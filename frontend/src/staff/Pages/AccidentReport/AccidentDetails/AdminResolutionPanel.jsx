import { Box, Text, FormControl, FormLabel, Select, Textarea } from '@chakra-ui/react';

export default function AdminResolutionPanel({ 
  selectedStatus, 
  setSelectedStatus, 
  actionType, 
  setActionType, 
  resolutionNote, 
  setResolutionNote, 
  getNextStatusOptions, 
  accidentDetails,
  showActionTypeField 
}) {
  return (
    <Box p={4} border="1px" borderColor="blue.200" borderRadius="md" bg="blue.50">
      <Text fontWeight="bold" fontSize="lg" mb={3}>Admin Resolution</Text>

      {/* Status Update - Hide if Repaired (status 4) */}
      {accidentDetails.status !== 4 && (
        <FormControl mb={3}>
          <FormLabel>Change Status</FormLabel>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            placeholder="Select next status"
          >
            {getNextStatusOptions(accidentDetails.status).map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>
      )}

      {showActionTypeField && (
        <FormControl mb={3}>
          <FormLabel>Action Type</FormLabel>
          <Select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            placeholder="Select action"
          >
            <option value="0">💰 Refund Contracts</option>
            <option value="1">🔄 Replace Vehicles</option>
            <option value="2">🛠️ Repair Only</option>
          </Select>
        </FormControl>
      )}

      {showActionTypeField && (
        <FormControl mb={3}>
          <FormLabel>Resolution Notes</FormLabel>
          <Textarea
            value={resolutionNote || accidentDetails?.resolutionNote || ''}
            onChange={(e) => setResolutionNote(e.target.value)}
            placeholder="Add resolution notes (Optional)(e.g., call repair team, contact customer, etc.)"
            size="sm"
          />
        </FormControl>
      )}
    </Box>
  );
}