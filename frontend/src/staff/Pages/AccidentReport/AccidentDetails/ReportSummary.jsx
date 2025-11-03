import { Box, Text, Grid, Image } from '@chakra-ui/react';

export default function ReportSummary({ accidentDetails, formatDate }) {
  return (
    <>
      {/* Accident Image */}
      {accidentDetails.imageUrl && (
        <Box border="1px" borderColor="gray.200" borderRadius="md">
          <Image
            src={accidentDetails.imageUrl}
            alt="Accident damage"
            maxH="400px"
            objectFit="contain"
            borderRadius="md"
            mx="auto"
            border="1px"
            borderColor="gray.200"
          />
        </Box>
      )}

      {/* Report Summary */}
      <Box p={4} bg="gray.50" borderRadius="md">
        <Text fontWeight="bold" mb={2}>Report Summary</Text>
        <Grid templateColumns="repeat(2, 1fr)" gap={2}>
          <Text><strong>Report Type:</strong> {accidentDetails.contractId ? 'Contract Issue' : 'Vehicle Issue'}</Text>
          <Text><strong>Reported At:</strong> {formatDate(accidentDetails.reportedAt)}</Text>
        </Grid>
      </Box>
    </>
  );
}