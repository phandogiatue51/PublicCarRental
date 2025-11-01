import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  useColorModeValue,
  Spinner,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
} from "@chakra-ui/react";
import { adminDashboardAPI } from "../../../../../services/api";
import Card from "../../../../components/card/Card";

export default function RiskCustomers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const riskCustomers = await adminDashboardAPI.getRiskCustomers();
        setData(riskCustomers || []);
      } catch (err) {
        console.error("Error fetching risk customers:", err);
        setError(err.message || "Failed to fetch risk customers");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRiskBadgeColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "yellow";
      default:
        return "gray";
    }
  };

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
        Risk Customers
      </Text>

      <Card p="20px">
        {data.length === 0 ? (
          <Text color="gray.400">No risk customers found</Text>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>Full Name</Th>
                <Th borderColor={borderColor}>Email</Th>
                <Th borderColor={borderColor}>Phone</Th>
                <Th borderColor={borderColor}>License Number</Th>
                <Th borderColor={borderColor} isNumeric>Total Rentals</Th>
                <Th borderColor={borderColor} isNumeric>Damage Reports</Th>
                <Th borderColor={borderColor} isNumeric>Late Returns</Th>
                <Th borderColor={borderColor}>Risk Level</Th>
                <Th borderColor={borderColor}>Last Rental</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((customer, index) => (
                <Tr key={index}>
                  <Td borderColor={borderColor}>{customer.fullName}</Td>
                  <Td borderColor={borderColor}>{customer.email}</Td>
                  <Td borderColor={borderColor}>{customer.phoneNumber}</Td>
                  <Td borderColor={borderColor}>{customer.licenseNumber}</Td>
                  <Td borderColor={borderColor} isNumeric>{customer.totalRentals || 0}</Td>
                  <Td borderColor={borderColor} isNumeric>{customer.damageReportCount || 0}</Td>
                  <Td borderColor={borderColor} isNumeric>{customer.lateReturnCount || 0}</Td>
                  <Td borderColor={borderColor}>
                    <Badge colorScheme={getRiskBadgeColor(customer.riskLevel)}>
                      {customer.riskLevel || "N/A"}
                    </Badge>
                  </Td>
                  <Td borderColor={borderColor}>
                    {customer.lastRentalDate
                      ? new Date(customer.lastRentalDate).toLocaleDateString()
                      : "N/A"}
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
