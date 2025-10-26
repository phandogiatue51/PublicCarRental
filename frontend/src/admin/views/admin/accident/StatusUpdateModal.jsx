import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, 
  ModalBody, ModalCloseButton, Button, FormControl, FormLabel, 
  Select, useToast, VStack, Text, Badge
} from '@chakra-ui/react';
import { useState } from 'react';
import { accidentAPI } from '../../../../services/api';

const statusOptions = [
  { value: 'Reported', label: 'Reported' },
  { value: 'UnderInvestigation', label: 'Under Investigation' },
  { value: 'RepairApproved', label: 'Repair Approved' },
  { value: 'UnderRepair', label: 'Under Repair' },
  { value: 'Repaired', label: 'Repaired' }
];

const getStatusColor = (status) => {
  const colors = {
    Reported: 'blue',
    UnderInvestigation: 'orange',
    RepairApproved: 'yellow',
    UnderRepair: 'purple',
    Repaired: 'green'
  };
  return colors[status] || 'gray';
};

export default function StatusUpdateModal({ isOpen, onClose, onSuccess, accident = null }) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useState(() => {
    if (isOpen && accident) {
      setSelectedStatus(accident.status);
    }
  }, [isOpen, accident]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStatus) {
      toast({
        title: 'Validation Error',
        description: 'Please select a status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await accidentAPI.updateReportStatus(accident.accidentId, selectedStatus);
      
      toast({
        title: 'Success',
        description: response.message || 'Status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onSuccess();
      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus('');
    onClose();
  };

  if (!accident) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Update Accident Report Status</ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                <strong>Report ID:</strong> #{accident.accidentId}
              </Text>
              <Text>
                <strong>Vehicle ID:</strong> VEH-{accident.vehicleId}
              </Text>
              <Text>
                <strong>Current Status:</strong>{' '}
                <Badge colorScheme={getStatusColor(accident.status)} ml={2}>
                  {accident.status.replace(/([A-Z])/g, ' $1').trim()}
                </Badge>
              </Text>
              
              <FormControl isRequired>
                <FormLabel>New Status</FormLabel>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  placeholder="Select status"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              type="submit" 
              isLoading={loading}
              loadingText="Updating..."
            >
              Update Status
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}