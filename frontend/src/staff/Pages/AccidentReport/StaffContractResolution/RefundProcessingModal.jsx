import { useState, useEffect } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, SimpleGrid,
    Button, VStack, FormControl, FormLabel, Text, Alert, AlertIcon,
    NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
    Box, Badge, Divider, HStack, Input, Tabs, TabList, TabPanels, Tab, TabPanel
} from '@chakra-ui/react';
import { accidentAPI } from '../../../../services/api';
import QRCameraScanner from './QRCameraScanner';
import QRScannerUpload from './QRScannerUpload';
import { useRefund } from './../../../../hooks/useRefund';
import { AiFillCamera } from "react-icons/ai";

export default function RefundProcessingModal({ isOpen, onClose, contract, onSuccess }) {
    const [refundAmount, setRefundAmount] = useState(0);
    const [refundReason, setRefundReason] = useState('');
    const [refundType, setRefundType] = useState('auto');
    const [preview, setPreview] = useState(null);
    const [fetchingPreview, setFetchingPreview] = useState(false);
    const [showCamera, setShowCamera] = useState(false);

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
            setRefundReason('');
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

    const handleBankInfoScanned = (scannedInfo) => {
        setBankInfo(prev => ({
            ...prev,
            accountNumber: scannedInfo.accountNumber || prev.accountNumber,
            accountName: scannedInfo.accountName || prev.accountName,
            bankCode: scannedInfo.bankCode || prev.bankCode
        }));
    };

    const handleBankInfoChange = (field, value) => {
        setBankInfo(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const isFormValid = () => {
        if (!refundReason || !refundAmount || refundAmount <= 0) return false;
        if (!bankInfo.accountNumber || !bankInfo.accountName || !bankInfo.bankCode) {
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!isFormValid() || !contract) return;

        const staffId = localStorage.getItem('staffId') || 1;
        const fullRefund = refundAmount >= preview.totalPaid;

        const result = await staffRefund(
            contract.contractId,
            refundAmount,
            refundReason,
            staffId,
            'Staff override - 100% refund',
            bankInfo,
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

    return (
        <>
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
                                        Total Paid: ${preview?.totalPaid?.toFixed(2) || '0.00'}
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
                                                ${preview.refundAmount?.toFixed(2)}
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

                                <FormControl>
                                    <FormLabel>
                                        Refund Amount {refundType === 'auto' && '(Policy-based)'}
                                    </FormLabel>
                                    <NumberInput
                                        value={refundAmount}
                                        onChange={(value) => setRefundAmount(parseFloat(value) || 0)}
                                        min={0}
                                        max={preview?.totalPaid || 0}
                                        precision={2}
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
                                            Maximum: ${preview.totalPaid?.toFixed(2)}
                                            {refundAmount >= preview.totalPaid && (
                                                <Badge ml={2} colorScheme="green">100% Refund</Badge>
                                            )}
                                        </Text>
                                    )}
                                </FormControl>
                            </VStack>

                            <Box>
                                <Tabs variant="enclosed">
                                    <TabList>
                                        <Tab>Manual Input</Tab>
                                        <Tab>QR Scan</Tab>
                                    </TabList>

                                    <TabPanels>
                                        <TabPanel>
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
                                                        placeholder="Enter bank code"
                                                    />
                                                </FormControl>
                                                <FormControl>
                                                    <FormLabel fontSize="sm">Branch (Optional)</FormLabel>
                                                    <Input
                                                        value={bankInfo.branch}
                                                        onChange={(e) => handleBankInfoChange('branch', e.target.value)}
                                                        placeholder="Enter branch name"
                                                    />
                                                </FormControl>
                                            </VStack>
                                        </TabPanel>

                                        <TabPanel>
                                            <QRScannerUpload
                                                onBankInfoScanned={handleBankInfoScanned}
                                                existingBankInfo={bankInfo}
                                            />

                                            <Button
                                                mt={4}
                                                leftIcon={<AiFillCamera />}
                                                onClick={() => setShowCamera(true)}
                                                width="100%"
                                                variant="outline"
                                                colorScheme="blue"
                                            >
                                                Use Camera to Scan
                                            </Button>

                                            {(bankInfo.accountNumber || bankInfo.accountName) && (
                                                <Box mt={4} p={3} bg="green.50" borderRadius="md">
                                                    <Text fontSize="sm" fontWeight="medium" color="green.800">
                                                        ✓ QR Code Scanned Successfully
                                                    </Text>
                                                    <Text fontSize="sm" color="gray.700">
                                                        Account: {bankInfo.accountNumber} | Bank: {bankInfo.bankCode}
                                                    </Text>
                                                    <Text fontSize="sm" color="gray.700">
                                                        Name: {bankInfo.accountName}
                                                    </Text>
                                                </Box>
                                            )}
                                        </TabPanel>
                                    </TabPanels>
                                </Tabs>
                            </Box>
                        </SimpleGrid>

                        <FormControl mt={4} isRequired>
                            <FormLabel>Refund Reason</FormLabel>
                            <Input
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                placeholder="Enter reason for refund"
                            />
                        </FormControl>

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

            <QRCameraScanner
                isOpen={showCamera}
                onClose={() => setShowCamera(false)}
                onBankInfoScanned={handleBankInfoScanned}
            />
        </>
    );
}