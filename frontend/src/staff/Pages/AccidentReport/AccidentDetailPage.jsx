import {
  Container, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, Button, VStack, HStack, Divider,
  Alert, AlertIcon, Spinner, useToast, Box, Text
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import { accidentAPI } from '../../../services/api';
import VehicleReplacementPreview from './../../../admin/views/admin/accident/VehicleReplacementPreview';
import { useParams, useNavigate } from 'react-router-dom';
import AccidentHeader from './AccidentDetails/AccidentHeader';
import AdminResolutionPanel from './AccidentDetails/AdminResolutionPanel';
import VehicleInfo from './AccidentDetails/VehicleInfo';
import DescriptionSection from './AccidentDetails/DescriptionSection';
import ReportSummary from './AccidentDetails/ReportSummary';
import ResolutionDetails from './AccidentDetails/ResolutionNotes';

export default function AccidentDetailsPage() {
  const { accidentId } = useParams();
  const [accidentDetails, setAccidentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [actionType, setActionType] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const toast = useToast();
  const [showReplacementPreview, setShowReplacementPreview] = useState(false);
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const navigate = useNavigate();
  const backPath = isAdmin ? '/admin/issue' : '/staff/issues';
  const fetchAccidentDetails = useCallback(async () => {
    if (!accidentId) return;

    setLoading(true);
    setError('');

    try {
      const details = await accidentAPI.getById(parseInt(accidentId));
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
  }, [accidentId]);
  useEffect(() => {
    if (accidentId) {
      fetchAccidentDetails();
    }
  }, [accidentId, fetchAccidentDetails]);

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

      fetchAccidentDetails();

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

  return (
    <Container maxW="container.xl" py={8}>
      <Breadcrumb mb={6}>
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => navigate('/staff/issues')}>
            Issues
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <Text>Issue #{accidentId}</Text>
        </BreadcrumbItem>
      </Breadcrumb>

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
        <>
          <HStack spacing={6} align="start">
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

          <Flex justify="flex-start" mt={6} gap={3}>
            <Button 
                variant="outline" 
                onClick={() => navigate(backPath)}
            >
                Back to List
            </Button>

            {isAdmin && accidentDetails.status !== 4 && (
              <Button
                colorScheme="blue"
                onClick={handleAccidentUpdate}
                isLoading={updating}
                isDisabled={!selectedStatus || selectedStatus === accidentDetails.status.toString()}
              >
                Apply
              </Button>
            )}

            {isAdmin && accidentDetails.status === 0 && (
              <Button colorScheme="teal" onClick={handleShowPreview}>
                Preview Vehicle Replacement
              </Button>
            )}
          </Flex>
        </>
      )}
      <VehicleReplacementPreview
        isOpen={showReplacementPreview}
        onClose={() => setShowReplacementPreview(false)}
        accidentId={accidentDetails?.accidentId}
        onExecuteReplacement={() => {
          fetchAccidentDetails(); // Refresh page data after replacement
        }}
      />
    </Container>
  );
}