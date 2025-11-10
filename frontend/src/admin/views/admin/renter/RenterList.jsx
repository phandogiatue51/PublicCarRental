import {
  Box, SimpleGrid,  Button,  Flex,  Icon,  Table,  Tbody,  Td,  Text,  Th,  Thead,  Tr,  useColorModeValue,  Spinner,  Select,  HStack,
  useToast,  Input
} from "@chakra-ui/react";
import {
  createColumnHelper,  flexRender,  getCoreRowModel,  getSortedRowModel,  useReactTable
} from "@tanstack/react-table";
import { useState, useEffect, useMemo } from "react";
import { renterAPI } from "../../../../services/api";
import {
  MdChevronLeft,  MdChevronRight,  MdPerson,  MdEmail,  MdPhone,  MdDriveEta,  MdToggleOn,  MdToggleOff,  MdVisibility,  MdSearch,  MdClear,
} from "react-icons/md";

import Card from "./../../../components/card/Card";
import RenterDetailModal from "./RenterDetailModal";

const columnHelper = createColumnHelper();

export default function RenterList() {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "white");

  const [renters, setRenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [param, setParam] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRenter, setSelectedRenter] = useState(null);
  const toast = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch renters
  const fetchRenters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await renterAPI.getAll();
      setRenters(response || []);
      setTotalItems(response?.length || 0);
    } catch (err) {
      console.error("Error fetching renters:", err);
      setError(err.message || "Failed to fetch renters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenters();
  }, []);

const handleFilter = async () => {
  try {
    setLoading(true);
    setError(null);

    let filteredData = [];

    if (param) {
      filteredData = await renterAPI.filterByParam(param);
    } else {
      filteredData = await renterAPI.getAll();
    }

    if (statusFilter !== "all") {
      filteredData = filteredData.filter(
        (r) =>
          (statusFilter === "active" && r.status === 0) ||
          (statusFilter === "suspended" && r.status === 2) 
      );
    }

    setRenters(filteredData);
    setTotalItems(filteredData.length);
    setCurrentPage(1);
  } catch (err) {
    console.error("Error filtering renters:", err);
    setError("Failed to filter renters");
  } finally {
    setLoading(false);
  }
};

  // 🧹 Clear filter
  const handleClear = async () => {
    setParam("");
    setStatusFilter("all");
    await fetchRenters();
  };

  // 🧭 Pagination logic
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRenters = renters.slice(startIndex, endIndex);

    return { totalPages, startIndex, endIndex, paginatedRenters };
  }, [renters, currentPage, pageSize, totalItems]);

  const { totalPages, startIndex, endIndex, paginatedRenters } = paginationData;

  const goToPreviousPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleStatusToggle = async (renterId, currentStatus) => {
    try {
      await renterAPI.changeStatus(renterId);
      await fetchRenters();
      toast({
        title: "Success",
        description: `Status changed to ${currentStatus === 0 ? "Suspended" : "Active"
          }`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to change renter status",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleView = (renter) => {
    setSelectedRenter(renter);
    setIsDetailModalOpen(true);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedRenter(null);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("renterId", {
        header: "ID",
        cell: (info) => <Text fontWeight="600">{info.getValue()}</Text>,
      }),
      columnHelper.accessor("fullName", {
        header: "FULL NAME",
        cell: (info) => (
          <Flex align="center" gap={2}>
            <Icon as={MdPerson} />
            <Text>{info.getValue()}</Text>
          </Flex>
        ),
      }),

      columnHelper.accessor("phoneNumber", {
        header: "PHONE",
        cell: (info) => (
          <Flex align="center" gap={2}>
            <Icon as={MdPhone} />
            <Text>{info.getValue()}</Text>
          </Flex>
        ),
      }),
      columnHelper.accessor("status", {
        header: "STATUS",
        cell: (info) => {
          const status = info.getValue();
          const renterId = info.row.original.renterId;
          const isActive = status === 0;
          return (
            <Button
              variant="ghost"
              onClick={() => handleStatusToggle(renterId, status)}
              colorScheme={isActive ? "green" : "red"}
              leftIcon={
                <Icon as={isActive ? MdToggleOn : MdToggleOff} boxSize={7} />
              }
            >
              {isActive ? "Active" : "Suspended"}
            </Button>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "ACTIONS",
        cell: (info) => (
          <Button
            size="sm"
            variant="outline"
            colorScheme="blue"
            leftIcon={<Icon as={MdVisibility} />}
            onClick={() => handleView(info.row.original)}
          >
            View
          </Button>
        ),
      }),
    ],
    [textColor]
  );

  const table = useReactTable({
    data: paginatedRenters,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" color={brandColor} />
        <Text ml={4}>Loading renters...</Text>
      </Flex>
    );
  }

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Card>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
          <Input
            placeholder="Search by name, email, or phone..."
            value={param}
            onChange={(e) => setParam(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
          <HStack justify="flex-start">
            <Button
              colorScheme="teal"
              leftIcon={<Icon as={MdSearch} />}
              onClick={handleFilter}
            >
              Search
            </Button>
            <Button
              variant="outline"
              colorScheme="gray"
              leftIcon={<Icon as={MdClear} />}
              onClick={handleClear}
            >
              Clear
            </Button>
          </HStack>
        </SimpleGrid>
      </Card>


      {/* 🧾 Table Section */}
      <Card mt={5}>
        <Table variant="simple">
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
                  <Td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      {/* 📄 Pagination + Modal */}
      <Flex justify="space-between" align="center" mt={4}>
        <Text fontSize="sm">
          Showing {startIndex + 1} - {Math.min(endIndex, totalItems)} of{" "}
          {totalItems}
        </Text>
        <HStack>
          <Button onClick={goToPreviousPage} isDisabled={currentPage === 1}>
            <Icon as={MdChevronLeft} />
          </Button>
          <Text>{currentPage}</Text>
          <Button
            onClick={goToNextPage}
            isDisabled={currentPage === totalPages}
          >
            <Icon as={MdChevronRight} />
          </Button>
        </HStack>
      </Flex>

      <RenterDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleDetailModalClose}
        renter={selectedRenter}
      />
    </Box>
  );
}
