import { 
    Card, CardHeader, CardBody, Table, Thead, Tbody, Tr, Th, Td, 
    Text, VStack, Badge 
} from '@chakra-ui/react';

export default function ContractTable({ data }) {
    const getReplacementTypeColor = (type) => {
        const colors = {
            'SameModel': 'green',
            'DifferentModel': 'orange',
            'NoReplacement': 'red'
        };
        return colors[type] || 'gray';
    };

    if (!data?.previewResults?.length) return null;

    return (
        <Card>
            <CardHeader>
                <Text fontWeight="bold" fontSize="lg">Contract Replacement Details</Text>
            </CardHeader>
            <CardBody>
                <Table variant="simple">
                    <Thead>
                        <Tr>
                            <Th>Contract ID</Th>
                            <Th>Renter</Th>
                            <Th>Start Time</Th>
                            <Th>Current Vehicle</Th>
                            <Th>Replacement Vehicle</Th>
                            <Th>Status</Th>
                            <Th>Type</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {data.previewResults.map((contract) => (
                            <Tr key={contract.contractId}>
                                <Td fontWeight="medium">#{contract.contractId}</Td>
                                <Td>{contract.renterName}</Td>
                                <Td>{new Date(contract.startTime).toLocaleString()}</Td>
                                <Td>Vehicle #{contract.currentVehicleId}</Td>
                                <Td>
                                    {contract.willBeReplaced ? (
                                        <VStack align="start" spacing={1}>
                                            <Text fontWeight="medium">#{contract.newVehicleId}</Text>
                                            <Text fontSize="sm" color="gray.600">
                                                {contract.newVehicleInfo}
                                            </Text>
                                        </VStack>
                                    ) : (
                                        <Text color="red.500" fontStyle="italic">
                                            No replacement
                                        </Text>
                                    )}
                                </Td>
                                <Td>
                                    <Badge
                                        colorScheme={contract.willBeReplaced ? 'green' : 'red'}
                                        fontSize="sm"
                                    >
                                        {contract.willBeReplaced ? 'Will Replace' : 'Cannot Replace'}
                                    </Badge>
                                </Td>
                                <Td>
                                    {contract.willBeReplaced ? (
                                        <Badge colorScheme={getReplacementTypeColor(contract.replacementType)}>
                                            {contract.replacementType}
                                        </Badge>
                                    ) : (
                                        <Text fontSize="sm" color="red.500">
                                            {contract.reason}
                                        </Text>
                                    )}
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </CardBody>
        </Card>
    );
}