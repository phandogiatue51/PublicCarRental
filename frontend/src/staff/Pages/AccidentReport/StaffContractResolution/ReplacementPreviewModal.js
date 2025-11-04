import { useState, useEffect } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, VStack, Text, Box, Alert, AlertIcon, Spinner, 
    useToast
} from '@chakra-ui/react';
import { accidentAPI } from '../../../../services/api';

export default function ReplacementPreviewModal({ isOpen, onClose, contract, onSuccess }) {
    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [replacing, setReplacing] = useState(false);
    const [error, setError] = useState('');
    const toast = useToast();

    useEffect(() => {
        if (isOpen && contract) {
            fetchReplacementPreview();
        }
    }, [isOpen, contract]);

    const fetchReplacementPreview = async () => {
        if (!contract) return;
        
        setLoading(true);
        setError('');
        try {
            const data = await accidentAPI.previewReplacement(contract.contractId);
            setPreviewData(data);
        } catch (err) {
            console.error('Error fetching replacement preview:', err);
            setError('Failed to load replacement options');
        } finally {
            setLoading(false);
        }
    };

    const handleReplace = async () => {
        if (!previewData || !previewData.willBeReplaced) return;

        setReplacing(true);
        setError('');
        try {
            const result = await accidentAPI.replaceContract(
                contract.contractId,
                previewData.lockKey,
                previewData.lockToken
            );

            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.message || 'Failed to replace vehicle');
            }
        } catch (err) {
            console.error('Error replacing vehicle:', err);
            setError('Failed to replace vehicle');
        } finally {
            setReplacing(false);
        }
    };

    const handleClose = () => {
        setPreviewData(null);
        setError('');
        setLoading(false);
        setReplacing(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Replace Vehicle</ModalHeader>
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        {contract && (
                            <Box p={3} bg="gray.50" borderRadius="md">
                                <Text fontWeight="bold">Contract #{contract.contractId}</Text>
                                <Text fontSize="sm">Renter: {contract.renterName}</Text>
                                <Text fontSize="sm">
                                    Period: {new Date(contract.startTime).toLocaleDateString()} - {new Date(contract.endTime).toLocaleDateString()}
                                </Text>
                            </Box>
                        )}

                        {loading && (
                            <Box textAlign="center" py={4}>
                                <Spinner size="md" />
                                <Text mt={2}>Checking available vehicles...</Text>
                            </Box>
                        )}

                        {error && (
                            <Alert status="error">
                                <AlertIcon />
                                {error}
                            </Alert>
                        )}

                        {!loading && previewData && (
                            <>
                                {previewData.willBeReplaced ? (
                                    <Alert status="success">
                                        <AlertIcon />
                                        <Box>
                                            <Text fontWeight="bold">Replacement Vehicle Available</Text>
                                            <Text fontSize="sm">
                                                {previewData.newVehicleInfo} ({previewData.replacementType})
                                            </Text>
                                        </Box>
                                    </Alert>
                                ) : (
                                    <Alert status="warning">
                                        <AlertIcon />
                                        <Box>
                                            <Text fontWeight="bold">No Replacement Available</Text>
                                            <Text fontSize="sm">{previewData.reason}</Text>
                                        </Box>
                                    </Alert>
                                )}

                                {previewData.lockExpiresAt && (
                                    <Box p={2} bg="blue.50" borderRadius="md">
                                        <Text fontSize="sm" color="blue.700">
                                            This vehicle is reserved for you until: {' '}
                                            {new Date(previewData.lockExpiresAt).toLocaleTimeString()}
                                        </Text>
                                    </Box>
                                )}
                            </>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="outline" onClick={handleClose} mr={3}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={handleReplace}
                        isLoading={replacing}
                        isDisabled={!previewData?.willBeReplaced}
                    >
                        Confirm Replacement
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}