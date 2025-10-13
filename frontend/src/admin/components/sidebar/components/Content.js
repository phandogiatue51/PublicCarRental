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
    // Clear all auth-related data from localStorage
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("accountId");
    localStorage.removeItem("fullName");
    localStorage.removeItem("email");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("staffId");
    localStorage.removeItem("stationId");
    localStorage.removeItem("renterId");
    localStorage.removeItem("phoneNumber");
    
    // Dispatch custom event to notify components of auth state change
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    
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