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
} from '@chakra-ui/react';
import { accidentAPI } from '../../../../services/api';

const ContractAccidentViewModal = ({ 
  isOpen, 
  onClose, 
  contract,
  accidentReport 
}) => {
  const [accidentDetails, setAccidentDetails] = useState(null);
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
      const details = await accidentAPI.getById(accidentReport.accidentId);
      setAccidentDetails(details);
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
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Accident Report Details</ModalHeader>
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
              {/* Contract & Vehicle Info */}
              <Box p={3} bg="blue.50" borderRadius="md">
                <Text fontWeight="bold" fontSize="lg" mb={2}>Contract & Vehicle Information</Text>
                <HStack justify="space-between">
                  <Box>
                    <Text><strong>Contract ID:</strong> {contract?.contractId}</Text>
                    <Text><strong>Vehicle:</strong> {contract?.vehicleName} ({contract?.licensePlate})</Text>
                    <Text><strong>Renter:</strong> {contract?.renterName}</Text>
                  </Box>
                  <Box>
                    <Text><strong>Accident ID:</strong> {accidentDetails.accidentId}</Text>
                    <Text><strong>Reported At:</strong> {formatDate(accidentDetails.reportedAt)}</Text>
                  </Box>
                </HStack>
              </Box>

              {/* Accident Status */}
              <Box p={3} bg="gray.50" borderRadius="md">
                <HStack justify="space-between">
                  <Text fontWeight="bold">Status</Text>
                  <Badge 
                    colorScheme={getStatusColor(accidentDetails.status)}
                    fontSize="md"
                    px={3}
                    py={1}
                  >
                    {getStatusText(accidentDetails.status)}
                  </Badge>
                </HStack>
              </Box>

              {/* Accident Details */}
              <Box p={3} border="1px" borderColor="gray.200" borderRadius="md">
                <Text fontWeight="bold" mb={2}>Accident Details</Text>
                <Text><strong>Location:</strong> {accidentDetails.location || 'Not specified'}</Text>
                <Text><strong>Description:</strong></Text>
                <Text mt={1} p={2} bg="gray.50" borderRadius="md" minH="60px">
                  {accidentDetails.description || 'No description provided'}
                </Text>
              </Box>

              {/* Accident Image */}
              {accidentDetails.imageUrl && (
                <Box p={3} border="1px" borderColor="gray.200" borderRadius="md">
                  <Text fontWeight="bold" mb={2}>Accident Image</Text>
                  <Image
                    src={accidentDetails.imageUrl}
                    alt="Accident damage"
                    maxH="300px"
                    objectFit="contain"
                    borderRadius="md"
                    mx="auto"
                  />
                </Box>
              )}

              {/* Staff Information */}
              <Box p={3} bg="green.50" borderRadius="md">
                <Text fontWeight="bold" mb={2}>Report Information</Text>
                <Text><strong>Reported By Staff ID:</strong> {accidentDetails.staffId || 'Not specified'}</Text>
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

export default ContractAccidentViewModal;