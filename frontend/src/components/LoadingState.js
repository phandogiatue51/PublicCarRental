// LoadingState.js
import { Box, Card, Flex, Spinner, Text, useColorModeValue } from "@chakra-ui/react";

export default function LoadingState() {
  const brandColor = useColorModeValue("brand.500", "white");
  const textColor = useColorModeValue("secondaryGray.900", "white");

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Card>
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" color={brandColor} />
          <Text ml={4} color={textColor}>
            Loading vehicles...
          </Text>
        </Flex>
      </Card>
    </Box>
  );
}