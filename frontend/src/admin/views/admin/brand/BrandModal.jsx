/* eslint-disable */

import {
  Modal,  ModalOverlay,  ModalContent,  ModalHeader,  ModalFooter,  ModalBody,  ModalCloseButton,  Button,  FormControl,
  FormLabel,  Input,  useToast
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { brandAPI } from '../../../../services/api';

export default function BrandModal({ isOpen, onClose, onSuccess, brand = null, isEdit = false }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingBrand, setFetchingBrand] = useState(false);
  const toast = useToast();

  // Fetch brand data when editing
  useEffect(() => {
    if (isOpen && isEdit && brand?.brandId) {
      fetchBrandData();
    } else if (isOpen && !isEdit) {
      // Reset form for add mode
      setName('');
    }
  }, [isOpen, isEdit, brand?.brandId]);

  const fetchBrandData = async () => {
    try {
      setFetchingBrand(true);
      const brandData = await brandAPI.getById(brand.brandId);
      setName(brandData.name || '');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch brand data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setFetchingBrand(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Brand name is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      
      if (isEdit) {
        const response = await brandAPI.update(brand.brandId, { name: name.trim() });
        toast({
          title: 'Success',
          description: response.message || 'Brand updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const response = await brandAPI.create({ name: name.trim() });
        toast({
          title: 'Success',
          description: response.message || 'Brand created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      onSuccess();
      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isEdit ? 'update' : 'create'} brand`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setFetchingBrand(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isEdit ? 'Edit Brand' : 'Add New Brand'}</ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>Brand Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={fetchingBrand ? "Loading brand data..." : "Enter brand name"}
                maxLength={100}
                isDisabled={fetchingBrand}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose} disabled={loading || fetchingBrand}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              type="submit" 
              isLoading={loading}
              loadingText={isEdit ? 'Updating...' : 'Creating...'}
              isDisabled={fetchingBrand}
            >
              {fetchingBrand ? 'Loading...' : (isEdit ? 'Update' : 'Create')} Brand
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
