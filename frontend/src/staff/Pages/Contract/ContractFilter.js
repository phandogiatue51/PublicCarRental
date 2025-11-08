import React, { useState, useEffect, useMemo } from 'react';
import {
  Flex,
  FormControl,
  Select,
  HStack,
  Button,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  useToast,
  Box,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { MdFilterList, MdClear, MdSearch } from 'react-icons/md';
import { renterAPI, vehicleAPI } from '../../../services/api';

const ContractFilters = ({
  filters,
  filterOptions,
  onFilterChange,
  onApplyFilter,
  onClearFilter,
  isFilterActive,
  loading,
  stationId,
}) => {
  const [isRenterModalOpen, setIsRenterModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [renters, setRenters] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedRenter, setSelectedRenter] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [renterSearchTerm, setRenterSearchTerm] = useState('');
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');
  const [loadingRenters, setLoadingRenters] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const toast = useToast();
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  // Load renters when modal opens
  useEffect(() => {
    if (isRenterModalOpen) {
      const loadRenters = async () => {
        try {
          setLoadingRenters(true);
          const res = await renterAPI.getAll();
          setRenters(res || []);
        } catch (err) {
          console.error('Error fetching renters:', err);
          toast({
            title: 'Error',
            description: 'Failed to load renters',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        } finally {
          setLoadingRenters(false);
        }
      };
      loadRenters();
    } else {
      setRenterSearchTerm('');
    }
  }, [isRenterModalOpen, toast]);

  // Load vehicles when modal opens
  useEffect(() => {
    if (isVehicleModalOpen) {
      const loadVehicles = async () => {
        try {
          setLoadingVehicles(true);
          const res = await vehicleAPI.filter({ stationId: stationId });
          setVehicles(res || []);
        } catch (err) {
          console.error('Error fetching vehicles:', err);
          toast({
            title: 'Error',
            description: 'Failed to load vehicles',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        } finally {
          setLoadingVehicles(false);
        }
      };
      loadVehicles();
    } else {
      setVehicleSearchTerm('');
    }
  }, [isVehicleModalOpen, stationId, toast]);

  // Filter renters by search term
  const filteredRenters = useMemo(() => {
    if (!renterSearchTerm.trim()) return renters;
    const search = renterSearchTerm.toLowerCase();
    return renters.filter(r => {
      const name = (r.fullName || r.name || '').toLowerCase();
      const email = (r.email || '').toLowerCase();
      const id = (r.renterId || r.id || '').toString().toLowerCase();
      return name.includes(search) || email.includes(search) || id.includes(search);
    });
  }, [renters, renterSearchTerm]);

  // Filter vehicles by search term
  const filteredVehicles = useMemo(() => {
    if (!vehicleSearchTerm.trim()) return vehicles;
    const search = vehicleSearchTerm.toLowerCase();
    return vehicles.filter(v => {
      const licensePlate = (v.licensePlate || v.vehicleLicensePlate || '').toLowerCase();
      const modelName = (v.modelName || v.model?.name || '').toLowerCase();
      const id = (v.vehicleId || v.id || '').toString().toLowerCase();
      return licensePlate.includes(search) || modelName.includes(search) || id.includes(search);
    });
  }, [vehicles, vehicleSearchTerm]);

  // Update selected renter/vehicle when filters change
  useEffect(() => {
    if (filters.renterId) {
      const renter = filterOptions.renters.find(r =>
        (r.renterId || r.id)?.toString() === filters.renterId.toString()
      );
      setSelectedRenter(renter || null);
    } else {
      setSelectedRenter(null);
    }
  }, [filters.renterId, filterOptions.renters]);

  useEffect(() => {
    if (filters.vehicleId) {
      const vehicle = filterOptions.vehicles?.find(v =>
        (v.vehicleId || v.id)?.toString() === filters.vehicleId.toString()
      );
      setSelectedVehicle(vehicle || null);
    } else {
      setSelectedVehicle(null);
    }
  }, [filters.vehicleId, filterOptions.vehicles]);

  const handleRenterSelect = (renter) => {
    const renterId = (renter.renterId || renter.id)?.toString();
    onFilterChange('renterId', renterId);
    setSelectedRenter(renter);
    setIsRenterModalOpen(false);
  };

  const handleVehicleSelect = (vehicle) => {
    const vehicleId = (vehicle.vehicleId || vehicle.id)?.toString();
    onFilterChange('vehicleId', vehicleId);
    setSelectedVehicle(vehicle);
    setIsVehicleModalOpen(false);
  };

  const handleClearRenter = () => {
    onFilterChange('renterId', '');
    setSelectedRenter(null);
  };

  const handleClearVehicle = () => {
    onFilterChange('vehicleId', '');
    setSelectedVehicle(null);
  };

  return (
    <>
      <Flex gap={3} wrap="wrap" align="center">
        {/* Status Filter */}
        <FormControl flex={1}>
          <Select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            placeholder="All Status"
            size="sm"
          >
            {filterOptions.statuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </FormControl>

        {/* Date Filters */}
        <FormControl flex={1}>
          <Input
            type="date"
            placeholder="Start Date"
            value={filters.startDate || ''}
            onChange={(e) => onFilterChange('startDate', e.target.value)}
            size="sm"
          />
        </FormControl>

        <FormControl width="180px">
          <Input
            type="date"
            placeholder="End Date"
            value={filters.endDate || ''}
            onChange={(e) => onFilterChange('endDate', e.target.value)}
            size="sm"
          />
        </FormControl>

        {/* Renter Button */}
        <Button
          flex={1}
          size="sm"
          border="1px solid"
          borderColor="gray.300"
          onClick={() => setIsRenterModalOpen(true)}
          variant={selectedRenter ? "solid" : "outline"}
          colorScheme={selectedRenter ? "yellow" : "yellow"}
        >
          {selectedRenter
            ? `Renter: ${selectedRenter.fullName || selectedRenter.name || selectedRenter.email} (${selectedRenter.renterId || selectedRenter.id})`
            : 'Select Renter'}
        </Button>
        {selectedRenter && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearRenter}
            colorScheme="red"
          >
            ×
          </Button>
        )}

        {/* Vehicle Button */}
        <Button
          flex={1}
          size="sm"
          border="1px solid"
          borderColor="gray.300"
          onClick={() => setIsVehicleModalOpen(true)}
          variant={selectedVehicle ? "solid" : "outline"}
          colorScheme={selectedVehicle ? "purple" : "purple"}
        >
          {selectedVehicle
            ? `Vehicle: ${selectedVehicle.licensePlate || selectedVehicle.vehicleLicensePlate} (${selectedVehicle.vehicleId || selectedVehicle.id})`
            : 'Select Vehicle'}
        </Button>
        {selectedVehicle && (
          <Button
            size="sm"
            border="1px solid"
            variant="ghost"
            onClick={handleClearVehicle}
            colorScheme="red"
          >
            ×
          </Button>
        )}

        {/* Action Buttons */}
        <HStack>
          <Button
            leftIcon={<Icon as={MdFilterList} />}
            colorScheme="blue"
            onClick={onApplyFilter}
            isDisabled={loading}
            size="sm"
          >
            Apply Filters
          </Button>
          <Button
            leftIcon={<Icon as={MdClear} />}
            variant="outline"
            onClick={onClearFilter}
            isDisabled={loading || !isFilterActive}
            size="sm"
          >
            Clear
          </Button>
        </HStack>
      </Flex>

      {/* Renter Select Modal */}
      <Modal
        isOpen={isRenterModalOpen}
        onClose={() => setIsRenterModalOpen(false)}
        size="2xl"
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent maxH="85vh">
          <ModalHeader
            fontSize="xl"
            fontWeight="700"
            color={textColor}
            borderBottom="1px"
            borderColor={borderColor}
            pb={4}
          >
            Select Renter
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} pt={4}>
            {/* Search Box */}
            <InputGroup mb={4}>
              <InputLeftElement pointerEvents="none">
                <Icon as={MdSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search by name, email, or ID..."
                value={renterSearchTerm}
                onChange={(e) => setRenterSearchTerm(e.target.value)}
                size="md"
                borderRadius="md"
              />
            </InputGroup>

            {/* Table */}
            <Box
              border="1px"
              borderColor={borderColor}
              borderRadius="md"
              overflow="hidden"
            >
              <Table variant="simple" size="md">
                <Thead bg="gray.50">
                  <Tr>
                    <Th width="80px" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase">
                      ID
                    </Th>
                    <Th fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase">
                      Name
                    </Th>
                    <Th fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase">
                      Email
                    </Th>
                    <Th width="100px" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" textAlign="center">
                      Action
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {loadingRenters ? (
                    <Tr>
                      <Td colSpan={4} textAlign="center" py={8}>
                        <Spinner size="md" color="blue.500" />
                        <Text mt={2} color="gray.500" fontSize="sm">
                          Loading renters...
                        </Text>
                      </Td>
                    </Tr>
                  ) : filteredRenters.length === 0 ? (
                    <Tr>
                      <Td colSpan={4} textAlign="center" py={8}>
                        <Text color="gray.500" fontSize="sm">
                          {renterSearchTerm ? 'No renters found matching your search' : 'No renters available'}
                        </Text>
                      </Td>
                    </Tr>
                  ) : (
                    filteredRenters.map((r) => (
                      <Tr
                        key={r.renterId || r.id}
                        _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                        transition="background 0.2s"
                      >
                        <Td>
                          <Text fontWeight="600" color={textColor} fontSize="sm">
                            {r.renterId || r.id}
                          </Text>
                        </Td>
                        <Td>
                          <Text
                            color={textColor}
                            fontSize="sm"
                            fontWeight="500"
                            noOfLines={1}
                            title={r.fullName || r.name || 'N/A'}
                          >
                            {r.fullName || r.name || 'N/A'}
                          </Text>
                        </Td>
                        <Td>
                          <Text
                            color="gray.600"
                            fontSize="sm"
                            noOfLines={1}
                            title={r.email || 'N/A'}
                          >
                            {r.email || 'N/A'}
                          </Text>
                        </Td>
                        <Td textAlign="center">
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleRenterSelect(r)}
                            borderRadius="md"
                            fontWeight="500"
                          >
                            Choose
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>

            {/* Results count */}
            {!loadingRenters && filteredRenters.length > 0 && (
              <Text mt={3} fontSize="xs" color="gray.500" textAlign="right">
                Showing {filteredRenters.length} of {renters.length} renters
                {renterSearchTerm && ` matching "${renterSearchTerm}"`}
              </Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Vehicle Select Modal */}
      <Modal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        size="2xl"
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent maxH="85vh">
          <ModalHeader
            fontSize="xl"
            fontWeight="700"
            color={textColor}
            borderBottom="1px"
            borderColor={borderColor}
            pb={4}
          >
            Select Vehicle
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} pt={4}>
            {/* Search Box */}
            <InputGroup mb={4}>
              <InputLeftElement pointerEvents="none">
                <Icon as={MdSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search by license plate, model, or ID..."
                value={vehicleSearchTerm}
                onChange={(e) => setVehicleSearchTerm(e.target.value)}
                size="md"
                borderRadius="md"
              />
            </InputGroup>

            {/* Table */}
            <Box
              border="1px"
              borderColor={borderColor}
              borderRadius="md"
              overflow="hidden"
            >
              <Table variant="simple" size="md">
                <Thead bg="gray.50">
                  <Tr>
                    <Th width="80px" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase">
                      ID
                    </Th>
                    <Th fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase">
                      License Plate
                    </Th>
                    <Th fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase">
                      Model
                    </Th>
                    <Th width="100px" fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" textAlign="center">
                      Action
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {loadingVehicles ? (
                    <Tr>
                      <Td colSpan={4} textAlign="center" py={8}>
                        <Spinner size="md" color="blue.500" />
                        <Text mt={2} color="gray.500" fontSize="sm">
                          Loading vehicles...
                        </Text>
                      </Td>
                    </Tr>
                  ) : filteredVehicles.length === 0 ? (
                    <Tr>
                      <Td colSpan={4} textAlign="center" py={8}>
                        <Text color="gray.500" fontSize="sm">
                          {vehicleSearchTerm ? 'No vehicles found matching your search' : 'No vehicles available'}
                        </Text>
                      </Td>
                    </Tr>
                  ) : (
                    filteredVehicles.map((v) => (
                      <Tr
                        key={v.vehicleId || v.id}
                        _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                        transition="background 0.2s"
                      >
                        <Td>
                          <Text fontWeight="600" color={textColor} fontSize="sm">
                            {v.vehicleId || v.id}
                          </Text>
                        </Td>
                        <Td>
                          <Text
                            color={textColor}
                            fontSize="sm"
                            fontWeight="500"
                            noOfLines={1}
                          >
                            {v.licensePlate || v.vehicleLicensePlate}
                          </Text>
                        </Td>
                        <Td>
                          <Text
                            color="gray.600"
                            fontSize="sm"
                            noOfLines={1}
                            title={v.modelName || v.model?.name || 'N/A'}
                          >
                            {v.modelName || v.model?.name || 'N/A'}
                          </Text>
                        </Td>
                        <Td textAlign="center">
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleVehicleSelect(v)}
                            borderRadius="md"
                            fontWeight="500"
                          >
                            Choose
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>

            {/* Results count */}
            {!loadingVehicles && filteredVehicles.length > 0 && (
              <Text mt={3} fontSize="xs" color="gray.500" textAlign="right">
                Showing {filteredVehicles.length} of {vehicles.length} vehicles
                {vehicleSearchTerm && ` matching "${vehicleSearchTerm}"`}
              </Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ContractFilters;