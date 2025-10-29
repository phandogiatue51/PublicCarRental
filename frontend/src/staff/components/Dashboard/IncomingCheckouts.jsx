import React, { useEffect, useState } from 'react';
import { Card, CardBody, Box, Text, Spinner, Alert, AlertIcon, VStack, HStack, Badge, SimpleGrid, Button } from '@chakra-ui/react';
import { staffDashboardAPI } from '../../../services/api';

const IncomingCheckouts = ({ stationId, count = 5 }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 9; // 3 rows x 3 columns

  useEffect(() => {
    let isActive = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await staffDashboardAPI.getIncomingCheckouts(stationId, count);
        if (isActive) setItems(Array.isArray(data) ? data : (data.result || []));
      } catch (e) {
        if (isActive) setError(e.message || 'Failed to load incoming check-outs');
      } finally {
        if (isActive) setLoading(false);
      }
    };
    if (stationId) fetchData();
    return () => { isActive = false; };
  }, [stationId, count]);

  useEffect(() => {
    setPage(1);
  }, [items]);

  return (
    <Card>
      <CardBody>
        <Text fontWeight="bold" mb={3}>Incoming Check-outs</Text>
        {loading && (
          <HStack>
            <Spinner size="sm" />
            <Text>Loading...</Text>
          </HStack>
        )}
        {!loading && error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
        {!loading && !error && (
          <VStack align="stretch" spacing={3}>
            {items.length === 0 && (
              <Text color="gray.500">No upcoming check-outs.</Text>
            )}
            {items
              .slice((page - 1) * pageSize, page * pageSize)
              .map((item, idx) => (
              <Box key={item.contractId || idx} p={4} borderWidth="1px" borderRadius="lg" bg="white" _dark={{ bg: 'gray.800' }}>
                <HStack spacing={6} wrap="wrap" justify="space-between" align="center">
                  <HStack spacing={8} flex="1 1 auto" minW={0}>
                    <Text fontWeight="extrabold" fontSize="lg" whiteSpace="nowrap">{item.licensePlate || 'N/A'}</Text>
                    <Text color="gray.700" _dark={{ color: 'gray.300' }} fontSize="md" noOfLines={1}>{item.vehicleModel || 'Unknown Model'}</Text>
                    <Text color="gray.600" fontSize="md" whiteSpace="nowrap">Customer: {item.customerName || 'N/A'}</Text>
                    <Text color="gray.600" fontSize="md" whiteSpace="nowrap">Phone: {item.customerPhone || 'N/A'}</Text>
                    <Text color="gray.600" fontSize="md" whiteSpace="nowrap">License: {item.licenseNumber || 'N/A'}</Text>
                  </HStack>
                  <Badge colorScheme="purple" variant="subtle" borderRadius="full" px={4} py={1.5} fontSize="0.8rem">
                    {item.scheduledTime ? new Date(item.scheduledTime).toLocaleString() : 'Soon'}
                  </Badge>
                </HStack>
              </Box>
            ))}
            {items.length > pageSize && (
              <HStack justify="center" pt={2} spacing={2}>
                {Array.from({ length: Math.ceil(items.length / pageSize) }, (_, i) => i + 1).map(p => (
                  <Button key={p} size="sm" onClick={() => setPage(p)} variant={p === page ? 'solid' : 'outline'} colorScheme={p === page ? 'blue' : 'gray'}>
                    {p}
                  </Button>
                ))}
              </HStack>
            )}
          </VStack>
        )}
      </CardBody>
    </Card>
  );
};

export default IncomingCheckouts;


