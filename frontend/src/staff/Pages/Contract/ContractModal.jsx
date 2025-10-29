import React, { useState, useCallback, useEffect } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
    VStack, HStack, FormControl, FormLabel, Input, FormHelperText, Button,
    Text, Box, Icon, useToast, Image
} from '@chakra-ui/react';
import { MdDirectionsCar, MdExitToApp } from 'react-icons/md';
import { contractAPI } from '../../../services/api';

const ContractModal = ({ 
    isOpen, 
    onClose, 
    contract, 
    action, 
    onSuccess 
}) => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    // Format currency helper function
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return 'N/A';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const getStaffId = () => {
        return localStorage.getItem("staffId");
    };

    // Handle file upload
    const handleFileChange = useCallback((event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
        
        // Create preview URL
        if (selectedFile) {
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    }, []);

    // Handle modal close
    const handleClose = useCallback(() => {
        setFile(null);
        setPreviewUrl(null);
        setIsLoading(false);
        onClose();
    }, [onClose]);

    const handleConfirm = useCallback(async () => {
        if (!file) {
            toast({
                title: 'Error',
                description: 'Please select an image file',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            setIsLoading(true);
            
            const staffId = getStaffId();
            if (!staffId) {
                toast({
                    title: 'Error',
                    description: 'Staff ID not found. Please log in again.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
                return;
            }

            const formData = new FormData();
            formData.append('ContractId', contract.contractId.toString());
            
            let response;
            
            if (action === 'handover') {
                formData.append('StaffId', staffId);
                formData.append('ImageFile', file);
                
                response = await contractAPI.activeContract(formData);
            } else if (action === 'return') {
                formData.append('ImageFile', file);
                
                response = await contractAPI.finishContract(formData);
            }

            console.log(`${action} response:`, response);

            toast({
                title: 'Success',
                description: response.message || `Vehicle ${action} completed successfully`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            if (action === 'return' && response.totalCost) {
                toast({
                    title: 'Contract Details',
                    description: `Total Cost: ${formatCurrency(response.totalCost)} | Vehicle Status: ${response.vehicleStatus} | Contract Status: ${response.contractStatus}`,
                    status: 'info',
                    duration: 5000,
                    isClosable: true,
                });
            }

            if (onSuccess) {
                await onSuccess();
            }

            handleClose();
        } catch (error) {
            console.error(`Error during ${action}:`, error);
            toast({
                title: 'Error',
                description: error.message || `Failed to complete vehicle ${action}`,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    }, [file, contract, action, toast, onSuccess, handleClose]);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // Get modal configuration based on action
    const getModalConfig = () => {
        if (action === 'handover') {
            return {
                icon: MdDirectionsCar,
                iconColor: 'green.500',
                title: `Hand Over Vehicle for Contract ${contract?.contractId}`,
                label: 'Upload Vehicle Handover Image',
                helperText: 'Please select an image file showing the vehicle condition at handover',
                buttonColor: 'green',
                buttonText: 'Confirm Handover'
            };
        } else if (action === 'return') {
            return {
                icon: MdExitToApp,
                iconColor: 'orange.500',
                title: `Return Vehicle for Contract ${contract?.contractId}`,
                label: 'Upload Vehicle Return Image',
                helperText: 'Please select an image file showing the vehicle condition at return',
                buttonColor: 'orange',
                buttonText: 'Confirm Return'
            };
        }
        return null;
    };

    const config = getModalConfig();
    if (!config) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="md" isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Icon as={config.icon} color={config.iconColor} />
                        <Text>{config.title}</Text>
                    </Box>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <VStack spacing={4}>
                        <FormControl>
                            <FormLabel>{config.label}</FormLabel>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                p={1}
                            />
                            <FormHelperText>
                                {config.helperText}
                            </FormHelperText>
                        </FormControl>

                        {file && (
                            <Box w="full">
                                <Text fontSize="sm" color="green.500" mb={2}>
                                    Selected file: {file.name}
                                </Text>
                                {previewUrl && (
                                    <Box
                                        border="1px solid"
                                        borderColor="gray.200"
                                        borderRadius="md"
                                        p={2}
                                        bg="gray.50"
                                    >
                                        <Text fontSize="sm" color="gray.600" mb={2}>
                                            Preview:
                                        </Text>
                                        <Image
                                            src={previewUrl}
                                            alt="Image preview"
                                            maxH="200px"
                                            maxW="100%"
                                            objectFit="contain"
                                            borderRadius="md"
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}

                        <HStack spacing={4} w="full" justify="center">
                            <Button
                                colorScheme={config.buttonColor}
                                onClick={handleConfirm}
                                isDisabled={!file || isLoading}
                                isLoading={isLoading}
                                loadingText="Processing..."
                            >
                                {config.buttonText}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                isDisabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </HStack>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ContractModal;