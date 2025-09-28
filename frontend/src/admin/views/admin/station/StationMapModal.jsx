/* eslint-disable */

import {
  Modal,  ModalOverlay,  ModalContent,  ModalHeader,  ModalFooter,  ModalBody,  ModalCloseButton,  Button,  VStack,  HStack,
  Text,  Box,  Badge,  Icon,  Divider,  Alert,  AlertIcon,  AlertDescription
} from '@chakra-ui/react';
import { MdLocationOn, MdDirectionsCar, MdPeople, MdMap } from 'react-icons/md';

export default function StationMapModal({ isOpen, onClose, station = null }) {
  if (!station) return null;

  const handleOpenInMaps = () => {
    const url = `https://www.google.com/maps?q=${station.latitude},${station.longitude}`;
    window.open(url, '_blank');
  };

  const handleCopyCoordinates = () => {
    const coordinates = `${station.latitude}, ${station.longitude}`;
    navigator.clipboard.writeText(coordinates);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>
          <HStack spacing={2}>
            <Icon as={MdMap} color="blue.500" />
            <Text>Station Location</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Station Info */}
            <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
              <VStack spacing={3} align="start">
                <HStack spacing={2}>
                  <Icon as={MdLocationOn} color="blue.500" />
                  <Text fontSize="lg" fontWeight="bold">
                    {station.name}
                  </Text>
                </HStack>
                
                <Text color="gray.600" fontSize="sm">
                  {station.address}
                </Text>
                
                <HStack spacing={4}>
                  <HStack spacing={1}>
                    <Icon as={MdDirectionsCar} color="green.500" />
                    <Text fontSize="sm" color="gray.600">Vehicles:</Text>
                    <Badge colorScheme="green">{station.vehicleCount}</Badge>
                  </HStack>
                  
                  <HStack spacing={1}>
                    <Icon as={MdPeople} color="blue.500" />
                    <Text fontSize="sm" color="gray.600">Staff:</Text>
                    <Badge colorScheme="blue">{station.staffCount}</Badge>
                  </HStack>
                </HStack>
              </VStack>
            </Box>

            {/* Coordinates */}
            <Box p={4} bg="gray.50" borderRadius="md">
              <VStack spacing={2} align="start">
                <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                  Coordinates
                </Text>
                <HStack spacing={4}>
                  <Text fontSize="sm" color="gray.600">
                    <strong>Latitude:</strong> {station.latitude.toFixed(6)}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    <strong>Longitude:</strong> {station.longitude.toFixed(6)}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Map Placeholder */}
            <Box 
              height="300px" 
              bg="gray.100" 
              borderRadius="md" 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
              border="2px dashed"
              borderColor="gray.300"
            >
              <VStack spacing={2}>
                <Icon as={MdMap} boxSize={12} color="gray.400" />
                <Text color="gray.500" fontSize="sm">
                  Map View (Integration with Google Maps/OpenStreetMap)
                </Text>
                <Text color="gray.400" fontSize="xs">
                  Click "Open in Maps" to view the exact location
                </Text>
              </VStack>
            </Box>

            {/* Help Text */}
            <Alert status="info" size="sm">
              <AlertIcon />
              <AlertDescription>
                This station is located at coordinates {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}. 
                Click "Open in Maps" to view the exact location on Google Maps.
              </AlertDescription>
            </Alert>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={2}>
            <Button variant="outline" onClick={handleCopyCoordinates}>
              Copy Coordinates
            </Button>
            <Button colorScheme="blue" onClick={handleOpenInMaps} leftIcon={<Icon as={MdMap} />}>
              Open in Maps
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
