import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    VStack,
    Text,
    Box,
    Divider,
    Badge,
    HStack
} from '@chakra-ui/react';
import { paymentAPI } from '../services/api';
import '../styles/BookingSummaryModal.css';

const BookingSummaryModal = ({ isOpen, onClose, bookingSummary, onConfirm }) => {
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentInfo, setPaymentInfo] = useState(null);

    // Hide navbar when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Hide navbar
            const navbar = document.querySelector('nav, header, .navbar, .header');
            if (navbar) {
                navbar.style.display = 'none';
            }
        } else {
            document.body.style.overflow = 'unset';
            // Show navbar
            const navbar = document.querySelector('nav, header, .navbar, .header');
            if (navbar) {
                navbar.style.display = 'block';
            }
        }
        
        // Cleanup on unmount
        return () => {
            document.body.style.overflow = 'unset';
            const navbar = document.querySelector('nav, header, .navbar, .header');
            if (navbar) {
                navbar.style.display = 'block';
            }
        };
    }, [isOpen]);

    if (!bookingSummary) return null;

    const handleProceedToPayment = async () => {
        setPaymentLoading(true);
        
        try {
            // Prepare payment data with invoiceId and renterId
            const paymentData = {
                invoiceId: bookingSummary.invoiceId,
                renterId: bookingSummary.renterId 
            };
            
            console.log('Creating payment with:', paymentData);
            
            // Call Payment API
            const response = await paymentAPI.createPayment(paymentData);
            console.log('Payment response:', response);
            
            // Handle successful payment creation
            if (response && response.checkoutUrl) {
                // Store payment info for display
                setPaymentInfo(response);
                
                // Redirect to payment URL
                window.open(response.checkoutUrl, '_blank');
                
                // Call the confirm callback
                if (onConfirm) {
                    onConfirm();
                }
            } else {
                alert('Payment creation failed. Please try again.');
            }
            
        } catch (error) {
            console.error('Payment error:', error);
            alert('Failed to create payment. Please try again.');
        } finally {
            setPaymentLoading(false);
        }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xxl" isCentered>
            <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
            <ModalContent className="booking-summary-modal-content">
                <ModalHeader className="booking-summary-modal-header">
                    Booking Summary
                </ModalHeader>
                
                <ModalBody className="booking-summary-modal-body">
                    <VStack spacing={6} align="stretch">
                        {/* Booking Details */}
                       
                            
                            <VStack spacing={3} align="stretch">
                                {bookingSummary.period && (
                                    <HStack justify="space-between">
                                        <Text fontWeight="bold">📅 Period:</Text>
                                        <Text fontSize="lg" color="blue.600" fontWeight="bold">
                                            {bookingSummary.period}
                                        </Text>
                                    </HStack>
                                )}
                                {bookingSummary.vehicle && (
                                    <>
                                      
                                        <HStack justify="space-between">
                                            <Text fontWeight="bold">🚗 Vehicle:</Text>
                                            <Text fontSize="lg" color="blue.600">{bookingSummary.vehicle.modelName}</Text>
                                        </HStack>   
                                        <HStack justify="space-between">
                                            <Text fontWeight="bold">📍 Station:</Text>
                                            <Text fontSize="lg">{bookingSummary.station?.name}</Text>
                                        </HStack>
                                    </>
                                )}
                                <HStack justify="space-between">
                                    <Text fontWeight="bold" fontSize="xl">💰 Total Cost:</Text>
                                    <Text fontWeight="bold" fontSize="xxl" color="green" bg="green.50" px={3} py={1} borderRadius="md">
                                        {parseInt(bookingSummary.totalCost || 0).toLocaleString()} VND
                                    </Text>
                                </HStack>
                               {bookingSummary.terms && bookingSummary.terms.length > 0 && (
                                    <>
                                       
                                        <Box>
                                            <Text fontWeight="bold" fontSize="lg" mb={3}>📋 Terms & Conditions:</Text>
                                            <VStack spacing={2} align="stretch">
                                                {bookingSummary.terms.map((term, index) => (
                                                    <Text key={index} fontSize="sm" color="gray.700" pl={4} position="relative">
                                                        <Text as="span" position="absolute" left={0} color="blue.500">•</Text>
                                                        {term}
                                                    </Text>
                                                ))}
                                            </VStack>
                                        </Box>
                                    </>
                                )}
                            </VStack>
                        
                        {/* Payment Information */}
                        {paymentInfo && (
                            <Box className="payment-info-box">
                                <Text fontSize="xl" fontWeight="bold" mb={4} color="green.600">
                                    💳 Payment Information
                                </Text>
                                <VStack spacing={3} align="stretch">
                                    <HStack justify="space-between">
                                        <Text fontWeight="bold">Order Code:</Text>
                                        <Text fontSize="lg" color="blue.600" fontWeight="bold">
                                            {paymentInfo.orderCode}
                                        </Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text fontWeight="bold">Amount:</Text>
                                        <Text fontSize="lg" color="green.600" fontWeight="bold">
                                            {paymentInfo.amount.toLocaleString()} {paymentInfo.currency}
                                        </Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text fontWeight="bold">Status:</Text>
                                        <Badge colorScheme="orange" fontSize="md" px={3} py={1}>
                                            {paymentInfo.status}
                                        </Badge>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text fontWeight="bold">Payment Link:</Text>
                                        <Text fontSize="sm" color="blue.500" textDecoration="underline">
                                            Payment page opened in new tab
                                        </Text>
                                    </HStack>
                                </VStack>
                            </Box>
                        )}
                    </VStack>
                </ModalBody>

                <ModalFooter className="booking-summary-modal-footer">
                    
                    {!paymentInfo && (
                        <Button 
                            className="confirm-button" 
                            onClick={handleProceedToPayment}
                            size="lg"
                            isLoading={paymentLoading}
                            loadingText="Creating Payment..."
                            disabled={paymentLoading}
                        >
                            {paymentLoading ? 'Creating Payment...' : 'I Accept and Proceed to Payment'}
                        </Button>
                    )}
                    {paymentInfo && (
                        <Button 
                            className="confirm-button" 
                            onClick={() => window.open(paymentInfo.checkoutUrl, '_blank')}
                            size="lg"
                            colorScheme="green"
                        >
                            Open Payment Page
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default BookingSummaryModal;
