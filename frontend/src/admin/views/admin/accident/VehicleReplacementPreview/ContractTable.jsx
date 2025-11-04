import {
    Button, useToast, Card, CardHeader, Text, CardBody, Th, Tbody, Td, Badge
    , Table, Thead, Tr, VStack
} from '@chakra-ui/react';
import { accidentAPI } from './../../../../../services/api';
import { useState } from 'react';

export default function ContractTable({ data, onContractReplaced, onRefresh }) {
    const [replacing, setReplacing] = useState(null);
    const toast = useToast();
    const handleReplace = async (contractId, lockKey, lockToken) => {
        setReplacing(contractId);
        try {
            const result = await accidentAPI.replaceSingleContract(contractId, lockKey, lockToken);
            
            toast({
                title: result.success ? 'Success' : 'Error',
                description: result.message,
                status: result.success ? 'success' : 'error',
                duration: 3000,
                isClosable: true,
            });

            if (result.success) {
                if (onRefresh) {
                    await onRefresh();
                }
            }

            if (onContractReplaced) onContractReplaced(result);
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to replace this contract',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setReplacing(null);
        }
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
                            <Th>Start Time</Th>
                            <Th>Current Vehicle</Th>
                            <Th>Replacement Vehicle</Th>
                            <Th>Status</Th>
                            <Th>Action</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {data.previewResults.map((contract) => (
                            <Tr key={contract.contractId}>
                                <Td fontWeight="medium">#{contract.contractId}</Td>
                                <Td>{new Date(contract.startTime).toLocaleString()}</Td>
                                <Td>Vehicle #{contract.currentVehicleId}</Td>
                                <Td>
                                    {contract.willBeReplaced ? (
                                        <VStack align="start" spacing={1}>
                                            <Text fontWeight="medium">#{contract.newVehicleId}</Text>
                                            <Text fontSize="sm" color="gray.600">
                                                {contract.newVehicleInfo}
                                            </Text>
                                            {contract.lockToken && (
                                                <Badge colorScheme="green" fontSize="xs">
                                                    Locked
                                                </Badge>
                                            )}
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
                                    {contract.willBeReplaced && contract.lockKey && contract.lockToken && (
                                        <Button
                                            size="sm"
                                            colorScheme="blue"
                                            isLoading={replacing === contract.contractId}
                                            onClick={() =>
                                                handleReplace(
                                                    contract.contractId, 
                                                    contract.lockKey, 
                                                    contract.lockToken
                                                )
                                            }
                                        >
                                            Replace
                                        </Button>
                                    )}
                                    {contract.willBeReplaced && (!contract.lockKey || !contract.lockToken) && (
                                        <Button
                                            size="sm"
                                            colorScheme="gray"
                                            isDisabled
                                            variant="outline"
                                        >
                                            Lock Expired
                                        </Button>
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