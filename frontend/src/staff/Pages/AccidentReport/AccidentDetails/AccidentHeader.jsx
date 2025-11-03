import { Box, Text, Badge, Grid } from '@chakra-ui/react';

export default function AccidentHeader({ accidentDetails, getStatusColor, mapStatusNumberToString, formatDate }) {
  return (
    <Box p={4} bg="blue.50" borderRadius="md">
      <Grid templateColumns="1fr auto" gap={4} alignItems="center">
        <Box>
          <Text fontWeight="bold" fontSize="xl">
            Issue Report #{accidentDetails.accidentId}
          </Text>
          <Text color="gray.600">
            Reported on {formatDate(accidentDetails.reportedAt)}
          </Text>
        </Box>
        <Badge
          colorScheme={getStatusColor(accidentDetails.status)}
          fontSize="md"
          px={3}
          py={2}
          borderRadius="full"
        >
          {mapStatusNumberToString(accidentDetails.status).replace(/([A-Z])/g, ' $1').trim()}
        </Badge>
      </Grid>
    </Box>
  );
}