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

    // Validation logic
    if (!formData.fullName.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name is required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!isEdit && !formData.password.trim()) {
      toast({
        title: "Validation Error",
        description: "Password is required for new staff",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!formData.phoneNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Phone number is required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!formData.identityCardNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Identity card number is required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      const staffData = { ...formData };
      
      // Remove password if empty in edit mode
      if (isEdit && !staffData.password.trim()) {
        delete staffData.password;
      }
      
      // Convert stationId to number if it exists
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
              <FormControl isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder={fetchingStaff ? "Loading staff data..." : "Enter full name"}
                  maxLength={100}
                  isDisabled={fetchingStaff}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  isDisabled={fetchingStaff}
                />
              </FormControl>

              <FormControl isRequired={!isEdit}>
                <FormLabel>
                  Password {isEdit && "(Leave blank to keep current)"}
                </FormLabel>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder={isEdit ? "Enter new password (optional)" : "Enter password"}
                  isDisabled={fetchingStaff}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Phone Number</FormLabel>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter phone number"
                  isDisabled={fetchingStaff}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Identity Card Number</FormLabel>
                <Input
                  value={formData.identityCardNumber}
                  onChange={(e) => handleInputChange('identityCardNumber', e.target.value)}
                  placeholder="Enter identity card number"
                  isDisabled={fetchingStaff}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Station (Optional)</FormLabel>
                <Select
                  value={formData.stationId}
                  onChange={(e) => handleInputChange('stationId', e.target.value)}
                  placeholder="Select station"
                  isDisabled={fetchingStaff}
                >
                  {stations.map((station) => (
                    <option key={station.stationId} value={station.stationId}>
                      {station.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={handleClose}
              disabled={loading || fetchingStaff}
            >
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