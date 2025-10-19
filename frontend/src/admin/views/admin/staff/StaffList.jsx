/* eslint-disable */

import {
  Box, Button, Flex, Icon, Table, Tbody, Td, Text, Th, Thead, Tr, useColorModeValue, Spinner, Alert, AlertIcon,
  AlertTitle, AlertDescription, Badge, Select, HStack, VStack, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, useToast, useDisclosure, InputGroup,
  InputLeftElement, Divider,
} from '@chakra-ui/react';
import {
  createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable,
} from '@tanstack/react-table';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { staffAPI, stationAPI } from '../../../../services/api';
import { MdEdit, MdDelete, MdAdd, MdChevronLeft, MdChevronRight, MdPerson, MdEmail, MdPhone, MdLocationOn, MdToggleOn, MdToggleOff, MdSearch, MdFilterList, MdClear } from 'react-icons/md';

// Custom components
import Card from '../../../components/card/Card';

const columnHelper = createColumnHelper();

export default function StaffList() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [stations, setStations] = useState([]);
  const toast = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Search and filter state
  const [searchParam, setSearchParam] = useState('');
  const [selectedStationId, setSelectedStationId] = useState('');
  const [contractStatusFilter, setContractStatusFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const brandColor = useColorModeValue('brand.500', 'white');

  // Fetch staff from API
  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await staffAPI.getAll();
      console.log('Staff response:', response);
      setStaff(response || []);
      setTotalItems(response?.length || 0);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError(err.message || 'Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  // Search staff by parameter within station
  const searchStaff = async () => {
    if (!selectedStationId) {
      toast({
        title: 'Warning',
        description: 'Please select a station first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const response = await staffAPI.searchByParam(searchParam, selectedStationId);
      console.log('Search response:', response);
      setStaff(response || []);
      setTotalItems(response?.length || 0);
      setCurrentPage(1); // Reset to first page
    } catch (err) {
      console.error('Error searching staff:', err);
      setError(err.message || 'Failed to search staff');
    } finally {
      setIsSearching(false);
    }
  };

  // Filter staff by contract status within station
  const filterByContractStatus = async () => {
    if (!selectedStationId) {
      toast({
        title: 'Warning',
        description: 'Please select a station first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const response = await staffAPI.filterByContractStatus(selectedStationId, contractStatusFilter);
      console.log('Filter response:', response);
      setStaff(response || []);
      setTotalItems(response?.length || 0);
      setCurrentPage(1); // Reset to first page
    } catch (err) {
      console.error('Error filtering staff:', err);
      setError(err.message || 'Failed to filter staff');
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search and filters
  const clearFilters = () => {
    setSearchParam('');
    setContractStatusFilter('');
    setSelectedStationId('');
    fetchStaff(); // Reload all staff
  };

  // Fetch stations for dropdown
  const fetchStations = async () => {
    try {
      const response = await stationAPI.getAll();
      setStations(response || []);
    } catch (err) {
      console.error('Error fetching stations:', err);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchStations();
  }, []);

  // Pagination calculations - memoized for performance
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedStaff = staff.slice(startIndex, endIndex);

    return {
      totalPages,
      startIndex,
      endIndex,
      paginatedStaff
    };
  }, [staff, currentPage, pageSize, totalItems]);

  const { totalPages, startIndex, endIndex, paginatedStaff } = paginationData;

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

  // Handle edit staff
  const handleEdit = useCallback((staffMember) => {
    setSelectedStaff(staffMember);
    setIsEditMode(true);
    setIsModalOpen(true);
  }, []);

  // Handle delete staff
  const handleDelete = useCallback(async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        const response = await staffAPI.delete(staffId);
        console.log('Delete response:', response);
        await fetchStaff(); // Refresh the list
        toast({
          title: 'Success',
          description: 'Staff member deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        setError(err.message || 'Failed to delete staff member');
        toast({
          title: 'Error',
          description: err.message || 'Failed to delete staff member',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [toast]);

  // Handle status toggle
  const handleStatusToggle = useCallback(async (staffId, currentStatus) => {
    try {
      const response = await staffAPI.changeStatus(staffId);
      console.log('Status change response:', response);
      await fetchStaff(); // Refresh the list
      toast({
        title: 'Success',
        description: `Staff status changed to ${getStatusText(currentStatus === 0 ? 1 : 0)}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to change staff status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 0: return 'green'; // Active
      case 1: return 'red';   // Inactive
      case 2: return 'orange'; // Suspended
      default: return 'gray';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 0: return 'Active';
      case 1: return 'Inactive';
      case 2: return 'Suspended';
      default: return 'Unknown';
    }
  };

  // Get station name
  const getStationName = (stationId) => {
    if (!stationId) return 'No Station';
    const station = stations.find(s => s.stationId === stationId);
    return station ? station.name : `Station ${stationId}`;
  };

  const columns = useMemo(() => [
    columnHelper.accessor('staffId', {
      id: 'staffId',
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
    columnHelper.accessor('fullName', {
      id: 'fullName',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          FULL NAME
        </Text>
      ),
      cell: (info) => (
        <Flex align="center" gap={2}>
          <Icon as={MdPerson} color="gray.500" />
          <Text color={textColor} fontSize="sm" fontWeight="700">
            {info.getValue()}
          </Text>
        </Flex>
      ),
    }),
    columnHelper.accessor('email', {
      id: 'email',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          EMAIL
        </Text>
      ),
      cell: (info) => (
        <Flex align="center" gap={2}>
          <Icon as={MdEmail} color="gray.500" />
          <Text color={textColor} fontSize="sm">
            {info.getValue()}
          </Text>
        </Flex>
      ),
    }),
    columnHelper.accessor('phoneNumber', {
      id: 'phoneNumber',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          PHONE
        </Text>
      ),
      cell: (info) => (
        <Flex align="center" gap={2}>
          <Icon as={MdPhone} color="gray.500" />
          <Text color={textColor} fontSize="sm">
            {info.getValue()}
          </Text>
        </Flex>
      ),
    }),
    columnHelper.accessor('stationId', {
      id: 'station',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          STATION
        </Text>
      ),
      cell: (info) => {
        const stationId = info.getValue();
        return (
          <Flex align="center" gap={2}>
            <Icon as={MdLocationOn} color="gray.500" />
            <Text color={textColor} fontSize="sm">
              {getStationName(stationId)}
            </Text>
          </Flex>
        );
      },
    }),
    columnHelper.accessor('status', {
      id: 'status',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          STATUS
        </Text>
      ),
      cell: (info) => {
        const status = info.getValue();
        const staffId = info.row.original.staffId;
        const isActive = status === 0;

        return (
          <Flex align="center">
            <Button
              fontSize="4xl"
              leftIcon={<Icon as={isActive ? MdToggleOn : MdToggleOff} boxSize={8} />}
              colorScheme={isActive ? "green" : "red"}
              variant="ghost"
              onClick={() => handleStatusToggle(staffId, status)}
              _hover={{
                bg: isActive ? "green.50" : "red.50"
              }}
            >
            </Button>
          </Flex>
        );
      },
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
        <Flex align="center" gap={2}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={MdEdit} />}
            colorScheme="blue"
            onClick={() => handleEdit(info.row.original)}
          >
            Edit
          </Button>
        </Flex>
      ),
    }),
  ], [textColor, handleEdit, handleDelete, handleStatusToggle, stations]);

  const table = useReactTable({
    data: paginatedStaff,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  // Handle add new staff
  const handleAdd = () => {
    setSelectedStaff(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStaff(null);
    setIsEditMode(false);
  };

  // Handle modal success (refresh data)
  const handleModalSuccess = () => {
    fetchStaff();
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
              Loading staff...
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
            <Button onClick={fetchStaff} colorScheme="blue">
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
            Staff Management
          </Text>
          <Button
            leftIcon={<Icon as={MdAdd} />}
            colorScheme="blue"
            variant="solid"
            onClick={handleAdd}
            me="24px"
          >
            Add New Staff
          </Button>
        </Flex>

        {/* Search and Filter Controls */}
        <Card>
          <Box p={6}>
            <VStack spacing={4} align="stretch">
              <Text color={textColor} fontSize="lg" fontWeight="600">
                Search & Filter Staff
              </Text>

              <HStack spacing={4} wrap="wrap">
                {/* Station Selection */}
                <FormControl minW="200px">
                  <FormLabel fontSize="sm" color="gray.600">Station</FormLabel>
                  <Select
                    value={selectedStationId}
                    onChange={(e) => setSelectedStationId(e.target.value)}
                    placeholder="Select station"
                    size="sm"
                  >
                    {stations.map((station) => (
                      <option key={station.stationId} value={station.stationId}>
                        {station.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {/* Search Input */}
                <FormControl minW="250px">
                  <FormLabel fontSize="sm" color="gray.600">Search (Name, Email, Phone)</FormLabel>
                  <InputGroup size="sm">
                    <InputLeftElement pointerEvents="none">
                      <Icon as={MdSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      value={searchParam}
                      onChange={(e) => setSearchParam(e.target.value)}
                      placeholder="Enter search term..."
                      onKeyPress={(e) => e.key === 'Enter' && searchStaff()}
                    />
                  </InputGroup>
                </FormControl>

                {/* Contract Status Filter */}
                <FormControl minW="200px">
                  <FormLabel fontSize="sm" color="gray.600">Contract Status</FormLabel>
                  <Select
                    value={contractStatusFilter}
                    onChange={(e) => setContractStatusFilter(e.target.value)}
                    placeholder="All statuses"
                    size="sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="ToBeConfirmed">To Be Confirmed</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </Select>
                </FormControl>
              </HStack>

              <HStack spacing={2} justify="flex-start">
                <Button
                  leftIcon={<Icon as={MdSearch} />}
                  colorScheme="blue"
                  size="sm"
                  onClick={searchStaff}
                  isLoading={isSearching}
                  loadingText="Searching..."
                  isDisabled={!selectedStationId}
                >
                  Search
                </Button>

                <Button
                  leftIcon={<Icon as={MdFilterList} />}
                  colorScheme="purple"
                  size="sm"
                  onClick={filterByContractStatus}
                  isLoading={isSearching}
                  loadingText="Filtering..."
                  isDisabled={!selectedStationId}
                >
                  Filter by Status
                </Button>

                <Button
                  leftIcon={<Icon as={MdClear} />}
                  colorScheme="gray"
                  size="sm"
                  onClick={clearFilters}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Card>

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
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} staff members
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

      {/* Staff Modal */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        staff={selectedStaff}
        isEdit={isEditMode}
        stations={stations}
      />
    </Box>
  );
}

// Staff Modal Component
function StaffModal({ isOpen, onClose, onSuccess, staff = null, isEdit = false, stations = [] }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [identityCardNumber, setIdentityCardNumber] = useState('');
  const [stationId, setStationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingStaff, setFetchingStaff] = useState(false);
  const toast = useToast();

  // Fetch staff data when editing
  useEffect(() => {
    if (isOpen && isEdit && staff?.staffId) {
      fetchStaffData();
    } else if (isOpen && !isEdit) {
      // Reset form for add mode
      resetForm();
    }
  }, [isOpen, isEdit, staff?.staffId]);

  const fetchStaffData = async () => {
    try {
      setFetchingStaff(true);
      const staffData = await staffAPI.getById(staff.staffId);
      setFullName(staffData.fullName || '');
      setEmail(staffData.email || '');
      setPhoneNumber(staffData.phoneNumber || '');
      setIdentityCardNumber(staffData.identityCardNumber || '');
      setStationId(staffData.stationId || '');
      setPassword(''); // Don't pre-fill password
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch staff data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setFetchingStaff(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setPhoneNumber('');
    setIdentityCardNumber('');
    setStationId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Full name is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Email is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!isEdit && !password.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Password is required for new staff',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!phoneNumber.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Phone number is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!identityCardNumber.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Identity card number is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);

      const staffData = {
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        identityCardNumber: identityCardNumber.trim(),
        stationId: stationId ? parseInt(stationId) : null,
      };

      // Only include password if it's provided (for new staff or when updating)
      if (password.trim()) {
        staffData.password = password.trim();
      }

      if (isEdit) {
        const response = await staffAPI.update(staff.staffId, staffData);
        toast({
          title: 'Success',
          description: response.message || 'Staff updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const response = await staffAPI.create(staffData);
        toast({
          title: 'Success',
          description: response.message || 'Staff created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      onSuccess();
      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isEdit ? 'update' : 'create'} staff`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setFetchingStaff(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isEdit ? 'Edit Staff' : 'Add New Staff'}</ModalHeader>
        <ModalCloseButton />

        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={fetchingStaff ? "Loading staff data..." : "Enter full name"}
                  maxLength={100}
                  isDisabled={fetchingStaff}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  isDisabled={fetchingStaff}
                />
              </FormControl>

              <FormControl isRequired={!isEdit}>
                <FormLabel>Password {isEdit && '(Leave blank to keep current)'}</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEdit ? "Enter new password (optional)" : "Enter password"}
                  isDisabled={fetchingStaff}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Phone Number</FormLabel>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  isDisabled={fetchingStaff}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Identity Card Number</FormLabel>
                <Input
                  value={identityCardNumber}
                  onChange={(e) => setIdentityCardNumber(e.target.value)}
                  placeholder="Enter identity card number"
                  isDisabled={fetchingStaff}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Station (Optional)</FormLabel>
                <Select
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                  placeholder="Select station"
                  isDisabled={fetchingStaff}
                >
                  {stations.map((station) => (
                    <option key={station.stationId} value={station.stationId}>
                      {station.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose} disabled={loading || fetchingStaff}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={loading}
              loadingText={isEdit ? 'Updating...' : 'Creating...'}
              isDisabled={fetchingStaff}
            >
              {fetchingStaff ? 'Loading...' : (isEdit ? 'Update' : 'Create')} Staff
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
