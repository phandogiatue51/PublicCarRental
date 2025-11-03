import { Alert, AlertIcon, Box, Text } from '@chakra-ui/react';

export default function ActionAlerts({ data }) {
    if (!data) return null;

    return (
        <>
            {/* Action Required Alert */}
            {data.cannotBeReplaced > 0 && (
                <Alert status="warning">
                    <AlertIcon />
                    <Box>
                        <Text fontWeight="bold">
                            {data.cannotBeReplaced} contract(s) cannot be automatically replaced
                        </Text>
                        <Text fontSize="sm">
                            These contracts will need manual staff follow-up after admin executes vehicle replacement. 
                            Staff may need to contact customers for model changes or refunds.
                        </Text>
                    </Box>
                </Alert>
            )}

            {data.cannotBeReplaced === 0 && data.totalContracts > 0 && (
                <Alert status="success">
                    <AlertIcon />
                    All affected contracts can be automatically replaced! You can safely proceed with the replacement.
                    No staff intervention will be needed.
                </Alert>
            )}

            {/* No Contracts Alert */}
            {data.totalContracts === 0 && (
                <Alert status="info">
                    <AlertIcon />
                    No future contracts are affected by this accident. No vehicle replacement is needed.
                </Alert>
            )}
        </>
    );
}