import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Button,
    Flex,
    Icon,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useColorModeValue,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Badge,
    Select,
    HStack,
    useToast,
    Tooltip,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    VStack,
    Divider
} from '@chakra-ui/react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable
} from '@tanstack/react-table';
import {
    MdChevronLeft,
    MdChevronRight,
    MdPerson,
    MdEmail,
    MdPhone,
    MdDriveEta,
    MdRefresh,
    MdVisibility
} from 'react-icons/md';
import { renterAPI } from '../../services/api';

const columnHelper = createColumnHelper();

const RenterList = () => {
    const [renters, setRenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sorting, setSorting] = useState([]);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedRenter, setSelectedRenter] = useState(null);
    const toast = useToast();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Color mode values - moved to top to avoid conditional hook calls
    const textColor = useColorModeValue('secondaryGray.900', 'white');
    const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
    const brandColor = useColorModeValue('brand.500', 'white');
    const cardBg = useColorModeValue('white', 'gray.800');

    // Fetch renters from API
    const fetchRenters = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await renterAPI.getAll();
            console.log('Renters response:', response);
            setRenters(response || []);
            setTotalItems(response?.length || 0);
        } catch (err) {
            console.error('Error fetching renters:', err);
            setError(err.message || 'Failed to fetch renters');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRenters();
    }, []);

    // Pagination calculations - memoized for performance
    const paginationData = useMemo(() => {
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedRenters = renters.slice(startIndex, endIndex);

        return {
            totalPages,
            startIndex,
            endIndex,
            paginatedRenters
        };
    }, [renters, currentPage, pageSize, totalItems]);

    const { totalPages, startIndex, endIndex, paginatedRenters } = paginationData;

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

    // Handle view renter details
    const handleView = useCallback((renter) => {
        setSelectedRenter(renter);
        setIsDetailModalOpen(true);
    }, []);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        fetchRenters();
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

    const columns = useMemo(() => [
        columnHelper.accessor('renterId', {
            id: 'renterId',
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
        columnHelper.accessor('licenseNumber', {
            id: 'license',
            header: () => (
                <Text
                    justifyContent="space-between"
                    align="center"
                    fontSize={{ sm: '10px', lg: '12px' }}
                    color="gray.400"
                >
                    LICENSE
                </Text>
            ),
            cell: (info) => {
                const licenseNumber = info.getValue();
                return (
                    <Flex align="center" gap={2}>
                        <Icon as={MdDriveEta} color="gray.500" />
                        <Text color={textColor} fontSize="sm">
                            {licenseNumber || 'No License'}
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
                    <Badge
                        colorScheme={getStatusColor(status)}
                        variant="solid"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="bold"
                    >
                        {getStatusText(status)}
                    </Badge>
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
                    <Tooltip label="View Details">
                        <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Icon as={MdVisibility} />}
                            colorScheme="blue"
                            onClick={() => handleView(info.row.original)}
                        >
                            View
                        </Button>
                    </Tooltip>
                </Flex>
            ),
        }),
    ], [textColor, handleView]);

    const table = useReactTable({
        data: paginatedRenters,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        debugTable: true,
    });

    // Handle modal close
    const handleDetailModalClose = () => {
        setIsDetailModalOpen(false);
        setSelectedRenter(null);
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
                <Flex justify="center" align="center" minH="200px">
                    <Spinner size="xl" color={brandColor} />
                    <Text ml={4} color={textColor}>
                        Loading renters...
                    </Text>
                </Flex>
            </Box>
        );
    }

    if (error) {
        return (
            <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle>Error!</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Flex justify="center" mt={4}>
                    <Button onClick={fetchRenters} colorScheme="blue">
                        Retry
                    </Button>
                </Flex>
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
                        Renter Management
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
                    </HStack>
                </Flex>

                {/* Table */}
                <Box
                    bg={cardBg}
                    borderRadius="lg"
                    border="1px"
                    borderColor={borderColor}
                    overflow="hidden"
                >
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

                {/* Pagination Controls */}
                <Box
                    bg={cardBg}
                    borderRadius="lg"
                    border="1px"
                    borderColor={borderColor}
                    p={4}
                >
                    <Flex justify="space-between" align="center">
                        <HStack spacing={4}>
                            <Text fontSize="sm" color={textColor}>
                                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} renters
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
                </Box>
            </Flex>

            {/* Renter Detail Modal */}
            <Modal isOpen={isDetailModalOpen} onClose={handleDetailModalClose} size="lg" isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <Flex align="center" gap={2}>
                            <Icon as={MdPerson} />
                            Renter Details
                        </Flex>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        {selectedRenter && (
                            <VStack spacing={4} align="stretch">
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>Full Name</Text>
                                    <Text color={textColor}>{selectedRenter.fullName}</Text>
                                </Box>
                                <Divider />
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>Email</Text>
                                    <Text color={textColor}>{selectedRenter.email}</Text>
                                </Box>
                                <Divider />
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>Phone Number</Text>
                                    <Text color={textColor}>{selectedRenter.phoneNumber}</Text>
                                </Box>
                                <Divider />
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>License Number</Text>
                                    <Text color={textColor}>{selectedRenter.licenseNumber || 'No License'}</Text>
                                </Box>
                                <Divider />
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>Status</Text>
                                    <Badge
                                        colorScheme={getStatusColor(selectedRenter.status)}
                                        variant="solid"
                                        px={3}
                                        py={1}
                                        borderRadius="full"
                                        fontSize="sm"
                                        fontWeight="bold"
                                    >
                                        {getStatusText(selectedRenter.status)}
                                    </Badge>
                                </Box>
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default RenterList;
