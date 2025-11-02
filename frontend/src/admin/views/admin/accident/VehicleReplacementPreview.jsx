import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, Button, VStack, Text,
    Box, Badge, HStack, Grid, Alert, AlertIcon,
    Spinner, useToast, Table, Thead, Tbody, Tr, Th, Td,
    Progress, Card, CardBody, CardHeader, 
    Stat, StatLabel, StatNumber, StatHelpText
} from '@chakra-ui/react';
import { useState } from 'react';
import { accidentAPI } from '../../../../services/api';

const AccidentResolutionWorkflow = ({
    accidentId,
    previewData,
    onExecuteReplacement,
    onRefresh
}) => {
    const [executionResult, setExecutionResult] = useState(null);
    const toast = useToast();

    const handleRetryPreview = async () => {
        try {
            if (onRefresh) {
                await onRefresh();
            }
            setExecutionResult(null);
        } catch (err) {
            console.error('Error refreshing preview:', err);
            toast({
                title: 'Error',
                description: 'Failed to refresh preview',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleExecuteReplacement = async () => {
        try {
            const result = await accidentAPI.executeReplacement(accidentId);
            setExecutionResult(result);

            toast({
                title: 'Replacement Executed',
                description: result.message,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            if (onExecuteReplacement) {
                onExecuteReplacement(result);
            }
        } catch (err) {
            console.error('Error executing replacement:', err);
            toast({
                title: 'Error',
                description: 'Failed to execute replacement',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <HStack spacing={3}>
            {!executionResult && (
                <>
                    {previewData && previewData.canBeReplaced > 0 && (
                        <Button
                            colorScheme="green"
                            onClick={handleExecuteReplacement}
                        >
                            Execute Replacement ({previewData.canBeReplaced} vehicles)
                        </Button>
                    )}

                    {previewData && previewData.canBeReplaced === 0 && previewData.totalContracts > 0 && (
                        <Button
                            colorScheme="orange"
                            onClick={handleExecuteReplacement}
                        >
                            Execute Anyway ({previewData.totalContracts} contracts)
                        </Button>
                    )}
                </>
            )}

            {executionResult && (
                <Button
                    colorScheme="teal"
                    onClick={handleExecuteReplacement}
                >
                    Retry Replacement
                </Button>
            )}

            <Button
                variant="outline"
                onClick={handleRetryPreview}
            >
                Refresh Preview
            </Button>
        </HStack>
    );
};

export default function VehicleReplacementPreview({
    isOpen,
    onClose,
    accidentId,
    onExecuteReplacement
    }) {
    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [setExecuting] = useState(false);
    const [error, setError] = useState('');
    const toast = useToast();

    const fetchPreview = async () => {
        if (!accidentId) return;

        setLoading(true);
        setError('');

        try {
            const data = await accidentAPI.getReplacementPreview(accidentId);
            setPreviewData(data);
        } catch (err) {
            console.error('Error fetching replacement preview:', err);
            setError('Failed to load replacement preview');
            toast({
                title: 'Error',
                description: 'Failed to load replacement preview',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = async () => {
        if (!accidentId) return;

        setExecuting(true);
        try {
            const result = await accidentAPI.executeReplacement(accidentId);

            toast({
                title: 'Replacement Executed',
                description: result.message,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            if (onExecuteReplacement) {
                onExecuteReplacement(result);
            }

            onClose();
        } catch (err) {
            console.error('Error executing replacement:', err);
            toast({
                title: 'Error',
                description: 'Failed to execute replacement',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setExecuting(false);
        }
    };

    const handleOpen = () => {
        if (isOpen && accidentId) {
            fetchPreview();
        }
    };

    const handleClose = () => {
        setPreviewData(null);
        setError('');
        setLoading(false);
        setExecuting(false);
        onClose();
    };

    const getReplacementTypeColor = (type) => {
        const colors = {
            'SameModel': 'green',
            'DifferentModel': 'orange',
            'NoReplacement': 'red'
        };
        return colors[type] || 'gray';
    };



    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="6xl" onOpen={handleOpen}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Vehicle Replacement Preview</ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    {loading && (
                        <Box textAlign="center" py={8}>
                            <Spinner size="xl" />
                            <Text mt={4}>Generating replacement preview...</Text>
                        </Box>
                    )}

                    {error && (
                        <Alert status="error" mb={4}>
                            <AlertIcon />
                            {error}
                        </Alert>
                    )}

                    {previewData && !loading && (
                        <VStack spacing={6} align="stretch">
                            {/* Summary Stats */}
                            <Card>
                                <CardBody>
                                    <Grid templateColumns="repeat(4, 1fr)" gap={4}>
                                        <Stat>
                                            <StatLabel>Total Contracts</StatLabel>
                                            <StatNumber>{previewData.totalContracts}</StatNumber>
                                        </Stat>
                                        <Stat>
                                            <StatLabel>Can Be Replaced</StatLabel>
                                            <StatNumber color="green.500">{previewData.canBeReplaced}</StatNumber>
                                            <StatHelpText>
                                                {((previewData.canBeReplaced / previewData.totalContracts) * 100).toFixed(1)}%
                                            </StatHelpText>
                                        </Stat>
                                        <Stat>
                                            <StatLabel>Cannot Be Replaced</StatLabel>
                                            <StatNumber color="red.500">{previewData.cannotBeReplaced}</StatNumber>
                                            <StatHelpText>
                                                {((previewData.cannotBeReplaced / previewData.totalContracts) * 100).toFixed(1)}%
                                            </StatHelpText>
                                        </Stat>
                                        <Stat>
                                            <StatLabel>Success Rate</StatLabel>
                                            <StatNumber color={previewData.canBeReplaced > 0 ? 'green.500' : 'red.500'}>
                                                {previewData.canBeReplaced > 0 ? 'Ready' : 'Needs Review'}
                                            </StatNumber>
                                        </Stat>
                                    </Grid>
                                    <Progress
                                        value={(previewData.canBeReplaced / previewData.totalContracts) * 100}
                                        colorScheme={previewData.canBeReplaced > 0 ? 'green' : 'red'}
                                        mt={4}
                                        size="lg"
                                    />
                                </CardBody>
                            </Card>

                            {/* Replacement Details Table */}
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
                                            {previewData.previewResults.map((contract) => (
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

                            {/* Action Required Alert */}
                            {previewData.cannotBeReplaced > 0 && (
                                <Alert status="warning">
                                    <AlertIcon />
                                    <Box>
                                        <Text fontWeight="bold">
                                            {previewData.cannotBeReplaced} contract(s) cannot be automatically replaced
                                        </Text>
                                        <Text fontSize="sm">
                                            These contracts will need manual staff follow-up. You may need to contact customers
                                            for vehicle changes or refunds.
                                        </Text>
                                    </Box>
                                </Alert>
                            )}

                            {previewData.cannotBeReplaced === 0 && previewData.totalContracts > 0 && (
                                <Alert status="success">
                                    <AlertIcon />
                                    All affected contracts can be automatically replaced! You can safely proceed with the replacement.
                                </Alert>
                            )}

                            {/* No Contracts Alert */}
                            {previewData.totalContracts === 0 && (
                                <Alert status="info">
                                    <AlertIcon />
                                    No future contracts are affected by this accident. No vehicle replacement is needed.
                                </Alert>
                            )}
                        </VStack>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button variant="outline" mr={3} onClick={handleClose}>
                        Cancel
                    </Button>

                    <AccidentResolutionWorkflow
                        accidentId={accidentId}
                        previewData={previewData}
                        onExecuteReplacement={handleExecute}
                        onClose={onClose}
                        onSuccess={() => {
                            if (onExecuteReplacement) {
                                onExecuteReplacement();
                            }
                        }}
                        onRefresh={fetchPreview}
                    />
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}