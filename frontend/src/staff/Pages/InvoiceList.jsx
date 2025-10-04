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
    MdReceipt,
    MdPerson,
    MdDriveEta,
    MdRefresh,
    MdVisibility,
    MdAttachMoney,
    MdSchedule
} from 'react-icons/md';
import { invoiceAPI } from '../../services/api';

const columnHelper = createColumnHelper();

const InvoiceList = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sorting, setSorting] = useState([]);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
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

    // Fetch invoices from API
    const fetchInvoices = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await invoiceAPI.getAll();
            console.log('Invoices response:', response);
            setInvoices(response || []);
            setTotalItems(response?.length || 0);
        } catch (err) {
            console.error('Error fetching invoices:', err);
            setError(err.message || 'Failed to fetch invoices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    // Pagination calculations - memoized for performance
    const paginationData = useMemo(() => {
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedInvoices = invoices.slice(startIndex, endIndex);

        return {
            totalPages,
            startIndex,
            endIndex,
            paginatedInvoices
        };
    }, [invoices, currentPage, pageSize, totalItems]);

    const { totalPages, startIndex, endIndex, paginatedInvoices } = paginationData;

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

    // Handle view invoice details
    const handleView = useCallback((invoice) => {
        setSelectedInvoice(invoice);
        setIsDetailModalOpen(true);
    }, []);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        fetchInvoices();
    }, []);

    // Get status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case 0: return 'green'; // Paid
            case 1: return 'orange'; // Pending
            case 2: return 'red'; // Failed
            case 3: return 'gray'; // Cancelled
            default: return 'gray';
        }
    };

    // Get status text
    const getStatusText = (status) => {
        switch (status) {
            case 0: return 'Paid';
            case 1: return 'Pending';
            case 2: return 'Failed';
            case 3: return 'Cancelled';
            default: return 'Unknown';
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return 'N/A';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const columns = useMemo(() => [
        columnHelper.accessor('invoiceId', {
            id: 'invoiceId',
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
        columnHelper.accessor('contractId', {
            id: 'contractId',
            header: () => (
                <Text
                    justifyContent="space-between"
                    align="center"
                    fontSize={{ sm: '10px', lg: '12px' }}
                    color="gray.400"
                >
                    CONTRACT ID
                </Text>
            ),
            cell: (info) => (
                <Flex align="center" gap={2}>
                    <Icon as={MdReceipt} color="gray.500" />
                    <Text color={textColor} fontSize="sm" fontWeight="700">
                        {info.getValue()}
                    </Text>
                </Flex>
            ),
        }),
        columnHelper.accessor('renterName', {
            id: 'renter',
            header: () => (
                <Text
                    justifyContent="space-between"
                    align="center"
                    fontSize={{ sm: '10px', lg: '12px' }}
                    color="gray.400"
                >
                    RENTER
                </Text>
            ),
            cell: (info) => (
                <Flex align="center" gap={2}>
                    <Icon as={MdPerson} color="gray.500" />
                    <Text color={textColor} fontSize="sm">
                        {info.getValue()}
                    </Text>
                </Flex>
            ),
        }),
        columnHelper.accessor('vehicleLicensePlate', {
            id: 'vehicle',
            header: () => (
                <Text
                    justifyContent="space-between"
                    align="center"
                    fontSize={{ sm: '10px', lg: '12px' }}
                    color="gray.400"
                >
                    VEHICLE
                </Text>
            ),
            cell: (info) => (
                <Flex align="center" gap={2}>
                    <Icon as={MdDriveEta} color="gray.500" />
                    <Text color={textColor} fontSize="sm">
                        {info.getValue()}
                    </Text>
                </Flex>
            ),
        }),
        columnHelper.accessor('totalAmount', {
            id: 'amount',
            header: () => (
                <Text
                    justifyContent="space-between"
                    align="center"
                    fontSize={{ sm: '10px', lg: '12px' }}
                    color="gray.400"
                >
                    AMOUNT
                </Text>
            ),
            cell: (info) => (
                <Flex align="center" gap={2}>
                    <Icon as={MdAttachMoney} color="green.500" />
                    <Text color={textColor} fontSize="sm" fontWeight="bold">
                        {formatCurrency(info.getValue())}
                    </Text>
                </Flex>
            ),
        }),
        columnHelper.accessor('createdDate', {
            id: 'createdDate',
            header: () => (
                <Text
                    justifyContent="space-between"
                    align="center"
                    fontSize={{ sm: '10px', lg: '12px' }}
                    color="gray.400"
                >
                    CREATED DATE
                </Text>
            ),
            cell: (info) => (
                <Flex align="center" gap={2}>
                    <Icon as={MdSchedule} color="gray.500" />
                    <Text color={textColor} fontSize="sm">
                        {formatDate(info.getValue())}
                    </Text>
                </Flex>
            ),
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
        data: paginatedInvoices,
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
        setSelectedInvoice(null);
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
                        Loading invoices...
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
                    <Button onClick={fetchInvoices} colorScheme="blue">
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
                        Invoice Management
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
                                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} invoices
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

            {/* Invoice Detail Modal */}
            <Modal isOpen={isDetailModalOpen} onClose={handleDetailModalClose} size="lg" isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <Flex align="center" gap={2}>
                            <Icon as={MdReceipt} />
                            Invoice Details
                        </Flex>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        {selectedInvoice && (
                            <VStack spacing={4} align="stretch">
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>Invoice ID</Text>
                                    <Text color={textColor}>{selectedInvoice.invoiceId}</Text>
                                </Box>
                                <Divider />
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>Contract ID</Text>
                                    <Text color={textColor}>{selectedInvoice.contractId}</Text>
                                </Box>
                                <Divider />
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>Renter</Text>
                                    <Text color={textColor}>{selectedInvoice.renterName}</Text>
                                </Box>
                                <Divider />
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>Vehicle</Text>
                                    <Text color={textColor}>{selectedInvoice.vehicleLicensePlate}</Text>
                                </Box>
                                <Divider />
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>Total Amount</Text>
                                    <Text color={textColor} fontSize="lg" fontWeight="bold">
                                        {formatCurrency(selectedInvoice.totalAmount)}
                                    </Text>
                                </Box>
                                <Divider />
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>Created Date</Text>
                                    <Text color={textColor}>{formatDate(selectedInvoice.createdDate)}</Text>
                                </Box>
                                <Divider />
                                <Box>
                                    <Text fontWeight="bold" color={textColor} mb={2}>Status</Text>
                                    <Badge
                                        colorScheme={getStatusColor(selectedInvoice.status)}
                                        variant="solid"
                                        px={3}
                                        py={1}
                                        borderRadius="full"
                                        fontSize="sm"
                                        fontWeight="bold"
                                    >
                                        {getStatusText(selectedInvoice.status)}
                                    </Badge>
                                </Box>
                                {selectedInvoice.paymentMethod && (
                                    <>
                                        <Divider />
                                        <Box>
                                            <Text fontWeight="bold" color={textColor} mb={2}>Payment Method</Text>
                                            <Text color={textColor}>{selectedInvoice.paymentMethod}</Text>
                                        </Box>
                                    </>
                                )}
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default InvoiceList;
