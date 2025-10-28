import { Box, Card, Alert, AlertIcon, AlertTitle, AlertDescription, Flex, Button } from "@chakra-ui/react";

export default function ErrorState({ error, onRetry }) {
  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Card>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Flex justify="center" mt={4}>
          <Button onClick={onRetry} colorScheme="blue">
            Retry
          </Button>
        </Flex>
      </Card>
    </Box>
  );
}