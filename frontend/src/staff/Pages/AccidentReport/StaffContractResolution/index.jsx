import { useState, useEffect } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, VStack, Text, Box, Alert, AlertIcon, Spinner, useToast
} from '@chakra-ui/react';
import ContractList from './ContractList';
import ReplacementPreviewModal from './ReplacementPreviewModal';
import { accidentAPI } from '../../../../services/api';

export default function StaffContractResolution({ isOpen, onClose, accidentId, vehicleId, onSuccess }) {
    const [selectedContract, setSelectedContract] = useState(null);
    const [showReplacementPreview, setShowReplacementPreview] = useState(false);
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const toast = useToast();

    const fetchAffectedContracts = async () => {
        if (!vehicleId) return;

        setLoading(true);
        setError('');
        try {
            const data = await accidentAPI.getAffectedContracts(vehicleId);
            console.log('✅ API Response:', data);
            console.log('✅ Data type:', typeof data);
            console.log('✅ Is array:', Array.isArray(data));
            console.log('✅ Array length:', data?.length);
            
            setContracts(Array.isArray(data) ? data : []);
            
            console.log('✅ Contracts state set:', contracts);
        } catch (err) {
            console.error('❌ Error fetching affected contracts:', err);
            setError('Failed to load affected contracts');
            setContracts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && vehicleId) {
            fetchAffectedContracts();
        }
    }, [isOpen, vehicleId]);

    const handleReplaceVehicle = (contract) => {
        setSelectedContract(contract);
        setShowReplacementPreview(true);
    };

    const handleRefund = (contract) => {
        setSelectedContract(contract);
        toast({
            title: 'Refund Processing',
            description: 'Refund functionality will be implemented separately',
            status: 'info',
            duration: 3000,
            isClosable: true,
        });
    };

    const handleReplacementSuccess = () => {
        fetchAffectedContracts();
        if (onSuccess) onSuccess();

        toast({
            title: 'Vehicle Replaced',
            description: 'Contract has been successfully updated with new vehicle',
            status: 'success',
            duration: 3000,
            isClosable: true,
        });
    };

    const handleClose = () => {
        setContracts([]);
        setError('');
        setLoading(false);
        onClose();
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={handleClose} size="6xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Manual Contract Resolution</ModalHeader>
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Alert status="warning">
                                <AlertIcon />
                                <Box>
                                    <Text fontWeight="bold">Manual Resolution Required</Text>
                                    <Text fontSize="sm">
                                        These contracts are affected by the accident and require staff intervention.
                                        You can replace vehicles using the existing replacement system.
                                    </Text>
                                </Box>
                            </Alert>

                            {loading && (
                                <Box textAlign="center" py={8}>
                                    <Spinner size="xl" />
                                    <Text mt={4}>Loading affected contracts...</Text>
                                </Box>
                            )}

                            {error && (
                                <Alert status="error">
                                    <AlertIcon />
                                    {error}
                                </Alert>
                            )}

                            {!loading && !error && (
                                <ContractList
                                    contracts={contracts}
                                    onReplaceVehicle={handleReplaceVehicle}
                                    onRefund={handleRefund}
                                />
                            )}

                            {!loading && contracts.length === 0 && (
                                <Box textAlign="center" py={8}>
                                    <Text color="gray.500">No contracts require manual resolution.</Text>
                                </Box>
                            )}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={handleClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <ReplacementPreviewModal
                isOpen={showReplacementPreview}
                onClose={() => setShowReplacementPreview(false)}
                contract={selectedContract}
                onSuccess={handleReplacementSuccess}
            />
        </>
    );
}