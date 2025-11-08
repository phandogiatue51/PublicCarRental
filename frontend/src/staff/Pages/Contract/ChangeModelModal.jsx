import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Text,
  useToast,
  Spinner,
  Box,
  VStack,
  useColorModeValue,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  InputGroup,
  InputLeftElement,
  Input,
  Icon,
  Badge,
} from '@chakra-ui/react';
import { MdSearch } from 'react-icons/md';
import { modelAPI, modificationAPI, paymentAPI } from '../../../services/api';
const ChangeModelModal = ({ isOpen, onClose, contract, onSuccess }) => {
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  useEffect(() => {
    if (isOpen && contract) {
      fetchModels();
      setSelectedModelId('');
      setSearchTerm('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, contract]);

  // Filter models by search term
  const filteredModels = useMemo(() => {
    let result = models;

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      result = result.filter((m) => {
        const name = (m.modelName || m.name || '').toLowerCase();
        const brandName = (m.brand || m.brandName || '').toLowerCase();
        const id = (m.modelId || m.id || '').toString().toLowerCase();
        return name.includes(search) || brandName.includes(search) || id.includes(search);
      });
    }

    return result;
  }, [models, searchTerm]);

  const fetchModels = async () => {
    if (!contract) return;

    try {
      setLoading(true);

      // Get stationId from localStorage
      const stationId = localStorage.getItem('stationId');
      if (!stationId) {
        toast({
          title: 'Error',
          description: 'Station ID not found',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Get StartTime and EndTime from contract
      const startTime = contract.startTime || contract.startDate;
      const endTime = contract.endTime || contract.endDate;

      if (!startTime || !endTime) {
        toast({
          title: 'Error',
          description: 'Contract dates are missing',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Fetch available counts
      const response = await modelAPI.getAvailableCounts(
        parseInt(stationId),
        startTime,
        endTime
      );

      setModels(response || []);
    } catch (error) {
      console.error('Error fetching models:', error);
      toast({
        title: 'Error',
        description: 'Failed to load models',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedModelId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a model',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSubmitting(true);
      const requestData = {
        newModelId: parseInt(selectedModelId),
      };

      const result = await modificationAPI.changeModel(contract.contractId, requestData);

      if (result.success) {
        // 🆕 ADD THIS PAYMENT HANDLING BLOCK
        if (result.requiresPayment && result.newInvoiceId) {
          toast({
            title: 'Payment Required',
            description: result.message || 'Please complete payment to change model',
            status: 'info',
            duration: 5000,
            isClosable: true,
          });

          // Create payment for the additional invoice
          try {
            const paymentData = {
              invoiceId: result.newInvoiceId,
              renterId: contract.evRenterId || contract.renterId // Use appropriate renter ID
            };

            const paymentResponse = await paymentAPI.createPayment(paymentData);

            if (paymentResponse && paymentResponse.checkoutUrl) {
              // Open payment in new tab
              window.open(paymentResponse.checkoutUrl, '_blank');

              // 🆕 ADD THIS POLLING FUNCTION
              startPaymentPolling(contract.contractId, result.newInvoiceId);
            } else {
              throw new Error('Payment creation failed');
            }
          } catch (paymentError) {
            console.error('Payment creation error:', paymentError);
            toast({
              title: 'Payment Error',
              description: 'Failed to create payment link',
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
          }
        } else {
          toast({
            title: 'Success',
            description: result.message || 'Model changed successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          onSuccess?.();
          onClose();
        }
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to change model',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error changing model:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to change model',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startPaymentPolling = async (contractId, invoiceId) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await modificationAPI.getPendingStatus(contractId, invoiceId);

        if (status.isCompleted) {
          clearInterval(pollInterval);
          toast({
            title: 'Success!',
            description: 'Model change completed successfully!',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          onSuccess?.();
          onClose();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    setTimeout(() => {
      clearInterval(pollInterval);
      toast({
        title: 'Timeout',
        description: 'Payment verification timeout. Please refresh the page to check status.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    }, 10 * 60 * 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent maxH="85vh">
        <ModalHeader color={textColor}>Change Model</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {loading ? (
            <Box textAlign="center" py={8}>
              <Spinner size="lg" color="blue.500" />
              <Text mt={4} color="gray.500">
                Loading models...
              </Text>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Select a new model for contract #{contract?.contractId}
                </Text>
              </Alert>

              {/* Search Box */}
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={MdSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search by model name, brand, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  borderRadius="md"
                />
              </InputGroup>

              {/* Model Selection */}
              {filteredModels.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Text color="gray.500">
                    {searchTerm
                      ? 'No models found matching your search'
                      : 'No models available'}
                  </Text>
                </Box>
              ) : (
                <Box
                  border="1px"
                  borderColor={borderColor}
                  borderRadius="md"
                  overflow="hidden"
                  maxH="400px"
                  overflowY="auto"
                >
                  <Table variant="simple" size="sm">
                    <Thead bg="gray.50" position="sticky" top={0} zIndex={1}>
                      <Tr>
                        <Th width="80px" fontSize="xs" fontWeight="700" color="gray.600">
                          ID
                        </Th>
                        <Th fontSize="xs" fontWeight="700" color="gray.600">
                          Model Name
                        </Th>
                        <Th fontSize="xs" fontWeight="700" color="gray.600">
                          Brand
                        </Th>
                        <Th width="100px" fontSize="xs" fontWeight="700" color="gray.600" textAlign="center">
                          Available
                        </Th>
                        <Th width="100px" fontSize="xs" fontWeight="700" color="gray.600" textAlign="center">
                          Select
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredModels.map((model) => {
                        const modelIdStr = (model.modelId || model.id)?.toString();
                        const isSelected = selectedModelId === modelIdStr;
                        const availableCount = model.count || 0;
                        const isAvailable = availableCount > 0;

                        return (
                          <Tr
                            key={model.modelId || model.id}
                            bg={isSelected ? 'blue.50' : 'transparent'}
                            _hover={{ bg: 'gray.50', cursor: isAvailable ? 'pointer' : 'not-allowed' }}
                            opacity={isAvailable ? 1 : 0.6}
                            onClick={() => {
                              if (isAvailable) {
                                setSelectedModelId(modelIdStr);
                              }
                            }}
                          >
                            <Td>
                              <Text fontWeight="600" color={textColor} fontSize="sm">
                                {model.modelId || model.id}
                              </Text>
                            </Td>
                            <Td>
                              <Text color={textColor} fontSize="sm" fontWeight="500">
                                {model.modelName || model.name}
                              </Text>
                            </Td>
                            <Td>
                              <Text color="gray.600" fontSize="sm">
                                {model.brand || model.brandName || 'N/A'}
                              </Text>
                            </Td>
                            <Td textAlign="center">
                              <Badge
                                colorScheme={isAvailable ? 'green' : 'red'}
                                variant="solid"
                                fontSize="xs"
                                px={2}
                                py={1}
                                borderRadius="md"
                              >
                                {availableCount} available
                              </Badge>
                            </Td>
                            <Td textAlign="center">
                              <Button
                                size="xs"
                                colorScheme={isSelected ? 'blue' : 'gray'}
                                variant={isSelected ? 'solid' : 'outline'}
                                isDisabled={!isAvailable}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isAvailable) {
                                    setSelectedModelId(modelIdStr);
                                  }
                                }}
                              >
                                {isSelected ? 'Selected' : 'Select'}
                              </Button>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              )}

              {!loading && filteredModels.length > 0 && (
                <Text fontSize="xs" color="gray.500" textAlign="right">
                  Showing {filteredModels.length} of {models.length} models
                  {searchTerm && ` matching "${searchTerm}"`}
                </Text>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={submitting}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={submitting}
            loadingText="Changing..."
            isDisabled={!selectedModelId || (models.find(m => (m.modelId || m.id)?.toString() === selectedModelId)?.count || 0) === 0}
          >
            Change Model
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ChangeModelModal;

