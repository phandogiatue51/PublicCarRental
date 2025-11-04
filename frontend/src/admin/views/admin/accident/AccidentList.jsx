import {
  Box, Button, Flex, Table, Tbody, Td, Text, Th, Thead, Tr,
  useColorModeValue, Spinner, Alert, AlertIcon, AlertTitle,
  AlertDescription, Badge, HStack
} from '@chakra-ui/react';
import {
  createColumnHelper, flexRender, getCoreRowModel,
  getSortedRowModel, useReactTable
} from '@tanstack/react-table';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { accidentAPI, stationAPI } from '../../../../services/api';
import { MdDelete } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Pagination from './../../../../components/Pagination';

import Card from './../../../components/card/Card';

const columnHelper = createColumnHelper();

export default function AccidentList() {
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([]);
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const brandColor = useColorModeValue('brand.500', 'white');
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalItems = accidents.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const [stations, setStations] = useState([]);

  const paginatedData = useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
      return accidents.slice((totalPages - 1) * pageSize, totalPages * pageSize);
    }
    return accidents.slice(startIndex, endIndex);
  }, [accidents, currentPage, pageSize, totalPages, startIndex, endIndex]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const data = await stationAPI.getAll();
        setStations(data);
      } catch (err) {
        console.error('Error fetching stations:', err);
      }
    };
    fetchStations();
  }, []);

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleView = (accident) => {
    navigate(`/admin/issue/${accident.accidentId}`);
  };

  const fetchAccidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = {};
      if (statusFilter) query.status = statusFilter;
      if (stationFilter) query.stationId = stationFilter;

      const data = await accidentAPI.filter(query);
      console.log('Accidents fetched:', data);

      setAccidents(
        data.map(accident => ({
          ...accident,
          reportedAt:
            accident.reportedAt === '0001-01-01T00:00:00'
              ? new Date().toISOString()
              : accident.reportedAt
        }))
      );
    } catch (err) {
      console.error('Error fetching accidents:', err);
      setError(err.message || 'Failed to fetch accident reports');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, stationFilter]);

  useEffect(() => {
    fetchAccidents();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      0: 'blue',
      1: 'orange',
      2: 'yellow',
      3: 'purple',
      4: 'green'
    };
    return colors[status] || 'gray';
  };

  const mapStatusNumberToString = (statusNumber) => {
    const statusMap = {
      0: 'Reported',
      1: 'Under Investigation',
      2: 'Repair Approved',
      3: 'Under Repair',
      4: 'Repaired'
    };
    return statusMap[statusNumber] || 'Reported';
  };

  const mapActionNumberToString = (actionValue) => {
    if (actionValue === null || actionValue === undefined) return 'Pending';

    const num = Number(actionValue);
    const actionMap = {
      0: 'Replace and Refund',
      1: 'Replace',
      2: 'Repair'
    };

    return actionMap[num] || 'Pending';
  };

  const getActionColor = (actionValue) => {
    if (actionValue === null || actionValue === undefined) return 'gray';

    const num = Number(actionValue);
    const colors = {
      0: 'orange',
      1: 'green',
      2: 'blue'
    };

    return colors[num] || 'gray';
  };

  const columns = [
    columnHelper.accessor('accidentId', {
      id: 'accidentId',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          ID
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm" fontWeight="700">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor(row => `#${row.vehicleId} - ${row.licensePlate}`, {
      id: 'vehicle',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          VEHICLE
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm" fontWeight="600">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('contractId', {
      id: 'contractId',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          CONTRACT ID
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm">
          {info.getValue() ? info.getValue() : 'N/A'}
        </Text>
      ),
    }),

    columnHelper.accessor('location', {
      id: 'location',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          LOCATION
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm">
          {info.getValue() || 'Unknown'}
        </Text>
      ),
    }),
    columnHelper.accessor('reportedAt', {
      id: 'reportedAt',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          REPORTED AT
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm">
          {formatDate(info.getValue())}
        </Text>
      ),
    }),
    columnHelper.accessor('status', {
      id: 'status',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          STATUS
        </Text>
      ),
      cell: (info) => {
        const statusValue = info.getValue();
        const statusText = typeof statusValue === 'number'
          ? mapStatusNumberToString(statusValue)
          : statusValue;

        return (
          <Badge
            colorScheme={getStatusColor(statusValue)}
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="full"
          >
            {statusText.replace(/([A-Z])/g, ' $1').trim()}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('actionTaken', {
      id: 'actionTaken',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          RESOLUTION
        </Text>
      ),
      cell: (info) => {
        const actionValue = info.getValue();
        const status = info.row.original.status;

        if (status === 0 || actionValue === null || actionValue === undefined) {
          return (
            <Badge colorScheme="gray" fontSize="xs" px={2} py={1} borderRadius="full">
              Pending
            </Badge>
          );
        }

        const actionText = mapActionNumberToString(actionValue);
        const colorScheme = getActionColor(actionValue);

        return (
          <Badge
            colorScheme={colorScheme}
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="full"
          >
            {actionText}
          </Badge>
        );
      }
    }),
    columnHelper.accessor('actions', {
      id: 'actions',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          ACTIONS
        </Text>
      ),
      cell: (info) => (
        <HStack spacing={2}>
          <Button
            size="sm"
            variant="outline"
            colorScheme="blue"
            onClick={() => handleView(info.row.original)}
          >
            View Details
          </Button>
          <Button
            aria-label="Delete Report"
            icon={<MdDelete />}
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={() => handleDelete(info.row.original.accidentId)}
          >Delete</Button>
        </HStack>
      ),
    }),

  ];

  const table = useReactTable({
    data: paginatedData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  const handleDelete = async (accidentId) => {
    if (window.confirm('Are you sure you want to delete this issue report?')) {
      try {
        await accidentAPI.deleteReport(accidentId);
        await fetchAccidents();
      } catch (err) {
        setError(err.message || 'Failed to delete issue report');
      }
    }
  };


  if (loading) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Card>
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="xl" color={brandColor} />
            <Text ml={4} color={textColor}>
              Loading accident reports...
            </Text>
          </Flex>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Card>
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Flex justify="center" mt={4}>
            <Button onClick={fetchAccidents} colorScheme="blue">
              Retry
            </Button>
          </Flex>
        </Card>
      </Box>
    );
  }

  return (
    <Box pt={{ md: "30px" }}>
      <Flex direction="column" gap="20px" me="auto">
        <Flex
          mt="45px"
          justifyContent="space-between"
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'start', md: 'center' }}
        >
          <Text color={textColor} fontSize="2xl" ms="24px" fontWeight="700">
            Issue Report Management
          </Text>
          <Flex gap={3} align="center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', minWidth: '200px' }}
            >
              <option value="">All Statuses</option>
              <option value="0">Reported</option>
              <option value="1">Under Investigation</option>
              <option value="2">Repair Approved</option>
              <option value="3">Under Repair</option>
              <option value="4">Repaired</option>
            </select>

            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', minWidth: '200px' }}
            >
              <option value="">All Stations</option>
              {stations.map(station => (
                <option key={station.stationId} value={station.stationId}>
                  {station.name}
                </option>
              ))}
            </select>

            <Button colorScheme="blue" onClick={fetchAccidents}>
              Apply Filter
            </Button>
          </Flex>
        </Flex>

        <Flex gap="4" justify="start">
          <Card p="4" minW="200px">
            <Text color="gray.500" fontSize="sm">Total Reports</Text>
            <Text color={textColor} fontSize="2xl" fontWeight="700">{accidents.length}</Text>
          </Card>

          <Card p="4" minW="200px">
            <Text color="gray.500" fontSize="sm">Reported</Text>
            <Text color="blue.500" fontSize="2xl" fontWeight="700">
              {accidents.filter(a => a.status === 0).length}
            </Text>
          </Card>

          <Card p="4" minW="200px">
            <Text color="gray.500" fontSize="sm">Repair Approved</Text>
            <Text color="yellow.500" fontSize="2xl" fontWeight="700">
              {accidents.filter(a => a.status === 2).length}
            </Text>
          </Card>

          <Card p="4" minW="200px">
            <Text color="gray.500" fontSize="sm">Under Repair</Text>
            <Text color="purple.500" fontSize="2xl" fontWeight="700">
              {accidents.filter(a => a.status === 3).length}
            </Text>
          </Card>

          <Card p="4" minW="200px">
            <Text color="gray.500" fontSize="sm">Repaired</Text>
            <Text color="green.500" fontSize="2xl" fontWeight="700">
              {accidents.filter(a => a.status === 4).length}
            </Text>
          </Card>
        </Flex>


        {/* Table Card */}
        <Card>
          <Box overflowX="auto">
            <Table variant="simple" color="gray.500" mb="24px" mt="12px">
              <Thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <Tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <Th
                        key={header.id}
                        colSpan={header.colSpan}
                        pe="10px"
                        borderColor={borderColor}
                        cursor="pointer"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <Flex
                          justifyContent="space-between"
                          align="center"
                          fontSize={{ sm: '10px', lg: '12px' }}
                          color="gray.400"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </Flex>
                      </Th>
                    ))}
                  </Tr>
                ))}
              </Thead>
              <Tbody>
                {table.getRowModel().rows.map((row) => (
                  <Tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Td
                        key={cell.id}
                        fontSize={{ sm: '14px' }}
                        borderColor="transparent"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Td>
                    ))}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Card>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          startIndex={startIndex}
          endIndex={endIndex}
        />
      </Flex>
    </Box>
  );
}