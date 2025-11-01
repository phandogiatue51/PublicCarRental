import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  SimpleGrid,
  Text,
  useColorModeValue,
  Spinner,
  Icon,
} from "@chakra-ui/react";
import { adminDashboardAPI } from "../../../../../services/api";
import {
  MdBarChart,
  MdAttachMoney,
  MdLocationOn,
  MdDirectionsCar,
  MdPeople,
  MdGroups,
  MdTrendingUp,
  MdArrowUpward,
} from "react-icons/md";

// Helper function to format VND currency
const formatVND = (amount) => {
  return `${(amount || 0).toLocaleString('vi-VN')} ₫`;
};

const StatCard = ({ icon, name, value, color, delay = 0, trend }) => {
  const bgGradient = useColorModeValue(
    `linear(to-br, ${color}.50, ${color}.100)`,
    `linear(to-br, ${color}.900, ${color}.800)`
  );
  const iconBg = useColorModeValue(`${color}.500`, `${color}.400`);
  const textColor = useColorModeValue("gray.800", "white");
  const labelColor = useColorModeValue("gray.600", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const shadowColor = useColorModeValue(
    "rgba(0, 0, 0, 0.1)",
    "rgba(0, 0, 0, 0.3)"
  );

  return (
    <Box
      bg={cardBg}
      bgGradient={bgGradient}
      borderRadius="20px"
      p="20px"
      position="relative"
      overflow="hidden"
      boxShadow={`0 4px 20px ${shadowColor}`}
      transition="all 0.3s ease"
      style={{
        animation: `fadeIn 0.5s ease-out ${delay}s both`,
      }}
      sx={{
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        }
      }}
      _hover={{
        transform: "translateY(-5px)",
        boxShadow: `0 8px 30px ${shadowColor}`,
      }}
    >
      <Flex align="center" gap="15px">
        <Flex
          w="60px"
          h="60px"
          align="center"
          justify="center"
          borderRadius="16px"
          bg={iconBg}
          color="white"
          boxShadow="0 4px 15px rgba(0,0,0,0.15)"
        >
          <Icon as={icon} w="30px" h="30px" />
        </Flex>
        <Box flex="1">
          <Text
            fontSize="sm"
            fontWeight="500"
            color={labelColor}
            mb="5px"
            textTransform="uppercase"
            letterSpacing="0.5px"
          >
            {name}
          </Text>
          <Text
            fontSize="2xl"
            fontWeight="700"
            color={textColor}
            lineHeight="1"
          >
            {value}
          </Text>
          {trend && (
            <Flex align="center" mt="5px" gap="4px">
              <Icon as={MdArrowUpward} color="green.500" w="14px" h="14px" />
              <Text fontSize="xs" color="green.500" fontWeight="600">
                {trend}
              </Text>
            </Flex>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const textColor = useColorModeValue("gray.800", "white");
  const bgColor = useColorModeValue("gray.50", "gray.900");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const overview = await adminDashboardAPI.getOverview();
        setData(overview);
      } catch (err) {
        console.error("Error fetching overview:", err);
        setError(err.message || "Failed to fetch overview data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px" bg={bgColor} borderRadius="20px">
        <Flex direction="column" align="center" gap="20px">
          <Spinner size="xl" thickness="4px" color="blue.500" speed="0.8s" />
          <Text color={textColor} fontSize="lg" fontWeight="500">
            Loading dashboard...
          </Text>
        </Flex>
      </Flex>
    );
  }

  if (error) {
    return (
      <Box
        p="30px"
        bg="red.50"
        borderRadius="20px"
        borderLeft="5px solid"
        borderColor="red.500"
      >
        <Text color="red.600" fontSize="lg" fontWeight="600">
          ⚠️ Error: {error}
        </Text>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  const stats = [
    {
      icon: MdLocationOn,
      name: "Total Stations",
      value: data.totalStations || 0,
      color: "purple",
      delay: 0,
    },
    {
      icon: MdDirectionsCar,
      name: "Total Vehicles",
      value: data.totalVehicles || 0,
      color: "blue",
      delay: 0.1,
    },
    {
      icon: MdPeople,
      name: "Total Customers",
      value: data.totalCustomers || 0,
      color: "cyan",
      delay: 0.2,
    },
    {
      icon: MdGroups,
      name: "Total Staff",
      value: data.totalStaff || 0,
      color: "teal",
      delay: 0.3,
    },
    {
      icon: MdBarChart,
      name: "Active Rentals",
      value: data.activeRentals || 0,
      color: "orange",
      delay: 0.4,
    },
    {
      icon: MdAttachMoney,
      name: "Today Revenue",
      value: formatVND(data.todayRevenue || 0),
      color: "green",
      delay: 0.5,
      trend: "+12.5%",
    },
    {
      icon: MdTrendingUp,
      name: "Monthly Revenue",
      value: formatVND(data.monthlyRevenue || 0),
      color: "pink",
      delay: 0.6,
      trend: "+8.2%",
    },
  ];

  return (
    <Box mb="30px">
      <Flex align="center" gap="15px" mb="30px">
        <Box
          w="6px"
          h="35px"
          bgGradient="linear(to-b, blue.400, purple.500)"
          borderRadius="full"
        />
        <Text
          fontSize="3xl"
          fontWeight="800"
          color={textColor}
          letterSpacing="-0.5px"
        >
          System Overview
        </Text>
      </Flex>

      <SimpleGrid
        columns={{ base: 1, md: 2, lg: 3, xl: 4 }}
        spacing="25px"
      >
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </SimpleGrid>
    </Box>
  );
}