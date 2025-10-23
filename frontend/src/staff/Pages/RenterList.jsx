import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Flex,
  Icon,
  Input,
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
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Divider,
} from "@chakra-ui/react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  MdChevronLeft,
  MdChevronRight,
  MdPerson,
  MdEmail,
  MdPhone,
  MdDriveEta,
  MdRefresh,
  MdVisibility,
  MdSearch,
  MdClear,
} from "react-icons/md";
import { renterAPI } from "../../services/api";

const columnHelper = createColumnHelper();

const RenterList = () => {
  const [renters, setRenters] = useState([]);
  const [filteredRenters, setFilteredRenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRenter, setSelectedRenter] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "white");
  const cardBg = useColorModeValue("white", "gray.800");

  const fetchRenters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await renterAPI.getAll();
      setRenters(response || []);
      setFilteredRenters(response || []);
      setTotalItems(response?.length || 0);
    } catch (err) {
      setError(err.message || "Failed to fetch renters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenters();
  }, []);

  // Filter logic (runs on search/status change)
  useEffect(() => {
    let result = [...renters];
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.fullName?.toLowerCase().includes(term) ||
          r.email?.toLowerCase().includes(term) ||
          r.phoneNumber?.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== "") {
      result = result.filter((r) => String(r.status) === statusFilter);
    }
    setFilteredRenters(result);
    setTotalItems(result.length);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, renters]);

  const handleClear = () => {
    setSearchTerm("");
    setStatusFilter("");
    setFilteredRenters(renters);
  };

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filteredRenters.slice(startIndex, endIndex);
    return { totalPages, startIndex, endIndex, paginated };
  }, [filteredRenters, currentPage, pageSize, totalItems]);

  const { totalPages, startIndex, endIndex, paginated } = paginationData;

  const handleView = (renter) => {
    setSelectedRenter(renter);
    setIsDetailModalOpen(true);
  };

  const getStatusColor = (status) =>
    status === 0 ? "green" : status === 1 ? "red" : "orange";

  const getStatusText = (status) =>
    status === 0 ? "Active" : status === 1 ? "Inactive" : "Suspended";

  const columns = useMemo(
    () => [
      columnHelper.accessor("renterId", {
        header: "ID",
        cell: (info) => <Text fontWeight="700">{info.getValue()}</Text>,
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
      columnHelper.accessor("email", {
        header: "EMAIL",
        cell: (info) => (
          <Flex align="center" gap={2}>
            <Icon as={MdEmail} />
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
      columnHelper.accessor("licenseNumber", {
        header: "LICENSE",
        cell: (info) => (
          <Flex align="center" gap={2}>
            <Icon as={MdDriveEta} />
            <Text>{info.getValue() || "No License"}</Text>
          </Flex>
        ),
      }),
      columnHelper.accessor("status", {
        header: "STATUS",
        cell: (info) => (
          <Badge colorScheme={getStatusColor(info.getValue())}>
            {getStatusText(info.getValue())}
          </Badge>
        ),
      }),
      columnHelper.accessor("actions", {
        header: "ACTIONS",
        cell: (info) => (
          <Button
            size="sm"
            colorScheme="blue"
            variant="outline"
            onClick={() => handleView(info.row.original)}
            leftIcon={<Icon as={MdVisibility} />}
          >
            View
          </Button>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: paginated,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading)
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" color={brandColor} />
        <Text ml={4}>Loading renters...</Text>
      </Flex>
    );

  return (
    <Box>
      <Flex justify="space-between" align="center" mt="45px">
        <Text fontSize="2xl" fontWeight="700">
          Renter Management
        </Text>
        <Button
          leftIcon={<MdRefresh />}
          variant="outline"
          onClick={fetchRenters}
        >
          Refresh
        </Button>
      </Flex>

      {/* Search + Filter */}
      <Flex mt={4} gap={3} align="center">
        <Input
          placeholder="Search by name, email, or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          maxW="300px"
        />
        <Select
          placeholder="All Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          maxW="150px"
        >
          <option value="0">Active</option>
          <option value="1">Inactive</option>
          <option value="2">Suspended</option>
        </Select>
        <Button leftIcon={<MdSearch />}>Search</Button>
        <Button leftIcon={<MdClear />} variant="outline" onClick={handleClear}>
          Clear
        </Button>
      </Flex>

      {/* Table */}
      <Box
        bg={cardBg}
        borderRadius="lg"
        border="1px"
        borderColor={borderColor}
        mt={4}
      >
        <Table variant="simple" color="gray.500">
          <Thead>
            {table.getHeaderGroups().map((hg) => (
              <Tr key={hg.id}>
                {hg.headers.map((header) => (
                  <Th key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {paginated.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </Td>
                  ))}
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={7} textAlign="center" py={6}>
                  No renters found
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default RenterList;
