import React, { useEffect, useState } from 'react';
import { Card, CardBody, Box, Text, Spinner, Alert, AlertIcon, VStack, HStack, Badge, Progress, Button } from '@chakra-ui/react';
import { staffDashboardAPI } from '../../../services/api';

const LowBatteryVehicles = ({ stationId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 5; // items per page

  useEffect(() => {
    let isActive = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await staffDashboardAPI.getLowBatteryVehicles(stationId);
        if (isActive) setItems(Array.isArray(data) ? data : (data.result || []));
      } catch (e) {
        if (isActive) setError(e.message || 'Failed to load low-battery vehicles');
      } finally {
        if (isActive) setLoading(false);
      }
    };
    if (stationId) fetchData();
    return () => { isActive = false; };
  }, [stationId]);

  useEffect(() => {
    setPage(1); // Reset to first page when list changes
  }, [items]);

  const getColor = (percent) => {
    if (percent <= 15) return 'red';
    if (percent <= 30) return 'orange';
    return 'yellow';
  };

  return (
    <Card>
      <CardBody>
        <Text fontWeight="bold" mb={3}>Low Battery Vehicles</Text>
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
              <Text color="gray.500">No vehicles need charging.</Text>
            )}
            {items
              .slice((page - 1) * pageSize, page * pageSize)
              .map((item, idx) => {
                const percent = (typeof item.batteryLevel === 'number') ? item.batteryLevel : 0;
                return (
                  <Box key={item.vehicleId || idx} p={3} borderWidth="1px" borderRadius="md">
                    <HStack justify="space-between" align="start">
                      <Box>
                        <Text fontWeight="medium">{item.licensePlate || 'N/A'}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {item.vehicleModel || 'Unknown Model'}{item.brand ? ` (${item.brand})` : ''}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          Last maintenance: {item.lastMaintenanceDate ? new Date(item.lastMaintenanceDate).toLocaleString() : 'N/A'}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          Current rental contract: {item.currentRentalContractId ?? 'None'}
                        </Text>
                      </Box>
                      <Box ml={2} minW="58px" textAlign="right">
                        <Badge colorScheme={getColor(percent)} mb={1}>{percent}%</Badge>
                        <Progress size="xs" mt={1} colorScheme={getColor(percent)} value={percent} />
                      </Box>
                    </HStack>
                  </Box>
                );
              })}
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

export default LowBatteryVehicles;


