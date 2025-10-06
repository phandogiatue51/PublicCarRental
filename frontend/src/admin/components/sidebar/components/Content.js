// chakra imports
import { Box, Flex, Stack, Button, Icon } from "@chakra-ui/react";
import { MdExitToApp } from "react-icons/md";
//   Custom components
import Brand from "./Brand";
import Links from "./Links";
import React from "react";

// FUNCTIONS

function SidebarContent(props) {
  const { routes } = props;

  const handleLogout = () => {
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("accountId");
    sessionStorage.removeItem("fullName");
    sessionStorage.removeItem("email");
    sessionStorage.removeItem("isAdmin");
    sessionStorage.removeItem("staffId");
    sessionStorage.removeItem("stationId");
    sessionStorage.removeItem("renterId");
    sessionStorage.removeItem("phoneNumber");
    
    window.location.href = '/';
  };

  // SIDEBAR
  return (
    <Flex direction='column' height='100%' pt='25px' px="16px" borderRadius='30px'>
      <Brand />
      <Stack direction='column' mb='auto' mt='8px' flex="1">
        <Box ps='20px' pe={{ md: "16px", "2xl": "1px" }}>
          <Links routes={routes} />
        </Box>
      </Stack>
      
      {/* Logout button at the bottom */}
      <Box mt="auto" pb="25px" px="20px" display="flex" justifyContent="center">
      <Button
        w="50%" leftIcon={<Icon as={MdExitToApp} />}
        colorScheme="red"        variant="outline"        justifyContent="center"
        onClick={handleLogout}        size="md"      >
        Logout
      </Button>
    </Box>
    </Flex>
  );
}

export default SidebarContent;