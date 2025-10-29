import React, { useState, useCallback, useEffect } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
    VStack, HStack, FormControl, FormLabel, Button, Text, Box, Icon,
    useToast, Slider, SliderTrack, SliderFilledTrack, SliderThumb,
    Spinner
} from '@chakra-ui/react';
import { MdBatteryChargingFull, MdUpdate } from 'react-icons/md';
import { vehicleAPI } from '../../../services/api';

const VehicleUpdateModal = ({
    isOpen,
    onClose,
    vehicle,
    onSuccess
}) => {
    const [batteryLevel, setBatteryLevel] = useState(vehicle?.batteryLevel || 0);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchingVehicle, setFetchingVehicle] = useState(false);
    const [vehicleData, setVehicleData] = useState(null);
    const toast = useToast();

    // Fetch complete vehicle data when modal opens
    useEffect(() => {
        if (isOpen && vehicle?.vehicleId) {
            fetchVehicleData();
        }
    }, [isOpen, vehicle?.vehicleId]);

    const fetchVehicleData = async () => {
        try {
            setFetchingVehicle(true);
            const response = await vehicleAPI.getById(vehicle.vehicleId);
            setVehicleData(response);
            setBatteryLevel(response.batteryLevel || 0);
        } catch (error) {
            console.error('Error fetching vehicle data:', error);
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

    // Handle modal close
    const handleClose = useCallback(() => {
        setBatteryLevel(vehicle?.batteryLevel || 0);
        setVehicleData(null);
        setIsLoading(false);
        setFetchingVehicle(false);
        onClose();
    }, [onClose, vehicle]);

    // Handle battery update - send complete vehicle data
    const handleUpdate = useCallback(async () => {
        if (!vehicleData) return;

        try {
            setIsLoading(true);

            // Send complete vehicle data with updated battery level
            const updateData = {
                licensePlate: vehicleData.licensePlate,
                batteryLevel: batteryLevel,
                pricePerHour: vehicleData.pricePerHour || vehicleData.rentalPrice,
                stationId: vehicleData.stationId,
                modelId: vehicleData.modelId,
                status: vehicleData.status
                // Include any other required fields from your DTO
            };

            const response = await vehicleAPI.update(vehicle.vehicleId, updateData);

            toast({
                title: 'Success',
                description: response.message || `Battery level updated to ${batteryLevel}%`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            if (onSuccess) {
                await onSuccess();
            }

            handleClose();
        } catch (error) {
            console.error('Error updating battery:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update battery level',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    }, [batteryLevel, vehicle, vehicleData, toast, onSuccess, handleClose]);

    // Get battery color based on level
    const getBatteryColor = (level) => {
        if (level >= 80) return 'green';
        if (level >= 50) return 'yellow';
        if (level >= 20) return 'orange';
        return 'red';
    };

    if (fetchingVehicle) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} size="sm" isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalBody py={8}>
                        <VStack spacing={4}>
                            <Spinner size="xl" color="blue.500" />
                            <Text>Loading vehicle data...</Text>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Icon as={MdBatteryChargingFull} color="blue.500" />
                        <Text>Update Battery Level</Text>
                    </Box>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <VStack spacing={6}>
                        <Box w="full">
                            <Text fontSize="lg" fontWeight="bold" textAlign="center" mb={2}>
                                Vehicle ID: {vehicle?.vehicleId}
                            </Text>
                             <Text fontSize="lg" fontWeight="bold" textAlign="center" mb={2}>
                                License Plate: {vehicleData?.licensePlate || vehicle?.licensePlate}
                            </Text>
                            <Text fontSize="sm" color="gray.600" textAlign="center">
                                Current: {vehicleData?.batteryLevel}% → New: {batteryLevel}%
                            </Text>
                        </Box>

                        <FormControl>
                            <FormLabel textAlign="center" mb={4}>
                                Battery Level: {batteryLevel}%
                            </FormLabel>
                            <Slider
                                value={batteryLevel}
                                onChange={setBatteryLevel}
                                min={0}
                                max={100}
                                step={1}
                                colorScheme={getBatteryColor(batteryLevel)}
                            >
                                <SliderTrack>
                                    <SliderFilledTrack />
                                </SliderTrack>
                                <SliderThumb boxSize={6}>
                                    <Box color={getBatteryColor(batteryLevel)} as={MdBatteryChargingFull} />
                                </SliderThumb>
                            </Slider>
                        </FormControl>

                        <HStack spacing={4} w="full" justify="center">
                            <Button
                                colorScheme="blue"
                                onClick={handleUpdate}
                                isDisabled={isLoading || batteryLevel === vehicleData?.batteryLevel || !vehicleData}
                                isLoading={isLoading}
                                loadingText="Updating..."
                                leftIcon={<Icon as={MdUpdate} />}
                            >
                                Update Battery
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                isDisabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </HStack>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default VehicleUpdateModal;