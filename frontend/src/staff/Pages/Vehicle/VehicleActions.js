import React, { useState } from 'react';
import { Button, Flex, Icon, Tooltip, Modal, ModalOverlay, ModalContent, 
    ModalHeader, ModalBody, ModalFooter, ModalCloseButton, VStack, 
    HStack, Text, Progress, useToast
} from '@chakra-ui/react';
import { MdReportProblem, MdCheckCircle, MdBatteryChargingFull, MdBatteryFull, MdBattery90, MdBattery80, MdBattery60, MdBattery50 } from 'react-icons/md';
import { vehicleAPI } from '../../../services/api';

const VehicleActions = ({
    vehicle,
    onUpdate,
    onReport,
    onActivate,
    onFinishCharging
}) => {
    const [isFinishChargingModalOpen, setIsFinishChargingModalOpen] = useState(false);
    const [selectedBatteryLevel, setSelectedBatteryLevel] = useState(100);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const canUpdateBattery = [0, 3, 5].includes(vehicle.status); // ToBeRented, ToBeCheckup, Available
    const canActivate = vehicle.status === 0; // ToBeRented -> Available
    const canFinishCharging = vehicle.status === 2; // Charging -> Available

    const handleFinishCharging = async () => {
        try {
            setLoading(true);
            
            await vehicleAPI.update(vehicle.vehicleId, {
                licensePlate: vehicle.licensePlate,
                batteryLevel: selectedBatteryLevel,
                status: 5, // Available
                stationId: vehicle.stationId,
                modelId: vehicle.modelId
            });

            toast({
                title: 'Success',
                description: `Battery set to ${selectedBatteryLevel}% and vehicle is now Available`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onFinishCharging();
            setIsFinishChargingModalOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to finish charging',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const getBatteryColor = (level) => {
        if (level >= 80) return 'green';
        if (level >= 50) return 'yellow';
        if (level >= 20) return 'orange';
        return 'red';
    };

    const quickBatteryLevels = [100, 90, 80, 60, 50];

    return (
        <>
            <Flex align="center" gap={2} wrap="wrap">
                {/* Update Battery Button - Shows update modal */}
                {canUpdateBattery && (
                    <Tooltip label="Update battery and start charging">
                        <Button
                            size="sm"
                            variant="outline"
                            colorScheme="blue"
                            leftIcon={<Icon as={MdBatteryChargingFull} />}
                            onClick={() => onUpdate(vehicle)}
                        >
                            Charge
                        </Button>
                    </Tooltip>
                )}

                {/* Finish Charging Button - Opens battery selection modal */}
                {canFinishCharging && (
                    <Tooltip label="Finish charging and set battery level">
                        <Button
                            size="sm"
                            variant="outline"
                            colorScheme="green"
                            leftIcon={<Icon as={MdCheckCircle} />}
                            onClick={() => setIsFinishChargingModalOpen(true)}
                        >
                            Finish Charging
                        </Button>
                    </Tooltip>
                )}

                {/* Activate Button - Turns ToBeRented to Available */}
                {canActivate && (
                    <Tooltip label="Make vehicle available for rental">
                        <Button
                            size="sm"
                            variant="outline"
                            colorScheme="green"
                            leftIcon={<Icon as={MdCheckCircle} />}
                            onClick={() => onActivate(vehicle)}
                        >
                            Active
                        </Button>
                    </Tooltip>
                )}

                {/* Report Button */}
                {(vehicle.status === 1 || vehicle.status === 3 || vehicle.status === 5) && (
                    <Tooltip label="Report accident or issue">
                        <Button
                            size="sm"
                            variant="outline"
                            colorScheme="red"
                            leftIcon={<Icon as={MdReportProblem} />}
                            onClick={() => onReport(vehicle)}
                        >
                            Report
                        </Button>
                    </Tooltip>
                )}
            </Flex>

            {/* Finish Charging Modal */}
            <Modal isOpen={isFinishChargingModalOpen} onClose={() => setIsFinishChargingModalOpen(false)} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Finish Charging</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Text fontWeight="bold">
                                Vehicle: {vehicle.licensePlate} - {vehicle.modelName}
                            </Text>
                            
                            <Text>Select battery level after charging:</Text>
                            
                            {/* Quick battery buttons */}
                            <HStack spacing={2} justify="center">
                                {quickBatteryLevels.map(level => (
                                    <Button
                                        key={level}
                                        size="sm"
                                        variant={selectedBatteryLevel === level ? "solid" : "outline"}
                                        colorScheme={getBatteryColor(level)}
                                        leftIcon={<Icon as={
                                            level === 100 ? MdBatteryFull :
                                            level === 90 ? MdBattery90 :
                                            level === 80 ? MdBattery80 :
                                            level === 60 ? MdBattery60 :
                                            MdBattery50
                                        } />}
                                        onClick={() => setSelectedBatteryLevel(level)}
                                    >
                                        {level}%
                                    </Button>
                                ))}
                            </HStack>

                            {/* Custom battery input */}
                            <VStack spacing={2} align="start">
                                <Text fontSize="sm">Or enter custom level:</Text>
                                <HStack spacing={2}>
                                    <Button
                                        size="xs"
                                        onClick={() => setSelectedBatteryLevel(prev => Math.max(0, prev - 1))}
                                    >
                                        -
                                    </Button>
                                    <Text minW="40px" textAlign="center" fontWeight="bold">
                                        {selectedBatteryLevel}%
                                    </Text>
                                    <Button
                                        size="xs"
                                        onClick={() => setSelectedBatteryLevel(prev => Math.min(100, prev + 1))}
                                    >
                                        +
                                    </Button>
                                </HStack>
                            </VStack>

                            {/* Battery preview */}
                            <VStack spacing={2} align="start">
                                <Text fontSize="sm">Preview:</Text>
                                <Progress
                                    value={selectedBatteryLevel}
                                    size="sm"
                                    width="100%"
                                    colorScheme={getBatteryColor(selectedBatteryLevel)}
                                    borderRadius="md"
                                />
                                <Text fontSize="sm" color="gray.600">
                                    Vehicle will be set to: <strong>Available</strong>
                                </Text>
                            </VStack>
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={() => setIsFinishChargingModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="green"
                            onClick={handleFinishCharging}
                            isLoading={loading}
                            loadingText="Updating..."
                        >
                            Confirm {selectedBatteryLevel}%
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default VehicleActions;