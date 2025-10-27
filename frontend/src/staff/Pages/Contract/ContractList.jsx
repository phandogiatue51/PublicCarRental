import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Image,
  Grid,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { contractAPI, renterAPI, vehicleAPI } from "../../../services/api";
import {
  MdChevronLeft,
  MdChevronRight,
  MdRefresh,
  MdVisibility,
  MdSchedule,
  MdPhotoLibrary,
  MdDirectionsCar,
  MdExitToApp,
  MdFilterList,
  MdClear,
} from "react-icons/md";

// Custom components
import Card from "../../../admin/components/card/Card";
import ContractDetailModal from "./ContractDetailModal";
import ContractModal from "./ContractModal";

const columnHelper = createColumnHelper();

const ContractList = () => {
  const [stationId, setStationId] = useState(null); 

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState({
    imageIn: "",
    imageOut: "",
  });
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedContractForAction, setSelectedContractForAction] =
    useState(null);
  const [modalAction, setModalAction] = useState(null); // 'handover' or 'return'
  
  const [filters, setFilters] = useState({
    status: "",
    renterId: "",
    vehicleId: "",
  });

  const [filterOptions, setFilterOptions] = useState({
  renters: [],
  vehicles: [], // Add vehicles array
  statuses: [
    { value: "", label: "All Status" },
    { value: "0", label: "To Be Confirmed" },
    { value: "1", label: "Active" },
    { value: "2", label: "Completed" },
    { value: "3", label: "Cancelled" },
    { value: "4", label: "Confirmed" },
  ],
});

  const toast = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Color mode values
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "white");

const fetchFilterOptions = async () => {
  try {
    const [rentersResponse, vehiclesResponse] = await Promise.all([
      renterAPI.getAll(),
      vehicleAPI.filter({ stationId: stationId }),
    ]);

    console.log('Renters for filter:', rentersResponse);
    console.log('Vehicles for filter (station ${stationId}):', vehiclesResponse);

    setFilterOptions(prev => ({
      ...prev,
      renters: rentersResponse || [],
      vehicles: vehiclesResponse || [], 
    }));
  } catch (err) {
    console.error('Error fetching filter options:', err);
    toast({
      title: "Warning",
      description: "Failed to load some filter options",
      status: "warning",
      duration: 3000,
      isClosable: true,
    });
  }
};

 useEffect(() => {
    const storedStationId = localStorage.getItem('stationId');
    console.log('ContractList - StationId from localStorage:', storedStationId);
    
    if (storedStationId) {
      setStationId(parseInt(storedStationId));
    } else {
      setError('No station assigned. Please contact administrator.');
      setLoading(false);
    }
  }, []);

  // THEN fetch data when stationId is available
  useEffect(() => {
    if (stationId) {
      console.log('ContractList - stationId is now available:', stationId);
      fetchContracts();
      fetchFilterOptions();
    }
  }, [stationId]);

  // Fetch contracts from API - ALWAYS filter by stationId
  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filterParams = {
        stationId: stationId // Use the state variable
      };
      
      if (filters.status !== "") filterParams.status = parseInt(filters.status);
      if (filters.renterId) filterParams.renterId = parseInt(filters.renterId);
      if (filters.vehicleId) filterParams.vehicleId = parseInt(filters.vehicleId);

      console.log('Filter params:', filterParams);
      const response = await contractAPI.filter(filterParams);
      console.log('Filtered contracts by station:', response);

      setContracts(response || []);
      setTotalItems(response?.length || 0);
    } catch (err) {
      console.error('Error fetching contracts:', err);
      setError(err.message || 'Failed to fetch contracts');
      toast({
        title: "Error",
        description: "Failed to fetch contracts",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Apply filter
  const handleApplyFilter = () => {
  setCurrentPage(1);
  fetchContracts(); // Remove the parameter
};

  // Clear filter
 const handleClearFilter = () => {
  setFilters({
    status: "",
    renterId: "",
    vehicleId: "",
  });
  setCurrentPage(1);
  fetchContracts(); // Remove the parameter
};

  // Check if any filter is active
  const isFilterActive = Object.values(filters).some(value => value !== "");

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
      paginatedContracts,
    };
  }, [contracts, currentPage, pageSize, totalItems]);

  const { totalPages, startIndex, endIndex, paginatedContracts } =
    paginationData;

  // Pagination handlers - memoized for performance
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const goToFirstPage = useCallback(() => setCurrentPage(1), []);
  const goToLastPage = useCallback(
    () => setCurrentPage(totalPages),
    [totalPages]
  );
  const goToPreviousPage = useCallback(
    () => setCurrentPage((prev) => Math.max(prev - 1, 1)),
    []
  );
  const goToNextPage = useCallback(
    () => setCurrentPage((prev) => Math.min(prev + 1, totalPages)),
    [totalPages]
  );

  // Handle refresh
