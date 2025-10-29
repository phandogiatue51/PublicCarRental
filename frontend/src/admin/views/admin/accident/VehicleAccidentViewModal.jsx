import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Image,
  Box,
  Badge,
  HStack,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
  Grid,
} from '@chakra-ui/react';
import { accidentAPI, vehicleAPI } from '../../../../services/api';

const VehicleAccidentViewModal = ({ 
  isOpen, 
  onClose, 
  accidentReport 
}) => {
  const [accidentDetails, setAccidentDetails] = useState(null);
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && accidentReport) {
      fetchAccidentDetails();
    }
  }, [isOpen, accidentReport]);

  const fetchAccidentDetails = async () => {
    if (!accidentReport) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Fetch accident details
      const details = await accidentAPI.getById(accidentReport.accidentId);
      setAccidentDetails(details);

      // Fetch vehicle details
      if (details.vehicleId) {
        const vehicle = await vehicleAPI.getById(details.vehicleId);
        setVehicleDetails(vehicle);
      }
    } catch (err) {
      console.error('Error fetching accident details:', err);
      setError('Failed to load accident details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0: return 'orange'; // Reported
      case 1: return 'yellow'; // UnderInvestigation
      case 2: return 'blue'; // RepairApproved
      case 3: return 'purple'; // UnderRepair
      case 4: return 'green'; // Repaired
      default: return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0: return 'Reported';
      case 1: return 'Under Investigation';
      case 2: return 'Repair Approved';
      case 3: return 'Under Repair';
      case 4: return 'Repaired';
      default: return 'Unknown';
    }
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
    setVehicleDetails(null);
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Vehicle Accident Report Details</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {loading && (
            <Box textAlign="center" py={4}>
              <Spinner size="xl" />
              <Text mt={2}>Loading accident details...</Text>
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
              {/* Header Info */}
              <Grid templateColumns="1fr auto" gap={4} alignItems="center">
                <Box>
                  <Text fontWeight="bold" fontSize="xl">Accident Report #{accidentDetails.accidentId}</Text>
                  <Text color="gray.600">Reported on {formatDate(accidentDetails.reportedAt)}</Text>
                </Box>
                <Badge 
                  colorScheme={getStatusColor(accidentDetails.status)}
                  fontSize="md"
                  px={3}
                  py={2}
                >
                  {getStatusText(accidentDetails.status)}
                </Badge>
              </Grid>

              <Divider />

              {/* Vehicle Information */}
              {vehicleDetails && (
                <Box p={3} bg="blue.50" borderRadius="md">
                  <Text fontWeight="bold" fontSize="lg" mb={2}>Vehicle Information</Text>
                  <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                    <Box>
                      <Text><strong>Vehicle ID:</strong> {vehicleDetails.vehicleId}</Text>
                      <Text><strong>Model:</strong> {vehicleDetails.modelName}</Text>
                      <Text><strong>License Plate:</strong> {vehicleDetails.licensePlate}</Text>
                    </Box>
                    <Box>
                      <Text><strong>Battery Level:</strong> {vehicleDetails.batteryLevel}%</Text>
                      <Text><strong>Current Status:</strong> {vehicleDetails.status}</Text>
                      <Text><strong>Station:</strong> {vehicleDetails.stationName}</Text>
                    </Box>
                  </Grid>
                </Box>
              )}

              {/* Accident Details */}
              <Box p={3} border="1px" borderColor="gray.200" borderRadius="md">
                <Text fontWeight="bold" fontSize="lg" mb={3}>Accident Details</Text>
                
                <VStack align="stretch" spacing={3}>
                  <Box>
                    <Text fontWeight="medium" mb={1}>Location</Text>
                    <Text p={2} bg="gray.50" borderRadius="md">
                      {accidentDetails.location || 'Not specified'}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontWeight="medium" mb={1}>Description</Text>
                    <Text p={2} bg="gray.50" borderRadius="md" minH="80px">
                      {accidentDetails.description || 'No description provided'}
                    </Text>
                  </Box>
                </VStack>
              </Box>

              {/* Accident Image */}
              {accidentDetails.imageUrl && (
                <Box p={3} border="1px" borderColor="gray.200" borderRadius="md">
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

              {/* Report Information */}
              <Box p={3} bg="green.50" borderRadius="md">
                <Text fontWeight="bold" fontSize="lg" mb={2}>Report Information</Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                  <Box>
                    <Text><strong>Reported By Staff ID:</strong> {accidentDetails.staffId || 'Not specified'}</Text>
                  </Box>
                  <Box>
                    <Text><strong>Contract ID:</strong> {accidentDetails.contractId || 'Not applicable'}</Text>
                  </Box>
                </Grid>
              </Box>
            </VStack>
          )}

          {!accidentDetails && !loading && !error && (
            <Text textAlign="center" py={4}>
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
};

export default VehicleAccidentViewModal;