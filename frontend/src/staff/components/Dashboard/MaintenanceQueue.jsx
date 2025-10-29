import React, { useEffect, useState } from 'react';
import { Card, CardBody, Box, Text, Spinner, Alert, AlertIcon, VStack, HStack, Badge, Button, SimpleGrid } from '@chakra-ui/react';
import { staffDashboardAPI } from '../../../services/api';

const MaintenanceQueue = ({ stationId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 9; // 3 rows x 3 columns per page

  useEffect(() => {
    let isActive = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await staffDashboardAPI.getMaintenanceQueue(stationId);
        if (isActive) setItems(Array.isArray(data) ? data : (data.result || []));
      } catch (e) {
        if (isActive) setError(e.message || 'Failed to load maintenance queue');
      } finally {
        if (isActive) setLoading(false);
      }
    };
    if (stationId) fetchData();
    return () => { isActive = false; };
  }, [stationId]);

  useEffect(() => {
    // Reset to first page when data changes
    setPage(1);
  }, [items]);

  return (
    <Card>
      <CardBody>
        <Text fontWeight="bold" mb={3}>Maintenance Queue</Text>
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
              <Text color="gray.500">No vehicles in maintenance queue.</Text>
            )}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
              {items
                .slice((page - 1) * pageSize, page * pageSize)
                .map((item, idx) => (
                <Box key={item.vehicleId || item.id || idx} p={3} borderWidth="1px" borderRadius="md">
                  <HStack justify="space-between" align="start">
                    <Box>
                      <HStack spacing={3}>
                        <Text fontWeight="medium">{item.licensePlate || 'N/A'}</Text>
                        {typeof item.batteryLevel === 'number' && (
                          <Badge colorScheme={item.batteryLevel <= 15 ? 'red' : item.batteryLevel <= 30 ? 'orange' : 'yellow'}>
                            {item.batteryLevel}%
                          </Badge>
                        )}
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        {item.vehicleModel || 'Unknown Model'} {item.brand ? `(${item.brand})` : ''}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Last maintenance: {item.lastMaintenanceDate ? new Date(item.lastMaintenanceDate).toLocaleString() : 'N/A'}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Current rental contract: {item.currentRentalContractId ?? 'None'}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              ))}
            </SimpleGrid>
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

export default MaintenanceQueue;


