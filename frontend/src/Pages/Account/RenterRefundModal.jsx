import { useState, useEffect } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, SimpleGrid,
    Button, VStack, FormControl, FormLabel, Text, Alert, AlertIcon,
    Box, Badge, Divider, HStack, Input
} from '@chakra-ui/react';
import { modificationAPI } from '../../services/api';

export default function RenterRefundModal({ contract, onRefundSuccess, isOpen, onClose }) {
    const [preview, setPreview] = useState(null);
    const [fetchingPreview, setFetchingPreview] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const [bankInfo, setBankInfo] = useState({
        accountNumber: '',
        accountName: '',
        bankCode: '',
        branch: ''
    });

    useEffect(() => {
        if (isOpen && contract) {
            fetchRefundPreview();
            setBankInfo({
                accountNumber: '',
                accountName: '',
                bankCode: '',
                branch: ''
            });
        }
    }, [isOpen, contract]);

    const fetchRefundPreview = async () => {
        if (!contract) return;

        setFetchingPreview(true);
        try {
            const previewData = await modificationAPI.getRefundPreview(contract.contractId);
            setPreview(previewData);
        } catch (err) {
            console.error('Error fetching refund preview:', err);
        } finally {
            setFetchingPreview(false);
        }
    };

    const handleBankInfoChange = (field, value) => {
        setBankInfo(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const isFormValid = () => {
        if (!bankInfo.accountNumber?.trim() ||
            !bankInfo.accountName?.trim() ||
            !bankInfo.bankCode?.trim()) {
            return false;
        }
        return true;
    };

    const handleCancelContract = async () => {
        if (!isFormValid() || !contract) return;

        setCancelling(true);
        try {
            const result = await modificationAPI.cancelContract(contract.contractId, {
                accountNumber: bankInfo.accountNumber.trim(),
                accountName: bankInfo.accountName.trim(),
                bankCode: bankInfo.bankCode.trim(),
                branch: bankInfo.branch?.trim() || ''
            });

            if (result.success) {
                onRefundSuccess?.();
                onClose();
            } else {
                throw new Error(result.message || 'Failed to cancel contract');
            }
        } catch (err) {
            console.error('Error cancelling contract:', err);
        } finally {
            setCancelling(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size={"6xl"}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader fontSize="20px">Cancel Contract & Request Refund</ModalHeader>
                <ModalBody fontSize="16px">
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <VStack spacing={4} align="stretch">
                            <Box p={3} bg="gray.50" borderRadius="md">
                                <Text fontWeight="bold">Contract #{contract?.contractId}</Text>
                                <Text color="gray.600">
                                    Vehicle: {contract?.vehicleLicensePlate}
                                </Text>
                                <Text color="gray.600">
                                    Total Paid: {preview ? formatCurrency(preview.totalPaid) : '0 ₫'}
                                </Text>
                            </Box>

                            {fetchingPreview ? (
                                <Text>Loading refund preview...</Text>
                            ) : preview && (
                                <Box p={3} border="1px" borderColor="gray.200" borderRadius="md">
                                    <Text fontWeight="medium">Refund Policy</Text>
                                    <HStack justify="space-between">
                                        <Text>Policy:</Text>
                                        <Text fontWeight="medium">
                                            {preview.policy}
                                        </Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text>Refund Amount:</Text>
                                        <Text fontWeight="bold" color="green.600">
                                            {formatCurrency(preview.refundAmount)}
                                        </Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text>Days Until Start:</Text>
                                        <Text>
                                            {Math.max(0, Math.round(preview.daysUntilStart))} days
                                        </Text>
                                    </HStack>
                                </Box>
                            )}

                            <Divider />
                        </VStack>

                        <Box>
                            <Text fontWeight="medium" mb={4} fontSize={"16px"}>Bank Information for Refund</Text>
                            <VStack spacing={3}>
                                <FormControl isRequired>
                                    <FormLabel fontSize={"16px"}>Account Number</FormLabel>
                                    <Input
                                        fontSize={"16px"}
                                        value={bankInfo.accountNumber}
                                        onChange={(e) => handleBankInfoChange('accountNumber', e.target.value)}
                                        placeholder="Enter your account number"
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel fontSize={"16px"}>Account Name</FormLabel>
                                    <Input
                                        fontSize={"16px"}
                                        value={bankInfo.accountName}
                                        onChange={(e) => handleBankInfoChange('accountName', e.target.value)}
                                        placeholder="Enter account holder name"
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel fontSize={"16px"}>Bank Code</FormLabel>
                                    <Input
                                        fontSize={"16px"}
                                        value={bankInfo.bankCode}
                                        onChange={(e) => handleBankInfoChange('bankCode', e.target.value)}
                                        placeholder="Enter bank code (e.g., VCB, OCB, MB)"
                                    />
                                </FormControl>
                            </VStack>
                        </Box>
                    </SimpleGrid>

                    <Box mt={6}>
                        <Alert status="warning" borderRadius="md" justifyContent="center" textAlign="center">
                            <HStack justify="center" w="100%">
                                <AlertIcon />
                                <Text fontWeight="semibold" color="red.600">
                                    This action cannot be undone.
                                </Text>
                            </HStack>
                        </Alert>
                    </Box>
                </ModalBody>

                <ModalFooter>
                    <Button variant="outline" mr={3} onClick={onClose} fontSize={"16px"}>
                        Keep Contract
                    </Button>
                    <Button
                        fontSize={"16px"}
                        colorScheme="red"
                        onClick={handleCancelContract}
                        isLoading={cancelling}
                        isDisabled={!isFormValid() || !preview}
                    >
                        Cancel Contract & Get Refund
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}