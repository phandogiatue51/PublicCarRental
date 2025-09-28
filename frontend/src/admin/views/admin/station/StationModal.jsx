/* eslint-disable */

import {
  Modal,  ModalOverlay,  ModalContent,  ModalHeader,  ModalFooter,  ModalBody,  ModalCloseButton,  Button,  FormControl,  FormLabel,
  Input,  useToast,  VStack,  HStack,  Text,  NumberInput,  NumberInputField,  NumberInputStepper,  NumberIncrementStepper,
  NumberDecrementStepper,  FormHelperText,  Alert,  AlertIcon,  AlertDescription
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { stationAPI } from '../../../../services/api';

export default function StationModal({ isOpen, onClose, onSuccess, station = null, isEdit = false }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingStation, setFetchingStation] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const toast = useToast();

  // Fetch station data when editing
  useEffect(() => {
    if (isOpen && isEdit && station?.stationId) {
      fetchStationData();
    } else if (isOpen && !isEdit) {
      // Reset form for add mode
      resetForm();
    }
  }, [isOpen, isEdit, station?.stationId]);

  const fetchStationData = async () => {
    try {
      setFetchingStation(true);
      const stationData = await stationAPI.getById(station.stationId);
      setName(stationData.name || '');
      setAddress(stationData.address || '');
      setLatitude(stationData.latitude || 0);
      setLongitude(stationData.longitude || 0);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch station data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setFetchingStation(false);
    }
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setLatitude(0);
    setLongitude(0);
    setValidationErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!name.trim()) {
      errors.name = 'Station name is required';
    }

    if (!address.trim()) {
      errors.address = 'Address is required';
    }

    if (latitude === 0 && longitude === 0) {
      errors.coordinates = 'Please provide valid coordinates';
    }

    if (latitude < -90 || latitude > 90) {
      errors.latitude = 'Latitude must be between -90 and 90';
    }

    if (longitude < -180 || longitude > 180) {
      errors.longitude = 'Longitude must be between -180 and 180';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const stationData = {
        name: name.trim(),
        address: address.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      };
      
      if (isEdit) {
        const response = await stationAPI.update(station.stationId, stationData);
        toast({
          title: 'Success',
          description: response.message || 'Station updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const response = await stationAPI.create(stationData);
        toast({
          title: 'Success',
          description: response.message || 'Station created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      onSuccess();
      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isEdit ? 'update' : 'create'} station`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setFetchingStation(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isEdit ? 'Edit Station' : 'Add New Station'}</ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              {/* Station Name */}
              <FormControl isRequired isInvalid={validationErrors.name}>
                <FormLabel>Station Name</FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={fetchingStation ? "Loading station data..." : "Enter station name"}
                  maxLength={100}
                  isDisabled={fetchingStation}
                />
                {validationErrors.name && (
                  <FormHelperText color="red.500">{validationErrors.name}</FormHelperText>
                )}
              </FormControl>

              {/* Address */}
              <FormControl isRequired isInvalid={validationErrors.address}>
                <FormLabel>Address</FormLabel>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter station address"
                  isDisabled={fetchingStation}
                />
                {validationErrors.address && (
                  <FormHelperText color="red.500">{validationErrors.address}</FormHelperText>
                )}
              </FormControl>

              {/* Coordinates */}
              <Text fontSize="md" fontWeight="semibold" color="gray.600">
                Coordinates
              </Text>
              
              <HStack spacing={4} width="100%">
                <FormControl isRequired isInvalid={validationErrors.latitude}>
                  <FormLabel>Latitude</FormLabel>
                  <NumberInput
                    value={latitude}
                    onChange={(value) => setLatitude(parseFloat(value) || 0)}
                    min={-90}
                    max={90}
                    step={0.0001}
                    precision={4}
                    isDisabled={fetchingStation}
                  >
                    <NumberInputField placeholder="0.0000" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  {validationErrors.latitude && (
                    <FormHelperText color="red.500">{validationErrors.latitude}</FormHelperText>
                  )}
                </FormControl>

                <FormControl isRequired isInvalid={validationErrors.longitude}>
                  <FormLabel>Longitude</FormLabel>
                  <NumberInput
                    value={longitude}
                    onChange={(value) => setLongitude(parseFloat(value) || 0)}
                    min={-180}
                    max={180}
                    step={0.0001}
                    precision={4}
                    isDisabled={fetchingStation}
                  >
                    <NumberInputField placeholder="0.0000" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  {validationErrors.longitude && (
                    <FormHelperText color="red.500">{validationErrors.longitude}</FormHelperText>
                  )}
                </FormControl>
              </HStack>

              {validationErrors.coordinates && (
                <Alert status="error" size="sm">
                  <AlertIcon />
                  <AlertDescription>{validationErrors.coordinates}</AlertDescription>
                </Alert>
              )}

              {/* Help Text */}
              <Alert status="info" size="sm">
                <AlertIcon />
                <AlertDescription>
                  Enter the exact coordinates for this station. You can find coordinates using Google Maps or other mapping services.
                </AlertDescription>
              </Alert>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose} disabled={loading || fetchingStation}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              type="submit" 
              isLoading={loading}
              loadingText={isEdit ? 'Updating...' : 'Creating...'}
              isDisabled={fetchingStation}
            >
              {fetchingStation ? 'Loading...' : (isEdit ? 'Update' : 'Create')} Station
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
