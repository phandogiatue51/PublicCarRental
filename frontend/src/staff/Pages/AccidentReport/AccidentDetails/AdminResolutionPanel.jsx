import { Box, Text, FormControl, FormLabel, Select, Textarea, HStack, Button } from '@chakra-ui/react';

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
    <Box p={4} border="1px" bg="white" borderColor="gray.200" borderRadius="xl">
      <Text fontWeight="bold" fontSize="lg" mb={3}>Admin Resolution</Text>

      {accidentDetails.status !== 4 && (
        <FormControl mb={3}>
          <FormLabel>Select Status</FormLabel>
          <HStack spacing={3}>
            {getNextStatusOptions(accidentDetails.status).map(option => (
              <Button
                key={option.value}
                colorScheme={Number(selectedStatus) === option.value ? 'blue' : 'white'}
                variant={Number(selectedStatus) === option.value ? 'solid' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </HStack>
        </FormControl>

      )}

      {showActionTypeField && (
        <>
          <FormControl mb={3}>
            <FormLabel>Resolution Action</FormLabel>
            <HStack spacing={3}>
              <Button
                colorScheme="green"
                variant={actionType === '2' ? 'solid' : 'outline'}
                onClick={() => setActionType('2')}
                size="sm"
              >
                Repair Vehicle
              </Button>
              <Button
                colorScheme="red"
                variant={actionType === '0' ? 'solid' : 'outline'}
                onClick={() => setActionType('0')}
                size="sm"
              >
                Attempt to replace Model and Refund
              </Button>
            </HStack>
          </FormControl>

          <FormControl mb={3}>
            <FormLabel>Resolution Notes</FormLabel>
            <Textarea
              value={resolutionNote || accidentDetails?.resolutionNote || ''}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Add resolution notes (Optional)"
              size="sm"
              bg="white"
              borderRadius="xl"
              isDisabled={!!accidentDetails?.resolutionNote}
            />
          </FormControl>
        </>
      )}
    </Box>
  );
}