import { HStack, Button, useToast, Alert, AlertIcon, Box } from '@chakra-ui/react';
import { accidentAPI } from './../../../../../services/api';
import { useState } from 'react';

export default function AccidentResolutionWorkflow({
    accidentId,
    previewData,
    onExecuteReplacement,
    onRefresh
}) {
    const [executionResult, setExecutionResult] = useState(null);
    const [executing, setExecuting] = useState(false);
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
        setExecuting(true);
        try {
            const result = await accidentAPI.executeReplacement(accidentId);
            setExecutionResult(result);

            toast({
                title: result.success ? 'Replacement Executed' : 'Partial Success',
                description: result.message,
                status: result.success ? 'success' : result.results?.some(r => r.success) ? 'warning' : 'error',
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
        } finally {
            setExecuting(false);
        }
    };

    const hasValidLocks = previewData?.previewResults?.some(
        contract => contract.willBeReplaced && contract.lockKey && contract.lockToken
    );

    return (
        <Box>
            {previewData?.canBeReplaced > 0 && !hasValidLocks && (
                <Alert status="warning" mb={3} fontSize="sm">
                    <AlertIcon />
                    Some vehicle locks may have expired. Click "Refresh Preview" to renew locks.
                </Alert>
            )}

            <HStack spacing={3}>
                {!executionResult && (
                    <>
                        {previewData && previewData.canBeReplaced > 0 && hasValidLocks && (
                            <Button
                                colorScheme="green"
                                onClick={handleExecuteReplacement}
                                isLoading={executing}
                            >
                                Execute Bulk Replacement ({previewData.canBeReplaced} vehicles)
                            </Button>
                        )}
                        {previewData && previewData.canBeReplaced > 0 && !hasValidLocks && (
                            <Button
                                colorScheme="orange"
                                onClick={handleRetryPreview}
                                variant="outline"
                            >
                                Refresh Locks to Enable Bulk Replace
                            </Button>
                        )}
                    </>
                )}

                {previewData && previewData.canBeReplaced === 0 && previewData.totalContracts > 0 && (
                    <Button
                        colorScheme="gray"
                        isDisabled={true}
                        variant="outline"
                    >
                        No Vehicles Available ({previewData.totalContracts} contracts affected)
                    </Button>
                )}

                {executionResult && (
                    <Button colorScheme="teal" onClick={handleExecuteReplacement} isLoading={executing}>
                        Retry Replacement
                    </Button>
                )}

                <Button variant="outline" onClick={handleRetryPreview}>
                    Refresh Preview
                </Button>
            </HStack>
        </Box>
    );
}