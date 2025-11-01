import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import { adminDashboardAPI } from "../../../../../services/api";
import Card from "../../../../components/card/Card";

// Helper function to format VND currency
const formatVND = (amount) => {
  return `${(amount || 0).toLocaleString('vi-VN')} ₫`;
};

export default function StationsPerformance() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const stations = await adminDashboardAPI.getStationsPerformance();
        setData(stations || []);
      } catch (err) {
        console.error("Error fetching stations performance:", err);
        setError(err.message || "Failed to fetch stations performance");
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

  return (
    <Box mb="20px">
      <Text
        fontSize="2xl"
        fontWeight="700"
        mb="20px"
        color={textColor}>
        Stations Performance
      </Text>

      <Card p="20px">
        {data.length === 0 ? (
          <Text color="gray.400">No station performance data available</Text>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>Station Name</Th>
                <Th borderColor={borderColor} isNumeric>Total Vehicles</Th>
                <Th borderColor={borderColor} isNumeric>Active Rentals</Th>
                <Th borderColor={borderColor} isNumeric>Revenue</Th>
                <Th borderColor={borderColor} isNumeric>Utilization Rate</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((station, index) => (
                <Tr key={index}>
                  <Td borderColor={borderColor}>{station.stationName || "N/A"}</Td>
                  <Td borderColor={borderColor} isNumeric>{station.totalVehicles || 0}</Td>
                  <Td borderColor={borderColor} isNumeric>{station.activeRentals || 0}</Td>
                  <Td borderColor={borderColor} isNumeric>
                    {formatVND(station.revenue)}
                  </Td>
                  <Td borderColor={borderColor} isNumeric>
                    {(station.utilizationRate || 0).toFixed(1)}%
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </Box>
  );
}
