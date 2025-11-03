import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Button, VStack, HStack, Divider,
  Alert, AlertIcon, Spinner, useToast, Box, Text
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import { accidentAPI } from '../../../services/api';
import VehicleReplacementPreview from './../../../admin/views/admin/accident/VehicleReplacementPreview/index';
// import StaffContractResolution from './StaffContractResolution'; // Comment out for now

// Import components
import AccidentHeader from './AccidentDetails/AccidentHeader';
import AdminResolutionPanel from './AccidentDetails/AdminResolutionPanel';
import VehicleInfo from './AccidentDetails/VehicleInfo';
import DescriptionSection from './AccidentDetails/DescriptionSection';
import ReportSummary from './AccidentDetails/ReportSummary';
import ResolutionDetails from './AccidentDetails/ResolutionNotes';

export default function AccidentViewModal({ isOpen, onClose, accident, onSuccess }) {
  const [accidentDetails, setAccidentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [actionType, setActionType] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const toast = useToast();
  const [showReplacementPreview, setShowReplacementPreview] = useState(false);
  // const [showStaffResolution, setShowStaffResolution] = useState(false); // Comment out for now
  // const [contractsNeedingResolution, setContractsNeedingResolution] = useState([]); // Comment out for now
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  const fetchAccidentDetails = useCallback(async () => {
    if (!accident) return;

    setLoading(true);
    setError('');

    try {
      const details = await accidentAPI.getById(accident.accidentId);
      setAccidentDetails(details);
      setSelectedStatus(details.status);
      setActionType('');
      setResolutionNote('');
    } catch (err) {
      console.error('Error fetching accident details:', err);
      setError('Failed to load accident details');
    } finally {
      setLoading(false);
    }
  }, [accident]);

  useEffect(() => {
    if (isOpen && accident?.accidentId) {
      fetchAccidentDetails();
    }
  }, [isOpen, accident?.accidentId, fetchAccidentDetails]);

  // Comment out staff resolution for now
  /*
  const getContractsNeedingResolution = async () => {
    if (!accidentDetails) return [];
    const result = await accidentAPI.getUnresolvedContracts(accidentDetails.accidentId);
    setContractsNeedingResolution(result.contracts);
    return result.contracts;
  };

  const handleStaffResolution = async () => {
    const contracts = await getContractsNeedingResolution();
    if (contracts.length > 0) {
      setShowStaffResolution(true);
    }
  };
  */

  const handleAccidentUpdate = async () => {
    if (!accidentDetails) return;

    setUpdating(true);
    setError('');

    try {
      const finalActionTaken = showActionTypeField && actionType
        ? parseInt(actionType)
        : accidentDetails.actionTaken;

      const finalResolutionNote = resolutionNote
        ? resolutionNote
        : accidentDetails.resolutionNote;

      const updateData = {
        status: parseInt(selectedStatus),
        actionTaken: finalActionTaken,
        resolutionNote: finalResolutionNote,
        resolvedAt: new Date().toISOString()
      };

      await accidentAPI.updateAccident(accidentDetails.accidentId, updateData);

      toast({
        title: 'Accident Updated',
        description: 'Accident has been resolved successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error updating accident:', err);
      setError('Failed to update accident');
      toast({
        title: 'Error',
        description: 'Failed to update accident',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleShowPreview = () => {
    setShowReplacementPreview(true);
  };

  const getStatusColor = (status) => {
    const colors = { 0: 'blue', 1: 'orange', 2: 'yellow', 3: 'purple', 4: 'green' };
    return colors[status] || 'gray';
  };

  const mapStatusNumberToString = (statusNumber) => {
    const statusMap = {
      0: 'Reported', 1: 'Under Investigation', 2: 'Repair Approved', 
      3: 'Under Repair', 4: 'Repaired'
    };
    return statusMap[statusNumber] || 'Reported';
  };

  const mapActionTypeToString = (actionType) => {
    const actionMap = { 0: 'Refund', 1: 'Replace', 2: 'RepairOnly' };
    return actionMap[actionType] || 'No Action';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleClose = () => {
    setAccidentDetails(null);
    setSelectedStatus('');
    setActionType('');
    setResolutionNote('');
    setError('');
    setLoading(false);
    setUpdating(false);
    onClose();
  };

  const getNextStatusOptions = (currentStatus) => {
    const statusOptions = [
      { value: 0, label: 'Reported' },
      { value: 1, label: 'Under Investigation' },
      { value: 2, label: 'Repair Approved' },
      { value: 3, label: 'Under Repair' },
      { value: 4, label: 'Repaired' }
    ];

    switch (currentStatus) {
      case 0: return statusOptions.filter(opt => opt.value === 2);
      case 2: return statusOptions.filter(opt => opt.value === 3);
      case 3: return statusOptions.filter(opt => opt.value === 4);
      case 4: return [];
      default: return statusOptions;
    }
  };

  const showActionTypeField = selectedStatus === '2';

  if (!accident) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="5xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Issue Report Details</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            {loading && (
              <Box textAlign="center" py={8}>
                <Spinner size="xl" />
                <Text mt={4}>Loading issue details...</Text>
              </Box>
            )}

            {error && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                {error}
              </Alert>
            )}

            {accidentDetails && !loading && (
              <HStack spacing={6} align="start">
                {/* Left Column: Textual Details */}
                <VStack spacing={4} align="stretch" flex={1}>
                  <AccidentHeader 
                    accidentDetails={accidentDetails}
                    getStatusColor={getStatusColor}
                    mapStatusNumberToString={mapStatusNumberToString}
                    formatDate={formatDate}
                  />

                  <Divider />

                  {isAdmin && accidentDetails.status !== 4 && (
                    <AdminResolutionPanel
                      selectedStatus={selectedStatus}
                      setSelectedStatus={setSelectedStatus}
                      actionType={actionType}
                      setActionType={setActionType}
                      resolutionNote={resolutionNote}
                      setResolutionNote={setResolutionNote}
                      getNextStatusOptions={getNextStatusOptions}
                      accidentDetails={accidentDetails}
                      showActionTypeField={showActionTypeField}
                    />
                  )}

                  {(accidentDetails?.resolutionNote || accidentDetails?.actionTaken !== null) &&
                    accidentDetails.status >= 2 && (
                      <ResolutionDetails 
                        accidentDetails={accidentDetails}
                        mapActionTypeToString={mapActionTypeToString}
                      />
                    )}

                  <VehicleInfo accidentDetails={accidentDetails} />
                  <DescriptionSection accidentDetails={accidentDetails} />
                </VStack>

                {/* Right Column: Image + Summary */}
                <VStack spacing={4} align="stretch" flex={1}>
                  <ReportSummary 
                    accidentDetails={accidentDetails} 
                    formatDate={formatDate} 
                  />
                </VStack>
              </HStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" mr={3} onClick={handleClose}>
              Close
            </Button>
            
            {isAdmin && accidentDetails && accidentDetails.status !== 4 && (
              <Button
                colorScheme="blue"
                onClick={handleAccidentUpdate}
                isLoading={updating}
                isDisabled={!selectedStatus || selectedStatus === accidentDetails.status.toString()}
              >
                Apply
              </Button>
            )}

            {isAdmin && accidentDetails && accidentDetails.status === 0 && (
              <Button colorScheme="teal" onClick={handleShowPreview} ml={3}>
                Preview Vehicle Replacement
              </Button>
            )}

            {/* Comment out staff button for now
            {!isAdmin && accidentDetails?.actionTaken === 1 && accidentDetails.status === 2 && (
              <Button colorScheme="orange" onClick={handleStaffResolution} ml={3}>
                Resolve Remaining Contracts ({contractsNeedingResolution.length})
              </Button>
            )}
            */}
          </ModalFooter>
        </ModalContent>
      </Modal>

      <VehicleReplacementPreview
        isOpen={showReplacementPreview}
        onClose={() => setShowReplacementPreview(false)}
        accidentId={accidentDetails?.accidentId}
        onExecuteReplacement={(result) => {
          fetchAccidentDetails();
          if (onSuccess) onSuccess();
        }}
      />

      {/* Comment out staff resolution modal for now
      <StaffContractResolution
        isOpen={showStaffResolution}
        onClose={() => setShowStaffResolution(false)}
        accidentId={accidentDetails?.accidentId}
        contracts={contractsNeedingResolution}
      />
      */}
    </>
  );
}