import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import {
  Box, Table, Thead, Tbody, Tr, Th, Td, Text, Badge, Button, HStack, VStack,
  Input, Select, Spinner, Alert, AlertIcon, useDisclosure,
  Icon, useColorModeValue, Flex, Tooltip, InputGroup, InputLeftElement
} from '@chakra-ui/react';
import { MdSearch, MdFilterList, MdAssignment, MdRefresh, MdDelete } from 'react-icons/md';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getSortedRowModel } from '@tanstack/react-table';
import { ratingsAPI, contractAPI } from '../../../services/api';
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

  const fetchRatings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ratingsAPI.getAll();
      setRatings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching ratings:', err);
      setError(err.message || 'Failed to fetch ratings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRatings(); }, []);

  const filteredRatings = useMemo(() => {
    return ratings.filter(r => {
      const matchesSearch =
        !filters.search ||
        r.renterName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        r.comment?.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStar = !filters.starRating || r.stars === Number(filters.starRating);
      const matchesModel = !filters.modelId || r.modelId === Number(filters.modelId);
      const matchesRenter = !filters.renterId || r.renterId === Number(filters.renterId);

      return matchesSearch && matchesStar && matchesModel && matchesRenter;
    });
  }, [ratings, filters]);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const handleClearFilters = () => setFilters({ search: '', starRating: '', modelId: '', renterId: '' });

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
    try { await ratingsAPI.delete(ratingId); await fetchRatings(); }
    catch (err) { console.error(err); setError('Failed to delete rating'); }
  };

  const renderStars = (stars) => '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('en-US', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : 'N/A';

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
      cell: info => <Badge colorScheme="yellow">{info.getValue()}</Badge>
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
    data: filteredRatings,
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
        <Flex align="center" mb={4}>
          <Icon as={MdFilterList} mr={2} color={brandColor} />
          <Text fontSize="xl" fontWeight="bold">Filter Ratings</Text>
        </Flex>
        <HStack spacing={4} align="flex-end" wrap="wrap">
          <Box flex="1">
            <InputGroup>
              <InputLeftElement pointerEvents="none"><Icon as={MdSearch} color="gray.400" /></InputLeftElement>
              <Input placeholder="Search..." value={filters.search} onChange={e => handleFilterChange('search', e.target.value)} />
            </InputGroup>
          </Box>
          <Select flex="1" placeholder="All ratings" value={filters.starRating} onChange={e => handleFilterChange('starRating', e.target.value)}>
            {[5,4,3,2,1].map(star => <option key={star} value={star}>⭐ {star}</option>)}
          </Select>
          <Input flex="1" type="number" placeholder="Model ID" value={filters.modelId} onChange={e => handleFilterChange('modelId', e.target.value)} />
          <Input flex="1" type="number" placeholder="Renter ID" value={filters.renterId} onChange={e => handleFilterChange('renterId', e.target.value)} />
          <Button variant="outline" onClick={handleClearFilters}>Clear</Button>
        </HStack>
      </Card>

      <Text fontSize="sm" color="gray.600" mb={4}>Showing {filteredRatings.length} of {ratings.length} ratings</Text>

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