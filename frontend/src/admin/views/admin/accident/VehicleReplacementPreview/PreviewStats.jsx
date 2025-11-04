import {
    Card, CardBody, Grid, Stat, StatLabel, StatNumber, StatHelpText, Progress
} from '@chakra-ui/react';

export default function PreviewStats({ data }) {
    if (!data) return null;

    // Calculate counts based on current preview data
    const totalContracts = data.previewResults?.length || 0;
    const canBeReplaced = data.previewResults?.filter(c => c.willBeReplaced && c.lockKey && c.lockToken).length || 0;
    const cannotBeReplaced = totalContracts - canBeReplaced;

    return (
        <Card>
            <CardBody>
                <Grid templateColumns="repeat(4, 1fr)" gap={4}>
                    <Stat>
                        <StatLabel>Total Contracts</StatLabel>
                        <StatNumber>{totalContracts}</StatNumber>
                    </Stat>
                    <Stat>
                        <StatLabel>Can Be Replaced</StatLabel>
                        <StatNumber color="green.500">{canBeReplaced}</StatNumber>
                        <StatHelpText>
                            {totalContracts > 0 ? ((canBeReplaced / totalContracts) * 100).toFixed(1) + '%' : '0%'}
                        </StatHelpText>
                    </Stat>
                    <Stat>
                        <StatLabel>Cannot Be Replaced</StatLabel>
                        <StatNumber color="red.500">{cannotBeReplaced}</StatNumber>
                        <StatHelpText>
                            {totalContracts > 0 ? ((cannotBeReplaced / totalContracts) * 100).toFixed(1) + '%' : '0%'}
                        </StatHelpText>
                    </Stat>
                    <Stat>
                        <StatLabel>Success Rate</StatLabel>
                        <StatNumber
                            color={
                                totalContracts === 0
                                    ? 'blue.500'
                                    : cannotBeReplaced === 0
                                        ? 'green.500'
                                        : 'red.500'
                            }
                        >
                            {totalContracts === 0
                                ? 'Success'
                                : cannotBeReplaced === 0
                                    ? 'Ready'
                                    : 'Needs Review'}
                        </StatNumber>
                    </Stat>
                </Grid>
                <Progress
                    value={totalContracts === 0 ? 100 : (canBeReplaced / totalContracts) * 100}
                    colorScheme={
                        totalContracts === 0
                            ? 'blue'
                            : cannotBeReplaced === 0
                                ? 'green'
                                : 'red'
                    }
                    size="lg"
                />
            </CardBody>
        </Card>
    );
}