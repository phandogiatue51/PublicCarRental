import {
  Box,  Button,  Flex,  Icon,  Table,  Tbody,  Td,  Text,  Th,  Thead,  Tr,  useColorModeValue,  Spinner,  Alert,  AlertIcon,
  AlertTitle,  AlertDescription, HStack
} from '@chakra-ui/react';
import {
  createColumnHelper,  flexRender,  getCoreRowModel,  getSortedRowModel,  useReactTable
} from '@tanstack/react-table';
import { useState, useEffect } from 'react';
import { brandAPI } from '../../../../services/api';
import { MdEdit, MdDelete, MdAdd, MdRefresh} from 'react-icons/md';
import BrandModal from './BrandModal';

// Custom components
import Card from '../../../components/card/Card';

const columnHelper = createColumnHelper();

export default function BrandList() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const brandColor = useColorModeValue('brand.500', 'white');

  // Fetch brands from API
  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching brands from API...');
      const data = await brandAPI.getAll();
      console.log('Brands fetched successfully:', data);
      setBrands(data);
    } catch (err) {
      console.error('Error fetching brands:', err);
      let errorMessage = 'Failed to fetch brands';
      
      if (err.message.includes('Unable to connect')) {
        errorMessage = 'Cannot connect to the server. Please check if the backend is running on https://localhost:7230';
      } else if (err.message.includes('CORS')) {
        errorMessage = 'CORS error. Please check backend CORS configuration.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // Table columns configuration
  const columns = [
    columnHelper.accessor('brandId', {
      id: 'brandId',
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
          BRAND NAME
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm" fontWeight="700">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('actions', {
      id: 'actions',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          ACTIONS
        </Text>
      ),
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
            leftIcon={<Icon as={MdDelete} />}
            colorScheme="red"
            onClick={() => handleDelete(info.row.original.brandId)}
          >
            Delete
          </Button>
        </Flex>
      ),
    }),
  ];

  const table = useReactTable({
    data: brands,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  // Handle edit brand
  const handleEdit = (brand) => {
    setSelectedBrand(brand);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // Handle delete brand
  const handleDelete = async (brandId) => {
    if (window.confirm('Are you sure you want to delete this brand?')) {
      try {
        const response = await brandAPI.delete(brandId);
        console.log('Delete response:', response);
        await fetchBrands(); // Refresh the list
      } catch (err) {
        setError(err.message || 'Failed to delete brand');
      }
    }
  };

  // Handle add new brand
  const handleAdd = () => {
    setSelectedBrand(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedBrand(null);
    setIsEditMode(false);
  };

  // Handle modal success (refresh data)
  const handleModalSuccess = () => {
    fetchBrands();
  };

  if (loading) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Card>
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="xl" color={brandColor} />
            <Text ml={4} color={textColor}>
              Loading brands...
            </Text>
          </Flex>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Card>
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Flex justify="center" mt={4}>
            <Button onClick={fetchBrands} colorScheme="blue">
              Retry
            </Button>
          </Flex>
        </Card>
      </Box>
    );
  }

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Flex direction="column" gap="20px" me="auto">
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontSize="2xl" fontWeight="700" color={textColor}>
            Brand Management
          </Text>
          <HStack>
            <Button leftIcon={<Icon as={MdRefresh} />} onClick={fetchBrands}>
              Refresh
            </Button>
            <Button
              leftIcon={<Icon as={MdAdd} />}
              colorScheme="blue"
              onClick={handleAdd}
            >
              Add New Brand
            </Button>
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
                          fontSize={{ sm: '10px', lg: '12px' }}
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
                  .rows.slice(0, 11)
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
      </Flex>

      {/* Brand Modal */}
      <BrandModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        brand={selectedBrand}
        isEdit={isEditMode}
      />
    </Box>
  );
}
