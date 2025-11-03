import { Badge } from '@chakra-ui/react';

export default function StatusBadge({ status, getStatusColor, mapStatusNumberToString }) {
  return (
    <Badge
      colorScheme={getStatusColor(status)}
      fontSize="md"
      px={3}
      py={2}
      borderRadius="full"
    >
      {mapStatusNumberToString(status).replace(/([A-Z])/g, ' $1').trim()}
    </Badge>
  );
}