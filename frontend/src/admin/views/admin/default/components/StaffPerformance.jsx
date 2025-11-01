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
import { MdGroups, MdCheckCircle, MdLogout } from "react-icons/md";

export default function StaffPerformance() {
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
        const performance = await adminDashboardAPI.getStaffPerformance();
        setData(performance);
      } catch (err) {
        console.error("Error fetching staff performance:", err);
        setError(err.message || "Failed to fetch staff performance");
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
        Staff Performance
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px" mb="20px">
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="32px" h="32px" as={MdGroups} color={brandColor} />}
            />
          }
          name="Total Staff"
          value={data.totalStaff || 0}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="32px" h="32px" as={MdCheckCircle} color={brandColor} />}
            />
          }
          name="Active Staff"
          value={data.activeStaff || 0}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="32px" h="32px" as={MdLogout} color={brandColor} />}
            />
          }
          name="Avg Check-ins/Staff"
          value={(data.averageCheckInsPerStaff || 0).toFixed(1)}
        />
        <MiniStatistics
          name="Avg Check-outs/Staff"
          value={(data.averageCheckOutsPerStaff || 0).toFixed(1)}
        />
      </SimpleGrid>

      {data.topPerformers && data.topPerformers.length > 0 && (
        <Card p="20px">
          <Text fontSize="xl" fontWeight="700" mb="15px" color={textColor}>
            Top Performers
          </Text>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>Staff Name</Th>
                <Th borderColor={borderColor}>Station</Th>
                <Th borderColor={borderColor} isNumeric>Check-ins</Th>
                <Th borderColor={borderColor} isNumeric>Check-outs</Th>
                <Th borderColor={borderColor} isNumeric>Total Rentals Processed</Th>
                <Th borderColor={borderColor} isNumeric>Customer Satisfaction</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.topPerformers.map((staff, index) => (
                <Tr key={index}>
                  <Td borderColor={borderColor}>{staff.fullName || "N/A"}</Td>
                  <Td borderColor={borderColor}>{staff.stationName || "N/A"}</Td>
                  <Td borderColor={borderColor} isNumeric>{staff.totalCheckIns || 0}</Td>
                  <Td borderColor={borderColor} isNumeric>{staff.totalCheckOuts || 0}</Td>
                  <Td borderColor={borderColor} isNumeric>{staff.totalRentalsProcessed || 0}</Td>
                  <Td borderColor={borderColor} isNumeric>
                    {(staff.customerSatisfactionScore || 0).toFixed(1)}
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
