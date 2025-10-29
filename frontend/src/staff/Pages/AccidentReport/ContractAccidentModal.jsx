import React, { useState, useEffect } from 'react';
import {
  Modal, HStack,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Textarea,
  Input,
  VStack,
  Text,
  Image,
  Box,
  useToast,
  Alert,
  AlertIcon, Badge,
  Select,
} from '@chakra-ui/react';
import { accidentAPI, contractAPI } from '../../../services/api';

const ContractAccidentModal = ({
  isOpen,
  onClose,
  onSuccess,
  contract
}) => {
  const [contracts, setContracts] = useState([]);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingContracts, setFetchingContracts] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const staffId = parseInt(localStorage.getItem('staffId'));
  const stationId = parseInt(localStorage.getItem('stationId'));

  useEffect(() => {
    if (isOpen && contract) {
      setSelectedContractId(contract.contractId);
    } else if (isOpen && stationId) {
      fetchContracts();
    }
  }, [isOpen, contract, stationId]);

  const fetchContracts = async () => {
    setFetchingContracts(true);
    try {
      const response = await contractAPI.filter({ stationId });

      // Filter for contracts where accidents can be reported:
      // - Confirmed (4): Accident before rental starts (vehicle damage at station)
      // - Active (1): Accident during rental
      // - Completed (2): Accident discovered after return
      const eligibleContracts = response.filter(contract =>
        contract.status === 1 || // Active - during rental
        contract.status === 4 || // Confirmed - before rental starts  
        contract.status === 2    // Completed - damage found after return
      );

      console.log('Eligible contracts for accident reporting:', eligibleContracts);
      setContracts(eligibleContracts || []);
    } catch (err) {
      console.error('Error fetching contracts:', err);
      setError('Failed to load contracts');
    } finally {
      setFetchingContracts(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file',
          description: 'Please select an image file',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedContractId) {
      setError('Please select a contract');
      return;
    }

    if (!image) {
      setError('Accident image is required');
      return;
    }

    if (!staffId) {
      setError('Staff ID not found. Please log in again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('ContractId', selectedContractId);
      formData.append('StaffId', staffId);
      formData.append('Description', description || '');
      formData.append('ImageUrl', image);

      const result = await accidentAPI.createContractAccident(formData);

      if (result.success) {
        toast({
          title: 'Accident Reported',
          description: 'Contract issue has been submitted successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        onSuccess();
        handleClose();
      } else {
        setError(result.message || 'Failed to submit contract issue');
      }
    } catch (err) {
      console.error('Error submitting contract issue', err);
      setError('Failed to submit contract issue. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to submit contract issue',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedContractId('');
    setDescription('');
    setImage(null);
    setImagePreview(null);
    setError('');
    setLoading(false);
    onClose();
  };

  const getSelectedContract = () => {
    return contracts.find(c => c.contractId === parseInt(selectedContractId));
  };

  const selectedContract = getSelectedContract();

  const statusMap = [
    "ToBeConfirmed", // 0
    "Active",        // 1
    "Completed",     // 2
    "Cancelled",     // 3
    "Confirmed"      // 4
  ];

  const statusStyles = {
    ToBeConfirmed: { label: "To Be Confirmed", color: "#FFA500" }, // orange
    Active: { label: "Active", color: "#28a745" }, // green
    Completed: { label: "Completed", color: "#007bff" }, // blue
    Cancelled: { label: "Cancelled", color: "#dc3545" }, // red
    Confirmed: { label: "Confirmed", color: "#6f42c1" } // purple
  };

  const getStatusInfo = (status) => {
    const statusName = statusMap[status] || "Unknown";
    return statusStyles[statusName] || { label: "Unknown", color: "gray" };
  };

  const statusInfo = selectedContract ? getStatusInfo(selectedContract.status) : { label: "Unknown", color: "gray" };

  const getStatusColor = (status) => {
    switch (status) {
      case 0: return "orange";    // ToBeConfirmed
      case 1: return "green";     // Active
      case 2: return "blue";      // Completed
      case 3: return "red";       // Cancelled
      case 4: return "purple";    // Confirmed
      default: return "gray";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Report Contract Issue</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <HStack spacing={6} align="start">
            <VStack spacing={4} align="stretch" flex={1}>
              <FormControl isRequired>
                <FormLabel>Select Contract</FormLabel>
                <Select
                  value={selectedContractId}
                  onChange={(e) => setSelectedContractId(e.target.value)}
                  placeholder={
                    contract
                      ? `Contract #${contract.contractId} - ${contract.vehicleLicensePlate}`
                      : fetchingContracts
                        ? "Loading contracts..."
                        : "Choose a contract"
                  }
                  isDisabled={!!contract || fetchingContracts} // Disable if contract is passed
                >
                  {contracts.map(contract => (
                    <option key={contract.contractId} value={contract.contractId}>
                      Contract #{contract.contractId} - License #{contract.vehicleLicensePlate}
                    </option>
                  ))}
                </Select>

                {contracts.length === 0 && !fetchingContracts && !contract && (
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    No contracts found at this station
                  </Text>
                )}
              </FormControl>

              {selectedContract && (
                <Box p={3} bg="gray.50" borderRadius="md">
                  <Text fontWeight="bold">Contract Details</Text>
                  <Text>Contract ID: {selectedContract.contractId}</Text>
                  <Text>Vehicle: {selectedContract.vehicleId} - #({selectedContract.vehicleLicensePlate})</Text>
                  <Text>Renter: {selectedContract.evRenterName}</Text>
                  <Text>Start Time: {new Date(selectedContract.startTime).toLocaleString()}</Text>
                  <Text>End Time: {new Date(selectedContract.endTime).toLocaleString()}</Text>
                  <Text>
                    Status: <Badge colorScheme={getStatusColor(selectedContract.status)}>{statusInfo.label}</Badge>
                  </Text>
                </Box>
              )}

              {error && (
                <Alert status="error">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              <FormControl>
                <FormLabel>Description (Optional)</FormLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue details, damage, etc."
                  size="sm"
                  resize="vertical"
                  rows={3}
                />
              </FormControl>
            </VStack>

            {/* Right Column: Image Upload and Preview */}
            <VStack spacing={4} align="stretch" flex={1}>
              <FormControl isRequired>
                <FormLabel>Image</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  size="sm"
                />
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Please upload a clear photo showing the damage (max 5MB)
                </Text>
              </FormControl>

              {imagePreview && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Image Preview:
                  </Text>
                  <Image
                    src={imagePreview}
                    alt="Accident preview"
                    maxH="200px"
                    maxW="100%"
                    objectFit="contain"
                    borderRadius="md"
                    border="1px"
                    borderColor="gray.200"
                  />
                </Box>
              )}
            </VStack>
          </HStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} onClick={handleClose} isDisabled={loading}>
            Cancel
          </Button>
          <Button
            colorScheme="red"
            onClick={handleSubmit}
            isLoading={loading}
            isDisabled={!selectedContractId || !image}
            loadingText="Submitting..."
          >
            Report Issue
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ContractAccidentModal;