/* eslint-disable */

import {
  Modal,  ModalOverlay,  ModalContent,  ModalHeader,  ModalFooter,  ModalBody,  ModalCloseButton,  Button,  VStack,  HStack,
  Text,  Box,  Badge,  Icon,  Divider,  Alert,  AlertIcon,  AlertDescription,  Grid,  GridItem
} from '@chakra-ui/react';
import { 
  MdPerson,   MdEmail,   MdPhone,   MdCreditCard,  MdDriveEta,   MdToggleOn,   MdToggleOff,  MdInfo
} from 'react-icons/md';

export default function RenterDetailModal({ isOpen, onClose, renter = null }) {
  if (!renter) return null;

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 0: return 'green'; // Active
      case 1: return 'red';   // Inactive
      case 2: return 'orange'; // Suspended
      default: return 'gray';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 0: return 'Active';
      case 1: return 'Inactive';
      default: return 'Unknown';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent maxW="600px">
        <ModalHeader>
          <HStack spacing={2}>
            <Icon as={MdPerson} color="blue.500" />
            <Text>Renter Details #{renter.renterId}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <Box p={6} border="1px solid" borderColor="gray.200" borderRadius="lg" bg="gray.50">
              <VStack spacing={4} align="start">
                {/* Header with Name and Status */}
                <HStack spacing={4} width="100%" justify="space-between">
                  <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                    {renter.fullName}
                  </Text>
                  <Badge
                    variant="subtle"
                    colorScheme={getStatusColor(renter.status)}
                    fontSize="md"
                    fontWeight="600"
                    px={3}
                    py={1}
                  >
                    {getStatusText(renter.status)}
                  </Badge>
                </HStack>

                <Divider />

                {/* Contact Information */}
                <Box width="100%">
                  <Text fontSize="lg" fontWeight="semibold" color="gray.700" mb={3}>
                    Contact Information
                  </Text>
                  
                  <Grid templateColumns="repeat(1, 1fr)" gap={3}>
                    <GridItem>
                      <HStack spacing={3}>
                        <Icon as={MdEmail} color="blue.500" boxSize={5} />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" color="gray.500">Email</Text>
                          <Text fontSize="md" fontWeight="500">{renter.email}</Text>
                        </VStack>
                      </HStack>
                    </GridItem>
                    
                    <GridItem>
                      <HStack spacing={3}>
                        <Icon as={MdPhone} color="green.500" boxSize={5} />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" color="gray.500">Phone Number</Text>
                          <Text fontSize="md" fontWeight="500">{renter.phoneNumber}</Text>
                        </VStack>
                      </HStack>
                    </GridItem>
                  </Grid>
                </Box>

                <Divider />

                {/* Identity Information */}
                <Box width="100%">
                  <Text fontSize="lg" fontWeight="semibold" color="gray.700" mb={3}>
                    Identity Information
                  </Text>
                  
                  <Grid templateColumns="repeat(1, 1fr)" gap={3}>
                    <GridItem>
                      <HStack spacing={3}>
                        <Icon as={MdCreditCard} color="purple.500" boxSize={5} />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" color="gray.500">Identity Card Number</Text>
                          <Text fontSize="md" fontWeight="500">{renter.identityCardNumber}</Text>
                        </VStack>
                      </HStack>
                    </GridItem>
                    
                    <GridItem>
                      <HStack spacing={3}>
                        <Icon as={MdDriveEta} color="orange.500" boxSize={5} />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" color="gray.500">Driver's License</Text>
                          <Text fontSize="md" fontWeight="500">
                            {renter.licenseNumber || 'No License Provided'}
                          </Text>
                        </VStack>
                      </HStack>
                    </GridItem>
                  </Grid>
                </Box>
              </VStack>
            </Box>
           
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
