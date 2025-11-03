import { 
    Card, CardBody, Grid, Stat, StatLabel, StatNumber, StatHelpText, Progress 
} from '@chakra-ui/react';

export default function PreviewStats({ data }) {
    if (!data) return null;

    return (
        <Card>
            <CardBody>
                <Grid templateColumns="repeat(4, 1fr)" gap={4}>
                    <Stat>
                        <StatLabel>Total Contracts</StatLabel>
                        <StatNumber>{data.totalContracts}</StatNumber>
                    </Stat>
                    <Stat>
                        <StatLabel>Can Be Replaced</StatLabel>
                        <StatNumber color="green.500">{data.canBeReplaced}</StatNumber>
                        <StatHelpText>
                            {((data.canBeReplaced / data.totalContracts) * 100).toFixed(1)}%
                        </StatHelpText>
                    </Stat>
                    <Stat>
                        <StatLabel>Cannot Be Replaced</StatLabel>
                        <StatNumber color="red.500">{data.cannotBeReplaced}</StatNumber>
                        <StatHelpText>
                            {((data.cannotBeReplaced / data.totalContracts) * 100).toFixed(1)}%
                        </StatHelpText>
                    </Stat>
                    <Stat>
                        <StatLabel>Success Rate</StatLabel>
                        <StatNumber color={data.canBeReplaced > 0 ? 'green.500' : 'red.500'}>
                            {data.canBeReplaced > 0 ? 'Ready' : 'Needs Review'}
                        </StatNumber>
                    </Stat>
                </Grid>
                <Progress
                    value={(data.canBeReplaced / data.totalContracts) * 100}
                    colorScheme={data.canBeReplaced > 0 ? 'green' : 'red'}
                    mt={4}
                    size="lg"
                />
            </CardBody>
        </Card>
    );
}