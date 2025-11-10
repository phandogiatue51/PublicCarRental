import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import {
  Box, Table, Thead, Tbody, Tr, Th, Td, Text, Badge, Button, HStack,
  Select, Spinner, Alert, AlertIcon, useDisclosure,
  Icon, useColorModeValue, Flex, Tooltip
} from '@chakra-ui/react';
import { MdSearch, MdAssignment, MdRefresh, MdDelete } from 'react-icons/md';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getSortedRowModel } from '@tanstack/react-table';
import { ratingsAPI, modelAPI, renterAPI, contractAPI } from '../../../services/api';
import Card from '../../components/card/Card';

const ContractDetailModal = lazy(() => import('./contract/ContractDetailModal'));

export default function RatingList() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '', starRating: '', modelId: '', renterId: '' });
  const [selectedContract, setSelectedContract] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [sorting, setSorting] = useState([]);

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "white");

  const columnHelper = createColumnHelper();
  const [models, setModels] = useState([]);
  const [renters, setRenters] = useState([]);
  const fetchRatings = async (filterParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      const data = await ratingsAPI.filter(filterParams);
      setRatings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching ratings:', err);
      setError(err.message || 'Failed to fetch ratings');
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const modelsData = await modelAPI.getAll();
      setModels(Array.isArray(modelsData) ? modelsData : []);
    } catch (err) {
      console.error('Error fetching models:', err);
    }
  };

  const fetchRenters = async () => {
    try {
      const rentersData = await renterAPI.getAll();
      setRenters(Array.isArray(rentersData) ? rentersData : []);
    } catch (err) {
      console.error('Error fetching renters:', err);
    }
  };

  const applyFilters = async () => {
    const filterParams = {};
    if (filters.starRating) filterParams.starRating = filters.starRating;
    if (filters.modelId) filterParams.modelId = filters.modelId;
    if (filters.renterId) filterParams.renterId = filters.renterId;

    await fetchRatings(filterParams);
  };

  const handleClearFilters = async () => {
    setFilters({ starRating: '', modelId: '', renterId: '' });
    await fetchRatings();
  };

  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([fetchRatings(), fetchModels(), fetchRenters()]);
    };
    fetchAllData();
  }, []);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const handleViewContract = async (contractId) => {
    try {
      const contract = await contractAPI.getById(contractId);
      setSelectedContract(contract);
      onOpen();
    } catch (err) {
      console.error('Error fetching contract:', err);
      setError('Failed to load contract details');
    }
  };

  const handleDeleteRating = async (ratingId) => {
    if (!window.confirm('Are you sure you want to delete this rating?')) return;
    try {
      await ratingsAPI.delete(ratingId);
      await fetchRatings(); // Refresh the list
    } catch (err) {
      console.error(err);
      setError('Failed to delete rating');
    }
  };

  const renderStars = (stars) => '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  const columns = useMemo(() => [
    columnHelper.accessor('ratingId', {
      header: () => <Text color="gray.400" fontSize="12px">ID</Text>,
      cell: info => <Text color={textColor} fontWeight="700">{info.getValue()}</Text>
    }),
    columnHelper.accessor('renterName', {
      header: () => <Text color="gray.400" fontSize="12px">RENTER</Text>,
      cell: info => <Text color={textColor}>{info.getValue()}</Text>
    }),
    columnHelper.accessor('stars', {
      header: () => <Text color="gray.400" fontSize="12px">STARS</Text>,
      cell: info => {
        const stars = info.getValue();
        const getColorScheme = (stars) => {
          switch (stars) {
            case 5: return 'green';
            case 4: return 'blue';
            case 3: return 'yellow';
            case 2: return 'orange';
            case 1: return 'red';
            default: return 'gray';
          }
        };

        return (
          <Badge colorScheme={getColorScheme(stars)} fontSize="md" px={3} py={1}>
            {stars} ⭐
          </Badge>
        );
      }
    }),
    columnHelper.accessor('comment', {
      header: () => <Text color="gray.400" fontSize="12px">COMMENT</Text>,
      cell: info => <Tooltip label={info.getValue() || 'No comment'}><Text maxW="300px" noOfLines={2}>{info.getValue() || 'No comment'}</Text></Tooltip>
    }),
    columnHelper.accessor('createdAt', {
      header: () => <Text color="gray.400" fontSize="12px">DATE</Text>,
      cell: info => <Text fontSize="sm">{formatDate(info.getValue())}</Text>
    }),
    columnHelper.accessor('actions', {
      header: () => <Text color="gray.400" fontSize="12px">ACTIONS</Text>,
      cell: info => (
        <HStack spacing={2}>
          <Button size="sm" variant="ghost" leftIcon={<Icon as={MdAssignment} />} onClick={() => handleViewContract(info.row.original.contractId)}>View</Button>
          <Button size="sm" variant="ghost" colorScheme="red" leftIcon={<Icon as={MdDelete} />} onClick={() => handleDeleteRating(info.row.original.ratingId)}>Delete</Button>
        </HStack>
      )
    })
  ], [textColor]);

  const table = useReactTable({
    data: ratings,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  if (loading) return <Flex align="center" justify="center" minH="300px"><Spinner size="xl" color={brandColor} /><Text ml={4}>Loading ratings...</Text></Flex>;
  if (error) return <Alert status="error"><AlertIcon />{error}<Button ml={4} size="sm" onClick={fetchRatings}>Retry</Button></Alert>;

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="2xl" fontWeight="700" color={textColor}>Rating Management</Text>
        <Button leftIcon={<Icon as={MdRefresh} />} onClick={fetchRatings}>Refresh</Button>
      </Flex>

      {/* Filters */}
      <Card mb={6} p={4}>
        <HStack spacing={4} align="flex-end" wrap="wrap">
          <Select flex="1" placeholder="All ratings" value={filters.starRating} onChange={e => handleFilterChange('starRating', e.target.value)}>
            {[5, 4, 3, 2, 1].map(star => <option key={star} value={star}>⭐ {star}</option>)}
          </Select>
          <Select
            flex="1"
            placeholder="All models"
            value={filters.modelId}
            onChange={e => handleFilterChange('modelId', e.target.value)}
          >
            {models.map(model => (
              <option key={model.modelId} value={model.modelId}>
                {model.name || `Model ${model.modelId}`}
              </option>
            ))}
          </Select>

          <Select
            flex="1"
            placeholder="All renters"
            value={filters.renterId}
            onChange={e => handleFilterChange('renterId', e.target.value)}
          >
            {renters.map(renter => (
              <option key={renter.renterId} value={renter.renterId}>
                {renter.fullName || `Renter ${renter.renterId}`}
              </option>
            ))}
          </Select>
          <Button
            leftIcon={<Icon as={MdSearch} />}
            colorScheme="blue"
            onClick={applyFilters}
            isLoading={loading}
          >
            Search
          </Button>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear
          </Button>
        </HStack>
      </Card>

      <Text fontSize="sm" color="gray.600" mb={4}>Showing {ratings.length} ratings</Text>

      <Card>
        <Table variant="simple" color="gray.500" mb="24px" mt="12px">
          <Thead>
            {table.getHeaderGroups().map(headerGroup => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <Th key={header.id} borderColor={borderColor} cursor={header.column.getCanSort() ? 'pointer' : 'default'} onClick={header.column.getToggleSortingHandler()}>
                    <Flex align="center" gap={1}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: '▲',
                        desc: '▼'
                      }[header.column.getIsSorted()] ?? null}
                    </Flex>
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {table.getRowModel().rows.length > 0 ? table.getRowModel().rows.map(row => (
              <Tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <Td key={cell.id} borderColor="transparent">{flexRender(cell.column.columnDef.cell, cell.getContext())}</Td>
                ))}
              </Tr>
            )) : (
              <Tr><Td colSpan={6}><Box textAlign="center" py={6}><Text fontSize="lg" color="gray.500">No ratings found</Text></Box></Td></Tr>
            )}
          </Tbody>
        </Table>
      </Card>

      <Suspense fallback={<div>Loading...</div>}>
        <ContractDetailModal isOpen={isOpen} onClose={onClose} contract={selectedContract} />
      </Suspense>
    </Box>
  );
}