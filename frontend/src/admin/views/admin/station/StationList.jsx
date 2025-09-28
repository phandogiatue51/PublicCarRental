/* eslint-disable */

import {
  Box,  Button,  Flex,  Icon,  Table,  Tbody,  Td,  Text,  Th,  Thead,  Tr,  useColorModeValue,  Spinner,  Alert,  AlertIcon,
  AlertTitle,  AlertDescription,  Badge,  Select,  HStack,  VStack,  useToast,  useDisclosure,  Tooltip,  NumberInput,  NumberInputField,
  NumberInputStepper,  NumberIncrementStepper,  NumberDecrementStepper} 
from '@chakra-ui/react';
import {
  createColumnHelper,  flexRender,  getCoreRowModel,  getSortedRowModel,  useReactTable
} from '@tanstack/react-table';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { stationAPI } from '../../../../services/api';
import { 
  MdEdit, 
  MdDelete, 
  MdAdd, 
  MdChevronLeft, 
  MdChevronRight, 
  MdLocationOn, 
  MdDirectionsCar,
  MdPeople,
  MdMap,
  MdRefresh
} from 'react-icons/md';

// Custom components
import Card from '@components/card/Card';
import StationModal from './StationModal';
import StationMapModal from './StationMapModal';

const columnHelper = createColumnHelper();

