import {
  Modal, Icon,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Flex,
  Spinner,
  Text,
  Grid,
  VStack,
  Image,
  FormControl,
  FormLabel,
  Input,
  Button,
  Box,
  useToast
} from "@chakra-ui/react";
import { useState } from "react";
import { documentAPI } from "../../../../services/api";
import { MdDescription, MdClose, MdAdd, MdCheckCircle, MdCancel } from "react-icons/md";
import Card from "../../../components/card/Card";

export default function StaffDocumentModals({
  isViewOpen,
  isAddOpen,
  selectedStaff,
  staffDocuments,
  staffDocsLoading,
  onViewClose,
  onAddClose,
  onAddDocuments,
  onDocumentsUploaded,
}) {
  const [staffDocumentForm, setStaffDocumentForm] = useState({
    identityCardFront: null,
    identityCardBack: null,
  });
  const [staffPreviewUrls, setStaffPreviewUrls] = useState({
    identityCardFront: null,
    identityCardBack: null,
  });
  const [staffUploading, setStaffUploading] = useState(false);
  const toast = useToast();

  const handleStaffFileChange = (field, file) => {
    if (staffPreviewUrls[field]) {
      URL.revokeObjectURL(staffPreviewUrls[field]);
    }

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setStaffPreviewUrls(prev => ({ ...prev, [field]: previewUrl }));
    } else {
      setStaffPreviewUrls(prev => ({ ...prev, [field]: null }));
    }

    setStaffDocumentForm(prev => ({ ...prev, [field]: file }));
  };

  const clearStaffPreview = (field) => {
    if (staffPreviewUrls[field]) {
      URL.revokeObjectURL(staffPreviewUrls[field]);
    }
    setStaffPreviewUrls(prev => ({ ...prev, [field]: null }));
    setStaffDocumentForm(prev => ({ ...prev, [field]: null }));
  };

  const handleUploadStaffDocuments = async () => {
    if (!selectedStaff) return;

    const hasFiles = Object.values(staffDocumentForm).some(file => file !== null);
    if (!hasFiles) {
      toast({
        title: "Error",
        description: "Please select at least one document to upload",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setStaffUploading(true);
      const formData = new FormData();
      
      if (staffDocumentForm.identityCardFront) {
        formData.append('IdentityCardFront', staffDocumentForm.identityCardFront);
      }
      if (staffDocumentForm.identityCardBack) {
        formData.append('IdentityCardBack', staffDocumentForm.identityCardBack);
      }

      await documentAPI.uploadStaffId(selectedStaff.staffId, formData);
      
      toast({
        title: "Success",
        description: "Staff documents uploaded successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      onDocumentsUploaded();
    } catch (err) {
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to upload staff documents",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setStaffUploading(false);
    }
  };

  const handleAddClose = () => {
    Object.values(staffPreviewUrls).forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    setStaffDocumentForm({ identityCardFront: null, identityCardBack: null });
    setStaffPreviewUrls({ identityCardFront: null, identityCardBack: null });
    onAddClose();
  };

  return (
    <>
      {/* View Documents Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" gap={2}>
              <MdDescription />
              Documents for {selectedStaff?.fullName}
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {staffDocsLoading ? (
              <Flex justify="center" align="center" minH="200px">
                <Spinner size="xl" />
                <Text ml={4}>Loading documents...</Text>
              </Flex>
            ) : staffDocuments.length > 0 ? (
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {staffDocuments.map((doc) => (
                  <Card key={doc.documentId}>
                    <Flex direction="column" p={4}>
                      <VStack spacing={3}>
                        <Image
                          src={doc.fileUrl}
                          alt={`Identity Card ${doc.side === 0 ? 'Front' : 'Back'}`}
                          borderRadius="md"
                          maxH="200px"
                          objectFit="contain"
                        />
                        <VStack spacing={1} align="stretch" w="100%">
                          <Text fontWeight="bold">
                            Identity Card {doc.side === 0 ? 'Front' : 'Back'}
                          </Text>
                          <Text fontSize="sm">Document #: {doc.documentNumber}</Text>
                          <Flex align="center" gap={2}>
                            <Icon 
                              as={doc.isVerified ? MdCheckCircle : MdCancel} 
                              color={doc.isVerified ? "green.500" : "red.500"} 
                            />
                           
                          </Flex>
                        </VStack>
                      </VStack>
                    </Flex>
                  </Card>
                ))}
              </Grid>
            ) : (
              <Flex direction="column" align="center" justify="center" minH="200px">
                <MdDescription size={48} color="gray" />
                <Text fontSize="lg" color="gray.500" mb={4}>
                  No documents found for this staff member
                </Text>
                <Button
                  colorScheme="blue"
                  onClick={() => {
                    onViewClose();
                    onAddDocuments(selectedStaff);
                  }}
                  leftIcon={<MdAdd />}
                >
                  Add Documents
                </Button>
              </Flex>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Add Documents Modal */}
      <Modal isOpen={isAddOpen} onClose={handleAddClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" gap={2}>
              <MdAdd />
              Add Identity Card for {selectedStaff?.fullName}
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={6}>
              <Card w="100%">
                <Flex direction="column" p={4}>
                  <Text fontWeight="bold" mb={4}>Identity Card</Text>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <FormControl>
                      <FormLabel>Front Side</FormLabel>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleStaffFileChange('identityCardFront', e.target.files[0])}
                      />
                      {staffPreviewUrls.identityCardFront && (
                        <Box mt={2} position="relative" display="inline-block">
                          <Image
                            src={staffPreviewUrls.identityCardFront}
                            alt="Identity Card Front Preview"
                            borderRadius="md"
                            maxH="150px"
                            objectFit="contain"
                            border="1px solid"
                            borderColor="gray.200"
                          />
                          <Button
                            size="xs"
                            colorScheme="red"
                            position="absolute"
                            top={1}
                            right={1}
                            onClick={() => clearStaffPreview('identityCardFront')}
                          >
                            <MdClose />
                          </Button>
                        </Box>
                      )}
                    </FormControl>
                    <FormControl>
                      <FormLabel>Back Side</FormLabel>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleStaffFileChange('identityCardBack', e.target.files[0])}
                      />
                      {staffPreviewUrls.identityCardBack && (
                        <Box mt={2} position="relative" display="inline-block">
                          <Image
                            src={staffPreviewUrls.identityCardBack}
                            alt="Identity Card Back Preview"
                            borderRadius="md"
                            maxH="150px"
                            objectFit="contain"
                            border="1px solid"
                            borderColor="gray.200"
                          />
                          <Button
                            size="xs"
                            colorScheme="red"
                            position="absolute"
                            top={1}
                            right={1}
                            onClick={() => clearStaffPreview('identityCardBack')}
                          >
                            <MdClose />
                          </Button>
                        </Box>
                      )}
                    </FormControl>
                  </Grid>
                </Flex>
              </Card>

              <Button
                colorScheme="blue"
                w="100%"
                onClick={handleUploadStaffDocuments}
                isLoading={staffUploading}
                loadingText="Uploading..."
              >
                Upload Identity Card
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}