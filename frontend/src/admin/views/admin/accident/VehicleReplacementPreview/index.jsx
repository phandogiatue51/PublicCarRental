import { useState, useEffect } from 'react';
import { 
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, 
    ModalBody, ModalCloseButton, Button, VStack, Box, 
    Alert, AlertIcon, Spinner, Text, useToast 
} from '@chakra-ui/react';
import { accidentAPI } from './../../../../../services/api';
import PreviewStats from './PreviewStats';
import ContractTable from './ContractTable';
import ActionAlerts from './ActionAlerts';
import AccidentResolutionWorkflow from './AccidentResolutionWorkflow';

export default function VehicleReplacementPreview({ isOpen, onClose, accidentId, onExecuteReplacement }) {
    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const toast = useToast();

    const fetchPreview = async () => {
        if (!accidentId) return;

        setLoading(true);
        setError('');

        try {
            // Your API call to the backend controller
            const data = await accidentAPI.getReplacementPreview(accidentId);
            setPreviewData(data);
        } catch (err) {
            console.error('Error fetching replacement preview:', err);
            setError('Failed to load replacement preview');
            toast({
                title: 'Error',
                description: 'Failed to load replacement preview',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && accidentId) {
            setPreviewData(null); 
            setError('');
            fetchPreview();
        }
    }, [isOpen, accidentId]); 

    const handleExecute = async (result) => {
        if (onExecuteReplacement) {
            onExecuteReplacement(result);
        }
        onClose();
    };

    const handleClose = () => {
        setPreviewData(null);
        setError('');
        setLoading(false);
        onClose();
    };

    return (
        // Removed the incorrect 'onOpen={handleOpen}' prop
        <Modal isOpen={isOpen} onClose={handleClose} size="6xl"> 
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Vehicle Replacement Preview</ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    {loading && (
                        <Box textAlign="center" py={8}>
                            <Spinner size="xl" />
                            <Text mt={4}>Generating replacement preview...</Text>
                        </Box>
                    )}

                    {error && (
                        <Alert status="error" mb={4}>
                            <AlertIcon />
                            {error}
                        </Alert>
                    )}

                    {previewData && !loading && (
                        <VStack spacing={6} align="stretch">
                            <PreviewStats data={previewData} />
                            <ContractTable data={previewData} />
                            <ActionAlerts data={previewData} /> 
                        </VStack>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button variant="outline" mr={3} onClick={handleClose}>
                        Cancel
                    </Button>

                    <AccidentResolutionWorkflow
                        accidentId={accidentId}
                        previewData={previewData}
                        onExecuteReplacement={handleExecute}
                        onRefresh={fetchPreview}
                    />
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}