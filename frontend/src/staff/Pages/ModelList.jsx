/* eslint-disable */

import {
  Box, Button, Flex, Icon, Table, Tbody, Td, Text, Th, Thead, Tr, useColorModeValue, Spinner, Alert, AlertIcon,
  AlertTitle, AlertDescription, Image, Badge, Select, HStack, VStack, Modal, ModalOverlay, ModalContent, ModalBody,
  ModalCloseButton, useDisclosure,
} from '@chakra-ui/react';
import {
  createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable,
} from '@tanstack/react-table';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { modelAPI, brandAPI, typeAPI } from '../../services/api';
import { MdEdit, MdDelete, MdAdd, MdVisibility, MdVisibilityOff, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import ModelModal from '../../admin/views/admin/model/ModelModal';

// Custom components
import Card from '../../admin/components/card/Card';

const columnHelper = createColumnHelper();

export default function ModelList() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const { isOpen: isImageModalOpen, onOpen: onImageModalOpen, onClose: onImageModalClose } = useDisclosure();
  const [brands, setBrands] = useState([]);
  const [types, setTypes] = useState([]);
  const [filter, setFilter] = useState({ brandId: '', typeId: '' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const brandColor = useColorModeValue('brand.500', 'white');

  // Fetch models from API
  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      // Try filterModels first with current filters (stationId = null)
      const brandId = filter.brandId ? Number(filter.brandId) : undefined;
      const typeId = filter.typeId ? Number(filter.typeId) : undefined;
      let response = await modelAPI.filterModels(brandId, typeId, undefined);
      if (!Array.isArray(response) || response.length === 0) {
        response = await modelAPI.getAll();
      }
      console.log('Models response:', response);
      const list = Array.isArray(response) ? response : [];
      setModels(list);
      setTotalItems(list.length);
    } catch (err) {
      console.error('Error fetching models:', err);
      setError(err.message || 'Failed to fetch models');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [b, t] = await Promise.all([brandAPI.getAll(), typeAPI.getAll()]);
        setBrands(Array.isArray(b) ? b : []);
        setTypes(Array.isArray(t) ? t : []);
      } catch (e) { /* ignore */ }
      fetchModels();
    })();
  }, []);

  useEffect(() => {
    fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.brandId, filter.typeId]);

  // Pagination calculations - memoized for performance
  const paginationData = useMemo(() => {
    const safeModels = Array.isArray(models) ? models : [];
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedModels = safeModels.slice(startIndex, endIndex);

    return {
      totalPages,
      startIndex,
      endIndex,
      paginatedModels
    };
  }, [models, currentPage, pageSize, totalItems]);

  const { totalPages, startIndex, endIndex, paginatedModels } = paginationData;

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

  const handleImageClick = useCallback((imageUrl) => {
    console.log('handleImageClick called with:', imageUrl);
    setSelectedImageUrl(imageUrl);
    onImageModalOpen();
  }, [onImageModalOpen]);

  const onFilterChange = (key) => (e) => {
    setFilter((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const clearFilters = () => setFilter({ brandId: '', typeId: '' });

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


  const columns = useMemo(() => [
    columnHelper.accessor('modelId', {
      id: 'modelId',
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
    columnHelper.accessor('name', {
      id: 'name',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          MODEL NAME
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm" fontWeight="700">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('brandName', {
      id: 'brandName',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          BRAND
        </Text>
      ),
      cell: (info) => (
        <Badge
          variant="subtle"
          colorScheme="blue"
          fontSize="sm"
          fontWeight="500"
        >
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('typeName', {
      id: 'typeName',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          TYPE
        </Text>
      ),
      cell: (info) => (
        <Badge
          variant="subtle"
          colorScheme="green"
          fontSize="sm"
          fontWeight="500"
        >
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('pricePerHour', {
      id: 'pricePerHour',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          PRICE PER HOUR
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm" fontWeight="700">
          ${info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('imageUrl', {
      id: 'image',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          IMAGE
        </Text>
      ),
      cell: (info) => {
        const imageUrl = info.getValue();

        if (!imageUrl) {
          return (
            <Text color="gray.500" fontSize="sm">
              No image
            </Text>
          );
        }

        // Handle both Azure Blob Storage URLs and relative URLs
        const fullImageUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://')
          ? imageUrl
          : `https://localhost:7230${imageUrl}`;

        console.log('Original imageUrl:', imageUrl);
        console.log('Processed fullImageUrl:', fullImageUrl);

        return (
          <Flex align="center" gap={2}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                console.log('Opening image with URL:', fullImageUrl);
                handleImageClick(fullImageUrl);
              }}
              leftIcon={<Icon as={MdVisibility} />}
            >
              View
            </Button>

          </Flex>
        );
      },
    }),
  ], [textColor, handleImageClick]);

  const table = useReactTable({
    data: paginatedModels,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  // Handle add new model
  const handleAdd = () => {
    setSelectedModel(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedModel(null);
    setIsEditMode(false);
  };

  // Handle modal success (refresh data)
  const handleModalSuccess = () => {
    fetchModels();
  };

  if (loading) {
    return (
      <Box >
        <Card>
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="xl" color={brandColor} />
            <Text ml={4} color={textColor}>
              Loading models...
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
            <Button onClick={fetchModels} colorScheme="blue">
              Retry
            </Button>
          </Flex>
        </Card>
      </Box>
    );
  }

  return (
    <Box >
      <Flex direction="column" gap="20px" me="auto">
        <Flex
          justifyContent="space-between"
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'start', md: 'center' }}
        >
          <Text color={textColor} fontSize="2xl" ms="24px" fontWeight="700">
            Model Management
          </Text>
          <HStack spacing={3}>
            <Select placeholder="Brand" value={filter.brandId} onChange={onFilterChange('brandId')} size="sm" width="160px">
              {brands.map(b => (<option key={b.brandId} value={b.brandId}>{b.name}</option>))}
            </Select>
            <Select placeholder="Type" value={filter.typeId} onChange={onFilterChange('typeId')} size="sm" width="140px">
              {types.map(t => (<option key={t.typeId} value={t.typeId}>{t.name}</option>))}
            </Select>
            <Button onClick={clearFilters} size="sm" variant="outline">Clear</Button>
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
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} models
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

      {/* Model Modal */}
      <ModelModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        model={selectedModel}
        isEdit={isEditMode}
      />

      {/* Image Preview Modal */}
      <Modal isOpen={isImageModalOpen} onClose={onImageModalClose} isCentered size="xl">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
        <ModalContent maxW="50vw" maxH="50vh" bg="transparent" boxShadow="none">
          <ModalCloseButton color="white" size="lg" />
          <ModalBody p={0} display="flex" justifyContent="center" alignItems="center">
            <Image
              src={selectedImageUrl}
              alt="Model Preview"
              maxW="100%"
              maxH="100%"
              objectFit="contain"
              borderRadius="lg"
              boxShadow="2xl"
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
