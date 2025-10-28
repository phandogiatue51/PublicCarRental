import { Flex, Text, Button, HStack, Icon } from "@chakra-ui/react";
import { useColorModeValue } from "@chakra-ui/react";
import { MdRefresh, MdAdd } from "react-icons/md";

export default function VehicleHeader({ onRefresh, onAdd }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");

  return (
    <Flex justify="space-between" align="center" mb={4}>
      <Text fontSize="2xl" fontWeight="700" color={textColor}>
        Vehicle Management
      </Text>
      <HStack>
        <Button leftIcon={<Icon as={MdRefresh} />} onClick={onRefresh}>
          Refresh
        </Button>
        <Button
          leftIcon={<Icon as={MdAdd} />}
          colorScheme="blue"
          onClick={onAdd}
        >
          Add New Vehicle
        </Button>
      </HStack>
    </Flex>
  );
}