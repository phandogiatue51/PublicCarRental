import { useState } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, VStack, FormControl, FormLabel, Textarea, Text, Alert, AlertIcon,
    NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper
} from '@chakra-ui/react';
import { accidentAPI } from '../../../../services/api';

export default function RefundProcessingModal({ isOpen, onClose, contract, onSuccess }) {
    const [refundAmount, setRefundAmount] = useState(0);
    const [refundReason, setRefundReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!refundReason || !contract) return;

        setLoading(true);
        setError('');

        try {
            // You would call an API to process refund
            // const result = await accidentAPI.processRefund(contract.contractId, refundAmount, refundReason);
            
            // For now, just simulate success
            setTimeout(() => {
                setLoading(false);
                if (onSuccess) onSuccess();
                onClose();
            }, 1000);

        } catch (err) {
            setError('Failed to process refund');
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Process Refund</ModalHeader>
                <ModalBody>
                    <VStack spacing={4}>
                        <Text>
                            Process refund for Contract #{contract?.contractId}
                        </Text>

                        <FormControl>
                            <FormLabel>Refund Amount</FormLabel>
                            <NumberInput 
                                value={refundAmount}
                                onChange={(value) => setRefundAmount(parseFloat(value) || 0)}
                                min={0}
                                precision={2}
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Refund Reason</FormLabel>
                            <Textarea 
                                placeholder="Explain why this refund is being processed..."
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                            />
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
                        colorScheme="orange" 
                        onClick={handleSubmit}
                        isLoading={loading}
                        isDisabled={!refundReason}
                    >
                        Process Refund
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}