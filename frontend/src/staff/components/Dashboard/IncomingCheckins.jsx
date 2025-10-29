import React, { useEffect, useState } from 'react';
import { Card, CardBody, Box, Text, Spinner, Alert, AlertIcon, VStack, HStack, Badge } from '@chakra-ui/react';
import { staffDashboardAPI } from '../../../services/api';

const IncomingCheckins = ({ stationId, count = 5 }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await staffDashboardAPI.getIncomingCheckins(stationId, count);
        if (isActive) setItems(Array.isArray(data) ? data : (data.result || []));
      } catch (e) {
        if (isActive) setError(e.message || 'Failed to load incoming check-ins');
      } finally {
        if (isActive) setLoading(false);
      }
    };
    if (stationId) fetchData();
    return () => { isActive = false; };
  }, [stationId, count]);

  return (
    <Card>
      <CardBody>
        <Text fontWeight="bold" mb={3}>Incoming Check-ins</Text>
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
              <Text color="gray.500">No upcoming check-ins.</Text>
            )}
            {items.map((item, idx) => (
              <Box key={item.id || idx} p={3} borderWidth="1px" borderRadius="md">
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="medium">{item.renterName || item.contractCode || 'Contract'}</Text>
                    <Text fontSize="sm" color="gray.500">Vehicle: {item.vehiclePlate || item.vehicleName || 'N/A'}</Text>
                  </Box>
                  <Badge colorScheme="green">{item.expectedCheckinTime || item.checkinTime || 'Soon'}</Badge>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </CardBody>
    </Card>
  );
};

export default IncomingCheckins;


