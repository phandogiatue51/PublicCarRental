import { HStack, Button, useToast } from '@chakra-ui/react';
import { accidentAPI } from './../../../../../services/api';
import { useState } from 'react';

export default function AccidentResolutionWorkflow({
    accidentId,
    previewData,
    onExecuteReplacement,
    onRefresh
}) {
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
}