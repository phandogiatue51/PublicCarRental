import { 
    Table, Thead, Tbody, Tr, Th, Td, 
    Button, HStack, Badge, Text, VStack
} from '@chakra-ui/react';

export default function ContractList({ contracts, onReplaceVehicle, onRefund }) {
    if (!contracts || contracts.length === 0) {
        return null;
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    return (
        <Table variant="simple">
            <Thead>
                <Tr>
                    <Th>Contract ID</Th>
                    <Th>Renter</Th>
                    <Th>Start Time</Th>
                    <Th>End Time</Th>
                    <Th>Vehicle</Th>
                    <Th>Model</Th>
                    <Th>Total Amount</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                </Tr>
            </Thead>
            <Tbody>
                {contracts.map((contract) => (
                    <Tr key={contract.contractId}>
                        <Td fontWeight="medium">#{contract.contractId}</Td>
                        <Td>
                            <VStack align="start" spacing={0}>
                                <Text>{contract.evRenterName || 'Unknown'}</Text>
                                <Text fontSize="sm" color="gray.600">{contract.phoneNumber}</Text>
                            </VStack>
                        </Td>
                        <Td>{new Date(contract.startTime).toLocaleString()}</Td>
                        <Td>{new Date(contract.endTime).toLocaleString()}</Td>
                        <Td>
                            <VStack align="start" spacing={0}>
                                <Text>#{contract.vehicleId}</Text>
                                <Text fontSize="sm" color="gray.600">{contract.vehicleLicensePlate}</Text>
                            </VStack>
                        </Td>
                        <Td>{contract.modelName}</Td>
                        <Td fontWeight="medium">{formatCurrency(contract.totalCost)}</Td>
                        <Td>
                            <Badge colorScheme={
                                contract.status === 4 ? 'red' : 
                                contract.status === 1 ? 'green' : 'orange'
                            }>
                                {contract.status === 4 ? 'Needs Resolution' : 
                                 contract.status === 1 ? 'Active' : 'Pending'}
                            </Badge>
                        </Td>
                        <Td>
                            <VStack spacing={2} align="start">
                                <Button 
                                    size="sm" 
                                    colorScheme="blue"
                                    onClick={() => onReplaceVehicle(contract)}
                                    width="100%"
                                    isDisabled={contract.status !== 4} 
                                >
                                    Replace Vehicle
                                </Button>
                                <Button 
                                    size="sm" 
                                    colorScheme="orange"
                                    onClick={() => onRefund(contract)}
                                    width="100%"
                                    variant="outline"
                                >
                                    Process Refund
                                </Button>
                            </VStack>
                        </Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );
}