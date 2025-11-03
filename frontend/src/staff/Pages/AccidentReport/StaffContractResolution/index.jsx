import { useState } from 'react';
import { 
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, 
    Button, VStack, Text, Box, Alert, AlertIcon} from '@chakra-ui/react';
import ContractList from './ContractList';
import ModelChangeModal from './ModelChangeModal';
import RefundProcessingModal from './RefundProcessingModal';

export default function StaffContractResolution({ isOpen, onClose, accidentId, onSuccess }) {
    const [selectedContract, setSelectedContract] = useState(null);
    const [showModelChange, setShowModelChange] = useState(false);
    const [showRefund, setShowRefund] = useState(false);

    const [contracts] = useState([]);

    const handleModelChange = (contract) => {
        setSelectedContract(contract);
        setShowModelChange(true);
    };

    const handleRefund = (contract) => {
        setSelectedContract(contract);
        setShowRefund(true);
    };

    const handleSuccess = () => {
        if (onSuccess) onSuccess();
        onClose();
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} size="4xl">
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
                                        These contracts could not be automatically replaced and require staff intervention.
                                    </Text>
                                </Box>
                            </Alert>

                            <ContractList 
                                contracts={contracts}
                                onModelChange={handleModelChange}
                                onRefund={handleRefund}
                            />

                            {contracts.length === 0 && (
                                <Box textAlign="center" py={8}>
                                    <Text color="gray.500">No contracts require manual resolution.</Text>
                                </Box>
                            )}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={onClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <ModelChangeModal
                isOpen={showModelChange}
                onClose={() => setShowModelChange(false)}
                contract={selectedContract}
                onSuccess={handleSuccess}
            />

            <RefundProcessingModal
                isOpen={showRefund}
                onClose={() => setShowRefund(false)}
                contract={selectedContract}
                onSuccess={handleSuccess}
            />
        </>
    );
}