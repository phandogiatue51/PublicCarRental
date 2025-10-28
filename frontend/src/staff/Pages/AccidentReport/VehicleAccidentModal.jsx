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
  FormControl, HStack,
  FormLabel,
  Textarea,
  Input,
  VStack,
  Text,
  Image,
  Box,
  useToast, Badge,
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
          description: 'Vehicle issue has been submitted successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        onSuccess();
        handleClose();
      } else {
        setError(result.message || 'Failed to submit vehicle issue');
      }
    } catch (err) {
      console.error('Error submitting vehicle issue:', err);
      setError('Failed to submit vehicle issue. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to submit vehicle issue',
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
  const vehicleStatusMap = [
    "ToBeRented",    // 0
    "Renting",       // 1
    "Charging",      // 2
    "ToBeCheckup",   // 3
    "InMaintenance", // 4
    "Available"      // 5
  ];

  const getVehicleStatusText = (status) => {
    const statusText = vehicleStatusMap[status] || "Unknown";
    return statusText.replace(/([A-Z])/g, ' $1').trim(); // Convert "ToBeRented" to "To Be Rented"
  };

  const getVehicleStatusColor = (status) => {
    switch (status) {
      case 0: return "orange";    // ToBeRented
      case 1: return "blue";      // Renting
      case 2: return "yellow";    // Charging
      case 3: return "purple";    // ToBeCheckup
      case 4: return "red";       // InMaintenance
      case 5: return "green";     // Available
      default: return "gray";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Report Vehicle Issue</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <HStack spacing={6} align="start">
            {/* Left Column: Vehicle Info and Description */}
            <VStack spacing={4} align="stretch" flex={1}>
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
                  <Text>
                    Status: <Badge colorScheme={getVehicleStatusColor(selectedVehicle.status)}>
                      {getVehicleStatusText(selectedVehicle.status)}
                    </Badge>
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
                <FormLabel>Accident Description (Optional)</FormLabel>
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
            isDisabled={!selectedVehicleId || !image}
            loadingText="Submitting..."
          >
            Report Issue
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default VehicleAccidentModal;