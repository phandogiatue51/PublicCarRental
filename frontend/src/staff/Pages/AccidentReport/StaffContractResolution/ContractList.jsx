import { 
    Table, Thead, Tbody, Tr, Th, Td, 
    Button, HStack, Badge} from '@chakra-ui/react';

export default function ContractList({ contracts, onModelChange, onRefund }) {
    if (!contracts || contracts.length === 0) {
        return null;
    }

    const getStatusColor = (contract) => {
        return 'red';
    };

    return (
        <Table variant="simple">
            <Thead>
                <Tr>
                    <Th>Contract ID</Th>
                    <Th>Renter</Th>
                    <Th>Start Time</Th>
                    <Th>Vehicle</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                </Tr>
            </Thead>
            <Tbody>
                {contracts.map((contract) => (
                    <Tr key={contract.contractId}>
                        <Td fontWeight="medium">#{contract.contractId}</Td>
                        <Td>{contract.renterName || 'Unknown'}</Td>
                        <Td>{new Date(contract.startTime).toLocaleString()}</Td>
                        <Td>Vehicle #{contract.currentVehicleId}</Td>
                        <Td>
                            <Badge colorScheme={getStatusColor(contract)}>
                                Needs Resolution
                            </Badge>
                        </Td>
                        <Td>
                            <HStack spacing={2}>
                                <Button 
                                    size="sm" 
                                    colorScheme="blue"
                                    onClick={() => onModelChange(contract)}
                                >
                                    Change Model
                                </Button>
                                <Button 
                                    size="sm" 
                                    colorScheme="orange"
                                    onClick={() => onRefund(contract)}
                                >
                                    Process Refund
                                </Button>
                            </HStack>
                        </Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );
}