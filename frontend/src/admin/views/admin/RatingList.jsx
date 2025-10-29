import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import {
  Box, Table, Thead, Tbody, Tr, Th, Td, Text, Badge, Button, HStack, VStack,
  Input, Select, Card, Spinner, Alert, AlertIcon, useDisclosure,
  Icon, useColorModeValue, Flex, Tooltip, AlertTitle, AlertDescription
} from '@chakra-ui/react';
import {
  MdSearch, MdFilterList, MdAssignment, MdRefresh, MdDelete
} from 'react-icons/md';
import { ratingsAPI, contractAPI } from '../../../services/api';

// Use lazy loading for ContractDetailModal
const ContractDetailModal = lazy(() => import('./contract/ContractDetailModal'));

export default function RatingList() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    starRating: '',
    modelId: '',
    renterId: ''
  });
  const [selectedContract, setSelectedContract] = useState(null);
  const { isOpen: isContractModalOpen, onOpen: onContractModalOpen, onClose: onContractModalClose } = useDisclosure();

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "white");

  // Fetch all ratings
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

  useEffect(() => {
    fetchRatings();
  }, []);

  // Filter ratings based on criteria
  const filteredRatings = useMemo(() => {
    return ratings.filter(rating => {
      const matchesSearch = !filters.search ||
        rating.renterName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        rating.comment?.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStar = !filters.starRating || rating.stars == filters.starRating;
      const matchesModel = !filters.modelId || rating.modelId == filters.modelId;
      const matchesRenter = !filters.renterId || rating.renterId == filters.renterId;

      return matchesSearch && matchesStar && matchesModel && matchesRenter;
    });
  }, [ratings, filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      starRating: '',
      modelId: '',
      renterId: ''
    });
  };

  const handleRefresh = () => {
    fetchRatings();
  };

  // Handle view contract
  const handleViewContract = async (contractId) => {
    try {
      const contract = await contractAPI.getById(contractId);
      setSelectedContract(contract);
      onContractModalOpen();
    } catch (err) {
      console.error('Error fetching contract:', err);
      setError('Failed to load contract details');
    }
  };

  const handleDeleteRating = async (ratingId) => {
    if (window.confirm('Are you sure you want to delete this rating?')) {
      try {
        await ratingsAPI.delete(ratingId);
        await fetchRatings(); // Refresh the list
      } catch (err) {
        console.error('Error deleting rating:', err);
        setError('Failed to delete rating');
      }
    }
  };

  // Render star rating
  const renderStars = (stars) => {
    return '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Flex align="center" justify="center" minH="300px">
        <Spinner size="xl" color={brandColor} />
        <Text ml={4}>Loading ratings...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Error!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button ml={4} size="sm" onClick={fetchRatings}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      {/* Header with Title and Refresh Button */}
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="2xl" fontWeight="700" color={textColor}>
          Rating Management
        </Text>
        <HStack>
          <Button leftIcon={<Icon as={MdRefresh} />} onClick={handleRefresh}>
            Refresh
          </Button>
        </HStack>
      </Flex>

      {/* Filters Card */}
      <Card mb={6} p={4}>
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontSize="xl" fontWeight="bold">
            <Icon as={MdFilterList} mr={2} />
            Filter Ratings
          </Text>
        </Flex>

        <HStack spacing={4} alignItems="flex-end">
          {/* Search */}
          <Box flex="1">
            <Input
              placeholder="Search by renter name or comment..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              leftElement={<Icon as={MdSearch} color="gray.400" />}
            />
          </Box>

          {/* Star Rating Filter */}
          <Box flex="1">
            <Select
              placeholder="All ratings"
              value={filters.starRating}
              onChange={(e) => handleFilterChange('starRating', e.target.value)}
            >
              <option value="5">⭐ 5 Stars</option>
              <option value="4">⭐ 4 Stars</option>
              <option value="3">⭐ 3 Stars</option>
              <option value="2">⭐ 2 Stars</option>
              <option value="1">⭐ 1 Star</option>
            </Select>
          </Box>

          {/* Model ID Filter */}
          <Box flex="1">
            <Input
              type="number"
              placeholder="Model ID"
              value={filters.modelId}
              onChange={(e) => handleFilterChange('modelId', e.target.value)}
            />
          </Box>

          {/* Renter ID Filter */}
          <Box flex="1">
            <Input
              type="number"
              placeholder="Renter ID"
              value={filters.renterId}
              onChange={(e) => handleFilterChange('renterId', e.target.value)}
            />
          </Box>

          {/* Action Buttons */}
          <Box>
            <HStack spacing={2}>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            </HStack>
          </Box>
        </HStack>
      </Card>

      {/* Results Count */}
      <Text fontSize="sm" color="gray.600" mb={4}>
        Showing {filteredRatings.length} of {ratings.length} ratings
      </Text>

      {/* Ratings Table Card */}
      <Card>
        <Table variant="simple" color="gray.500" mb="24px" mt="12px">
          <Thead>
            <Tr>
              <Th borderColor={borderColor}>
                <Text color="gray.400" fontSize="12px">ID</Text>
              </Th>
              <Th borderColor={borderColor}>
                <Text color="gray.400" fontSize="12px">RENTER</Text>
              </Th>
              <Th borderColor={borderColor}>
                <Text color="gray.400" fontSize="12px">STARS</Text>
              </Th>
              <Th borderColor={borderColor}>
                <Text color="gray.400" fontSize="12px">COMMENT</Text>
              </Th>
              <Th borderColor={borderColor}>
                <Text color="gray.400" fontSize="12px">DATE</Text>
              </Th>
              <Th borderColor={borderColor}>
                <Text color="gray.400" fontSize="12px">ACTIONS</Text>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredRatings.map((rating) => (
              <Tr key={rating.ratingId}>
                <Td borderColor="transparent">
                  <Text color={textColor} fontWeight="700">
                    {rating.ratingId}
                  </Text>
                </Td>
                <Td borderColor="transparent">
                  <VStack align="start" spacing={1}>
                    <Text color={textColor} fontWeight="medium">{rating.renterName}</Text>
                    <Text fontSize="sm" color="gray.600">ID: {rating.renterId}</Text>
                  </VStack>
                </Td>
                <Td borderColor="transparent">
                  <HStack>
                    <Text fontSize="lg">{renderStars(rating.stars)}</Text>
                    <Badge colorScheme="yellow">{rating.stars}</Badge>
                  </HStack>
                </Td>
                <Td borderColor="transparent">
                  <Tooltip label={rating.comment || 'No comment'} hasArrow>
                    <Text
                      maxW="300px"
                      noOfLines={2}
                      color={textColor}
                    >
                      {rating.comment || 'No comment'}
                    </Text>
                  </Tooltip>
                </Td>
                <Td borderColor="transparent">
                  <Text color={textColor} fontSize="sm">
                    {formatDate(rating.createdAt)}
                  </Text>
                </Td>
                <Td borderColor="transparent">
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Icon as={MdAssignment} />}
                      onClick={() => handleViewContract(rating.contractId)}
                    >
                      View Contract
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      leftIcon={<Icon as={MdDelete} />}
                      onClick={() => handleDeleteRating(rating.ratingId)}
                    >
                      Delete
                    </Button>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {filteredRatings.length === 0 && (
          <Box textAlign="center" py={8}>
            <Text fontSize="lg" color="gray.500">
              No ratings found matching your filters
            </Text>
          </Box>
        )}
      </Card>

      {/* Contract Detail Modal with Suspense */}
      <Suspense fallback={<div>Loading...</div>}>
        <ContractDetailModal
          isOpen={isContractModalOpen}
          onClose={onContractModalClose}
          contract={selectedContract}
        />
      </Suspense>
    </Box>
  );
}