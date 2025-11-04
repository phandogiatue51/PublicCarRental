import { Box, Text, Grid } from '@chakra-ui/react';
export default function ResolutionNotes({
  accidentDetails,
  resolutionNote,
}) {
  const actionType = accidentDetails?.actionTaken ?? null;
  const existingNote = accidentDetails?.resolutionNote || '';

  const mapActionTypeToString = (actionType) => {
    const map = { 0: 'Refund', 1: 'Replace', 2: 'Repair' };
    return map[actionType] || 'No Action';
  };

  return (
    <Box p={4} border="1px" borderColor="gray.200" borderRadius="xl" bg="white">
      <Text fontWeight="bold" fontSize="lg" mb={3}>
        Resolution Details
      </Text>

      <Grid>
        <Box>
          <Text fontSize="md">
            <strong>Action Type:</strong> {mapActionTypeToString(actionType)}
          </Text>
        </Box>
        <Box mt={2}>
          <Text fontSize="md">
            <strong>Resolution Note:</strong>
          </Text>
          <Box
            mt={1}
            p={2}
            borderRadius="md"
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
          >
            <Text fontSize="md" whiteSpace="pre-wrap">
              {resolutionNote || existingNote || 'No resolution note yet'}
            </Text>
          </Box>
        </Box>
      </Grid>
    </Box>
  );
}
