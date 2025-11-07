import { useState, useEffect } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, SimpleGrid,
    Button, VStack, FormControl, FormLabel, Text, Alert, AlertIcon,
    NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
    Box, Badge, Divider, HStack, Input
} from '@chakra-ui/react';
import { accidentAPI } from '../../../../services/api';
import { useRefund } from './../../../../hooks/useRefund';

export default function RefundProcessingModal({ isOpen, onClose, contract, onSuccess }) {
    const [refundAmount, setRefundAmount] = useState(0);
    const [refundType, setRefundType] = useState('auto');
    const [preview, setPreview] = useState(null);
    const [fetchingPreview, setFetchingPreview] = useState(false);

    const { staffRefund, loading, error, clearError } = useRefund();

    const [bankInfo, setBankInfo] = useState({
        accountNumber: '',
        accountName: '',
        bankCode: '',
        branch: ''
    });

    useEffect(() => {
        if (isOpen && contract) {
            fetchRefundPreview();
            setRefundType('auto');
            setBankInfo({
                accountNumber: '',
                accountName: '',
                bankCode: '',
                branch: ''
            });
            clearError();
        }
    }, [isOpen, contract]);

    const fetchRefundPreview = async () => {
        setFetchingPreview(true);
        try {
            const previewData = await accidentAPI.getRefundPreview(contract.contractId);
            setPreview(previewData);

            if (previewData) {
                setRefundAmount(previewData.refundAmount);
            }
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
        if (!refundAmount || refundAmount <= 0) return false;
        if (!bankInfo.accountNumber?.trim() ||
            !bankInfo.accountName?.trim() ||
            !bankInfo.bankCode?.trim()) {
            return false;
        }

        if (preview && refundAmount > preview.totalPaid) {
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!isFormValid() || !contract || !preview) return;

        const fullRefund = refundAmount >= preview.totalPaid;

        const result = await staffRefund(
            contract.contractId,
            refundAmount,
            "Refund processed", 
            fullRefund ? 'Staff override - 100% refund' : 'Standard refund',
            {
                accountNumber: bankInfo.accountNumber.trim(),
                accountName: bankInfo.accountName.trim(),
                bankCode: bankInfo.bankCode.trim(),
                branch: bankInfo.branch?.trim() || ''
            },
            fullRefund
        );

        if (result.success) {
            onSuccess();
            onClose();
        }
    };

    const handleFullRefund = () => {
        if (preview) {
            setRefundAmount(preview.totalPaid);
            setRefundType('manual');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="4xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Process Refund</ModalHeader>
                <ModalBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <VStack spacing={4} align="stretch">
                            <Box p={3} bg="gray.50" borderRadius="md">
                                <Text fontWeight="bold">Contract #{contract?.contractId}</Text>
                                <Text fontSize="sm" color="gray.600">
                                    Renter: {contract?.evRenterName}
                                </Text>
                                <Text fontSize="sm" color="gray.600">
                                    Total Paid: {preview ? formatCurrency(preview.totalPaid) : '0 ₫'}
                                </Text>
                            </Box>

                            {fetchingPreview ? (
                                <Text>Loading refund preview...</Text>
                            ) : preview && (
                                <Box p={3} border="1px" borderColor="gray.200" borderRadius="md">
                                    <Text fontWeight="medium">Refund Policy</Text>
                                    <HStack justify="space-between">
                                        <Text fontSize="sm">Policy:</Text>
                                        <Text fontSize="sm" fontWeight="medium">
                                            {preview.policy}
                                        </Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text fontSize="sm">Refund Amount:</Text>
                                        <Text fontSize="sm" fontWeight="bold" color="green.600">
                                            {formatCurrency(preview.refundAmount)}
                                        </Text>
                                    </HStack>
                                    {preview.daysUntilStart < 2 && (
                                        <Button
                                            size="sm"
                                            colorScheme="green"
                                            mt={2}
                                            onClick={handleFullRefund}
                                            width="100%"
                                        >
                                            Apply 100% Refund Override
                                        </Button>
                                    )}
                                </Box>
                            )}

                            <Divider />

                            <FormControl isRequired>
                                <FormLabel>
                                    Refund Amount {refundType === 'auto' && '(Policy-based)'}
                                </FormLabel>
                                <NumberInput
                                    value={refundAmount}
                                    onChange={(valueString, valueNumber) => setRefundAmount(valueNumber || 0)}
                                    min={0}
                                    max={preview?.totalPaid || 0}
                                    precision={0}
                                    isDisabled={refundType === 'auto'}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                                {refundType === 'manual' && preview && (
                                    <Text fontSize="sm" color="gray.600" mt={1}>
                                        Maximum: {formatCurrency(preview.totalPaid)}
                                        {refundAmount >= preview.totalPaid && (
                                            <Badge ml={2} colorScheme="green">100% Refund</Badge>
                                        )}
                                    </Text>
                                )}
                                {refundAmount > (preview?.totalPaid || 0) && (
                                    <Text fontSize="sm" color="red.500" mt={1}>
                                        Refund amount cannot exceed total paid
                                    </Text>
                                )}
                            </FormControl>
                        </VStack>

                        <Box>
                            <Text fontWeight="medium" mb={4}>Bank Information for Refund</Text>
                            <VStack spacing={3}>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm">Account Number</FormLabel>
                                    <Input
                                        value={bankInfo.accountNumber}
                                        onChange={(e) => handleBankInfoChange('accountNumber', e.target.value)}
                                        placeholder="Enter account number"
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm">Account Name</FormLabel>
                                    <Input
                                        value={bankInfo.accountName}
                                        onChange={(e) => handleBankInfoChange('accountName', e.target.value)}
                                        placeholder="Enter account holder name"
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm">Bank Code</FormLabel>
                                    <Input
                                        value={bankInfo.bankCode}
                                        onChange={(e) => handleBankInfoChange('bankCode', e.target.value)}
                                        placeholder="Enter bank code (e.g., VCB, OCB, MB)"
                                    />
                                </FormControl>
                            </VStack>
                        </Box>
                    </SimpleGrid>

                    {error && (
                        <Alert status="error" mt={4}>
                            <AlertIcon />
                            {error}
                        </Alert>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="outline" mr={3} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme="orange"
                        onClick={handleSubmit}
                        isLoading={loading}
                        isDisabled={!isFormValid()}
                    >
                        {refundType === 'manual' && refundAmount >= preview?.totalPaid
                            ? 'Process 100% Refund'
                            : 'Process Refund'
                        }
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}