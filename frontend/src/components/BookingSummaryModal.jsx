import React, { useState } from 'react';
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
    
    if (!bookingSummary) return null;

    const handleProceedToPayment = async () => {
        setPaymentLoading(true);
        
        try {
            // Prepare payment data (remove invoiceId and renterId as requested)
            const paymentData = {
                bookingToken: bookingSummary.bookingToken,
                // Add other required fields if needed
            };
            
            console.log('Creating payment link with:', paymentData);
            
            // Call Payment API
            const response = await paymentAPI.createPaymentLink(paymentData);
            console.log('Payment response:', response);
            
            // Get returnUrl from response
            const returnUrl = response?.returnUrl;
            
            if (returnUrl) {
                // Redirect to payment URL
                window.open(returnUrl, '_blank');
                
                // Call the confirm callback
                if (onConfirm) {
                    onConfirm();
                }
            } else {
                alert('Payment link not available. Please try again.');
            }
            
        } catch (error) {
            console.error('Payment error:', error);
            alert('Failed to create payment link. Please try again.');
        } finally {
            setPaymentLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
            <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
            <ModalContent className="booking-summary-modal-content">
                <ModalHeader className="booking-summary-modal-header">
                    Booking Summary
                </ModalHeader>
                
                <ModalBody className="booking-summary-modal-body">
                    <VStack spacing={6} align="stretch">
                        {/* Booking Details */}
                        <Box className="booking-details-box">
                            <Text fontSize="xl" fontWeight="bold" mb={4}>
                                📋 Booking Details
                            </Text>
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
                                        <Divider />
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

                                <Divider />
                                <HStack justify="space-between">
                                    <Text fontWeight="bold" fontSize="xl">💰 Total Cost:</Text>
                                    <Text fontWeight="bold" fontSize="xl" color="green.600" bg="green.50" px={3} py={1} borderRadius="md">
                                        ${bookingSummary.totalCost || '0.00'}
                                    </Text>
                                </HStack>

                                {bookingSummary.terms && bookingSummary.terms.length > 0 && (
                                    <>
                                        <Divider />
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
                        </Box>
                    </VStack>
                </ModalBody>

                <ModalFooter className="booking-summary-modal-footer">
                    <Button className="close-button" onClick={onClose} size="lg">
                        Close
                    </Button>
                    <Button 
                        className="confirm-button" 
                        onClick={handleProceedToPayment}
                        size="lg"
                        isLoading={paymentLoading}
                        loadingText="Creating Payment Link..."
                        disabled={paymentLoading}
                    >
                        {paymentLoading ? 'Creating Payment Link...' : 'I Accept and Proceed to Payment'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default BookingSummaryModal;
