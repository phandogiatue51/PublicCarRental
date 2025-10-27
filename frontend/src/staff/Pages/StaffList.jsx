/* eslint-disable */

import {
    Box, Button, Flex, Icon, Table, Tbody, Td, Text, Th, Thead, Tr, useColorModeValue, Spinner, Alert, AlertIcon,
    AlertTitle, AlertDescription, Badge, Select, HStack, VStack, FormControl, FormLabel, Input, useToast,
    InputGroup, InputLeftElement, Card, CardBody,
} from '@chakra-ui/react';
import {
    createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable,
} from '@tanstack/react-table';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { staffAPI, stationAPI } from '../../services/api';
import { MdPerson, MdEmail, MdPhone, MdLocationOn, MdSearch, MdFilterList, MdClear } from 'react-icons/md';

const columnHelper = createColumnHelper();

export default function StaffList() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sorting, setSorting] = useState([]);
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

    // Search staff by parameter (optional station filter)
    const searchStaff = async () => {
        try {
            setIsSearching(true);
            setError(null);
            const response = await staffAPI.searchByParam(searchParam, selectedStationId || null);
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

    // Filter staff by contract status (optional station filter)
    const filterByContractStatus = async () => {
        try {
            setIsSearching(true);
            setError(null);
            const response = await staffAPI.filterByContractStatus(selectedStationId || null, contractStatusFilter);
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
                return (
                    <Badge colorScheme={getStatusColor(status)} variant="solid">
                        {getStatusText(status)}
                    </Badge>
                );
            },
        }),
    ], [textColor, stations]);

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

    if (loading) {
        return (
            <Box >
                <Card>
                    <CardBody>
                        <Flex justify="center" align="center" minH="200px">
                            <Spinner size="xl" color={brandColor} />
                            <Text ml={4} color={textColor}>
                                Loading staff...
                            </Text>
                        </Flex>
                    </CardBody>
                </Card>
            </Box>
        );
    }

    if (error) {
        return (
            <Box >
                <Card>
                    <CardBody>
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
                    </CardBody>
                </Card>
            </Box>
        );
    }

    return (
        <Box>
            <Flex direction="column" gap="20px" me="auto">
                {/* Header */}
                <Flex
                    mt="45px"
                    justifyContent="space-between"
                    direction={{ base: 'column', md: 'row' }}
                    align={{ base: 'start', md: 'center' }}
                >
                    <Text color={textColor} fontSize="2xl" ms="24px" fontWeight="700">
                        Staff Directory
                    </Text>
                </Flex>

                {/* Search and Filter Controls */}
                <Card>
                    <CardBody>
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
                    </CardBody>
                </Card>

                {/* Table Card */}
                <Card>
                    <CardBody>
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
                    </CardBody>
                </Card>

                {/* Pagination Controls */}
                <Card>
                    <CardBody>
                        <Flex justify="space-between" align="center">
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
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
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
                        </Flex>
                    </CardBody>
                </Card>
            </Flex>
        </Box>
    );
}
