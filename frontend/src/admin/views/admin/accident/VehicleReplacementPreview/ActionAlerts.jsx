import { Alert, AlertIcon, Box, Text, Badge, HStack } from '@chakra-ui/react';

export default function ActionAlerts({ data, lastRefreshed }) {
    if (!data) return null;

    const hasExpiredLocks = data.previewResults?.some(
        contract => contract.willBeReplaced && (!contract.lockKey || !contract.lockToken)
    );

    return (
        <>
            {hasExpiredLocks && (
                <Alert status="warning">
                    <AlertIcon />
                    <Box>
                        <Text fontWeight="bold">Some vehicle locks have expired</Text>
                        <Text fontSize="sm">Refresh the preview to renew locks and enable replacement</Text>
                    </Box>
                </Alert>
            )}

            {data.cannotBeReplaced > 0 && (
                <Alert status="warning">
                    <AlertIcon />
                    <Box>
                        <Text fontWeight="bold">
                            {data.cannotBeReplaced} contract(s) cannot be automatically replaced
                        </Text>
                        <Text fontSize="md">
                            Staff may need to contact customers for model changes or refunds.
                        </Text>
                    </Box>
                </Alert>
            )}

            {data.cannotBeReplaced === 0 && data.totalContracts > 0 && !hasExpiredLocks && (
                <Alert status="success">
                    <AlertIcon />
                    <HStack>
                        <Box>
                            <Text fontWeight="bold">All contracts ready for replacement!</Text>
                            <Text fontSize="sm">Vehicle locks are active. You can safely proceed with replacement.</Text>
                        </Box>
                        {lastRefreshed && (
                            <Badge colorScheme="green" ml="auto">
                                Locks active
                            </Badge>
                        )}
                    </HStack>
                </Alert>
            )}

            {data.totalContracts === 0 && (
                <Alert status="info">
                    <AlertIcon />
                    No future contracts are affected by this accident. No vehicle replacement is needed.
                </Alert>
            )}
        </>
    );
}