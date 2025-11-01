import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  Spinner,
  Button,
  Input,
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
import { MdAttachMoney } from "react-icons/md";

// Helper function to format VND currency
const formatVND = (amount) => {
  return `${(amount || 0).toLocaleString('vi-VN')} ₫`;
};

export default function FinancialReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  useEffect(() => {
    // Set default dates to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(lastDay.toISOString().split("T")[0]);

    // Fetch data with default dates
    fetchFinancialReport(firstDay.toISOString(), lastDay.toISOString());
  }, []);

  const fetchFinancialReport = async (start, end) => {
    try {
      setLoading(true);
      setError(null);
      const report = await adminDashboardAPI.getFinancialReport({
        startDate: start,
        endDate: end,
      });
      setData(report);
    } catch (err) {
      console.error("Error fetching financial report:", err);
      setError(err.message || "Failed to fetch financial report");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (startDate && endDate) {
      fetchFinancialReport(
        new Date(startDate).toISOString(),
        new Date(endDate).toISOString()
      );
    }
  };

  return (
    <Box mb="20px">
      <Text
        fontSize="2xl"
        fontWeight="700"
        mb="20px"
        color={textColor}>
        Financial Report
      </Text>
      
      <Card p="20px" mb="20px">
        <form onSubmit={handleSubmit}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="15px" mb="15px">
            <Box>
              <Text mb="5px" fontSize="sm" color="gray.400">
                Start Date
              </Text>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </Box>
            <Box>
              <Text mb="5px" fontSize="sm" color="gray.400">
                End Date
              </Text>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </Box>
            <Flex align="end">
              <Button type="submit" colorScheme="brand" isLoading={loading}>
                Generate Report
              </Button>
            </Flex>
          </SimpleGrid>
        </form>
      </Card>

      {loading && (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="xl" />
        </Flex>
      )}

      {error && (
        <Card p="20px">
          <Text color="red.500">Error: {error}</Text>
        </Card>
      )}

      {data && !loading && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px" mb="20px">
          <Card p="20px">
            <Text fontSize="sm" color="gray.400" mb="5px">
              Total Revenue
            </Text>
            <Text fontSize="2xl" fontWeight="700" color={textColor}>
              {formatVND(data.totalRevenue)}
            </Text>
          </Card>
          <Card p="20px">
            <Text fontSize="sm" color="gray.400" mb="5px">
              Total Deposits
            </Text>
            <Text fontSize="2xl" fontWeight="700" color={textColor}>
              {formatVND(data.totalDeposits)}
            </Text>
          </Card>
          <Card p="20px">
            <Text fontSize="sm" color="gray.400" mb="5px">
              Total Refunds
            </Text>
            <Text fontSize="2xl" fontWeight="700" color={textColor}>
              {formatVND(data.totalRefunds)}
            </Text>
          </Card>
          <Card p="20px">
            <Text fontSize="sm" color="gray.400" mb="5px">
              Net Revenue
            </Text>
            <Text fontSize="2xl" fontWeight="700" color={textColor}>
              {formatVND(data.netRevenue)}
            </Text>
          </Card>
        </SimpleGrid>
      )}

      {data?.revenueByStation && data.revenueByStation.length > 0 && (
        <Card p="20px">
          <Text fontSize="xl" fontWeight="700" mb="15px" color={textColor}>
            Revenue by Station
          </Text>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>Station Name</Th>
                <Th borderColor={borderColor} isNumeric>Revenue</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.revenueByStation.map((station, index) => (
                <Tr key={index}>
                  <Td borderColor={borderColor}>{station.stationName}</Td>
                  <Td borderColor={borderColor} isNumeric>
                    {formatVND(station.revenue)}
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
