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
import { useState, useEffect, useMemo } from 'react';
import { accidentAPI } from '../../../services/api';
import { MdAdd, MdVisibility, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import ContractAccidentModal from './ContractAccidentModal';
import VehicleAccidentModal from './VehicleAccidentModal';
import AccidentViewModal from './AccidentViewModal';

import Card from '../../../admin/components/card/Card';

const columnHelper = createColumnHelper();

export default function AccidentList() {
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAccident, setSelectedAccident] = useState(null);
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
  // Get stationId from localStorage on component mount
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

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  const fetchAccidents = async () => {
    if (!stationId) {
      console.log('No stationId available, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching accidents for station:', stationId);

      const data = await accidentAPI.filter({ stationId });
      console.log('Accidents fetched successfully:', data);

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

  // Fetch accidents when stationId is available
  useEffect(() => {
    if (stationId) {
      console.log('AccidentList - stationId is now available:', stationId);
      fetchAccidents();
    }
  }, [stationId]);

  const getStatusColor = (status) => {
    const statusValue = typeof status === 'number'
      ? mapStatusNumberToString(status)
      : status;

    const colors = {
      'Reported': 'blue',
      'UnderInvestigation': 'orange',
      'RepairApproved': 'yellow',
      'UnderRepair': 'purple',
      'Repaired': 'green'
    };
    return colors[statusValue] || 'gray';
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
          {new Date(info.getValue()).toLocaleDateString()}
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

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return accidents.slice(startIndex, endIndex);
  }, [accidents, currentPage, pageSize]);

  const table = useReactTable({
    data: paginatedData, // Use paginatedData instead of accidents
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  const handleView = (accident) => {
    setSelectedAccident(accident);
    setIsViewModalOpen(true);
  };

  const handleAddContract = () => {
    setSelectedAccident(null);
    setIsContractModalOpen(true);
  };

  const handleAddVehicle = () => {
    setSelectedAccident(null);
    setIsVehicleModalOpen(true);
  };

  const handleModalClose = () => {
    setIsContractModalOpen(false);
    setIsVehicleModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedAccident(null);
  };

  const handleModalSuccess = () => {
    fetchAccidents();
  };
  const pageNumbers = useMemo(() => {
    const maxVisiblePages = 5;
    const pages = [];

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination logic
      let startPage, endPage;

      if (currentPage <= 3) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - maxVisiblePages + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - 2;
        endPage = currentPage + 2;
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

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
                        {stationId ? 'No accident reports found for this station' : 'No station assigned'}
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
      {/* Pagination */}
      {totalPages > 1 && (
        <Flex
          justify="space-between"
          align="center"
          w="100%"
          px="24px"
          py="16px"
          borderTop="1px"
          borderColor={borderColor}
          flexDirection={{ base: 'column', md: 'row' }}
          gap={4}
        >
          <Flex align="center">
            <Text color={textColor} fontSize="sm" mr={2}>
              Show:
            </Text>
            <Select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              size="sm"
              w="auto"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </Select>
            <Text color={textColor} fontSize="sm" ml={2}>
              rows per page
            </Text>
          </Flex>

          <Flex align="center" gap={2}>
            <Text color={textColor} fontSize="sm">
              Page {currentPage} of {totalPages}
            </Text>
            <HStack spacing={1}>
              <Button
                size="sm"
                variant="outline"
                onClick={goToFirstPage}
                isDisabled={currentPage === 1}
              >
                <Icon as={MdChevronLeft} />
                <Icon as={MdChevronLeft} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={goToPreviousPage}
                isDisabled={currentPage === 1}
              >
                <Icon as={MdChevronLeft} />
              </Button>

              {pageNumbers.map((page) => (
                <Button
                  key={page}
                  size="sm"
                  variant={currentPage === page ? 'solid' : 'outline'}
                  colorScheme={currentPage === page ? 'blue' : 'gray'}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}

              <Button
                size="sm"
                variant="outline"
                onClick={goToNextPage}
                isDisabled={currentPage === totalPages}
              >
                <Icon as={MdChevronRight} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={goToLastPage}
                isDisabled={currentPage === totalPages}
              >
                <Icon as={MdChevronRight} />
                <Icon as={MdChevronRight} />
              </Button>
            </HStack>
          </Flex>
        </Flex>
      )}
      {/* Create Modals */}
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

      {/* View Modal */}
      <AccidentViewModal
        isOpen={isViewModalOpen}
        onClose={handleModalClose}
        accident={selectedAccident}
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