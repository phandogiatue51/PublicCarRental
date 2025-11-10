import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, Button, Text, useToast, Spinner, Box, VStack, useColorModeValue, Alert,
  AlertIcon, Table, Thead, Tbody, Tr, Th, Td, InputGroup, InputLeftElement, Input, Icon
} from '@chakra-ui/react';
import { MdSearch } from 'react-icons/md';
import { vehicleAPI, modificationAPI } from '../../../services/api';

const ChangeVehicleModal = ({ isOpen, onClose, contract, onSuccess }) => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  useEffect(() => {
    if (isOpen && contract) {
      fetchVehicles();
      setSelectedVehicleId('');
      setSearchTerm('');
    }
  }, [isOpen, contract]);

  const fetchVehicles = async () => {
    if (!contract) return;

    try {
      setLoading(true);

      let currentModelId = null;
      if (contract.vehicleId) {
        try {
          const currentVehicle = await vehicleAPI.getById(contract.vehicleId);
          currentModelId = currentVehicle?.modelId || currentVehicle?.model?.modelId;
        } catch (err) {
          console.error('Error fetching current vehicle:', err);
        }
      }

      if (!currentModelId) {
        toast({
          title: 'Error',
          description: 'Could not determine the current vehicle model',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }

      const availableVehicles = await vehicleAPI.getAvailableVehicles(
        currentModelId,
        contract.stationId,
        contract.startTime,  
        contract.endTime
      );

      console.log('Available vehicles:', availableVehicles); 

      const filteredVehicles = (availableVehicles || []).filter(
        (v) => (v.vehicleId || v.id) !== (contract.vehicleId || contract.vehicle?.vehicleId)
      );

      setVehicles(filteredVehicles);
    } catch (error) {
      console.error('Error fetching available vehicles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available vehicles',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = useMemo(() => {
    if (!searchTerm.trim()) return vehicles;
    const search = searchTerm.toLowerCase();
    return vehicles.filter((v) => {
      const licensePlate = (v.licensePlate || v.vehicleLicensePlate || '').toLowerCase();
      const id = (v.vehicleId || v.id || '').toString().toLowerCase();
      return licensePlate.includes(search) || id.includes(search);
    });
  }, [vehicles, searchTerm]);

  const handleSubmit = async () => {
    if (!selectedVehicleId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a vehicle',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSubmitting(true);
      const requestData = {
        newVehicleId: parseInt(selectedVehicleId),
      };

      const result = await modificationAPI.changeVehicle(contract.contractId, requestData);

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Vehicle changed successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onSuccess?.();
        onClose();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to change vehicle',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error changing vehicle:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to change vehicle',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent maxH="85vh">
        <ModalHeader color={textColor}>Change Vehicle</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {loading ? (
            <Box textAlign="center" py={8}>
              <Spinner size="lg" color="blue.500" />
              <Text mt={4} color="gray.500">
                Loading vehicles...
              </Text>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Select a new vehicle from the same model for contract #{contract?.contractId}
                </Text>
              </Alert>

              {/* Search Box */}
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={MdSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search by license plate or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  borderRadius="md"
                />
              </InputGroup>

              {/* Vehicle Selection */}
              {filteredVehicles.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Text color="gray.500">
                    {searchTerm
                      ? 'No vehicles found matching your search'
                      : 'No available vehicles for this model'}
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
                          License Plate
                        </Th>

                        <Th width="100px" fontSize="xs" fontWeight="700" color="gray.600" textAlign="center">
                          Select
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredVehicles.map((vehicle) => (
                        <Tr
                          key={vehicle.vehicleId || vehicle.id}
                          bg={selectedVehicleId === (vehicle.vehicleId || vehicle.id)?.toString() ? 'blue.50' : 'transparent'}
                          _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                          onClick={() => setSelectedVehicleId((vehicle.vehicleId || vehicle.id)?.toString())}
                        >
                          <Td>
                            <Text fontWeight="600" color={textColor} fontSize="sm">
                              {vehicle.vehicleId || vehicle.id}
                            </Text>
                          </Td>
                          <Td>
                            <Text color={textColor} fontSize="sm" fontWeight="500">
                              {vehicle.licensePlate || vehicle.vehicleLicensePlate}
                            </Text>
                          </Td>
                          <Td textAlign="center">
                            <Button
                              size="xs"
                              colorScheme={selectedVehicleId === (vehicle.vehicleId || vehicle.id)?.toString() ? 'blue' : 'gray'}
                              variant={selectedVehicleId === (vehicle.vehicleId || vehicle.id)?.toString() ? 'solid' : 'outline'}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVehicleId((vehicle.vehicleId || vehicle.id)?.toString());
                              }}
                            >
                              {selectedVehicleId === (vehicle.vehicleId || vehicle.id)?.toString() ? 'Selected' : 'Select'}
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}

              {!loading && filteredVehicles.length > 0 && (
                <Text fontSize="xs" color="gray.500" textAlign="right">
                  Showing {filteredVehicles.length} of {vehicles.length} vehicles
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
            isDisabled={!selectedVehicleId}
          >
            Change Vehicle
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ChangeVehicleModal;

