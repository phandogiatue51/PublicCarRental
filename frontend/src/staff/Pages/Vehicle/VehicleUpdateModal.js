import React, { useState } from 'react';
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
  Input,
  VStack,
  Text,
  useToast,
  Progress
} from '@chakra-ui/react';
import { vehicleAPI } from '../../../services/api';

const VehicleUpdateModal = ({ isOpen, onClose, vehicle, onSuccess }) => {
  const [batteryLevel, setBatteryLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!batteryLevel || batteryLevel < 0 || batteryLevel > 100) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid battery level (0-100)',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);

      await vehicleAPI.update(vehicle.vehicleId, {
        licensePlate: vehicle.licensePlate,
        batteryLevel: parseInt(batteryLevel),
        status: 2, // Charging
        stationId: vehicle.stationId,
        modelId: vehicle.modelId
      });

      toast({
        title: 'Success',
        description: `Battery updated to ${batteryLevel}% and vehicle set to Charging`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onSuccess();
      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update vehicle',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setBatteryLevel('');
    onClose();
  };

  const getBatteryColor = (level) => {
    if (level >= 80) return 'green';
    if (level >= 50) return 'yellow';
    if (level >= 20) return 'orange';
    return 'red';
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Update Battery & Start Charging</ModalHeader>
        <ModalCloseButton />

        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              {vehicle && (
                <>
                  <Text fontWeight="bold">
                    Vehicle: {vehicle.licensePlate} - {vehicle.modelName}
                  </Text>

                  <FormControl isRequired>
                    <FormLabel>New Battery Level (%)</FormLabel>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={batteryLevel}
                      onChange={(e) => setBatteryLevel(e.target.value)}
                      placeholder="Enter battery level (0-100)"
                    />
                  </FormControl>

                  {batteryLevel && (
                    <FormControl>
                      <FormLabel>Preview:</FormLabel>
                      <VStack align="start" spacing={2}>
                        <Text fontSize="sm">{batteryLevel}%</Text>
                        <Progress
                          value={batteryLevel}
                          size="sm"
                          width="100%"
                          colorScheme={getBatteryColor(parseInt(batteryLevel))}
                          borderRadius="md"
                        />
                        <Text fontSize="sm" color="gray.600">
                          Vehicle status will be set to: <strong>Charging</strong>
                        </Text>
                      </VStack>
                    </FormControl>
                  )}
                </>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={loading}
              loadingText="Updating..."
            >
              Update & Start Charging
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default VehicleUpdateModal;