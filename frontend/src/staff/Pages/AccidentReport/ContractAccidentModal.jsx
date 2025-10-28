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
  AlertIcon,
  Select,
} from '@chakra-ui/react';
import { accidentAPI, contractAPI } from '../../../services/api';

const ContractAccidentModal = ({ 
  isOpen, 
  onClose, 
  onSuccess 
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
    if (isOpen && stationId) {
      fetchContracts();
    }
  }, [isOpen, stationId]);

  const fetchContracts = async () => {
    setFetchingContracts(true);
    try {
      // Filter contracts by stationId and only show active/confirmed contracts
      const response = await contractAPI.filter({ 
        stationId,
        status: 1 // Active contracts only, adjust as needed
      });
      console.log('Fetched contracts for station:', stationId, response);
      setContracts(response || []);
    } catch (err) {
      console.error('Error fetching contracts:', err);
      setError('Failed to load contracts');
      toast({
        title: 'Error',
        description: 'Failed to load contracts from this station',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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
          description: 'Contract accident report has been submitted successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        onSuccess();
        handleClose();
      } else {
        setError(result.message || 'Failed to submit accident report');
      }
    } catch (err) {
      console.error('Error submitting accident report:', err);
      setError('Failed to submit accident report. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to submit accident report',
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Report Contract Accident</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Select Contract</FormLabel>
              <Select
                value={selectedContractId}
                onChange={(e) => setSelectedContractId(e.target.value)}
                placeholder={fetchingContracts ? "Loading contracts..." : "Choose a contract"}
                isDisabled={fetchingContracts}
              >
                {contracts.map(contract => (
                  <option key={contract.contractId} value={contract.contractId}>
                    Contract #{contract.contractId} - {contract.vehicleName} ({contract.licensePlate})
                  </option>
                ))}
              </Select>
              {contracts.length === 0 && !fetchingContracts && (
                <Text fontSize="sm" color="gray.500" mt={1}>
                  No contracts found at this station
                </Text>
              )}
            </FormControl>

            {selectedContract && (
              <Box p={3} bg="gray.50" borderRadius="md">
                <Text fontWeight="bold">Contract Details</Text>
                <Text>Contract ID: {selectedContract.contractId}</Text>
                <Text>Vehicle: {selectedContract.vehicleName} ({selectedContract.licensePlate})</Text>
                <Text>Renter: {selectedContract.renterName}</Text>
                <Text>Start: {new Date(selectedContract.startTime).toLocaleDateString()}</Text>
                <Text>End: {new Date(selectedContract.endTime).toLocaleDateString()}</Text>
                <Text>Status: {selectedContract.status}</Text>
              </Box>
            )}

            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <FormControl>
              <FormLabel>Accident Description (Optional)</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the accident details, damage, location, etc."
                size="sm"
                resize="vertical"
                rows={3}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Accident Image</FormLabel>
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
                  objectFit="contain"
                  borderRadius="md"
                  border="1px"
                  borderColor="gray.200"
                />
              </Box>
            )}
          </VStack>
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
            Report Accident
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ContractAccidentModal;