const handleRefresh = useCallback(() => {
  fetchContracts(); // Remove the parameter
}, []); // Remove isFilterActive dependency


  // Handle view contract details
  const handleView = useCallback(
    async (contract) => {
      try {
        setLoading(true);
        const contractDetails = await contractAPI.getById(contract.contractId);
        console.log("Contract details:", contractDetails);
        setSelectedContract(contractDetails);
        setIsDetailModalOpen(true);
      } catch (err) {
        console.error("Error fetching contract details:", err);
        toast({
          title: "Error",
          description: "Failed to fetch contract details",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Handle image view
  const handleImageView = useCallback((contract) => {
    const baseUrl = "https://publiccarrental-production-b7c5.up.railway.app";

    const imageInUrl = contract.imageIn
      ? contract.imageIn.startsWith("http")
        ? contract.imageIn
        : `${baseUrl}${contract.imageIn}`
      : null;

    const imageOutUrl = contract.imageOut
      ? contract.imageOut.startsWith("http")
        ? contract.imageOut
        : `${baseUrl}${contract.imageOut}`
      : null;

    setSelectedImages({
      imageIn: imageInUrl,
      imageOut: imageOutUrl,
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
    setSelectedImages({ imageIn: "", imageOut: "" });
  }, []);

  // Handle action modal
  const handleHandover = useCallback((contract) => {
    setSelectedContractForAction(contract);
    setModalAction("handover");
    setIsActionModalOpen(true);
  }, []);

  const handleReturn = useCallback((contract) => {
    setSelectedContractForAction(contract);
    setModalAction("return");
    setIsActionModalOpen(true);
  }, []);

  const handleActionModalClose = useCallback(() => {
    setIsActionModalOpen(false);
    setSelectedContractForAction(null);
    setModalAction(null);
  }, []);

  // Handle modal success callback
const handleModalSuccess = useCallback(async () => {
  await fetchContracts(); // Remove the parameter
}, []); // Remove isFilterActive dependency

  const getStatusColor = (status) => {
    switch (status) {
      case 0:
        return "orange"; // ToBeConfirmed - màu cam cho chờ xác nhận
      case 1:
        return "green"; // Active - màu xanh lá cho đang hoạt động
      case 2:
        return "purple"; // Completed - màu tím cho hoàn thành
      case 3:
        return "red"; // Cancelled - màu đỏ cho đã hủy
      case 4:
        return "teal";
      default:
        return "gray";
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return "To Be Confirmed";
      case 1:
        return "Active";
      case 2:
        return "Completed";
      case 3:
        return "Cancelled";
      case 4:
        return "Confirmed";
      default:
        return "Unknown";
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("contractId", {
        id: "contractId",
        header: () => (
          <Text
            justifyContent="space-between"
            align="center"
            fontSize={{ sm: "10px", lg: "12px" }}
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

      columnHelper.accessor("imageIn", {
        id: "images",
        header: () => (
          <Text
            justifyContent="space-between"
            align="center"
            fontSize={{ sm: "10px", lg: "12px" }}
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

      columnHelper.accessor("status", {
        id: "status",
        header: () => (
          <Text
            justifyContent="space-between"
            align="center"
            fontSize={{ sm: "10px", lg: "12px" }}
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

      columnHelper.accessor("actions", {
        id: "actions",
        header: () => (
          <Text
            justifyContent="space-between"
            align="center"
            fontSize={{ sm: "10px", lg: "12px" }}
            color="gray.400"
          >
            ACTIONS
          </Text>
        ),
        cell: (info) => {
          const contract = info.row.original;
          const status = contract.status;

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
    ],
    [textColor, handleImageView, handleHandover, handleReturn]
  );

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

            {/* FILTER SECTION */}
            <Card>
                <Box>
                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={4}>
                        {/* Status Filter */}
                        <FormControl>
                            <Select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                placeholder="All Status"
                            >
                                {filterOptions.statuses.map(status => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Renter Filter */}
                        <FormControl>
                            <Select
                                value={filters.renterId}
                                onChange={(e) => handleFilterChange('renterId', e.target.value)}
                                placeholder="All Renters"
                            >
                                {filterOptions.renters.map(renter => (
                                    <option key={renter.renterId} value={renter.renterId}>
                                        {renter.fullName} (ID: {renter.renterId})
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Vehicle Filter */}
                        <FormControl>
                          <Select
                            value={filters.vehicleId}
                            onChange={(e) => handleFilterChange('vehicleId', e.target.value)}
                            placeholder="All Vehicles"
                          >
                            {filterOptions.vehicles?.map(vehicle => (
                              <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                                {vehicle.modelName} - {vehicle.licensePlate} (ID: {vehicle.vehicleId})
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                        <HStack>
                            <Button
                                leftIcon={<Icon as={MdFilterList} />}
                                colorScheme="blue"
                                onClick={handleApplyFilter}
                                isDisabled={loading}
                            >
                                Apply Filters
                            </Button>
                            <Button
                                leftIcon={<Icon as={MdClear} />}
                                variant="outline"
                                onClick={handleClearFilter}
                                isDisabled={loading || !isFilterActive}
                            >
                                Clear
                            </Button>
                        </HStack>
                    </Grid>
                </Box>
            </Card>

            {/* Contracts Table */}
            <Card>
                <Flex direction="column" w="100%">
                    {/* Table Header with Results Count */}
                    <Flex
                        justify="space-between"
                        align="center"
                        w="100%"
                        px="24px"
                        py="16px"
                        borderBottom="1px"
                        borderColor={borderColor}
                    >
                        <Text color={textColor} fontSize="lg" fontWeight="700">
                            Contracts ({totalItems} found)
                        </Text>
                    </Flex>

                    {/* Table */}
                    <Box overflowX="auto">
                        <Table variant="simple" color="gray.500" mb="24px">
                            <Thead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <Tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <Th
                                                key={header.id}
                                                colSpan={header.colSpan}
                                                pe="10px"
                                                borderColor={borderColor}
                                                cursor={header.column.getCanSort() ? 'pointer' : 'default'}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                <Flex
                                                    justifyContent="space-between"
                                                    align="center"
                                                    fontSize={{ sm: "10px", lg: "12px" }}
                                                    color="gray.400"
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {{
                                                        asc: ' 🔼',
                                                        desc: ' 🔽',
                                                    }[header.column.getIsSorted()] ?? null}
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
                                            <Text color="gray.500">No contracts found</Text>
                                        </Td>
                                    </Tr>
                                ) : (
                                    table.getRowModel().rows.map((row) => (
                                        <Tr key={row.id}>
                                            {row.getVisibleCells().map((cell) => (
                                                <Td
                                                    key={cell.id}
                                                    fontSize="sm"
                                                    border="none"
                                                    borderBottom="1px"
                                                    borderColor={borderColor}
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
                </Flex>
            </Card>
        </Flex>

        {/* Modals */}
        <ContractDetailModal
            isOpen={isDetailModalOpen}
            onClose={handleDetailModalClose}
            contract={selectedContract}
        />

        {/* Image Modal */}
        <Modal isOpen={isImageModalOpen} onClose={handleImageModalClose} size="xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Contract Images</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <Grid templateColumns="1fr 1fr" gap={4}>
                        <Box>
                            <Text fontWeight="bold" mb={2}>Check-in Image</Text>
                            {selectedImages.imageIn ? (
                                <Image
                                    src={selectedImages.imageIn}
                                    alt="Check-in"
                                    borderRadius="md"
                                    fallbackSrc="https://via.placeholder.com/300x200?text=No+Image"
                                />
                            ) : (
                                <Text color="gray.500">No check-in image available</Text>
                            )}
                        </Box>
                        <Box>
                            <Text fontWeight="bold" mb={2}>Check-out Image</Text>
                            {selectedImages.imageOut ? (
                                <Image
                                    src={selectedImages.imageOut}
                                    alt="Check-out"
                                    borderRadius="md"
                                    fallbackSrc="https://via.placeholder.com/300x200?text=No+Image"
                                />
                            ) : (
                                <Text color="gray.500">No check-out image available</Text>
                            )}
                        </Box>
                    </Grid>
                </ModalBody>
            </ModalContent>
        </Modal>

        {/* Action Modal */}
        <ContractModal
            isOpen={isActionModalOpen}
            onClose={handleActionModalClose}
            contract={selectedContractForAction}
            action={modalAction}
            onSuccess={handleModalSuccess}
        />
    </Box>
)
};


export default ContractList;
