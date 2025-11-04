import { useState, useEffect } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, VStack, FormControl, FormLabel, Select, Text, Alert, AlertIcon,
    Box, Spinner
} from '@chakra-ui/react';
import { accidentAPI, modelAPI } from '../../../../services/api';

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
        try {
            const mockModels = modelAPI.getAll();        
            setAvailableModels(mockModels);
        } catch (err) {
            setError('Failed to load available models');
        } finally {
            setFetchingModels(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedModel || !contract) return;

        setLoading(true);
        setError('');

        try {
            const result = await accidentAPI.manualModelChange(contract.contractId, selectedModel);
            
            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.message || 'Failed to change vehicle model');
            }
        } catch (err) {
            setError('Failed to change vehicle model');
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
                    <VStack spacing={4}>
                        <Box>
                            <Text fontWeight="bold">Contract #{contract?.contractId}</Text>
                            <Text fontSize="sm" color="gray.600">
                                Renter: {contract?.renterName}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                                Current Vehicle: #{contract?.currentVehicleId}
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
                                    {availableModels.map((model) => (
                                        <option key={model.id} value={model.id}>
                                            {model.name} ({model.price})
                                        </option>
                                    ))}
                                </Select>
                            )}
                        </FormControl>

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
                        isDisabled={!selectedModel || fetchingModels}
                    >
                        Change Model
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}