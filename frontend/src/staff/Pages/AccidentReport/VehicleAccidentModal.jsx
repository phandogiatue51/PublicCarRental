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
import { accidentAPI, vehicleAPI } from '../../../services/api';

const VehicleAccidentModal = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingVehicles, setFetchingVehicles] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const staffId = parseInt(localStorage.getItem('staffId'));
  const stationId = parseInt(localStorage.getItem('stationId'));

  useEffect(() => {
    if (isOpen && stationId) {
      fetchVehicles();
    }
  }, [isOpen, stationId]);

  const fetchVehicles = async () => {
    setFetchingVehicles(true);
    try {
      const response = await vehicleAPI.filter({ stationId });
      console.log('Fetched vehicles for station:', stationId, response);
      setVehicles(response || []);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('Failed to load vehicles');
      toast({
        title: 'Error',
        description: 'Failed to load vehicles from this station',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setFetchingVehicles(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ADD THE MISSING handleSubmit FUNCTION
  const handleSubmit = async () => {
    if (!selectedVehicleId) {
      setError('Please select a vehicle');
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
      formData.append('VehicleId', selectedVehicleId);
      formData.append('StaffId', staffId);
      formData.append('Description', description || '');
      formData.append('ImageUrl', image);

      const result = await accidentAPI.createVehicleAccident(formData);
      
      if (result.success) {
        toast({
          title: 'Accident Reported',
          description: 'Vehicle accident report has been submitted successfully.',
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
  console.log('Closing modal, calling parent onClose...');
  setSelectedVehicleId('');
  setDescription('');
  setImage(null);
  setImagePreview(null);
  setError('');
  setLoading(false);
  onClose();
};

  const getSelectedVehicle = () => {
    return vehicles.find(v => v.vehicleId === parseInt(selectedVehicleId));
  };

  const selectedVehicle = getSelectedVehicle();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Report Vehicle Accident</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Select Vehicle</FormLabel>
              <Select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                placeholder={fetchingVehicles ? "Loading vehicles..." : "Choose a vehicle"}
                isDisabled={fetchingVehicles}
              >
                {vehicles.map(vehicle => (
                  <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                    {vehicle.modelName} - {vehicle.licensePlate} (ID: {vehicle.vehicleId})
                  </option>
                ))}
              </Select>
              {vehicles.length === 0 && !fetchingVehicles && (
                <Text fontSize="sm" color="gray.500" mt={1}>
                  No vehicles found at this station
                </Text>
              )}
            </FormControl>

            {selectedVehicle && (
              <Box p={3} bg="gray.50" borderRadius="md">
                <Text fontWeight="bold">Vehicle Details</Text>
                <Text>Model: {selectedVehicle.modelName}</Text>
                <Text>License Plate: {selectedVehicle.licensePlate}</Text>
                <Text>Battery: {selectedVehicle.batteryLevel}%</Text>
                <Text>Status: {selectedVehicle.status}</Text>
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
            isDisabled={!selectedVehicleId || !image}
            loadingText="Submitting..."
          >
            Report Accident
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default VehicleAccidentModal;