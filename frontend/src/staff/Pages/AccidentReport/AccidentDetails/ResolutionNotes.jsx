import { Box, Text, Grid, Textarea } from '@chakra-ui/react';

export default function ResolutionNotes({ 
  accidentDetails, 
  resolutionNote, 
  setResolutionNote, 
  isDisabled = false 
}) {
  const existingNote = accidentDetails?.resolutionNote || '';
  const actionType = accidentDetails?.actionTaken ?? null;
  const hasExistingNote = existingNote && existingNote.trim() !== '';

  const mapActionTypeToString = (actionType) => {
    const map = { 0: 'Refund', 1: 'Replace', 2: 'Repair' };
    return map[actionType] || 'No Action';
  };

  return (
    <Box p={4} border="1px" borderColor="gray.200" borderRadius="xl" mb={3} bg="white">
      <Text fontWeight="bold" fontSize="lg" mb={3}>
        Resolution Details
      </Text>

      <Grid>
        <Box>
          <Text fontSize="mg">
            <strong>Action Type:</strong>{' '}
            {mapActionTypeToString(actionType)}
          </Text>
        </Box>
        <Box>
          <Text fontSize="mg">
            <strong>Resolution Note:</strong>
          </Text>
          {hasExistingNote ? (
            <Box
              mt={1}
              p={2}
              borderRadius="md"
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
            >
              <Text fontSize="md" whiteSpace="pre-wrap">
                {existingNote}
              </Text>
            </Box>
          ) : (
            <Textarea
              mt={1}
              value={resolutionNote || ''}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Add resolution notes (Optional)"
              size="md"
              isDisabled={isDisabled}
            />
          )}
        </Box>
      </Grid>
    </Box>
  );
}
