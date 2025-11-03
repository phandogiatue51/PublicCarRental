import { Box, Text, Grid } from '@chakra-ui/react';

export default function VehicleInfo({ accidentDetails }) {
  return (
    <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
      <Text fontWeight="bold" fontSize="lg" mb={3}>Vehicle Information</Text>
      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
        <Box>
          <Text><strong>License Plate:</strong> {accidentDetails.licensePlate}</Text>
          <Text><strong>Location:</strong> {accidentDetails.location || 'Not specified'}</Text>
        </Box>
        <Box>
          <Text><strong>Contract ID:</strong> {accidentDetails.contractId ? accidentDetails.contractId : 'N/A'}</Text>
          <Text><strong>Staff:</strong> {accidentDetails.staffName || 'Not specified'}</Text>
        </Box>
      </Grid>
    </Box>
  );
}