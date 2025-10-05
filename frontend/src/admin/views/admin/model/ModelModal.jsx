/* eslint-disable */

import {
  Modal,  ModalOverlay,  ModalContent,  ModalHeader,  ModalFooter,  ModalBody,  ModalCloseButton,  Button,  FormControl,  FormLabel,  Input,  Select,
  useToast,  Text,  VStack,  FormHelperText,  Box,  Image,  InputGroup,  InputRightElement,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { modelAPI, brandAPI, typeAPI } from '../../../../services/api';

export default function ModelModal({ isOpen, onClose, onSuccess, model = null, isEdit = false }) {
  const [name, setName] = useState('');
  const [brandId, setBrandId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingModel, setFetchingModel] = useState(false);
  const [brands, setBrands] = useState([]);
  const [types, setTypes] = useState([]);
  const [availableImages, setAvailableImages] = useState([]);
  const toast = useToast();

  // Fetch model data when editing
  useEffect(() => {
    if (isOpen && isEdit && model?.modelId) {
      fetchModelData();
    } else if (isOpen && !isEdit) {
      // Reset form for add mode
      resetForm();
    }
    
    // Always fetch brands and types when modal opens
    if (isOpen) {
      fetchBrandsAndTypes();
    }
  }, [isOpen, isEdit, model?.modelId]);

  const fetchModelData = async () => {
    try {
      setFetchingModel(true);
      const modelData = await modelAPI.getById(model.modelId);
      setName(modelData.name || '');
      setBrandId(modelData.brandId || '');
      setTypeId(modelData.typeId || '');
      setPricePerHour(modelData.pricePerHour || '');
      
      // Set image preview for existing model (for display only)
      if (modelData.imageUrl) {
        // If it's already a full URL (http/https), use it as is
        if (modelData.imageUrl.startsWith('http://') || modelData.imageUrl.startsWith('https://')) {
          setImagePreview(modelData.imageUrl);
        } else {
          // If it's a relative URL, prepend the API base URL
          const baseUrl = process.env.NODE_ENV === 'development' 
            ? 'https://localhost:7230'  // Backend URL
            : process.env.REACT_APP_API_URL || 'https://localhost:7230';
          setImagePreview(`${baseUrl}${modelData.imageUrl}`);
        }
      } else {
        setImagePreview('');
      }
      
      // Clear any selected file when loading existing data
      setSelectedImageFile(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch model data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setFetchingModel(false);
    }
  };

  const fetchBrandsAndTypes = async () => {
    try {
      const [brandsData, typesData, imagesData] = await Promise.all([
        brandAPI.getAll(),
        typeAPI.getAll(),
        modelAPI.getAvailableImages()
      ]);
      setBrands(brandsData || []);
      setTypes(typesData || []);
      setAvailableImages(imagesData || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch brands, types, and images',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const resetForm = () => {
    setName('');
    setBrandId('');
    setTypeId('');
    setPricePerHour('');
    setSelectedImageFile(null);
    setImagePreview('');
  };

  const handleImageFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImageFile(file);
      
      // Create preview URL for the new file
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      // If no file selected, clear the selection
      setSelectedImageFile(null);
      // Keep the existing preview if we're in edit mode and no new file is selected
      if (!isEdit) {
        setImagePreview('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Model name is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!brandId) {
      toast({
        title: 'Validation Error',
        description: 'Brand is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!typeId) {
      toast({
        title: 'Validation Error',
        description: 'Type is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!pricePerHour) {
      toast({
        title: 'Validation Error',
        description: 'Price per hour is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('Name', name.trim());
      formData.append('BrandId', brandId);
      formData.append('TypeId', typeId);
      formData.append('PricePerHour', pricePerHour);
      
      if (selectedImageFile) {
        formData.append('imageFile', selectedImageFile);
      }
      
      console.log('Sending FormData with file:', selectedImageFile?.name);
      
      if (isEdit) {
        const response = await modelAPI.update(model.modelId, formData);
        toast({
          title: 'Success',
          description: response.message || 'Model updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const response = await modelAPI.create(formData);
        toast({
          title: 'Success',
          description: response.message || 'Model created successfully',
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
        description: error.message || `Failed to ${isEdit ? 'update' : 'create'} model`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setFetchingModel(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isEdit ? 'Edit Model' : 'Add New Model'}</ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <FormControl isRequired mb={4}>
              <FormLabel>Model Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={fetchingModel ? "Loading model data..." : "Enter model name"}
                maxLength={100}
                isDisabled={fetchingModel}
              />
            </FormControl>

            <FormControl isRequired mb={4}>
              <FormLabel>Brand</FormLabel>
              <Select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                placeholder="Select brand"
                isDisabled={fetchingModel}
              >
                {brands.map((brand) => (
                  <option key={brand.brandId} value={brand.brandId}>
                    {brand.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired mb={4}>
              <FormLabel>Type</FormLabel>
              <Select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                placeholder="Select type"
                isDisabled={fetchingModel}
              >
                {types.map((type) => (
                  <option key={type.typeId} value={type.typeId}>
                    {type.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired mb={4}>
              <FormLabel>Price per Hour</FormLabel>
              <Input
                type="number"
                value={pricePerHour}
                onChange={(e) => setPricePerHour(e.target.value)}
                placeholder="Enter price per hour"
                min="1"
                isDisabled={fetchingModel}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Image (Optional)</FormLabel>
              
              <VStack spacing={3}>
                {/* File input for selecting images */}
                <InputGroup>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileSelect}
                    isDisabled={fetchingModel}
                    size="sm"
                    sx={{
                      '::file-selector-button': {
                        height: '32px',
                        padding: '0 12px',
                        marginRight: '12px',
                        background: 'blue.500',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'md',
                        cursor: 'pointer',
                        fontSize: 'sm',
                        fontWeight: 'medium',
                      },
                    }}
                  />
                </InputGroup>

                {/* Image preview */}
                {imagePreview && (
                  <Box width="100%">
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      Preview:
                    </Text>
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      maxH="150px"
                      objectFit="contain"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.200"
                    />
                  </Box>
                )}
              </VStack>
              
              <FormHelperText>
                Choose an image file from your computer. The image will be saved with the same filename in the image/models directory.
              </FormHelperText>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose} disabled={loading || fetchingModel}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              type="submit" 
              isLoading={loading}
              loadingText={isEdit ? 'Updating...' : 'Creating...'}
              isDisabled={fetchingModel}
            >
              {fetchingModel ? 'Loading...' : (isEdit ? 'Update' : 'Create')} Model
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
