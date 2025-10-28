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
  Input,
  useToast,
  Tooltip,
} from "@chakra-ui/react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState, useEffect, useMemo, useCallback } from "react";
import { invoiceAPI } from "../../../../services/api";
import {
  MdChevronLeft,
  MdChevronRight,
  MdRefresh,
  MdVisibility,
  MdAttachMoney,
  MdSchedule,
  MdFilterAlt,
} from "react-icons/md";

// Custom components
import Card from "./../../../components/card/Card";

const columnHelper = createColumnHelper();

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([]);
  const toast = useToast();

  // Filters
  const [contractId, setContractId] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [stationId, setStationId] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "white");

  // Fetch invoices from API
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (contractId || orderCode || stationId) {
        // Use filter API
        response = await invoiceAPI.filter({
          contractId: contractId || null,
          orderCode: orderCode || null,
          stationId: stationId || null,
        });
      } else {
        // Default: get all invoices
        response = await invoiceAPI.getAll();
      }

      setInvoices(response || []);
      setTotalItems(response?.length || 0);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError(err.message || "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Handlers
  const handleFilter = useCallback(() => {
    fetchInvoices();
  }, [contractId, orderCode, stationId]);

  const handleClearFilters = () => {
    setContractId("");
    setOrderCode("");
    setStationId("");
    fetchInvoices();
  };

  const handleRefresh = useCallback(() => {
    fetchInvoices();
  }, []);

  // Pagination logic
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedInvoices = invoices.slice(startIndex, endIndex);
    return { totalPages, startIndex, endIndex, paginatedInvoices };
  }, [invoices, currentPage, pageSize, totalItems]);

  const { totalPages, startIndex, endIndex, paginatedInvoices } =
    paginationData;

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
  const handlePageChange = useCallback((page) => setCurrentPage(page), []);
  const handlePageSizeChange = (e) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // Helpers
  const getStatusColor = (status) => {
    switch (status) {
      case 0:
        return "orange";
      case 1:
        return "green";
      case 2:
        return "gray";
      case 3:
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return "Pending";
      case 1:
        return "Paid";
      case 2:
        return "Overdue";
      case 3:
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };
const columns = useMemo(
  () => [
    columnHelper.accessor("invoiceId", {
      header: () => (
        <Text color="gray.400" fontSize="12px">
          ID
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontWeight="700">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor("orderCode", {
      header: () => (
        <Text color="gray.400" fontSize="12px">
          ORDER CODE
        </Text>
      ),
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor("contractId", {
      header: () => (
        <Text color="gray.400" fontSize="12px">
          CONTRACT
        </Text>
      ),
      // Add a cell function for this column
      cell: (info) => <Text color={textColor}>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('amountPaid', {
      id: 'amountPaid',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          AMOUNT PAID
        </Text>
      ),
      cell: (info) => (
        <Flex align="center" gap={2}>
          <Icon as={MdAttachMoney} color="green.500" />
          <Text color={textColor} fontSize="sm" fontWeight="700">
            {formatCurrency(info.getValue())}
          </Text>
        </Flex>
      ),
    }),
    columnHelper.accessor('paidAt', {
      id: 'paidAt',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          PAID DATE
        </Text>
      ),
      cell: (info) => {
        const paidAt = info.getValue();
        return (
          <Flex align="center" gap={2}>
            <Icon as={MdSchedule} color="gray.500" />
            <Text color={textColor} fontSize="sm">
              {paidAt ? formatDate(paidAt) : 'Not Paid'}
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
            colorScheme={getStatusColor(info.getValue())}
            px={3}
            py={1}
            borderRadius="full"
          >
            {getStatusText(info.getValue())}
          </Badge>
        );
      },
    }),
  ], [textColor]);

  const table = useReactTable({
    data: paginatedInvoices,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Page numbers
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);
      for (let i = startPage; i <= endPage; i++) pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  // --- Render ---
  if (loading) {
    return (
      <Flex align="center" justify="center" minH="300px">
        <Spinner size="xl" color={brandColor} />
        <Text ml={4}>Loading invoices...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Error!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="2xl" fontWeight="700" color={textColor}>
          Invoice Management
        </Text>
        <HStack>
          <Button leftIcon={<Icon as={MdRefresh} />} onClick={handleRefresh}>
            Refresh
          </Button>
        </HStack>
      </Flex>

      {/* 🔍 Filter Section */}
      <Card mb={4} p={4}>
        <HStack spacing={4} align="center">
          <Input
            placeholder="Contract ID"
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            width="150px"
            flex={1}
          />
          <Input
            placeholder="Order Code"
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value)}
            width="150px"
            flex={1}
          />
          <Input
            placeholder="Station ID"
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            width="150px"
            flex={1}
          />
          <Button
            leftIcon={<Icon as={MdFilterAlt} />}
            colorScheme="blue"
            onClick={handleFilter}
          >
            Apply
          </Button>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear
          </Button>
        </HStack>
      </Card>

      {/* 🧾 Table */}
      <Card>
        <Table variant="simple" color="gray.500" mb="24px" mt="12px">
          <Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Th key={header.id} borderColor={borderColor}>
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

      {/* 📄 Pagination */}
      <Card mt={4}>
        <Flex justify="space-between" align="center" p={4}>
          <Text fontSize="sm" color={textColor}>
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
            {totalItems}
          </Text>

          <HStack spacing={2}>
            <Button
              size="sm"
              onClick={goToFirstPage}
              isDisabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              size="sm"
              onClick={goToPreviousPage}
              isDisabled={currentPage === 1}
            >
              Prev
            </Button>

            {pageNumbers.map((num) => (
              <Button
                key={num}
                size="sm"
                variant={num === currentPage ? "solid" : "outline"}
                colorScheme={num === currentPage ? "blue" : "gray"}
                onClick={() => handlePageChange(num)}
              >
                {num}
              </Button>
            ))}

            <Button
              size="sm"
              onClick={goToNextPage}
              isDisabled={currentPage === totalPages}
            >
              Next
            </Button>
            <Button
              size="sm"
              onClick={goToLastPage}
              isDisabled={currentPage === totalPages}
            >
              Last
            </Button>
          </HStack>
        </Flex>
      </Card>
    </Box>
  );
}
