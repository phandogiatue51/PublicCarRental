import { Box, Text, Grid, Image } from '@chakra-ui/react';

export default function ReportSummary({ accidentDetails, formatDate }) {
  return (
    <>
      {accidentDetails.imageUrl && (
        <Box
          border="1px"
          borderColor="gray.200"
          borderRadius="xl"
          mt={20}
          h={"45vh"}
        >
          <Image
            src={accidentDetails.imageUrl}
            alt="Accident damage"
            h="100%"
            borderRadius={"xl"}
            w="100%"
            objectFit="cover"
            mx="auto"
            border="1px"
            borderColor="gray.200"
          />
        </Box>
      )}

      <Box p={4} border="1px" bg="white" borderColor="gray.200" borderRadius="xl">
        <Text fontWeight="bold" mb={2} fontSize={"lg"}>Report Summary</Text>
        <Grid templateColumns="repeat(2, 1fr)" gap={2}>
          <Text><strong>Report Type:</strong> {accidentDetails.contractId ? 'Contract Issue' : 'Vehicle Issue'}</Text>
          <Text><strong>Reported At:</strong> {formatDate(accidentDetails.reportedAt)}</Text>
        </Grid>
      </Box>
    </>
  );
}