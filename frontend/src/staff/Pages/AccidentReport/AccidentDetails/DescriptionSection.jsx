import { Box, Text } from '@chakra-ui/react';

export default function DescriptionSection({ accidentDetails }) {
  return (
    <Box p={4} border="1px" bg="white" borderColor="gray.200" borderRadius="xl">
      <Text fontWeight="bold" fontSize="lg" mb={3}>Description</Text>
      <Text>{accidentDetails.description || 'No description provided'}</Text>
    </Box>
  );
}