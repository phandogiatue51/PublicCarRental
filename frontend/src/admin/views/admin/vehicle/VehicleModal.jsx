/* eslint-disable */

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  Box, Text, VStack, HStack, FormControl, FormLabel, Input, Select, Button, useToast, Spinner
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { vehicleAPI, stationAPI, modelAPI } from '../../../../services/api';

export default function VehicleModal({ isOpen, onClose, onSuccess, vehicle = null, isEdit = false }) {
  const [licensePlate, setLicensePlate] = useState('');
  const [batteryLevel, setBatteryLevel] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [stationId, setStationId] = useState('');
  const [modelId, setModelId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingVehicle, setFetchingVehicle] = useState(false);
  const [stations, setStations] = useState([]);
  const [models, setModels] = useState([]);
  const toast = useToast();

  // Fetch vehicle data when editing
  useEffect(() => {
    if (isOpen && isEdit && vehicle?.vehicleId) {
      fetchVehicleData();
    } else if (isOpen && !isEdit) {
      // Reset form for add mode
      resetForm();
    }
  }, [isOpen, isEdit, vehicle?.vehicleId]);

  // Fetch stations and models
  useEffect(() => {
    if (isOpen) {
      fetchStations();
      fetchModels();
    }
  }, [isOpen]);

  const fetchVehicleData = async () => {
    try {
      setFetchingVehicle(true);
      const vehicleData = await vehicleAPI.getById(vehicle.vehicleId);
      setLicensePlate(vehicleData.licensePlate || '');
      setBatteryLevel(vehicleData.batteryLevel || '');
      setPricePerHour(vehicleData.pricePerHour || '');
      setStationId(vehicleData.stationId || '');
      setModelId(vehicleData.modelId || '');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch vehicle data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setFetchingVehicle(false);
    }
  };

  const fetchStations = async () => {
    try {
      const response = await stationAPI.getAll();
      setStations(response || []);
    } catch (err) {
      console.error('Error fetching stations:', err);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await modelAPI.getAll();
      setModels(response || []);
    } catch (err) {
      console.error('Error fetching models:', err);
    }
  };

  const resetForm = () => {
    setLicensePlate('');
    setBatteryLevel('');
    setPricePerHour('');
    setStationId('');
    setModelId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!licensePlate.trim()) {
      toast({
        title: 'Validation Error',
        description: 'License plate is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!batteryLevel || batteryLevel < 0 || batteryLevel > 100) {
      toast({
        title: 'Validation Error',
        description: 'Battery level must be between 0 and 100',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!pricePerHour || pricePerHour <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Price per hour must be greater than 0',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!stationId) {
      toast({
        title: 'Validation Error',
        description: 'Station is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!modelId) {
      toast({
        title: 'Validation Error',
        description: 'Model is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      
      const vehicleData = {
        licensePlate: licensePlate.trim(),
        batteryLevel: parseInt(batteryLevel),
        pricePerHour: parseInt(pricePerHour),
        stationId: parseInt(stationId),
        modelId: parseInt(modelId),
      };
      
      if (isEdit) {
        const response = await vehicleAPI.update(vehicle.vehicleId, vehicleData);
        toast({
          title: 'Success',
          description: response.message || 'Vehicle updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const response = await vehicleAPI.create(vehicleData);
        toast({
          title: 'Success',
          description: response.message || 'Vehicle created successfully',
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
        description: error.message || `Failed to ${isEdit ? 'update' : 'create'} vehicle`,
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
    setFetchingVehicle(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>License Plate</FormLabel>
                <Input
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  placeholder={fetchingVehicle ? "Loading vehicle data..." : "Enter license plate"}
                  maxLength={20}
                  isDisabled={fetchingVehicle}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Battery Level (%)</FormLabel>
                <Input
                  type="number"
                  value={batteryLevel}
                  onChange={(e) => setBatteryLevel(e.target.value)}
                  placeholder="Enter battery level (0-100)"
                  min="0"
                  max="100"
                  isDisabled={fetchingVehicle}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Price per Hour (VND)</FormLabel>
                <Input
                  type="number"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  placeholder="Enter price per hour"
                  min="1"
                  isDisabled={fetchingVehicle}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Station</FormLabel>
                <Select
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                  placeholder="Select station"
                  isDisabled={fetchingVehicle}
                >
                  {stations.map((station) => (
                    <option key={station.stationId} value={station.stationId}>
                      {station.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Model</FormLabel>
                <Select
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  placeholder="Select model"
                  isDisabled={fetchingVehicle}
                >
                  {models.map((model) => (
                    <option key={model.modelId} value={model.modelId}>
                      {model.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose} disabled={loading || fetchingVehicle}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              type="submit" 
              isLoading={loading}
              loadingText={isEdit ? 'Updating...' : 'Creating...'}
              isDisabled={fetchingVehicle}
            >
              {fetchingVehicle ? 'Loading...' : (isEdit ? 'Update' : 'Create')} Vehicle
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
