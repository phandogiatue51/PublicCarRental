import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Button,
  Select,
  useToast,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { staffAPI } from "../../../../services/api";

export default function StaffModal({
  isOpen,
  onClose,
  onSuccess,
  staff = null,
  isEdit = false,
  stations = [],
}) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    identityCardNumber: "",
    stationId: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetchingStaff, setFetchingStaff] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && isEdit && staff?.staffId) {
      fetchStaffData();
    } else if (isOpen && !isEdit) {
      resetForm();
    }
  }, [isOpen, isEdit, staff?.staffId]);

  const fetchStaffData = async () => {
    try {
      setFetchingStaff(true);
      const staffData = await staffAPI.getById(staff.staffId);
      setFormData({
        fullName: staffData.fullName || "",
        email: staffData.email || "",
        password: "",
        phoneNumber: staffData.phoneNumber || "",
        identityCardNumber: staffData.identityCardNumber || "",
        stationId: staffData.stationId || "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch staff data",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setFetchingStaff(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      password: "",
      phoneNumber: "",
      identityCardNumber: "",
      stationId: "",
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation logic here...
    
    try {
      setLoading(true);
      const staffData = { ...formData };
      if (!staffData.password.trim()) {
        delete staffData.password;
      }
      if (staffData.stationId) {
        staffData.stationId = parseInt(staffData.stationId);
      }

      if (isEdit) {
        await staffAPI.update(staff.staffId, staffData);
        toast({
          title: "Success",
          description: "Staff updated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        await staffAPI.create(staffData);
        toast({
          title: "Success",
          description: "Staff created successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }

      onSuccess();
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEdit ? "update" : "create"} staff`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setFetchingStaff(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isEdit ? "Edit Staff" : "Add New Staff"}</ModalHeader>
        <ModalCloseButton />

        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              {/* Form fields here - same as before */}
              <FormControl isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder={fetchingStaff ? "Loading staff data..." : "Enter full name"}
                  isDisabled={fetchingStaff}
                />
              </FormControl>
              {/* Add other form fields similarly */}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose} disabled={loading || fetchingStaff}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={loading}
              loadingText={isEdit ? "Updating..." : "Creating..."}
              isDisabled={fetchingStaff}
            >
              {fetchingStaff ? "Loading..." : isEdit ? "Update" : "Create"} Staff
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}