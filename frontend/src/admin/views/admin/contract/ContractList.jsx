import {
  Box, SimpleGrid,
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
  Input
} from "@chakra-ui/react";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState, useEffect, useMemo, useCallback } from "react";
import { contractAPI, stationAPI, renterAPI, staffAPI, vehicleAPI, brandAPI, modelAPI } from "../../../../services/api";
import {
  MdChevronLeft,
  MdChevronRight,
  MdDriveEta,
  MdRefresh,
  MdVisibility,
  MdSchedule,
  MdPhotoLibrary,
} from "react-icons/md";

// Custom components
import Card from "../../../components/card/Card";
import ContractDetailModal from "./ContractDetailModal";

const columnHelper = createColumnHelper();

export default function ContractList() {
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
  // -------------------- FILTER STATE --------------------
  const [stationId, setStationId] = useState("");
  const [status, setStatus] = useState("");
  const [renterId, setRenterId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  // Dropdown data & selection modals
  const [stations, setStations] = useState([]);
  const [isRenterModalOpen, setIsRenterModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [renters, setRenters] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedRenter, setSelectedRenter] = useState(null);
  const [selectedStaffObj, setSelectedStaffObj] = useState(null);
  const [selectedVehicleObj, setSelectedVehicleObj] = useState(null);
  // Vehicle modal filters
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");

  // Gọi API filter
  const handleFilter = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (stationId) params.stationId = parseInt(stationId);
      if (status !== "") params.status = parseInt(status);
      if (renterId) params.renterId = parseInt(renterId);
      if (staffId) params.staffId = parseInt(staffId);
      if (vehicleId) params.vehicleId = parseInt(vehicleId);

      const response = await contractAPI.filter(params);
      console.log("Filtered contracts:", response);

      setContracts(response || []);
      setTotalItems(response?.length || 0);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error filtering contracts:", err);
      toast({
        title: "Error",
        description: "Failed to filter contracts",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setStationId("");
    setStatus("");
    setRenterId("");
    setStaffId("");
    setVehicleId("");
    fetchContracts();
  };

  const toast = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "white");

  // Fetch contracts from API
  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contractAPI.getAll();
      console.log("Contracts response:", response);
      setContracts(response || []);
      setTotalItems(response?.length || 0);
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setError(err.message || "Failed to fetch contracts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
    // Load stations for dropdown
    (async () => {
      try {
        const res = await stationAPI.getAll();
        setStations(res || []);
      } catch (err) {
        console.error("Error fetching stations:", err);
      }
    })();
  }, []);

  // Load brands/models for vehicle modal once
  useEffect(() => {
    (async () => {
      try {
        const [b, m] = await Promise.all([brandAPI.getAll?.(), modelAPI.getAll?.()]);
        setBrands(b || []);
        setModels(m || []);
      } catch (e) {
        console.error("Error fetching brand/model:", e);
      }
    })();
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
    fetchContracts();
  }, []);

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
    const baseUrl = "https://localhost:7230";

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

  // Get status badge color
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
        return "teal"; // Confirmed - màu xanh ngọc cho đã xác nhận
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

      columnHelper.accessor("vehicleLicensePlate", {
        id: "vehicle",
        header: () => (
          <Text
            justifyContent="space-between"
            align="center"
            fontSize={{ sm: "10px", lg: "12px" }}
            color="gray.400"
          >
            VEHICLE
          </Text>
        ),
        cell: (info) => (
          <Flex align="center" gap={2}>
            <Icon as={MdDriveEta} color="gray.500" />
            <Text color={textColor} fontSize="sm" fontWeight="700">
              {info.getValue()}
            </Text>
          </Flex>
        ),
      }),

      columnHelper.accessor("startTime", {
        id: "startTime",
        header: () => (
          <Text
            justifyContent="space-between"
            align="center"
            fontSize={{ sm: "10px", lg: "12px" }}
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
      columnHelper.accessor("endTime", {
        id: "endTime",
        header: () => (
          <Text
            justifyContent="space-between"
            align="center"
            fontSize={{ sm: "10px", lg: "12px" }}
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
    ],
    [textColor, handleImageView]
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
      <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
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
      <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
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
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Flex direction="column" gap="20px" me="auto">
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontSize="2xl" fontWeight="700" color={textColor}>
            Contract Management
          </Text>
          <HStack>
            <Button leftIcon={<Icon as={MdRefresh} />} onClick={handleRefresh}>
              Refresh
            </Button>
          </HStack>
        </Flex>

        <Card mb={4} p={4}>
          <Flex gap={3} wrap="nowrap" overflowX="auto">
            <Select
              placeholder="Station"
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              size="sm"
              flex={1}
              width="180px"
            >
              {stations?.map((s) => (
                <option key={s.stationId || s.id} value={(s.stationId || s.id)?.toString?.()}>
                  {s.name || s.stationName || `Station ${s.stationId || s.id}`}
                </option>
              ))}
            </Select>
            <Select
              placeholder="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              size="sm"
              flex={1}
              width="150px"
            >
              <option value="0">To Be Confirmed</option>
              <option value="1">Active</option>
              <option value="2">Completed</option>
              <option value="3">Cancelled</option>
              <option value="4">Confirmed</option>
            </Select>
            <Flex gap={2} align="center">
              <Button size="sm"
                border="1px solid"
                onClick={async () => {
                  try {
                    const res = await renterAPI.getAll();
                    setRenters(res || []);
                    setIsRenterModalOpen(true);
                  } catch (err) {
                    console.error("Error fetching renters:", err);
                  }
                }}>{selectedRenter ? `Renter: ${selectedRenter.fullName || selectedRenter.name || selectedRenter.email} (${selectedRenter.renterId || selectedRenter.id})` : 'Select Renter'}</Button>
            </Flex>
            <Flex gap={2} align="center">
              <Button size="sm"
                border="1px solid"
                onClick={async () => {
                  try {
                    const res = await staffAPI.getAll();
                    setStaffList(res || []);
                    setIsStaffModalOpen(true);
                  } catch (err) {
                    console.error("Error fetching staff:", err);
                  }
                }}>{selectedStaffObj ? `Staff: ${selectedStaffObj.fullName || selectedStaffObj.name || selectedStaffObj.email} (${selectedStaffObj.staffId || selectedStaffObj.id})` : 'Select Staff'}</Button>
            </Flex>
            <Flex gap={2} align="center">
              <Button size="sm"
                border="1px solid"
                onClick={async () => {
                  try {
                    const res = await vehicleAPI.getAll();
                    setVehicles(res || []);
                    setIsVehicleModalOpen(true);
                  } catch (err) {
                    console.error("Error fetching vehicles:", err);
                  }
                }}>{selectedVehicleObj ? `Vehicle: ${selectedVehicleObj.licensePlate || selectedVehicleObj.vehicleLicensePlate} (${selectedVehicleObj.vehicleId || selectedVehicleObj.id})` : 'Select Vehicle'}</Button>
            </Flex>
            <Button colorScheme="blue" onClick={handleFilter} size="sm">
              Apply
            </Button>
            <Button variant="outline" onClick={handleClearFilter} size="sm">
              Clear
            </Button>
          </Flex>
        </Card>

        <Card>
          <Table variant="simple" color="gray.500" mb="24px" mt="12px">
            <Thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <Th
                      key={header.id}
                      borderColor={borderColor}
                      cursor={header.column.getCanSort() ? "pointer" : "default"}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <Flex align="center" gap={2}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: "▲",
                          desc: "▼",
                        }[header.column.getIsSorted()] ?? null}
                      </Flex>
                    </Th>

                  ))}
                </Tr>
              ))}
            </Thead>
            <Tbody>
              {table.getRowModel().rows.map((row) => (
                <Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Td key={cell.id} borderColor="transparent">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>

        {/* Pagination Controls */}
        <Card>
          <Flex justify="space-between" align="center" p={4}>
            <HStack spacing={4}>
              <Text fontSize="sm" color={textColor}>
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{" "}
                {totalItems} contracts
              </Text>
              <HStack spacing={2}>
                <Text fontSize="sm" color={textColor}>
                  Rows per page:
                </Text>
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
      />

      {/* Images Modal */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={handleImageModalClose}
        size="4xl"
        isCentered
      >
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
                <Text
                  fontWeight="bold"
                  mb={3}
                  textAlign="center"
                  color={textColor}
                >
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
                <Text
                  fontWeight="bold"
                  mb={3}
                  textAlign="center"
                  color={textColor}
                >
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

      {/* Renter Select Modal */}
      <Modal isOpen={isRenterModalOpen} onClose={() => setIsRenterModalOpen(false)} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Renter</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Table variant="simple" color="gray.500">
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Name</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {renters
                  ?.slice()
                  ?.sort((a, b) => {
                    const aId = Number(a?.renterId ?? a?.id ?? 0);
                    const bId = Number(b?.renterId ?? b?.id ?? 0);
                    return aId - bId;
                  })
                  .map((r) => (
                  <Tr key={r.renterId || r.id}>
                    <Td>{r.renterId || r.id}</Td>
                    <Td>{r.fullName || r.name || r.email}</Td>
                    <Td>
                      <Button size="sm" colorScheme="blue" onClick={() => {
                        setRenterId(((r.renterId || r.id) ?? "").toString());
                        setSelectedRenter(r);
                        setIsRenterModalOpen(false);
                      }}>Choose</Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Staff Select Modal */}
      <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Staff</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Table variant="simple" color="gray.500">
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Name</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {staffList?.map((s) => (
                  <Tr key={s.staffId || s.id}>
                    <Td>{s.staffId || s.id}</Td>
                    <Td>{s.fullName || s.name || s.email}</Td>
                    <Td>
                      <Button size="sm" colorScheme="blue" onClick={() => {
                        setStaffId(((s.staffId || s.id) ?? "").toString());
                        setSelectedStaffObj(s);
                        setIsStaffModalOpen(false);
                      }}>Choose</Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Vehicle Select Modal */}
      <Modal isOpen={isVehicleModalOpen} onClose={() => setIsVehicleModalOpen(false)} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent maxH="75vh">
          <ModalHeader>Select Vehicle</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} overflowY="auto">
            <Flex gap={3} mb={4} align="center" wrap="wrap">

              <Select
                placeholder="Model"
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                width="220px"
                size="sm"
              >
                {(selectedBrandId
                  ? models?.filter((m) => ((m.brandId || m.brand?.id)?.toString?.()) === selectedBrandId)
                  : models
                )?.map((m) => (
                  <option key={m.modelId || m.id} value={(m.modelId || m.id)?.toString?.()}>
                    {m.name || m.modelName}
                  </option>
                ))}
              </Select>
            </Flex>
            <Table variant="simple" color="gray.500">
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>License Plate</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {(vehicles || [])
                  .filter((v) => {
                    if (selectedBrandId && ((v.brandId || v.brand?.id)?.toString?.()) !== selectedBrandId) return false;
                    if (selectedModelId && ((v.modelId || v.model?.id)?.toString?.()) !== selectedModelId) return false;
                    return true;
                  })
                  .slice()
                  .sort((a, b) => {
                    const aId = Number(a?.vehicleId ?? a?.id ?? 0);
                    const bId = Number(b?.vehicleId ?? b?.id ?? 0);
                    return aId - bId;
                  })
                  .map((v) => (
                    <Tr key={v.vehicleId || v.id}>
                      <Td>{v.vehicleId || v.id}</Td>
                      <Td>{v.licensePlate || v.vehicleLicensePlate}</Td>
                      <Td>
                        <Button size="sm" colorScheme="blue" onClick={() => {
                          setVehicleId(((v.vehicleId || v.id) ?? "").toString());
                          setSelectedVehicleObj(v);
                          setIsVehicleModalOpen(false);
                        }}>Choose</Button>
                      </Td>
                    </Tr>
                  ))}
              </Tbody>
            </Table>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
