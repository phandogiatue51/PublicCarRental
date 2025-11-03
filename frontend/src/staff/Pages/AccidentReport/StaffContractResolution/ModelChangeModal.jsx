import { useState } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, VStack, FormControl, FormLabel, Select, Text, Alert, AlertIcon
} from '@chakra-ui/react';
import { accidentAPI } from '../../../../services/api';

export default function ModelChangeModal({ isOpen, onClose, contract, onSuccess }) {
    const [selectedModel, setSelectedModel] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!selectedModel || !contract) return;

        setLoading(true);
        setError('');

        try {
            // You would call an API to manually change the vehicle model
            // const result = await accidentAPI.manualModelChange(contract.contractId, selectedModel);
            
            // For now, just simulate success
            setTimeout(() => {
                setLoading(false);
                if (onSuccess) onSuccess();
                onClose();
            }, 1000);

        } catch (err) {
            setError('Failed to change vehicle model');
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
                        <Text>
                            Manual model change for Contract #{contract?.contractId}
                        </Text>

                        <FormControl>
                            <FormLabel>Select New Model</FormLabel>
                            <Select 
                                placeholder="Choose vehicle model"
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                            >
                                <option value="model1">Model A - Similar Features</option>
                                <option value="model2">Model B - Premium</option>
                                <option value="model3">Model C - Economy</option>
                            </Select>
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
                        isDisabled={!selectedModel}
                    >
                        Change Model
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}