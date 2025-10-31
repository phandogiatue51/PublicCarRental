import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Grid, Image,
  Button, FormLabel,
  Flex,
  Text,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  useToast,
  Icon,
  Badge,
  Tooltip,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
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
  MdRefresh,
  MdSchedule,
  MdPhotoLibrary,
  MdVisibility,
  MdDirectionsCar,
  MdExitToApp, MdReportProblem
} from "react-icons/md";

import Card from "../../../admin/components/card/Card";
import ContractDetailModal from "./ContractDetailModal";
import ContractModal from "./ContractModal";
import ContractFilters from "./ContractFilter";
import Pagination from "./../../../components/Pagination";
import ContractAccidentModal from './../AccidentReport/ContractAccidentModal';

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
  const [selectedImages, setSelectedImages] = useState({ imageIn: "", imageOut: "" });
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedContractForAction, setSelectedContractForAction] = useState(null);
  const [modalAction, setModalAction] = useState(null);
  const [isAccidentModalOpen, setIsAccidentModalOpen] = useState(false);

  const handleReportIssue = useCallback((contract) => {
    setSelectedContractForAction(contract);
    setIsAccidentModalOpen(true);
  }, []);

  const [filters, setFilters] = useState({
    status: "",
    renterId: "",
    vehicleId: "",
    startDate: "",
    endDate: "",
  });

  const [filterOptions, setFilterOptions] = useState({
    renters: [],
    vehicles: [],
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

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [rentersResponse, vehiclesResponse] = await Promise.all([
        renterAPI.getAll(),
        vehicleAPI.filter({ stationId: stationId }),
      ]);

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
  }, [stationId, toast]);

  // Fetch contracts
  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = {
        stationId: stationId
      };

      if (filters.status !== "") filterParams.status = parseInt(filters.status);
      if (filters.renterId) filterParams.renterId = parseInt(filters.renterId);
      if (filters.vehicleId) filterParams.vehicleId = parseInt(filters.vehicleId);
      if (filters.startDate) filterParams.startDate = filters.startDate;
      if (filters.endDate) filterParams.endDate = filters.endDate;

      const response = await contractAPI.filter(filterParams);
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
  }, [stationId, filters, toast]);

  // Effects
  useEffect(() => {
    const storedStationId = localStorage.getItem('stationId');
    if (storedStationId) {
      setStationId(parseInt(storedStationId));
    } else {
      setError('No station assigned. Please contact administrator.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (stationId) {
      fetchContracts();
      fetchFilterOptions();
    }
  }, [stationId, fetchContracts, fetchFilterOptions]);

  // Filter handlers
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleApplyFilter = useCallback(() => {
    setCurrentPage(1);
    fetchContracts();
  }, [fetchContracts]);

  const handleClearFilter = useCallback(() => {
    setFilters({ status: "", renterId: "", vehicleId: "" , startDate: "", endDate: "" });
    setCurrentPage(1);
    fetchContracts();
  }, [fetchContracts]);

  const isFilterActive = useMemo(() =>
    Object.values(filters).some(value => value !== ""),
    [filters]
  );

  // Pagination
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedContracts = contracts.slice(startIndex, endIndex);

    return { totalPages, startIndex, endIndex, paginatedContracts };
  }, [contracts, currentPage, pageSize, totalItems]);

  const { totalPages, startIndex, endIndex, paginatedContracts } = paginationData;

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  }, []);

  // Action handlers
  const handleRefresh = useCallback(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleView = useCallback(async (contract) => {
    try {
      setLoading(true);
      const contractDetails = await contractAPI.getById(contract.contractId);
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
  }, [toast]);

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

    setSelectedImages({ imageIn: imageInUrl, imageOut: imageOutUrl });
    setIsImageModalOpen(true);
  }, []);

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

  // Modal handlers
  const handleDetailModalClose = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedContract(null);
  }, []);

  const handleImageModalClose = useCallback(() => {
    setIsImageModalOpen(false);
    setSelectedImages({ imageIn: "", imageOut: "" });
  }, []);

  const handleActionModalClose = useCallback(() => {
    setIsActionModalOpen(false);
    setSelectedContractForAction(null);
    setModalAction(null);
  }, []);

  const handleModalSuccess = useCallback(async () => {
    await fetchContracts();
  }, [fetchContracts]);

  // Helper functions
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 0: return "orange";
      case 1: return "green";
      case 2: return "purple";
      case 3: return "red";
      case 4: return "teal";
      default: return "gray";
    }
  }, []);

  const getStatusText = useCallback((status) => {
    switch (status) {
      case 0: return "To Be Confirmed";
      case 1: return "Active";
      case 2: return "Completed";
      case 3: return "Cancelled";
      case 4: return "Confirmed";
      default: return "Unknown";
    }
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit"
    });
  }, []);

  // Add this right after your other modal close handlers
  const handleAccidentModalClose = useCallback(() => {
    setIsAccidentModalOpen(false);
    setSelectedContractForAction(null);
  }, []);

  // Columns definition
  const columns = useMemo(() => [
    columnHelper.accessor("contractId", {
      id: "contractId",
      header: () => (
        <Text fontSize={{ sm: "10px", lg: "12px" }} color="gray.400">
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
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
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
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
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
        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
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
        <Text fontSize={{ sm: "10px", lg: "12px" }} color="gray.400">
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
        <Text fontSize={{ sm: "10px", lg: "12px" }} color="gray.400">
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

    columnHelper.display({
      id: "actions",
      header: () => (
        <Text fontSize={{ sm: "10px", lg: "12px" }} color="gray.400">
          ACTIONS
        </Text>
      ),
      cell: (info) => {
        const contract = info.row.original;
        const status = contract.status;

        const canHandover = status === 4; // Confirmed status
        const canReturn = status === 1; // Active status

        return (
          <Flex align="center" gap={1} wrap="wrap">
            <Tooltip label="View Details">
              <Button
                variant="outline"
                size="sm"
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
                  colorScheme="green"
                  onClick={() => handleHandover(contract)}
                >
                  Active
                </Button>
              </Tooltip>
            )}

            {canReturn && (
              <Tooltip label="Return Vehicle">
                <Button
                  variant="outline"
                  size="sm"
                  colorScheme="orange"
                  onClick={() => handleReturn(contract)}
                >
                  Return
                </Button>
              </Tooltip>
            )}
            {(status === 2 || status === 3 || status === 4) && (
              <Tooltip label="Report Issue">
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="red"
                  onClick={() => handleReportIssue(contract)}
                >
                  Report
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
  ], [textColor, handleImageView, handleHandover, handleReturn, handleView, getStatusColor, getStatusText, formatDate]);

  // Table setup
  const table = useReactTable({
    data: paginatedContracts,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Loading state
  if (loading && contracts.length === 0) {
    return (
      <Box>
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

  // Error state
  if (error && contracts.length === 0) {
    return (
      <Box>
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

        {/* Filters */}
        <Card>
          <ContractFilters
            filters={filters}
            filterOptions={filterOptions}
            onFilterChange={handleFilterChange}
            onApplyFilter={handleApplyFilter}
            onClearFilter={handleClearFilter}
            isFilterActive={isFilterActive}
            loading={loading}
          />
        </Card>

        {/* Contracts Table */}
        <Card>
          <Flex direction="column" w="100%">
            {/* Table Header */}
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
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              startIndex={startIndex}
              endIndex={endIndex}
            />
          </Flex>
        </Card>
      </Flex>

      {/* Contract Accident Modal */}
      <ContractAccidentModal
        isOpen={isAccidentModalOpen}
        onClose={handleAccidentModalClose}
        contract={selectedContractForAction}
        onSuccess={handleModalSuccess}
      />

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
  );
};

export default ContractList;