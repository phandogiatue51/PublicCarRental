import React, { useEffect, useState } from 'react';
import { Card, CardBody, Box, Text, Spinner, Alert, AlertIcon, VStack, HStack, Badge, Button, SimpleGrid } from '@chakra-ui/react';
import { staffDashboardAPI } from '../../../services/api';

const AvailableVehicles = ({ stationId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 9; // 3 x 3

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await staffDashboardAPI.getAvailableVehicles(stationId);
        if (active) setItems(Array.isArray(data) ? data : (data.result || []));
      } catch (e) {
        if (active) setError(e.message || 'Failed to load available vehicles');
      } finally {
        if (active) setLoading(false);
      }
    };
    if (stationId) load();
    return () => { active = false; };
  }, [stationId]);

  useEffect(() => { setPage(1); }, [items]);

  const batteryColor = (percent) => {
    if (percent <= 15) return 'red';
    if (percent <= 30) return 'orange';
    return 'green';
  };

  return (
    <Card shadow="md" borderRadius="lg">
      <CardBody>
        <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.700" _dark={{ color: 'gray.200' }}>
          Available Vehicles
        </Text>
        {loading && (
          <HStack spacing={3} justify="center" py={8}>
            <Spinner size="md" color="teal.500" thickness="3px" />
            <Text color="gray.600">Loading...</Text>
          </HStack>
        )}
        {!loading && error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
        {!loading && !error && (
          <VStack align="stretch" spacing={4}>
            {items.length === 0 && (
              <Box textAlign="center" py={8}>
                <Text color="gray.500" fontSize="md">No vehicles available.</Text>
              </Box>
            )}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
              {items
                .slice((page - 1) * pageSize, page * pageSize)
                .map((v, idx) => (
                <Box
                  key={v.vehicleId || v.id || idx}
                  p={4}
                  borderWidth="1px"
                  borderRadius="md"
                  bg="white"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderColor="gray.200"
                  transition="all 0.2s"
                  _hover={{ shadow: 'md', borderColor: 'teal.300', transform: 'translateY(-2px)' }}
                >
                  <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between" align="center">
                      <Text fontWeight="bold" color="teal.600" _dark={{ color: 'teal.300' }}>
                        {v.licensePlate || 'N/A'}
                      </Text>
                      {typeof v.batteryLevel === 'number' && (
                        <Badge colorScheme={batteryColor(v.batteryLevel)}>{v.batteryLevel}%</Badge>
                      )}
                    </HStack>
                    <Text fontSize="sm" color="gray.700" _dark={{ color: 'gray.300' }} noOfLines={1}>
                      {v.modelName || 'Unknown Model'}
                    </Text>
                    <HStack justify="space-between" fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                     
                      {typeof v.pricePerHour === 'number' && (
                        <Text>Price/hr: <Text as="span" fontWeight="medium">{v.pricePerHour.toLocaleString()}</Text></Text>
                      )}
                    </HStack>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
            {items.length > pageSize && (
              <HStack justify="center" pt={2} spacing={2}>
                {Array.from({ length: Math.ceil(items.length / pageSize) }, (_, i) => i + 1).map(p => (
                  <Button key={p} size="sm" onClick={() => setPage(p)} variant={p === page ? 'solid' : 'outline'} colorScheme={p === page ? 'teal' : 'gray'} minW="35px">
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

export default AvailableVehicles;


