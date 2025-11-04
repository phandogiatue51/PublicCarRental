import {
  Box, Button, Flex, Icon, Table, Tbody, Td, Text, Th, Thead, Tr,
  useColorModeValue, Spinner, Alert, AlertIcon, AlertTitle,
  AlertDescription, Badge, Image,
  useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, HStack, Select
} from '@chakra-ui/react';
import {
  createColumnHelper, flexRender, getCoreRowModel,
  getSortedRowModel, useReactTable
} from '@tanstack/react-table';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { accidentAPI } from '../../../services/api';
import { MdAdd, MdVisibility, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import ContractAccidentModal from './ContractAccidentModal';
import VehicleAccidentModal from './VehicleAccidentModal';
import { useNavigate } from 'react-router-dom';
import Card from '../../../admin/components/card/Card';
import Pagination from './../../../components/Pagination';

const columnHelper = createColumnHelper();

export default function AccidentList() {
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [stationId, setStationId] = useState(null);
  const { isOpen: isImageModalOpen, onOpen: onImageModalOpen, onClose: onImageModalClose } = useDisclosure();

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const brandColor = useColorModeValue('brand.500', 'white');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalItems = accidents.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');

  const handleView = (accident) => {
    navigate(`/staff/issue/${accident.accidentId}`);
  };

  useEffect(() => {
    const storedStationId = localStorage.getItem('stationId');
    console.log('AccidentList - StationId from localStorage:', storedStationId);

    if (storedStationId) {
      setStationId(parseInt(storedStationId));
    } else {
      setError('No station assigned. Please contact administrator.');
      setLoading(false);
    }
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const fetchAccidents = useCallback(async () => {
    if (!stationId) return;

    try {
      setLoading(true);
      setError(null);

      const query = { stationId };
      if (statusFilter) query.status = statusFilter;

      const data = await accidentAPI.filter(query);
      console.log('Accidents fetched successfully:', data);

      // ✅ handle empty result
      if (!data || data.length === 0) {
        setAccidents([]);
        return;
      }

      const formattedData = data.map(accident => ({
        ...accident,
        reportedAt: accident.reportedAt === '0001-01-01T00:00:00'
          ? new Date().toISOString()
          : accident.reportedAt
      }));

      setAccidents(formattedData);
    } catch (err) {
      console.error('Error fetching accidents:', err);
      setError(err.message || 'Failed to fetch accident reports');
    } finally {
      setLoading(false);
    }
  }, [stationId, statusFilter]);

  useEffect(() => {
    if (stationId) {
      fetchAccidents();
    }
  }, [stationId, statusFilter, fetchAccidents]);

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
      1: 'UnderInvestigation',
      2: 'RepairApproved',
      3: 'UnderRepair',
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
          {info.getValue() ? `CONT-${info.getValue()}` : 'N/A'}
        </Text>
      ),
    }),
    columnHelper.accessor('description', {
      id: 'description',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          DESCRIPTION
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm" noOfLines={2} maxW="200px">
          {info.getValue() || 'No description'}
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
    columnHelper.accessor('imageUrl', {
      id: 'image',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          IMAGE
        </Text>
      ),
      cell: (info) => (
        info.getValue() ? (
          <Image
            src={info.getValue()}
            alt="Accident"
            boxSize="40px"
            objectFit="cover"
            borderRadius="md"
            cursor="pointer"
            onClick={() => {
              setImagePreview(info.getValue());
              onImageModalOpen();
            }}
            _hover={{ opacity: 0.8 }}
          />
        ) : (
          <Text color="gray.500" fontSize="sm">No Image</Text>
        )
      ),
    }),
    columnHelper.accessor('actions', {
      id: 'actions',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
          ACTIONS
        </Text>
      ),
      cell: (info) => (
        <Button
          size="sm"
          variant="outline"
          leftIcon={<MdVisibility />}
          onClick={() => handleView(info.row.original)}
        >
          View Details
        </Button>
      ),
    }),
  ];

  const handleModalClose = () => {
    setIsContractModalOpen(false);
    setIsVehicleModalOpen(false);
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return accidents.slice(startIndex, endIndex);
  }, [accidents, currentPage, pageSize]);

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

  const handleAddContract = () => {
    setIsContractModalOpen(true);
  };

  const handleAddVehicle = () => {
    setIsVehicleModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchAccidents();
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
    <Box >
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
          <Flex gap={3} me="24px">
            <Select
              placeholder="All Statuses"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              w="200px"
              bg="white"
              color="black"
            >
              <option value="0">Reported</option>
              <option value="1">Under Investigation</option>
              <option value="2">Repair Approved</option>
              <option value="3">Under Repair</option>
              <option value="4">Repaired</option>
            </Select>

            <Button
              leftIcon={<Icon as={MdAdd} />}
              colorScheme="blue"
              variant="solid"
              onClick={handleAddVehicle}
            >
              Report Vehicle Issue
            </Button>
            <Button
              leftIcon={<Icon as={MdAdd} />}
              colorScheme="green"
              variant="outline"
              onClick={handleAddContract}
            >
              Report Contract Issue
            </Button>
          </Flex>
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
                {table.getRowModel().rows.length === 0 ? (
                  <Tr>
                    <Td colSpan={columns.length} textAlign="center" py={8}>
                      <Text color="gray.500">
                        {'No accident reports found.'}
                      </Text>
                    </Td>
                  </Tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
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
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </Card>
      </Flex>

      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          startIndex={(currentPage - 1) * pageSize}
          endIndex={currentPage * pageSize}
        />
      )}

      <ContractAccidentModal
        isOpen={isContractModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <VehicleAccidentModal
        isOpen={isVehicleModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <Modal isOpen={isImageModalOpen} onClose={onImageModalClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Accident Image</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Image
              src={imagePreview}
              alt="Accident Preview"
              w="100%"
              h="auto"
              borderRadius="md"
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>

  );
}