export default function StationList() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const toast = useToast();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const brandColor = useColorModeValue('brand.500', 'white');

  // Fetch stations from API
  const fetchStations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await stationAPI.getAll();
      console.log('Stations response:', response);
      setStations(response || []);
      setTotalItems(response?.length || 0);
    } catch (err) {
      console.error('Error fetching stations:', err);
      setError(err.message || 'Failed to fetch stations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  // Pagination calculations - memoized for performance
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedStations = stations.slice(startIndex, endIndex);
    
    return {
      totalPages,
      startIndex,
      endIndex,
      paginatedStations
    };
  }, [stations, currentPage, pageSize, totalItems]);

  const { totalPages, startIndex, endIndex, paginatedStations } = paginationData;

  // Pagination handlers - memoized for performance
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const goToFirstPage = useCallback(() => setCurrentPage(1), []);
  const goToLastPage = useCallback(() => setCurrentPage(totalPages), [totalPages]);
  const goToPreviousPage = useCallback(() => setCurrentPage(prev => Math.max(prev - 1, 1)), []);
  const goToNextPage = useCallback(() => setCurrentPage(prev => Math.min(prev + 1, totalPages)), [totalPages]);

  // Handle edit station
  const handleEdit = useCallback((station) => {
    setSelectedStation(station);
    setIsEditMode(true);
    setIsModalOpen(true);
  }, []);

  // Handle delete station
  const handleDelete = useCallback(async (stationId) => {
    if (window.confirm('Are you sure you want to delete this station?')) {
      try {
        const response = await stationAPI.delete(stationId);
        console.log('Delete response:', response);
        await fetchStations(); // Refresh the list
        toast({
          title: 'Success',
          description: 'Station deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to delete station',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [toast]);

  // Handle view on map
  const handleViewMap = useCallback((station) => {
    setSelectedStation(station);
    setIsMapModalOpen(true);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchStations();
  }, []);

  const columns = useMemo(() => [
    columnHelper.accessor('stationId', {
      id: 'stationId',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          ID
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm" fontWeight="700">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('name', {
      id: 'name',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          STATION NAME
        </Text>
      ),
      cell: (info) => (
        <Flex align="center" gap={2}>
          <Icon as={MdLocationOn} color="blue.500" />
          <Text color={textColor} fontSize="sm" fontWeight="700">
            {info.getValue()}
          </Text>
        </Flex>
      ),
    }),
    columnHelper.accessor('address', {
      id: 'address',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          ADDRESS
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm" maxW="200px" isTruncated>
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('coordinates', {
      id: 'coordinates',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          COORDINATES
        </Text>
      ),
      cell: (info) => {
        const station = info.row.original;
        return (
          <VStack spacing={1} align="start">
            <Text color={textColor} fontSize="xs">
              Lat: {station.latitude.toFixed(4)}
            </Text>
            <Text color={textColor} fontSize="xs">
              Lng: {station.longitude.toFixed(4)}
            </Text>
          </VStack>
        );
      },
    }),
    columnHelper.accessor('vehicleCount', {
      id: 'vehicles',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          VEHICLES
        </Text>
      ),
      cell: (info) => (
        <Flex align="center" gap={1}>
          <Icon as={MdDirectionsCar} color="green.500" />
          <Badge
            variant="subtle"
            colorScheme="green"
            fontSize="sm"
            fontWeight="500"
          >
            {info.getValue()}
          </Badge>
        </Flex>
      ),
    }),
    columnHelper.accessor('staffCount', {
      id: 'staff',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          STAFF
        </Text>
      ),
      cell: (info) => (
        <Flex align="center" gap={1}>
          <Icon as={MdPeople} color="blue.500" />
          <Badge
            variant="subtle"
            colorScheme="blue"
            fontSize="sm"
            fontWeight="500"
          >
            {info.getValue()}
          </Badge>
        </Flex>
      ),
    }),
    columnHelper.accessor('actions', {
      id: 'actions',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          ACTIONS
        </Text>
      ),
      cell: (info) => (
        <Flex align="center" gap={1}>
          <Tooltip label="View on Map">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Icon as={MdMap} />}
              colorScheme="purple"
              onClick={() => handleViewMap(info.row.original)}
            >
              Map
            </Button>
          </Tooltip>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={MdEdit} />}
            colorScheme="blue"
            onClick={() => handleEdit(info.row.original)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={MdDelete} />}
            colorScheme="red"
            onClick={() => handleDelete(info.row.original.stationId)}
          >
            Delete
          </Button>
        </Flex>
      ),
    }),
  ], [textColor, handleEdit, handleDelete, handleViewMap]);

  const table = useReactTable({
    data: paginatedStations,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  // Handle add new station
  const handleAdd = () => {
    setSelectedStation(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStation(null);
    setIsEditMode(false);
  };

  // Handle map modal close
  const handleMapModalClose = () => {
    setIsMapModalOpen(false);
    setSelectedStation(null);
  };

  // Handle modal success (refresh data)
  const handleModalSuccess = () => {
    fetchStations();
  };

  // Memoized page numbers calculation
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
              Loading stations...
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
            <Button onClick={fetchStations} colorScheme="blue">
              Retry
            </Button>
          </Flex>
        </Card>
      </Box>
    );
  }

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Flex direction="column" gap="20px" me="auto">
        {/* Header */}
        <Flex
          mt="45px"
          justifyContent="space-between"
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'start', md: 'center' }}
        >
          <Text color={textColor} fontSize="2xl" ms="24px" fontWeight="700">
            Station Management
          </Text>
          <HStack spacing={2}>
            <Button
              leftIcon={<Icon as={MdRefresh} />}
              colorScheme="gray"
              variant="outline"
              onClick={handleRefresh}
            >
              Refresh
            </Button>
            <Button
              leftIcon={<Icon as={MdAdd} />}
              colorScheme="blue"
              variant="solid"
              onClick={handleAdd}
              me="24px"
            >
              Add New Station
            </Button>
          </HStack>
        </Flex>

        {/* Table Card */}
        <Card>
          <Box>
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
                          fontSize={{ sm: "10px", lg: "12px" }}
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
                {table
                  .getRowModel()
                  .rows
                  .map((row) => (
                    <Tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <Td
                          key={cell.id}
                          fontSize={{ sm: '14px' }}
                          minW={{ sm: '150px', md: '200px', lg: 'auto' }}
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

        {/* Pagination Controls */}
        <Card>
          <Flex justify="space-between" align="center" p={4}>
            <HStack spacing={4}>
              <Text fontSize="sm" color={textColor}>
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} stations
              </Text>
              <HStack spacing={2}>
                <Text fontSize="sm" color={textColor}>Rows per page:</Text>
                <Select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                  size="sm"
                  width="80px"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </Select>
              </HStack>
            </HStack>

            <HStack spacing={2}>
              <Button
                size="sm"
                variant="outline"
                onClick={goToFirstPage}
                isDisabled={currentPage === 1}
                leftIcon={<Icon as={MdChevronLeft} />}
              >
                First
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={goToPreviousPage}
                isDisabled={currentPage === 1}
                leftIcon={<Icon as={MdChevronLeft} />}
              >
                Previous
              </Button>
              
              <HStack spacing={1}>
                {pageNumbers.map((pageNum) => (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={currentPage === pageNum ? "solid" : "outline"}
                    colorScheme={currentPage === pageNum ? "blue" : "gray"}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                ))}
              </HStack>

              <Button
                size="sm"
                variant="outline"
                onClick={goToNextPage}
                isDisabled={currentPage === totalPages}
                rightIcon={<Icon as={MdChevronRight} />}
              >
                Next
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={goToLastPage}
                isDisabled={currentPage === totalPages}
                rightIcon={<Icon as={MdChevronRight} />}
              >
                Last
              </Button>
            </HStack>
          </Flex>
        </Card>
      </Flex>

      {/* Station Modal */}
      <StationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        station={selectedStation}
        isEdit={isEditMode}
      />

      {/* Station Map Modal */}
      <StationMapModal
        isOpen={isMapModalOpen}
        onClose={handleMapModalClose}
        station={selectedStation}
      />
    </Box>
  );
}
