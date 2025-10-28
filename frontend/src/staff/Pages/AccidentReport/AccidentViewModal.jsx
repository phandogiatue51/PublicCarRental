import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, 
  ModalBody, ModalCloseButton, Button, VStack, Text, 
  Box, Badge, HStack, Divider, Image, Grid, Alert, AlertIcon,
  Spinner
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { accidentAPI } from '../../../services/api';

export default function AccidentViewModal({ isOpen, onClose, accident }) {
  const [accidentDetails, setAccidentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && accident?.accidentId) {
      fetchAccidentDetails();
    }
  }, [isOpen, accident?.accidentId]);

  const fetchAccidentDetails = async () => {
    if (!accident) return;
    
    setLoading(true);
    setError('');
    
    try {
      const details = await accidentAPI.getById(accident.accidentId);
      setAccidentDetails(details);
    } catch (err) {
      console.error('Error fetching accident details:', err);
      setError('Failed to load accident details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusValue = typeof status === 'number' 
      ? mapStatusNumberToString(status) 
      : status;
    
    const colors = {
      'Reported': 'blue',
      'UnderInvestigation': 'orange',
      'RepairApproved': 'yellow',
      'UnderRepair': 'purple',
      'Repaired': 'green'
    };
    return colors[statusValue] || 'gray';
  };

  const mapStatusNumberToString = (statusNumber) => {
    const statusMap = {
      0: 'Reported',
      1: 'UnderInvestigation',
      2: 'RepairApproved',
      3: 'UnderRepair',
      4: 'Repaired'
    };
    return statusMap[statusNumber] || 'Reported';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const handleClose = () => {
    setAccidentDetails(null);
    setError('');
    setLoading(false);
    onClose();
  };

  if (!accident) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Accident Report Details</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {loading && (
            <Box textAlign="center" py={8}>
              <Spinner size="xl" />
              <Text mt={4}>Loading accident details...</Text>
            </Box>
          )}

          {error && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              {error}
            </Alert>
          )}

          {accidentDetails && !loading && (
            <VStack spacing={4} align="stretch">
              {/* Header Information */}
              <Box p={4} bg="blue.50" borderRadius="md">
                <Grid templateColumns="1fr auto" gap={4} alignItems="center">
                  <Box>
                    <Text fontWeight="bold" fontSize="xl">
                      Accident Report #{accidentDetails.accidentId}
                    </Text>
                    <Text color="gray.600">
                      Reported on {formatDate(accidentDetails.reportedAt)}
                    </Text>
                  </Box>
                  <Badge 
                    colorScheme={getStatusColor(accidentDetails.status)}
                    fontSize="md"
                    px={3}
                    py={2}
                    borderRadius="full"
                  >
                    {mapStatusNumberToString(accidentDetails.status).replace(/([A-Z])/g, ' $1').trim()}
                  </Badge>
                </Grid>
              </Box>

              <Divider />

              {/* Vehicle and Contract Information */}
              <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
                <Text fontWeight="bold" fontSize="lg" mb={3}>Vehicle Information</Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text><strong>Vehicle ID:</strong> VEH-{accidentDetails.vehicleId}</Text>
                    <Text><strong>Location:</strong> {accidentDetails.location || 'Not specified'}</Text>
                  </Box>
                  <Box>
                    <Text><strong>Contract ID:</strong> {accidentDetails.contractId ? `CONT-${accidentDetails.contractId}` : 'N/A'}</Text>
                    <Text><strong>Staff ID:</strong> {accidentDetails.staffId || 'Not specified'}</Text>
                  </Box>
                </Grid>
              </Box>

              {/* Accident Description */}
              <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
                <Text fontWeight="bold" fontSize="lg" mb={3}>Accident Details</Text>
                <Text>
                  {accidentDetails.description || 'No description provided'}
                </Text>
              </Box>

              {/* Accident Image */}
              {accidentDetails.imageUrl && (
                <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
                  <Text fontWeight="bold" fontSize="lg" mb={3}>Accident Evidence</Text>
                  <Image
                    src={accidentDetails.imageUrl}
                    alt="Accident damage"
                    maxH="400px"
                    objectFit="contain"
                    borderRadius="md"
                    mx="auto"
                    border="1px"
                    borderColor="gray.200"
                  />
                </Box>
              )}

              {/* Report Summary */}
              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontWeight="bold" mb={2}>Report Summary</Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                  <Text><strong>Report Type:</strong> {accidentDetails.contractId ? 'Contract Accident' : 'Vehicle Accident'}</Text>
                  <Text><strong>Reported At:</strong> {formatDate(accidentDetails.reportedAt)}</Text>
                </Grid>
              </Box>
            </VStack>
          )}

          {!accidentDetails && !loading && !error && (
            <Text textAlign="center" py={8}>
              No accident details found.
            </Text>
          )}
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" onClick={handleClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}