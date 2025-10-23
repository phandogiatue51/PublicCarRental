// Chakra imports
import { Portal, Box, useDisclosure, useToast } from '@chakra-ui/react'; 
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import Footer from '../../components/footer/FooterAdmin';
import Navbar from '../../components/navbar/NavbarAdmin';
import Sidebar from '../../components/sidebar/Sidebar';
import { SidebarContext } from '../../contexts/SidebarContext';
import routes from '../../routes';
import signalRService from '../../../services/signalRService';

// Custom Chakra theme
export default function Dashboard(props) {
  const { ...rest } = props;
  const location = useLocation();
  // states and functions
  const [fixed] = useState(false);
  const toast = useToast(); 
  const [toggleSidebar, setToggleSidebar] = useState(false);

  const getRoute = () => {
    return location.pathname !== '/admin/full-screen-maps';
  };

  const getActiveRoute = (routes) => {
    let activeRoute = 'Main Dashboard';
    const currentPath = location.pathname;
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].collapse) {
        let collapseActiveRoute = getActiveRoute(routes[i].items);
        if (collapseActiveRoute !== activeRoute) {
          return collapseActiveRoute;
        }
      } else if (routes[i].category) {
        let categoryActiveRoute = getActiveRoute(routes[i].items);
        if (categoryActiveRoute !== activeRoute) {
          return categoryActiveRoute;
        }
      } else {
        if (currentPath === routes[i].layout + routes[i].path) {
          return routes[i].name;
        }
      }
    }
    return activeRoute;
  };

  const getActiveNavbar = (routes) => {
    let activeNavbar = false;
    const currentPath = location.pathname;
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].collapse) {
        let collapseActiveNavbar = getActiveNavbar(routes[i].items);
        if (collapseActiveNavbar !== activeNavbar) {
          return collapseActiveNavbar;
        }
      } else if (routes[i].category) {
        let categoryActiveNavbar = getActiveNavbar(routes[i].items);
        if (categoryActiveNavbar !== activeNavbar) {
          return categoryActiveNavbar;
        }
      } else {
        if (currentPath === routes[i].layout + routes[i].path) {
          return routes[i].secondary;
        }
      }
    }
    return activeNavbar;
  };

  const getActiveNavbarText = (routes) => {
    let activeNavbar = false;
    const currentPath = location.pathname;
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].collapse) {
        let collapseActiveNavbar = getActiveNavbarText(routes[i].items);
        if (collapseActiveNavbar !== activeNavbar) {
          return collapseActiveNavbar;
        }
      } else if (routes[i].category) {
        let categoryActiveNavbar = getActiveNavbarText(routes[i].items);
        if (categoryActiveNavbar !== activeNavbar) {
          return categoryActiveNavbar;
        }
      } else {
        if (currentPath === routes[i].layout + routes[i].path) {
          return routes[i].messageNavbar;
        }
      }
    }
    return activeNavbar;
  };

  const getRoutes = (routes) => {
    return routes.map((route, key) => {
      if (route.layout === '/admin') {
        return (
          <Route path={`${route.path}`} element={route.component} key={key} />
        );
      }
      if (route.collapse) {
        return getRoutes(route.items);
      } else {
        return null;
      }
    });
  };

  document.documentElement.dir = 'ltr';
  const { onOpen } = useDisclosure();
  document.documentElement.dir = 'ltr';

  useEffect(() => {
    signalRService.startConnection();

    const handler = (notification) => {
      console.log('Admin received notification:', notification);
      
        if (notification?.type === 'AccidentReported') {
        toast({
          title: "🚨 Accident Report",
          description: notification.message || "An accident has been reported",
          status: "error",
          duration: 10000,
          isClosable: true,
          position: "top-right"
        });
      }
      
      if (notification?.type === 'NewBooking') {
        toast({
          title: "📋 New Booking",
          description: notification.message || `New booking received (ID: ${notification.bookingId || 'N/A'})`,
          status: "info",
          duration: 10000,
          isClosable: true,
          position: "top-right"
        });
      }
    };
    
    signalRService.registerNotificationHandler(handler);

    return () => {
      signalRService.unregisterNotificationHandler(handler);
      signalRService.stopConnection();
    };
  }, [toast]);


  return (
    <Box>
      <Box>
        <SidebarContext.Provider
          value={{
            toggleSidebar,
            setToggleSidebar,
          }}
        >
          <Sidebar routes={routes} display="none" {...rest} />
          <Box
            float="right"
            minHeight="100vh"
            height="100%"
            overflow="auto"
            position="relative"
            maxHeight="100%"
            w={{ base: '100%', xl: 'calc( 100% - 290px )' }}
            maxWidth={{ base: '100%', xl: 'calc( 100% - 290px )' }}
            transition="all 0.33s cubic-bezier(0.685, 0.0473, 0.346, 1)"
            transitionDuration=".2s, .2s, .35s"
            transitionProperty="top, bottom, width"
            transitionTimingFunction="linear, linear, ease"
          >
            <Portal>
              <Box>
                <Navbar
                  onOpen={onOpen}
                  logoText={'CAR RENTAL'}
                  brandText={getActiveRoute(routes)}
                  secondary={getActiveNavbar(routes)}
                  message={getActiveNavbarText(routes)}
                  fixed={fixed}
                  {...rest}
                />
              </Box>
            </Portal>

            {getRoute() ? (
              <Box
                mx="auto"
                p={{ base: '20px', md: '30px' }}
                pe="20px"
                minH="100vh"
                pt="50px"
              >
                <Routes>
                  {getRoutes(routes)}
                  <Route
                    path="/"
                    element={<Navigate to="/admin/default" replace />}
                  />
                </Routes>
              </Box>
            ) : null}
            <Box>
              <Footer />
            </Box>
          </Box>
        </SidebarContext.Provider>
      </Box>
    </Box>
  );
}
