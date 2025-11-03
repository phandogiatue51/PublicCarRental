import {
  Box, Button, Flex, Table, Tbody, Td, Text, Th, Thead, Tr,
  useColorModeValue, Spinner, Alert, AlertIcon, AlertTitle,
  AlertDescription, Badge, HStack
} from '@chakra-ui/react';
import {
  createColumnHelper, flexRender, getCoreRowModel,
  getSortedRowModel, useReactTable
} from '@tanstack/react-table';
import { useState, useEffect } from 'react';
import { accidentAPI } from '../../../../services/api';
import { MdDelete } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

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
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

 const handleView = (accident) => {
    navigate(`/admin/issues/${accident.accidentId}`);
  };

  const fetchAccidents = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching accidents from API...');
      const data = await accidentAPI.getAll();
      console.log('Issues fetched successfully:', data);

      const formattedData = data.map(accident => ({
        ...accident,
        reportedAt: accident.reportedAt === '0001-01-01T00:00:00'
          ? new Date().toISOString()
          : accident.reportedAt
      }));

      setAccidents(formattedData);
    } catch (err) {
      console.error('Error fetching accidents:', err);
      let errorMessage = 'Failed to fetch accident reports';

      if (err.message.includes('404')) {
        errorMessage = 'Accident API endpoint not found. Please check the backend URL.';
      } else if (err.message.includes('Unable to connect')) {
        errorMessage = 'Cannot connect to the server. Please check if the backend is running';
      } else if (err.message.includes('CORS')) {
        errorMessage = 'CORS error. Please check backend CORS configuration.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
    columnHelper.accessor('vehicleId', {
      id: 'vehicleId',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          VEHICLE ID
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
    data: accidents,
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
      </Flex>
    </Box>
  );
}