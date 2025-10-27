import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box, Button, Flex, Icon, Table, Tbody, Td, Text, Th, Thead, Tr, useColorModeValue, Spinner, Alert, AlertIcon,
    AlertTitle, AlertDescription, Badge, Select, HStack, useToast, Tooltip,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Image, Grid
} from '@chakra-ui/react';
import {
    createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable
} from '@tanstack/react-table';
import { contractAPI } from '../../../services/api';
import {
    MdChevronLeft, MdChevronRight, MdDriveEta, MdRefresh,
    MdVisibility, MdSchedule, MdPhotoLibrary, MdDirectionsCar, MdExitToApp
} from 'react-icons/md';

// Custom components
import Card from '../../../admin/components/card/Card';
import ContractDetailModal from '../../components/ContractDetailModal';
import ContractModal from './ContractModal';

const columnHelper = createColumnHelper();

const ContractList = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sorting, setSorting] = useState([]);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedImages, setSelectedImages] = useState({ imageIn: '', imageOut: '' });
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [selectedContractForAction, setSelectedContractForAction] = useState(null);
    const [modalAction, setModalAction] = useState(null); // 'handover' or 'return'
    const toast = useToast();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Color mode values - moved to top to avoid conditional hook calls
    const textColor = useColorModeValue('secondaryGray.900', 'white');
    const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
    const brandColor = useColorModeValue('brand.500', 'white');

    // Fetch contracts from API
    const fetchContracts = async () => {
        try {
            setLoading(true);
            setError(null);

            // Use the real API call with the new contract data structure
            const response = await contractAPI.getAll();
            console.log('Contracts response:', response);
            setContracts(response || []);
            setTotalItems(response?.length || 0);
        } catch (err) {
            console.error('Error fetching contracts:', err);
            setError(err.message || 'Failed to fetch contracts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, []);

    // Pagination calculations - memoized for performance
    const paginationData = useMemo(() => {
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedContracts = contracts.slice(startIndex, endIndex);

        return {
            totalPages,
            startIndex,
            endIndex,
            paginatedContracts
        };
    }, [contracts, currentPage, pageSize, totalItems]);

    const { totalPages, startIndex, endIndex, paginatedContracts } = paginationData;

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

    // Handle refresh
    const handleRefresh = useCallback(() => {
        fetchContracts();
    }, []);

    // Handle view contract details
    const handleView = useCallback(async (contract) => {
        try {
            setLoading(true);
            const contractDetails = await contractAPI.getById(contract.contractId);
            console.log('Contract details:', contractDetails);
            setSelectedContract(contractDetails);
            setIsDetailModalOpen(true);
        } catch (err) {
            console.error('Error fetching contract details:', err);
            toast({
                title: 'Error',
                description: 'Failed to fetch contract details',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Handle image view
    const handleImageView = useCallback((contract) => {
        const baseUrl = 'https://publiccarrental-production-b7c5.up.railway.app';

        const imageInUrl = contract.imageIn
            ? (contract.imageIn.startsWith('http') ? contract.imageIn : `${baseUrl}${contract.imageIn}`)
            : null;

        const imageOutUrl = contract.imageOut
            ? (contract.imageOut.startsWith('http') ? contract.imageOut : `${baseUrl}${contract.imageOut}`)
            : null;

        setSelectedImages({
            imageIn: imageInUrl,
            imageOut: imageOutUrl
        });
        setIsImageModalOpen(true);
    }, []);

    // Handle modal close
    const handleDetailModalClose = useCallback(() => {
        setIsDetailModalOpen(false);
        setSelectedContract(null);
    }, []);

    const handleImageModalClose = useCallback(() => {
        setIsImageModalOpen(false);
        setSelectedImages({ imageIn: '', imageOut: '' });
    }, []);

    // Handle action modal
    const handleHandover = useCallback((contract) => {
        setSelectedContractForAction(contract);
        setModalAction('handover');
        setIsActionModalOpen(true);
    }, []);

    const handleReturn = useCallback((contract) => {
        setSelectedContractForAction(contract);
        setModalAction('return');
        setIsActionModalOpen(true);
    }, []);

    const handleActionModalClose = useCallback(() => {
        setIsActionModalOpen(false);
        setSelectedContractForAction(null);
        setModalAction(null);
    }, []);

    // Handle modal success callback
    const handleModalSuccess = useCallback(async () => {
        await fetchContracts();
    }, [fetchContracts]);
    // Get status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case 0: return 'orange'; // ToBeConfirmed - màu cam cho chờ xác nhận
            case 1: return 'green'; // Active - màu xanh lá cho đang hoạt động
            case 2: return 'purple'; // Completed - màu tím cho hoàn thành
            case 3: return 'red'; // Cancelled - màu đỏ cho đã hủy
            case 4: return 'teal';
            default: return 'gray';
        }
    };

    // Get status text
    const getStatusText = (status) => {
        switch (status) {
            case 0: return 'To Be Confirmed';
            case 1: return 'Active';
            case 2: return 'Completed';
            case 3: return 'Cancelled';
            case 4: return 'Confirmed';
            default: return 'Unknown';
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };


    const columns = useMemo(() => [
        columnHelper.accessor('contractId', {
            id: 'contractId',
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

       
        columnHelper.accessor('stationName', {
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
            cell: (info) => (
                <Text color={textColor} fontSize="sm">
                    {info.getValue()}
                </Text>
            ),
        }),

            columnHelper.accessor('startTime', {
            id: 'startTime',
            header: () => (
                <Text
                    justifyContent="space-between"
                    align="center"
                    fontSize={{ sm: '10px', lg: '12px' }}
                    color="gray.400"
                >
                    START TIME
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
        columnHelper.accessor('endTime', {
            id: 'endTime',
            header: () => (
                <Text
                    justifyContent="space-between"
                    align="center"
                    fontSize={{ sm: '10px', lg: '12px' }}
                    color="gray.400"
                >
                    END TIME
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

        columnHelper.accessor('imageIn', {
            id: 'images',
            header: () => (
                <Text
                    justifyContent="space-between"
                    align="center"
                    fontSize={{ sm: '10px', lg: '12px' }}
                    color="gray.400"
                >
                    IMAGES
                </Text>
            ),
            cell: (info) => {
                const contract = info.row.original;
                const hasImages = contract.imageIn || contract.imageOut;

                if (!hasImages) {
                    return (
                        <Text color="gray.500" fontSize="sm">
                            No images
                        </Text>
                    );
                }

                return (
                    <Tooltip label="View Check-in & Check-out Images">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleImageView(contract)}
                            leftIcon={<Icon as={MdPhotoLibrary} />}
                            colorScheme="blue"
                        >
                            View Images
                        </Button>
                    </Tooltip>
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
            cell: (info) => {
                const contract = info.row.original;
                const status = contract.status;

                // Determine which actions are available based on contract status
                const canHandover = status === 4; // Confirmed status
                const canReturn = status === 1; // Active status

                return (
                    <Flex align="center" gap={2} wrap="wrap">
                        <Tooltip label="View Details">
                            <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<Icon as={MdVisibility} />}
                                colorScheme="blue"
                                onClick={() => handleView(contract)}
                            >
                                View
                            </Button>
                        </Tooltip>

                        {canHandover && (
                            <Tooltip label="Hand Over Vehicle">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    leftIcon={<Icon as={MdDirectionsCar} />}
                                    colorScheme="green"
                                    onClick={() => handleHandover(contract)}
                                >
                                    Hand Over
                                </Button>
                            </Tooltip>
                        )}

                        {canReturn && (
                            <Tooltip label="Return Vehicle">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    leftIcon={<Icon as={MdExitToApp} />}
                                    colorScheme="orange"
                                    onClick={() => handleReturn(contract)}
                                >
                                    Return
                                </Button>
                            </Tooltip>
                        )}

                        {!canHandover && !canReturn && status !== 2 && status !== 3 && (
                            <Text fontSize="sm" color="gray.500">
                                No actions available
                            </Text>
                        )}
                    </Flex>
                );
            },
        }),

    ], [textColor, handleImageView, handleHandover, handleReturn]);

    const table = useReactTable({
        data: paginatedContracts,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        debugTable: true,
    });

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
            <Box >
                <Card>
                    <Flex justify="center" align="center" minH="200px">
                        <Spinner size="xl" color={brandColor} />
                        <Text ml={4} color={textColor}>
                            Loading contracts...
                        </Text>
                    </Flex>
                </Card>
            </Box>
        );
    }

    if (error) {
        return (
            <Box >
                <Card>
                    <Alert status="error">
                        <AlertIcon />
                        <AlertTitle>Error!</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Flex justify="center" mt={4}>
                        <Button onClick={fetchContracts} colorScheme="blue">
                            Retry
                        </Button>
                    </Flex>
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
                        Contract Management
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
                                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} contracts
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

            {/* Contract Detail Modal */}
            <ContractDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleDetailModalClose}
                contract={selectedContract}
                onImageView={handleImageView}
            />

            {/* Images Modal */}
            <Modal isOpen={isImageModalOpen} onClose={handleImageModalClose} size="4xl" isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <Flex align="center" gap={2}>
                            <Icon as={MdPhotoLibrary} />
                            Vehicle Check-in & Check-out Images
                        </Flex>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                            {/* Check-in Image */}
                            <Box>
                                <Text fontWeight="bold" mb={3} textAlign="center" color={textColor}>
                                    Check-in Image
                                </Text>
                                {selectedImages.imageIn ? (
                                    <Image
                                        src={selectedImages.imageIn}
                                        alt="Vehicle check-in"
                                        borderRadius="md"
                                        boxShadow="md"
                                        maxH="400px"
                                        objectFit="contain"
                                        mx="auto"
                                        fallback={
                                            <Box
                                                bg="gray.100"
                                                height="200px"
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                                borderRadius="md"
                                            >
                                                <Text color="gray.500">Failed to load image</Text>
                                            </Box>
                                        }
                                    />
                                ) : (
                                    <Box
                                        bg="gray.100"
                                        height="200px"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        borderRadius="md"
                                    >
                                        <Text color="gray.500">No check-in image available</Text>
                                    </Box>
                                )}
                            </Box>

                            {/* Check-out Image */}
                            <Box>
                                <Text fontWeight="bold" mb={3} textAlign="center" color={textColor}>
                                    Check-out Image
                                </Text>
                                {selectedImages.imageOut ? (
                                    <Image
                                        src={selectedImages.imageOut}
                                        alt="Vehicle check-out"
                                        borderRadius="md"
                                        boxShadow="md"
                                        maxH="400px"
                                        objectFit="contain"
                                        mx="auto"
                                        fallback={
                                            <Box
                                                bg="gray.100"
                                                height="200px"
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                                borderRadius="md"
                                            >
                                                <Text color="gray.500">Failed to load image</Text>
                                            </Box>
                                        }
                                    />
                                ) : (
                                    <Box
                                        bg="gray.100"
                                        height="200px"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        borderRadius="md"
                                    >
                                        <Text color="gray.500">No check-out image available</Text>
                                    </Box>
                                )}
                            </Box>
                        </Grid>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Action Modal (Handover/Return) */}
            <ContractModal
                isOpen={isActionModalOpen}
                onClose={handleActionModalClose}
                contract={selectedContractForAction}
                action={modalAction}
                onSuccess={handleModalSuccess}
            />
        </Box>
    );
};

export default ContractList;
