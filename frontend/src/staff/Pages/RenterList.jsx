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
  Image,
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  Textarea,
  useToast,
  Card,
  CardBody,
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
  MdAdd,
  MdDescription,
  MdCheckCircle,
  MdCancel,
} from "react-icons/md";
import { renterAPI, documentAPI } from "../../services/api";

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
  const [isViewDocsModalOpen, setIsViewDocsModalOpen] = useState(false);
  const [isAddDocsModalOpen, setIsAddDocsModalOpen] = useState(false);
  const [selectedRenter, setSelectedRenter] = useState(null);
  const [renterDocuments, setRenterDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Form state for adding documents
  const [documentForm, setDocumentForm] = useState({
    driverLicenseFront: null,
    driverLicenseBack: null,
    identityCardFront: null,
    identityCardBack: null,
  });
  const [previewUrls, setPreviewUrls] = useState({
    driverLicenseFront: null,
    driverLicenseBack: null,
    identityCardFront: null,
    identityCardBack: null,
  });

  useEffect(() => {
    return () => {
      // Revoke object URLs to prevent memory leaks
      Object.values(previewUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "white");
  const cardBg = useColorModeValue("white", "gray.800");
  const toast = useToast();

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

  // Handle view renter details
  const handleView = (renter) => {
    setSelectedRenter(renter);
    setIsDetailModalOpen(true);
  };

  // Handle view documents
  const handleViewDocuments = async (renter) => {
    try {
      setDocumentsLoading(true);
      setSelectedRenter(renter);
      const documents = await documentAPI.getByRenterId(renter.renterId);
      setRenterDocuments(documents || []);
      setIsViewDocsModalOpen(true);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load documents",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Handle add documents
  const handleAddDocuments = (renter) => {
    setSelectedRenter(renter);
    setDocumentForm({
      driverLicenseFront: null,
      driverLicenseBack: null,
      identityCardFront: null,
      identityCardBack: null,
    });
    setIsAddDocsModalOpen(true);
  };

  const clearPreview = (field) => {
    if (previewUrls[field]) {
      URL.revokeObjectURL(previewUrls[field]);
    }
    setPreviewUrls(prev => ({
      ...prev,
      [field]: null
    }));
    setDocumentForm(prev => ({
      ...prev,
      [field]: null
    }));
  };

  const handleFileChange = (field, file) => {
    // Revoke previous preview URL if exists
    if (previewUrls[field]) {
      URL.revokeObjectURL(previewUrls[field]);
    }

    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrls(prev => ({
        ...prev,
        [field]: previewUrl
      }));
    } else {
      setPreviewUrls(prev => ({
        ...prev,
        [field]: null
      }));
    }

    setDocumentForm(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleUploadDocuments = async () => {
    if (!selectedRenter) {
      toast({
        title: "Error",
        description: "No renter selected",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check if at least one file is selected
    const hasFiles = Object.values(documentForm).some(file => file !== null);
    if (!hasFiles) {
      toast({
        title: "Error",
        description: "Please select at least one document to upload",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();

      console.log('Files to upload:', documentForm);

      if (documentForm.driverLicenseFront) {
        formData.append('DriverLicenseFront', documentForm.driverLicenseFront);
      }
      if (documentForm.driverLicenseBack) {
        formData.append('DriverLicenseBack', documentForm.driverLicenseBack);
      }
      if (documentForm.identityCardFront) {
        formData.append('IdentityCardFront', documentForm.identityCardFront);
      }
      if (documentForm.identityCardBack) {
        formData.append('IdentityCardBack', documentForm.identityCardBack);
      }

      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ', ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }

      console.log('Uploading to renter ID:', selectedRenter.renterId);

      const result = await documentAPI.uploadRenterAll(selectedRenter.renterId, formData);
      console.log('Upload response:', result);

      toast({
        title: "Success",
        description: result.message || "IDs uploaded successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      try {
        const updatedDocuments = await documentAPI.getByRenterId(selectedRenter.renterId);
        setRenterDocuments(updatedDocuments || []);
      } catch (refreshError) {
        console.error('Error refreshing documents:', refreshError);
      }

      Object.values(previewUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });

      setIsAddDocsModalOpen(false);
      setDocumentForm({
        driverLicenseFront: null,
        driverLicenseBack: null,
        identityCardFront: null,
        identityCardBack: null,
      });
      setPreviewUrls({
        driverLicenseFront: null,
        driverLicenseBack: null,
        identityCardFront: null,
        identityCardBack: null,
      });

    } catch (err) {
      console.error('Upload error details:', err);
      console.error('Error response:', err.response);

      const errorMessage = err.response?.data?.message || err.message || "Failed to upload documents";

      toast({
        title: "Upload Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status) =>
    status === 0 ? "green" : status === 1 ? "red" : "orange";

  const getStatusText = (status) =>
    status === 0 ? "Active" : status === 1 ? "Inactive" : "Suspended";

  // Helper function to get document type text
  const getDocumentTypeText = (type) => {
    switch (type) {
      case 0: return "Driver License";
      case 1: return "Identity Card";
      case 2: return "Vehicle Registration";
      default: return "Unknown";
    }
  };

  // Helper function to get document side text
  const getDocumentSideText = (side) => {
    return side === 0 ? "Front" : "Back";
  };

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
          <HStack spacing={2}>
            <Button
              size="sm"
              colorScheme="blue"
              variant="outline"
              onClick={() => handleView(info.row.original)}
              leftIcon={<Icon as={MdVisibility} />}
            >
              View
            </Button>
            <Button
              size="sm"
              colorScheme="green"
              variant="outline"
              onClick={() => handleViewDocuments(info.row.original)}
              leftIcon={<Icon as={MdDescription} />}
            >
              IDs
            </Button>
          </HStack>
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

  // Handle modal close
  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedRenter(null);
  };

  const handleViewDocsModalClose = () => {
    setIsViewDocsModalOpen(false);
    setSelectedRenter(null);
    setRenterDocuments([]);
  };

  const handleAddDocsModalClose = () => {
    Object.values(previewUrls).forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });

    setIsAddDocsModalOpen(false);
    setSelectedRenter(null);
    setDocumentForm({
      driverLicenseFront: null,
      driverLicenseBack: null,
      identityCardFront: null,
      identityCardBack: null,
    });
    setPreviewUrls({
      driverLicenseFront: null,
      driverLicenseBack: null,
      identityCardFront: null,
      identityCardBack: null,
    });
  };

  // Memoized page numbers calculation
  const pageNumbers = useMemo(() => {
    const maxVisiblePages = 5;
    const pages = [];

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
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
      <Box>
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" color={brandColor} />
          <Text ml={4} color={textColor}>
            Loading renters...
          </Text>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Flex justify="center" mt={4}>
          <Button onClick={fetchRenters} colorScheme="blue">
            Retry
          </Button>
        </Flex>
      </Box>
    );
  }

  return (
    <Box>
      <Flex direction="column" gap="20px" me="auto">
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontSize="2xl" fontWeight="700" color={textColor}>
            Renter Management
          </Text>
          <HStack>
            <Button leftIcon={<MdRefresh />} onClick={fetchRenters}>
              Refresh
            </Button>
          </HStack>
        </Flex>

        <Card mb={6} p={4}>
          <HStack spacing={4} alignItems="flex-end">
            <Box flex="1">
              <Text fontSize="sm" fontWeight="medium" mb={1}>Search</Text>
              <Input
                placeholder="Search by name, email, or phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftElement={<Icon as={MdSearch} color="gray.400" />}
              />
            </Box>

            <Box flex="1">
              <Text fontSize="sm" fontWeight="medium" mb={1}>Status</Text>
              <Select
                placeholder="All Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="0">Active</option>
                <option value="1">Inactive</option>
                <option value="2">Suspended</option>
              </Select>
            </Box>

            <Box flex="1">
              <HStack spacing={2}>
                <Button colorScheme="blue" onClick={handleClear} width="100%">
                  Clear
                </Button>
              </HStack>
            </Box>
          </HStack>
        </Card>
      </Flex>
      {/* Results Count */}
      <Text fontSize="sm" color="gray.600" mb={4}>
        Showing {Math.min(endIndex, totalItems)} of {totalItems} renters
      </Text>

      {/* Table */}
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

      {/* Renter Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={handleDetailModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" gap={2}>
              <Icon as={MdPerson} />
              Renter Details
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedRenter && (
              <VStack spacing={4} align="stretch">
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Text fontWeight="bold">Renter ID</Text>
                    <Text>{selectedRenter.renterId}</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="bold">Status</Text>
                    <Badge colorScheme={getStatusColor(selectedRenter.status)}>
                      {getStatusText(selectedRenter.status)}
                    </Badge>
                  </GridItem>
                  <GridItem colSpan={2}>
                    <Text fontWeight="bold">Full Name</Text>
                    <Text>{selectedRenter.fullName}</Text>
                  </GridItem>
                  <GridItem colSpan={2}>
                    <Text fontWeight="bold">Email</Text>
                    <Text>{selectedRenter.email}</Text>
                  </GridItem>
                  <GridItem colSpan={2}>
                    <Text fontWeight="bold">Phone</Text>
                    <Text>{selectedRenter.phoneNumber}</Text>
                  </GridItem>
                  <GridItem colSpan={2}>
                    <Text fontWeight="bold">License Number</Text>
                    <Text>{selectedRenter.licenseNumber || "Not provided"}</Text>
                  </GridItem>
                </Grid>

                <Divider />

                <HStack justify="space-between">
                  <Button
                    colorScheme="blue"
                    onClick={() => {
                      handleDetailModalClose();
                      handleViewDocuments(selectedRenter);
                    }}
                    leftIcon={<MdDescription />}
                  >
                    View IDs
                  </Button>
                  <Button
                    colorScheme="green"
                    onClick={() => {
                      handleDetailModalClose();
                      handleAddDocuments(selectedRenter);
                    }}
                    leftIcon={<MdAdd />}
                  >
                    Add IDs
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* View Documents Modal */}
      <Modal isOpen={isViewDocsModalOpen} onClose={handleViewDocsModalClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" gap={2}>
              <Icon as={MdDescription} />
              IDs for {selectedRenter?.fullName}
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {documentsLoading ? (
              <Flex justify="center" align="center" minH="200px">
                <Spinner size="xl" />
                <Text ml={4}>Loading IDs...</Text>
              </Flex>
            ) : renterDocuments.length > 0 ? (
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {renterDocuments.map((doc) => (
                  <Card key={doc.documentId}>
                    <CardBody>
                      <VStack spacing={3}>
                        <Image
                          src={doc.fileUrl}
                          alt={`${getDocumentTypeText(doc.type)} ${getDocumentSideText(doc.side)}`}
                          borderRadius="md"
                          maxH="200px"
                          objectFit="contain"
                        />

                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </Grid>
            ) : (
              <Flex direction="column" align="center" justify="center" minH="200px">
                <Icon as={MdDescription} boxSize={12} color="gray.400" mb={4} />
                <Text fontSize="lg" color="gray.500" mb={4}>
                  No IDs found for this renter
                </Text>
                <Button
                  colorScheme="blue"
                  onClick={() => {
                    handleViewDocsModalClose();
                    handleAddDocuments(selectedRenter);
                  }}
                  leftIcon={<MdAdd />}
                >
                  Add IDs
                </Button>
              </Flex>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Add Documents Modal */}
      <Modal isOpen={isAddDocsModalOpen} onClose={handleAddDocsModalClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" gap={2}>
              <Icon as={MdAdd} />
              Add IDs for {selectedRenter?.fullName}
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={6}>
              {/* Driver License */}
              <Card w="100%">
                <CardBody>
                  <Text fontWeight="bold" mb={4}>Driver License</Text>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <FormControl>
                      <FormLabel>Front Side</FormLabel>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('driverLicenseFront', e.target.files[0])}
                      />
                      {previewUrls.driverLicenseFront && (
                        <Box mt={2} position="relative" display="inline-block">
                          <Image
                            src={previewUrls.driverLicenseFront}
                            alt="Driver License Front Preview"
                            borderRadius="md"
                            maxH="150px"
                            objectFit="contain"
                            border="1px solid"
                            borderColor="gray.200"
                          />
                        </Box>
                      )}
                    </FormControl>
                    <FormControl>
                      <FormLabel>Back Side</FormLabel>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('driverLicenseBack', e.target.files[0])}
                      />
                      {previewUrls.driverLicenseBack && (
                        <Box mt={2} position="relative" display="inline-block">
                          <Image
                            src={previewUrls.driverLicenseBack}
                            alt="Driver License Back Preview"
                            borderRadius="md"
                            maxH="150px"
                            objectFit="contain"
                            border="1px solid"
                            borderColor="gray.200"
                          />
                        </Box>
                      )}
                    </FormControl>
                  </Grid>
                </CardBody>
              </Card>

              {/* Identity Card */}
              <Card w="100%">
                <CardBody>
                  <Text fontWeight="bold" mb={4}>Identity Card</Text>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <FormControl>
                      <FormLabel>Front Side</FormLabel>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('identityCardFront', e.target.files[0])}
                      />
                      {previewUrls.identityCardFront && (
                        <Box mt={2} position="relative" display="inline-block">
                          <Image
                            src={previewUrls.identityCardFront}
                            alt="Identity Card Front Preview"
                            borderRadius="md"
                            maxH="150px"
                            objectFit="contain"
                            border="1px solid"
                            borderColor="gray.200"
                          />
                        </Box>
                      )}
                    </FormControl>
                    <FormControl>
                      <FormLabel>Back Side</FormLabel>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('identityCardBack', e.target.files[0])}
                      />
                      {previewUrls.identityCardBack && (
                        <Box mt={2} position="relative" display="inline-block">
                          <Image
                            src={previewUrls.identityCardBack}
                            alt="Identity Card Back Preview"
                            borderRadius="md"
                            maxH="150px"
                            objectFit="contain"
                            border="1px solid"
                            borderColor="gray.200"
                          />
                        </Box>
                      )}
                    </FormControl>
                  </Grid>
                </CardBody>
              </Card>

              <Button
                colorScheme="blue"
                w="100%"
                onClick={handleUploadDocuments}
                isLoading={uploading}
                loadingText="Uploading..."
              >
                Upload IDs
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default RenterList;