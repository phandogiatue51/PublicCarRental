/* eslint-disable */

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
  VStack,
  useToast,
  Tooltip,
  Progress,
} from "@chakra-ui/react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState, useEffect, useMemo, useCallback } from "react";
import { vehicleAPI } from "../../../../services/api";
import {
  MdChevronLeft,
  MdChevronRight,
  MdDriveEta,
  MdLocationOn,
  MdRefresh,
  MdVisibility,
  MdAttachMoney,
  MdBattery6Bar,
  MdBuild,
  MdAdd,
  MdEdit,
  MdDelete,
} from "react-icons/md";

// Custom components
import Card from "../../../components/card/Card";
import VehicleModal from "./VehicleModal";

const columnHelper = createColumnHelper();

export default function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  // Filter state
  const [model, setModel] = useState("");
  const [type, setType] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState("");

  // Apply filter (you can replace with API call if needed)
  const handleFilter = async () => {
    setLoading(true);
    try {
      const filtered = vehicles.filter((v) => {
        return (
          (!model || v.modelName === model) &&
          (!type || v.type === type) &&
          (!brand || v.brand === brand) &&
          (!status || v.status?.toString() === status)
        );
      });
      setVehicles(filtered);
    } finally {
      setLoading(false);
    }
  };

  // Clear filter
  const handleClear = () => {
    setModel("");
    setType("");
    setBrand("");
    setStatus("");
    fetchVehicles(); // reload all vehicles
  };
  const toast = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "white");

  // Fetch vehicles from API
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vehicleAPI.getAll();
      console.log("Vehicles response:", response);
      setVehicles(response || []);
      setTotalItems(response?.length || 0);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError(err.message || "Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Pagination calculations - memoized for performance
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedVehicles = vehicles.slice(startIndex, endIndex);

    return {
      totalPages,
      startIndex,
      endIndex,
      paginatedVehicles,
    };
  }, [vehicles, currentPage, pageSize, totalItems]);

  const { totalPages, startIndex, endIndex, paginatedVehicles } =
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
    fetchVehicles();
  }, []);

  // Handle add new vehicle
  const handleAdd = useCallback(() => {
    setSelectedVehicle(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  }, []);

  // Handle edit vehicle
  const handleEdit = useCallback((vehicle) => {
    setSelectedVehicle(vehicle);
    setIsEditMode(true);
    setIsModalOpen(true);
  }, []);

  // Handle delete vehicle
  const handleDelete = useCallback(
    async (vehicleId) => {
      if (window.confirm("Are you sure you want to delete this vehicle?")) {
        try {
          const response = await vehicleAPI.delete(vehicleId);
          console.log("Delete response:", response);
          await fetchVehicles(); // Refresh the list
          toast({
            title: "Success",
            description: "Vehicle deleted successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        } catch (err) {
          toast({
            title: "Error",
            description: err.message || "Failed to delete vehicle",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      }
    },
    [toast]
  );

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
    setIsEditMode(false);
  }, []);

  // Handle modal success (refresh data)
  const handleModalSuccess = useCallback(() => {
    fetchVehicles();
  }, []);

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 0:
        return "orange";
      case 1:
        return "blue";
      case 2:
        return "purple";
      case 3:
        return "red";
      case 4:
        return "orange";
      case 5:
        return "green";
      default:
        return "gray";
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return "To Be Rented";
      case 1:
        return "Renting";
      case 2:
        return "Charging";
      case 3:
        return "To Be Checkup";
      case 4:
        return "In Maintenance";
      case 5:
        return "Available";
      default:
        return "Unknown";
    }
  };

  // Get battery color based on level
  const getBatteryColor = (level) => {
    if (level >= 80) return "green";
    if (level >= 50) return "yellow";
    if (level >= 20) return "orange";
    return "red";
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("vehicleId", {
        id: "vehicleId",
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
      columnHelper.accessor("licensePlate", {
        id: "licensePlate",
        header: () => (
          <Text
            justifyContent="space-between"
            align="center"
            fontSize={{ sm: "10px", lg: "12px" }}
            color="gray.400"
          >
            LICENSE PLATE
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
      columnHelper.accessor("modelName", {
        id: "model",
        header: () => (
          <Text
            justifyContent="space-between"
            align="center"
            fontSize={{ sm: "10px", lg: "12px" }}
            color="gray.400"
          >
            MODEL
          </Text>
        ),
        cell: (info) => (
          <Flex align="center" gap={2}>
            <Text color={textColor} fontSize="sm" fontWeight="700">
              {info.getValue()}
            </Text>
          </Flex>
        ),
      }),
      columnHelper.accessor("batteryLevel", {
        id: "battery",
        header: () => (
          <Text
            justifyContent="space-between"
            align="center"
            fontSize={{ sm: "10px", lg: "12px" }}
            color="gray.400"
          >
            BATTERY
          </Text>
        ),
        cell: (info) => {
          const level = info.getValue();
          return (
            <Flex align="center" gap={2}>
              <Icon
                as={MdBattery6Bar}
                color={`${getBatteryColor(level)}.500`}
              />
              <VStack spacing={1} align="start">
                <Text color={textColor} fontSize="sm" fontWeight="bold">
                  {level}%
                </Text>
                <Progress
                  value={level}
                  size="sm"
                  colorScheme={getBatteryColor(level)}
                  width="60px"
                  borderRadius="md"
                />
              </VStack>
            </Flex>
          );
        },
      }),
      columnHelper.accessor("stationName", {
        id: "station",
        header: () => (
          <Text
            justifyContent="space-between"
            align="center"
            fontSize={{ sm: "10px", lg: "12px" }}
            color="gray.400"
          >
            STATION
          </Text>
        ),
        cell: (info) => (
          <Flex align="center" gap={2}>
            <Icon as={MdLocationOn} color="gray.500" />
            <Text color={textColor} fontSize="sm">
              {info.getValue()}
            </Text>
          </Flex>
        ),
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
            <Tooltip label="Edit Vehicle">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Icon as={MdEdit} />}
                colorScheme="blue"
                onClick={() => handleEdit(info.row.original)}
              >
                Edit
              </Button>
            </Tooltip>
            <Tooltip label="Delete Vehicle">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Icon as={MdDelete} />}
                colorScheme="red"
                onClick={() => handleDelete(info.row.original.vehicleId)}
              >
                Delete
              </Button>
            </Tooltip>
          </Flex>
        ),
      }),
    ],
    [textColor, handleEdit, handleDelete]
  );

  const table = useReactTable({
    data: paginatedVehicles,
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
              Loading vehicles...
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
            <Button onClick={fetchVehicles} colorScheme="blue">
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
        {/* Header */}
        <Flex
          mt="45px"
          justifyContent="space-between"
          direction={{ base: "column", md: "row" }}
          align={{ base: "start", md: "center" }}
        >
          <Text color={textColor} fontSize="2xl" ms="24px" fontWeight="700">
            Vehicle Management
          </Text>
          <HStack spacing={2}>
            <Button
              leftIcon={<Icon as={MdAdd} />}
              colorScheme="blue"
              variant="solid"
              onClick={handleAdd}
            >
              Add Vehicle
            </Button>
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
        {/* 🔍 FILTER SECTION */}
        <Card>
          <HStack spacing={4} p={4} wrap="wrap">
            <Select
              placeholder="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              width="180px"
            >
              <option value="Model S">Model S</option>
              <option value="Model X">Model X</option>
              <option value="Model 3">Model 3</option>
              <option value="Model Y">Model Y</option>
            </Select>

            <Select
              placeholder="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              width="180px"
            >
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Gasoline">Gasoline</option>
            </Select>

            <Select
              placeholder="Brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              width="180px"
            >
              <option value="Tesla">Tesla</option>
              <option value="VinFast">VinFast</option>
              <option value="Toyota">Toyota</option>
              <option value="Honda">Honda</option>
            </Select>

            <Select
              placeholder="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              width="180px"
            >
              <option value="0">To Be Rented</option>
              <option value="1">Renting</option>
              <option value="2">Charging</option>
              <option value="3">To Be Checkup</option>
              <option value="4">In Maintenance</option>
              <option value="5">Available</option>
            </Select>

            <Button colorScheme="blue" onClick={handleFilter}>
              Apply Filter
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          </HStack>
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
                {table.getRowModel().rows.map((row) => (
                  <Tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Td
                        key={cell.id}
                        fontSize={{ sm: "14px" }}
                        minW={{ sm: "150px", md: "200px", lg: "auto" }}
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
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{" "}
                {totalItems} vehicles
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

      {/* Vehicle Modal */}
      <VehicleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        vehicle={selectedVehicle}
        isEdit={isEditMode}
      />
    </Box>
  );
}
