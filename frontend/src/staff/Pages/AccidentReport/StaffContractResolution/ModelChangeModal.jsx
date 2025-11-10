import { useState, useEffect } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, VStack, FormControl, FormLabel, Select, Text, Alert, AlertIcon,
    Box, Spinner
} from '@chakra-ui/react';
import { accidentAPI } from '../../../../services/api';

export default function ModelChangeModal({ isOpen, onClose, contract, onSuccess }) {
    const [selectedModel, setSelectedModel] = useState('');
    const [availableModels, setAvailableModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingModels, setFetchingModels] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && contract) {
            fetchAvailableModels();
        }
    }, [isOpen, contract]);

    const fetchAvailableModels = async () => {
        setFetchingModels(true);
        setError('');
        try {
            const stationId = localStorage.getItem('stationId');
            if (!stationId) {
                throw new Error('Station ID not found in localStorage');
            }

            const startTime = contract.startDate || contract.startTime;
            const endTime = contract.endDate || contract.endTime;

            if (!startTime || !endTime) {
                throw new Error('Contract dates are missing');
            }

            const models = await accidentAPI.getAvailableCounts(
                parseInt(stationId),
                startTime,
                endTime
            );

            console.log('Available models:', models);
            setAvailableModels(Array.isArray(models) ? models : []);
        } catch (err) {
            console.error('Error fetching models:', err);
            setError('Failed to load available models: ' + (err.message || 'Unknown error'));
            setAvailableModels([]);
        } finally {
            setFetchingModels(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedModel || !contract) return;

        setLoading(true);
        setError('');

        try {
            const result = await accidentAPI.manualModelChange(contract.contractId, parseInt(selectedModel));

            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.message || 'Failed to change vehicle model');
            }
        } catch (err) {
            setError('Failed to change vehicle model: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Change Vehicle Model</ModalHeader>
                <ModalBody>
                    <VStack spacing={4} align="start">
                        <Box textAlign="left" w="100%">
                            <Text fontWeight="bold">Contract #{contract?.contractId}</Text>
                            <Text fontSize="sm" color="gray.600">
                                Renter: {contract?.evRenterName}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                                Current Vehicle: #{contract?.vehicleLicensePlate} - {contract?.modelName}
                            </Text>
                        </Box>

                        <FormControl>
                            <FormLabel>Select New Model</FormLabel>
                            {fetchingModels ? (
                                <Box textAlign="center" py={4}>
                                    <Spinner size="sm" />
                                    <Text mt={2} fontSize="sm">Loading available models...</Text>
                                </Box>
                            ) : (
                                <Select
                                    placeholder="Choose vehicle model"
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                >
                                    {availableModels
                                        .filter(model => model.count > 0) 
                                        .map((model) => (
                                            <option key={model.modelId} value={model.modelId}>
                                                {model.modelName} ({model.brand}) - Available: {model.count}
                                            </option>
                                        ))
                                    }
                                </Select>
                            )}
                        </FormControl>

                        {availableModels.length === 0 && !fetchingModels && (
                            <Alert status="info">
                                <AlertIcon />
                                No available models found for the selected dates.
                            </Alert>
                        )}

                        {error && (
                            <Alert status="error">
                                <AlertIcon />
                                {error}
                            </Alert>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="outline" mr={3} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={handleSubmit}
                        isLoading={loading}
                        isDisabled={!selectedModel || fetchingModels || availableModels.length === 0}
                    >
                        Change Model
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}