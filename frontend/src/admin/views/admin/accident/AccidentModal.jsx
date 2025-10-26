import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, 
  ModalBody, ModalCloseButton, Button, FormControl, FormLabel, 
  Input, Textarea, Select, useToast, VStack, HStack, 
  Text, Box, Image, FormErrorMessage
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { accidentAPI } from '../../../../services/api';

export default function AccidentModal({ isOpen, onClose, onSuccess, accident = null, isEdit = false }) {
  const [formData, setFormData] = useState({
    reportType: 'vehicle',
    vehicleId: '',
    contractId: '',
    staffId: '',
    description: '',
    location: '',
    imageUrl: null
  });
  const [loading, setLoading] = useState(false);
  const [fetchingAccident, setFetchingAccident] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const toast = useToast();

  // Fetch accident data when editing
  useEffect(() => {
    if (isOpen && isEdit && accident?.accidentId) {
      fetchAccidentData();
    } else if (isOpen && !isEdit) {
      // Reset form for add mode
      setFormData({
        reportType: 'vehicle',
        vehicleId: '',
        contractId: '',
        staffId: '',
        description: '',
        location: '',
        imageUrl: null
      });
      setImagePreview(null);
    }
  }, [isOpen, isEdit, accident?.accidentId]);

  const fetchAccidentData = async () => {
    try {
      setFetchingAccident(true);
      const accidentData = await accidentAPI.getById(accident.accidentId);
      setFormData({
        reportType: accidentData.contractId ? 'contract' : 'vehicle',
        vehicleId: accidentData.vehicleId || '',
        contractId: accidentData.contractId || '',
        staffId: accidentData.staffId || '',
        description: accidentData.description || '',
        location: accidentData.location || '',
        imageUrl: null
      });
      if (accidentData.imageUrl) {
        setImagePreview(accidentData.imageUrl);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch accident data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setFetchingAccident(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file',
          description: 'Please select an image file',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setFormData(prev => ({ ...prev, imageUrl: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.vehicleId) {
      toast({
        title: 'Validation Error',
        description: 'Vehicle ID is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!formData.staffId) {
      toast({
        title: 'Validation Error',
        description: 'Staff ID is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (formData.reportType === 'contract' && !formData.contractId) {
      toast({
        title: 'Validation Error',
        description: 'Contract ID is required for contract reports',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      
      const submitData = new FormData();
      submitData.append('vehicleId', formData.vehicleId);
      submitData.append('staffId', formData.staffId);
      
      if (formData.contractId) {
        submitData.append('contractId', formData.contractId);
      }
      
      if (formData.description) {
        submitData.append('description', formData.description);
      }
      
      if (formData.location) {
        submitData.append('location', formData.location);
      }
      
      if (formData.imageUrl) {
        submitData.append('imageUrl', formData.imageUrl);
      }

      let response;
      if (formData.reportType === 'contract') {
        response = await accidentAPI.createContractReport(submitData);
      } else {
        response = await accidentAPI.createVehicleReport(submitData);
      }
      
      toast({
        title: 'Success',
        description: response.message || 'Accident report created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onSuccess();
      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create accident report',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      reportType: 'vehicle',
      vehicleId: '',
      contractId: '',
      staffId: '',
      description: '',
      location: '',
      imageUrl: null
    });
    setImagePreview(null);
    setFetchingAccident(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isEdit ? 'Accident Report Details' : 'Create New Accident Report'}
        </ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              {!isEdit && (
                <FormControl>
                  <FormLabel>Report Type</FormLabel>
                  <Select
                    value={formData.reportType}
                    onChange={(e) => handleInputChange('reportType', e.target.value)}
                  >
                    <option value="vehicle">Vehicle Accident</option>
                    <option value="contract">Contract Accident</option>
                  </Select>
                </FormControl>
              )}

              <FormControl isRequired>
                <FormLabel>Vehicle ID</FormLabel>
                <Input
                  type="number"
                  value={formData.vehicleId}
                  onChange={(e) => handleInputChange('vehicleId', e.target.value)}
                  placeholder="Enter vehicle ID"
                  isDisabled={isEdit || fetchingAccident}
                />
              </FormControl>

              {formData.reportType === 'contract' && (
                <FormControl isRequired={formData.reportType === 'contract'}>
                  <FormLabel>Contract ID</FormLabel>
                  <Input
                    type="number"
                    value={formData.contractId}
                    onChange={(e) => handleInputChange('contractId', e.target.value)}
                    placeholder="Enter contract ID"
                    isDisabled={isEdit || fetchingAccident}
                  />
                </FormControl>
              )}

              <FormControl isRequired>
                <FormLabel>Staff ID</FormLabel>
                <Input
                  type="number"
                  value={formData.staffId}
                  onChange={(e) => handleInputChange('staffId', e.target.value)}
                  placeholder="Enter staff ID"
                  isDisabled={isEdit || fetchingAccident}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Location</FormLabel>
                <Input
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter accident location"
                  isDisabled={isEdit || fetchingAccident}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the accident details..."
                  rows={3}
                  isDisabled={isEdit || fetchingAccident}
                />
              </FormControl>

              {!isEdit && (
                <FormControl>
                  <FormLabel>Accident Image</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <FormErrorMessage>Please select a valid image file (max 5MB)</FormErrorMessage>
                  
                  {imagePreview && (
                    <Box mt={2}>
                      <Text fontSize="sm" mb={2}>Image Preview:</Text>
                      <Image
                        src={imagePreview}
                        alt="Accident preview"
                        maxH="200px"
                        objectFit="contain"
                        borderRadius="md"
                      />
                    </Box>
                  )}
                </FormControl>
              )}

              {isEdit && imagePreview && (
                <FormControl>
                  <FormLabel>Current Image</FormLabel>
                  <Image
                    src={imagePreview}
                    alt="Current accident image"
                    maxH="200px"
                    objectFit="contain"
                    borderRadius="md"
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button 
                variant="ghost" 
                onClick={handleClose} 
                disabled={loading || fetchingAccident}
              >
                {isEdit ? 'Close' : 'Cancel'}
              </Button>
              {!isEdit && (
                <Button 
                  colorScheme="blue" 
                  type="submit" 
                  isLoading={loading}
                  loadingText="Creating..."
                  isDisabled={fetchingAccident}
                >
                  Create Report
                </Button>
              )}
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}