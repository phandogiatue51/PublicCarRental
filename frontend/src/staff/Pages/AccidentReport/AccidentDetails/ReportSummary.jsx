import { Box, Text, Grid, Image } from '@chakra-ui/react';

export default function ReportSummary({ accidentDetails, formatDate }) {
  return (
    <>
      {accidentDetails.imageUrl && (
        <Box border="1px" borderColor="gray.200" borderRadius="md" mt={20}>
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

      <Box p={4} border="1px" bg="white" borderColor="gray.200" borderRadius="xl">
        <Text fontWeight="bold" mb={2}>Report Summary</Text>
        <Grid templateColumns="repeat(2, 1fr)" gap={2}>
          <Text><strong>Report Type:</strong> {accidentDetails.contractId ? 'Contract Issue' : 'Vehicle Issue'}</Text>
          <Text><strong>Reported At:</strong> {formatDate(accidentDetails.reportedAt)}</Text>
        </Grid>
      </Box>
    </>
  );
}