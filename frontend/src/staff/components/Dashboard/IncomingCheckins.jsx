import React, { useEffect, useState } from 'react';
import { Card, CardBody, Box, Text, Spinner, Alert, AlertIcon, VStack, HStack, Badge, Button } from '@chakra-ui/react';
import { staffDashboardAPI } from '../../../services/api';

const IncomingCheckins = ({ stationId, count = 5 }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10; // 2 boxes per row, 5 rows

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

  useEffect(() => {
    setPage(1);
  }, [items]);

  return (
    <Card shadow="md" borderRadius="lg">
      <CardBody>
        <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.700" _dark={{ color: 'gray.200' }}>
          Incoming Check-ins
        </Text>
        
        {loading && (
          <HStack spacing={3} justify="center" py={8}>
            <Spinner size="md" color="blue.500" thickness="3px" />
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
                <Text color="gray.500" fontSize="md">No upcoming check-ins.</Text>
              </Box>
            )}
            
            <Box 
              display="grid" 
              gridTemplateColumns="repeat(2, 1fr)" 
              gap={4}
            >
              {items
                .slice((page - 1) * pageSize, page * pageSize)
                .map((item, idx) => (
              <Box 
                key={item.contractId || idx} 
                p={4} 
                borderWidth="1px" 
                borderRadius="md" 
                bg="white" 
                _dark={{ bg: 'gray.800' }}
                borderColor="gray.200"
                
                transition="all 0.2s"
                _hover={{ 
                  shadow: 'md', 
                  borderColor: 'blue.300',
                  transform: 'translateY(-2px)'
                }}
              >
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between" align="center">
                    <Text 
                      fontWeight="bold" 
                      fontSize="lg" 
                      color="blue.600"
                      _dark={{ color: 'blue.400' }}
                    >
                      {item.licensePlate || 'N/A'}
                    </Text>
                    
                    <Badge 
                      colorScheme="green" 
                      variant="subtle" 
                      borderRadius="full" 
                      px={3} 
                      py={1} 
                      fontSize="xs"
                      fontWeight="semibold"
                    >
                      {item.scheduledTime ? new Date(item.scheduledTime).toLocaleString() : 'Soon'}
                    </Badge>
                  </HStack>
                  
                  <Text 
                    color="gray.700" 
                    _dark={{ color: 'gray.300' }} 
                    fontSize="sm" 
                    noOfLines={1}
                  >
                    {item.vehicleModel || 'Unknown Model'}
                  </Text>
                  
                  <VStack align="stretch" spacing={1}>
                    <Text 
                      color="gray.600" 
                      _dark={{ color: 'gray.400' }}
                      fontSize="sm"
                    >
                      Customer: <Text as="span" fontWeight="medium">{item.customerName || 'N/A'}</Text>
                    </Text>
                    
                    <Text 
                      color="gray.600" 
                      _dark={{ color: 'gray.400' }}
                      fontSize="sm"
                    >
                      Phone: <Text as="span" fontWeight="medium">{item.customerPhone || 'N/A'}</Text>
                    </Text>
                    
                    <Text 
                      color="gray.600" 
                      _dark={{ color: 'gray.400' }}
                      fontSize="sm"
                    >
                      License: <Text as="span" fontWeight="medium">{item.licenseNumber || 'N/A'}</Text>
                    </Text>
                  </VStack>
                </VStack>
              </Box>
            ))}
            </Box>
            
            {items.length > pageSize && (
              <HStack justify="center" pt={4} spacing={2}>
                {Array.from({ length: Math.ceil(items.length / pageSize) }, (_, i) => i + 1).map(p => (
                  <Button 
                    key={p} 
                    size="sm" 
                    onClick={() => setPage(p)} 
                    colorScheme={p === page ? 'blue' : 'gray'}
                    variant={p === page ? 'solid' : 'outline'}
                    minW="35px"
                    _hover={{
                      transform: 'translateY(-2px)',
                      shadow: 'sm'
                    }}
                  >
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

export default IncomingCheckins;