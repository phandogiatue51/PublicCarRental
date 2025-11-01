import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  Spinner,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import { adminDashboardAPI } from "../../../../../services/api";
import Card from "../../../../components/card/Card";
import MiniStatistics from "../../../../components/card/MiniStatistics";
import IconBox from "../../../../components/icons/IconBox";
import { Icon } from "@chakra-ui/react";
import { MdPeople, MdTrendingUp, MdShoppingCart } from "react-icons/md";

// Helper function to format VND currency
const formatVND = (amount) => {
  return `${(amount || 0).toLocaleString('vi-VN')} ₫`;
};

export default function CustomerAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "white");
  const boxBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const analytics = await adminDashboardAPI.getCustomerAnalytics();
        setData(analytics);
      } catch (err) {
        console.error("Error fetching customer analytics:", err);
        setError(err.message || "Failed to fetch customer analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Text color="red.500">Error: {error}</Text>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Box mb="20px">
      <Text
        fontSize="2xl"
        fontWeight="700"
        mb="20px"
        color={textColor}>
        Customer Analytics
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px" mb="20px">
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="32px" h="32px" as={MdPeople} color={brandColor} />}
            />
          }
          name="Total Customers"
          value={data.totalCustomers || 0}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="32px" h="32px" as={MdTrendingUp} color={brandColor} />}
            />
          }
          name="New This Month"
          value={data.newCustomersThisMonth || 0}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="32px" h="32px" as={MdShoppingCart} color={brandColor} />}
            />
          }
          name="Active Customers"
          value={data.activeCustomers || 0}
        />
        <MiniStatistics
          name="Avg Rentals/Customer"
          value={(data.averageRentalsPerCustomer || 0).toFixed(1)}
        />
        <MiniStatistics
          name="Avg Spending/Customer"
          value={formatVND(data.averageSpendingPerCustomer)}
        />
      </SimpleGrid>

      {data.customerSegments && data.customerSegments.length > 0 && (
        <Card p="20px">
          <Text fontSize="xl" fontWeight="700" mb="15px" color={textColor}>
            Customer Segments
          </Text>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>Segment</Th>
                <Th borderColor={borderColor} isNumeric>Count</Th>
                <Th borderColor={borderColor} isNumeric>Average Revenue</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.customerSegments.map((segment, index) => (
                <Tr key={index}>
                  <Td borderColor={borderColor}>{segment.segment || "N/A"}</Td>
                  <Td borderColor={borderColor} isNumeric>{segment.count || 0}</Td>
                  <Td borderColor={borderColor} isNumeric>
                    {formatVND(segment.averageRevenue)}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}
    </Box>
  );
}
