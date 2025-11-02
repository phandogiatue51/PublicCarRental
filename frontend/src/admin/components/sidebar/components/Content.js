import { Box, Flex, Stack, Button, Icon } from "@chakra-ui/react";
import { MdExitToApp } from "react-icons/md";
import Brand from "./Brand";
import Links from "./Links";
import React from "react";
import { useAuth } from "./../../../../hooks/useAuth";
import { useState } from "react";

function SidebarContent(props) {
  const { routes } = props;
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
    }, 1000);
  };

  return (
    <Flex direction='column' height='100%' pt='25px' px="16px" borderRadius='30px'>
      <Brand />
      <Stack direction='column' mb='auto' mt='8px' flex="1">
        <Box ps='20px' pe={{ md: "16px", "2xl": "1px" }}>
          <Links routes={routes} />
        </Box>
      </Stack>

      <Box style={{ marginTop: 'auto', paddingBottom: '25px', paddingLeft: '20px', paddingRight: '20px', display: 'flex', justifyContent: 'center' }}>
        <Button
          w="75%"
          leftIcon={<Icon as={MdExitToApp} />}
          colorScheme="red"
          variant="outline"
          justifyContent="center"
          onClick={handleLogout}
          size="md"
          isLoading={isLoggingOut}
          loadingText="Logging out"
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Button>
      </Box>
    </Flex>
  );
}

export default SidebarContent;