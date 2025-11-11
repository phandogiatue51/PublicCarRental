import {
  Box, SimpleGrid, Button, Flex, Icon, Table, Tbody, Td, Text, Th, Thead, Tr, useColorModeValue, Spinner, Alert, AlertIcon,
  AlertTitle, AlertDescription, Select, HStack, Input, useToast
} from "@chakra-ui/react";
import {
  createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable
} from "@tanstack/react-table";
import { useState, useEffect, useMemo, useCallback } from "react";
import { staffAPI, stationAPI, documentAPI } from "../../../../services/api";
import {
  MdEdit, MdAdd, MdPerson, MdPhone, MdLocationOn, MdToggleOn, MdToggleOff, MdSearch, MdClear, MdDescription, MdRefresh,
} from "react-icons/md";
import Card from "../../../components/card/Card";
import StaffModal from "./StaffModal";
import StaffDocumentModals from "./StaffDocumentModal";

const columnHelper = createColumnHelper();

export default function StaffList() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [stations, setStations] = useState([]);
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [searchParam, setSearchParam] = useState("");
  const [selectedStationId, setSelectedStationId] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [isViewStaffDocsModalOpen, setIsViewStaffDocsModalOpen] = useState(false);
  const [isAddStaffDocsModalOpen, setIsAddStaffDocsModalOpen] = useState(false);
  const [staffDocuments, setStaffDocuments] = useState([]);
  const [staffDocsLoading, setStaffDocsLoading] = useState(false);

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "white");

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await staffAPI.getAll();
      setStaff(response || []);
      setTotalItems(response?.length || 0);
    } catch (err) {
      console.error("Error fetching staff:", err);
      setError(err.message || "Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  const searchStaff = async () => {
    try {
      setIsSearching(true);
      setError(null);

      const statusValue = statusFilter === "" ? null : parseInt(statusFilter);

      const response = await staffAPI.searchByParam(
        searchParam,
        selectedStationId || null,
        statusValue
      );

      setStaff(response || []);
      setTotalItems(response?.length || 0);
      setCurrentPage(1);
    } catch (err) { 
      console.error("Error searching staff:", err);
      setError(err.message || "Failed to search staff");
    } finally {
      setIsSearching(false);
    }
  };

  const clearFilters = () => {
    setSearchParam("");
    setStatusFilter("");
    setSelectedStationId("");
    fetchStaff();
  };

  const fetchStations = async () => {
    try {
      const response = await stationAPI.getAll();
      setStations(response || []);
    } catch (err) {
      console.error("Error fetching stations:", err);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchStations();
  }, []);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedStaff = staff.slice(startIndex, endIndex);

    return { totalPages, startIndex, endIndex, paginatedStaff };
  }, [staff, currentPage, pageSize, totalItems]);

  const { totalPages, startIndex, endIndex, paginatedStaff } = paginationData;

  // Pagination handlers
  const handlePageChange = useCallback((page) => setCurrentPage(page), []);
  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
  }, []);
  const goToFirstPage = useCallback(() => setCurrentPage(1), []);
  const goToLastPage = useCallback(() => setCurrentPage(totalPages), [totalPages]);
  const goToPreviousPage = useCallback(() => setCurrentPage((prev) => Math.max(prev - 1, 1)), []);
  const goToNextPage = useCallback(() => setCurrentPage((prev) => Math.min(prev + 1, totalPages)), [totalPages]);

  // Handle edit staff
  const handleEdit = useCallback((staffMember) => {
    setSelectedStaff(staffMember);
    setIsEditMode(true);
    setIsModalOpen(true);
  }, []);

  // Handle status toggle
  const handleStatusToggle = useCallback(async (staffId, currentStatus) => {
    try {
      await staffAPI.changeStatus(staffId);
      await fetchStaff();
      toast({
        title: "Success",
        description: `Staff status changed to ${getStatusText(currentStatus === 0 ? 1 : 0)}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to change staff status",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Handle view documents
  const handleViewStaffDocuments = async (staffMember) => {
    try {
      setStaffDocsLoading(true);
      setSelectedStaff(staffMember);
      const documents = await documentAPI.getByStaffId(staffMember.staffId);
      setStaffDocuments(documents || []);
      setIsViewStaffDocsModalOpen(true);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load staff documents",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setStaffDocsLoading(false);
    }
  };

  // Handle add documents
  const handleAddStaffDocuments = (staffMember) => {
    setSelectedStaff(staffMember);
    setIsAddStaffDocsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStaff(null);
    setIsEditMode(false);
  };

  // Handle modal success
  const handleModalSuccess = () => {
    fetchStaff();
  };

  // Helper functions
  const getStatusText = (status) => {
    switch (status) {
      case 0: return "Active";
      case 1: return "Inactive";
      case 2: return "Suspended";
      default: return "Unknown";
    }
  };

  // Columns definition
  const columns = useMemo(() => [
    columnHelper.accessor("staffId", {
      header: () => <Text color="gray.400" fontSize="12px">ID</Text>,
      cell: (info) => <Text color={textColor} fontSize="sm" fontWeight="700">{info.getValue()}</Text>,
    }),
    columnHelper.accessor("fullName", {
      header: () => <Text color="gray.400" fontSize="12px">FULL NAME</Text>,
      cell: (info) => (
        <Flex align="center" gap={2}>
          <Icon as={MdPerson} color="gray.500" />
          <Text color={textColor} fontSize="sm" fontWeight="700">{info.getValue()}</Text>
        </Flex>
      ),
    }),

    columnHelper.accessor("phoneNumber", {
      header: () => <Text color="gray.400" fontSize="12px">PHONE</Text>,
      cell: (info) => (
        <Flex align="center" gap={2}>
          <Icon as={MdPhone} color="gray.500" />
          <Text color={textColor} fontSize="sm">{info.getValue()}</Text>
        </Flex>
      ),
    }),
    columnHelper.accessor("stationName", {
      header: () => <Text color="gray.400" fontSize="12px">STATION</Text>,
      cell: (info) => (
        <Flex align="center" gap={2}>
          <Icon as={MdLocationOn} color="gray.500" />
          <Text color={textColor} fontSize="sm">
            {info.getValue() || "No Station"}
          </Text>
        </Flex>
      ),
    }),
    columnHelper.accessor("status", {
      header: () => <Text color="gray.400" fontSize="12px">STATUS</Text>,
      cell: (info) => {
        const status = info.getValue();
        const staffId = info.row.original.staffId;
        const isActive = status === 0;

        return (
          <Flex align="center">
            <Button
              fontSize="4xl"
              leftIcon={<Icon as={isActive ? MdToggleOn : MdToggleOff} boxSize={8} />}
              colorScheme={isActive ? "green" : "red"}
              variant="ghost"
              onClick={() => handleStatusToggle(staffId, status)}
              _hover={{ bg: isActive ? "green.50" : "red.50" }}
            ></Button>
          </Flex>
        );
      },
    }),
    columnHelper.accessor("actions", {
      header: () => <Text color="gray.400" fontSize="12px">ACTIONS</Text>,
      cell: (info) => (
        <Flex align="center" gap={2}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={MdEdit} />}
            colorScheme="blue"
            onClick={() => handleEdit(info.row.original)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={MdDescription} />}
            colorScheme="green"
            onClick={() => handleViewStaffDocuments(info.row.original)}
          >
            Docs
          </Button>
        </Flex>
      ),
    }),
  ], [textColor, handleEdit, handleStatusToggle]);

  const table = useReactTable({
    data: paginatedStaff,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Handle add new staff
  const handleAdd = () => {
    setSelectedStaff(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Page numbers calculation
  const pageNumbers = useMemo(() => {
    const maxVisiblePages = 5;
    const pages = [];
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);
      for (let i = startPage; i <= endPage; i++) pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <Flex align="center" justify="center" minH="300px">
        <Spinner size="xl" color={brandColor} />
        <Text ml={4}>Loading staff...</Text>
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
      {/* Header with Title and Refresh Button */}
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="2xl" fontWeight="700" color={textColor}>
          Staff Management
        </Text>
        <HStack>
          <Button leftIcon={<Icon as={MdRefresh} />} onClick={fetchStaff}>
            Refresh
          </Button>
          <Button
            leftIcon={<Icon as={MdAdd} />}
            colorScheme="blue"
            variant="solid"
            onClick={handleAdd}
          >
            Add New Staff
          </Button>
        </HStack>
      </Flex>

      <Card mb={4} p={4}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 5 }} spacing={4}>
          <Input
            value={searchParam}
            onChange={(e) => setSearchParam(e.target.value)}
            placeholder="Name, email or phone..."
            onKeyPress={(e) => e.key === "Enter" && searchStaff()}
          />
          <Select
            value={selectedStationId}
            onChange={(e) => setSelectedStationId(e.target.value)}
            placeholder="All stations"
          >
            {stations.map((station) => (
              <option key={station.stationId} value={station.stationId}>
                {station.name}
              </option>
            ))}
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="All status"
          >
            <option value="0">Active</option>
            <option value="1">Inactive</option>
          </Select>

          <Button
            leftIcon={<Icon as={MdSearch} />}
            colorScheme="blue"
            onClick={searchStaff}
            isLoading={isSearching}
          >
            Search
          </Button>

          <Button
            variant="outline"
            leftIcon={<Icon as={MdClear} />}
            onClick={clearFilters}
          >
            Clear
          </Button>
        </SimpleGrid>
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

      {/* 📄 Pagination */}
      <Card mt={4}>
        <Flex justify="space-between" align="center" p={4}>
          <Text fontSize="sm" color={textColor}>
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
            {totalItems} staff members
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

      {/* Modals */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        staff={selectedStaff}
        isEdit={isEditMode}
        stations={stations}
      />

      <StaffDocumentModals
        isViewOpen={isViewStaffDocsModalOpen}
        isAddOpen={isAddStaffDocsModalOpen}
        selectedStaff={selectedStaff}
        staffDocuments={staffDocuments}
        staffDocsLoading={staffDocsLoading}
        onViewClose={() => {
          setIsViewStaffDocsModalOpen(false);
          setSelectedStaff(null);
          setStaffDocuments([]);
        }}
        onAddClose={() => {
          setIsAddStaffDocsModalOpen(false);
          setSelectedStaff(null);
        }}
        onAddDocuments={handleAddStaffDocuments}
        onDocumentsUploaded={() => {
          setIsAddStaffDocsModalOpen(false);
          if (selectedStaff) {
            handleViewStaffDocuments(selectedStaff);
          }
        }}
      />
    </Box>
  );
}