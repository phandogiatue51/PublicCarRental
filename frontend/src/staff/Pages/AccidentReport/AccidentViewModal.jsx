import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Button, VStack, Text,
  Box, Badge, HStack, Divider, Image, Grid, Alert, AlertIcon,
  Spinner, Select, FormControl, FormLabel, useToast,
  Textarea // ADD THIS
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { accidentAPI } from '../../../services/api';

export default function AccidentViewModal({ isOpen, onClose, accident, onSuccess }) {
  const [accidentDetails, setAccidentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [actionType, setActionType] = useState(''); // ADD action type
  const [resolutionNote, setResolutionNote] = useState(''); // ADD resolution note
  const toast = useToast();

  const isAdmin = localStorage.getItem("isAdmin") === "true";

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
      setSelectedStatus(details.status);
      // Reset form fields
      setActionType('');
      setResolutionNote('');
    } catch (err) {
      console.error('Error fetching accident details:', err);
      setError('Failed to load accident details');
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Handle full accident update with action type and notes
  const handleAccidentUpdate = async () => {
    if (!accidentDetails) return;

    setUpdating(true);
    setError('');

    try {
      const updateData = {
        status: parseInt(selectedStatus),
        actionTaken: actionType ? parseInt(actionType) : null,
        resolutionNote: resolutionNote || '',
        resolvedAt: new Date().toISOString()
      };

      await accidentAPI.updateAccident(accidentDetails.accidentId, updateData);

      toast({
        title: 'Accident Updated',
        description: 'Accident has been resolved successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      if (onSuccess) {
        onSuccess(); // Refresh the parent list
      }
      handleClose();
    } catch (err) {
      console.error('Error updating accident:', err);
      setError('Failed to update accident');
      toast({
        title: 'Error',
        description: 'Failed to update accident',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
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

  const mapActionTypeToString = (actionType) => {
    const actionMap = {
      0: 'Refund',
      1: 'Replace', 
      2: 'RepairOnly'
    };
    return actionMap[actionType] || 'No Action';
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
    setSelectedStatus('');
    setActionType('');
    setResolutionNote('');
    setError('');
    setLoading(false);
    setUpdating(false);
    onClose();
  };

  const getNextStatusOptions = (currentStatus) => {
    const statusOptions = [
      { value: 0, label: 'Reported' },
      { value: 1, label: 'Under Investigation' },
      { value: 2, label: 'Repair Approved' },
      { value: 3, label: 'Under Repair' },
      { value: 4, label: 'Repaired' }
    ];

    switch (currentStatus) {
      case 0: // Reported
        return statusOptions.filter(opt => opt.value === 2);
      case 2: // RepairApproved
        return statusOptions.filter(opt => opt.value === 3);
      case 3: // UnderRepair
        return statusOptions.filter(opt => opt.value === 4);
      case 4: // Repaired
        return [];
      default:
        return statusOptions;
    }
  };

  const showActionTypeField = selectedStatus === '2'; // Show action type only for RepairApproved

  if (!accident) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="5xl" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Issue Report Details</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {loading && (
            <Box textAlign="center" py={8}>
              <Spinner size="xl" />
              <Text mt={4}>Loading issue details...</Text>
            </Box>
          )}

          {error && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              {error}
            </Alert>
          )}

          {accidentDetails && !loading && (
            <HStack spacing={6} align="start">
              {/* Left Column: Textual Details */}
              <VStack spacing={4} align="stretch" flex={1}>
                {/* Report Header */}
                <Box p={4} bg="blue.50" borderRadius="md">
                  <Grid templateColumns="1fr auto" gap={4} alignItems="center">
                    <Box>
                      <Text fontWeight="bold" fontSize="xl">
                        Issue Report #{accidentDetails.accidentId}
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

                {/* ADMIN CONTROLS */}
                {isAdmin && (
                  <Box p={4} border="1px" borderColor="blue.200" borderRadius="md" bg="blue.50">
                    <Text fontWeight="bold" fontSize="lg" mb={3}>Admin Resolution</Text>
                    
                    {/* Status Update */}
                    <FormControl mb={3}>
                      <FormLabel>Change Status</FormLabel>
                      <Select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        placeholder="Select next status"
                      >
                        {getNextStatusOptions(accidentDetails.status).map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Action Type (only show for RepairApproved) */}
                    {showActionTypeField && (
                      <FormControl mb={3}>
                        <FormLabel>Action Type</FormLabel>
                        <Select
                          value={actionType}
                          onChange={(e) => setActionType(e.target.value)}
                          placeholder="Select action"
                        >
                          <option value="0">💰 Refund Contracts</option>
                          <option value="1">🔄 Replace Vehicles</option>
                          <option value="2">🛠️ Repair Only</option>
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                )}

                {/* Vehicle Information */}
                <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
                  <Text fontWeight="bold" fontSize="lg" mb={3}>Vehicle Information</Text>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <Box>
                      <Text><strong>License Plate:</strong> {accidentDetails.licensePlate}</Text>
                      <Text><strong>Location:</strong> {accidentDetails.location || 'Not specified'}</Text>
                    </Box>
                    <Box>
                      <Text><strong>Contract ID:</strong> {accidentDetails.contractId ? accidentDetails.contractId : 'N/A'}</Text>
                      <Text><strong>Staff:</strong> {accidentDetails.staffName || 'Not specified'}</Text>
                    </Box>
                  </Grid>
                </Box>

                {/* Description */}
                <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
                  <Text fontWeight="bold" fontSize="lg" mb={3}>Description</Text>
                  <Text>{accidentDetails.description || 'No description provided'}</Text>
                </Box>
              </VStack>

              {/* Right Column: Image + Summary */}
              <VStack spacing={4} align="stretch" flex={1}>
                {/* Accident Image */}
                {accidentDetails.imageUrl && (
                  <Box border="1px" borderColor="gray.200" borderRadius="md">
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
                    <Text><strong>Report Type:</strong> {accidentDetails.contractId ? 'Contract Issue' : 'Vehicle Issue'}</Text>
                    <Text><strong>Reported At:</strong> {formatDate(accidentDetails.reportedAt)}</Text>
                  </Grid>
                </Box>
              </VStack>
            </HStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} onClick={handleClose}>
            Close
          </Button>
          {/* UPDATE BUTTON FOR ADMINS */}
          {isAdmin && accidentDetails && (
            <Button
              colorScheme="blue"
              onClick={handleAccidentUpdate}
              isLoading={updating}
              isDisabled={!selectedStatus || selectedStatus === accidentDetails.status.toString()}
            >
              Apply Resolution
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}