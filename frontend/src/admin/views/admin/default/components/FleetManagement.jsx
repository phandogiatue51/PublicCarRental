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
import {
  MdDirectionsCar,
  MdCheckCircle,
  MdBuild,
  MdEventAvailable,
} from "react-icons/md";

// Helper function to format VND currency
const formatVND = (amount) => {
  return `${(amount || 0).toLocaleString('vi-VN')} ₫`;
};

export default function FleetManagement() {
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
        const fleet = await adminDashboardAPI.getFleetManagement();
        setData(fleet);
      } catch (err) {
        console.error("Error fetching fleet management:", err);
        setError(err.message || "Failed to fetch fleet management data");
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
        Fleet Management
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px" mb="20px">
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="32px" h="32px" as={MdEventAvailable} color={brandColor} />}
            />
          }
          name="Available Vehicles"
          value={data.availableVehicles || 0}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="32px" h="32px" as={MdDirectionsCar} color={brandColor} />}
            />
          }
          name="Rented Vehicles"
          value={data.rentedVehicles || 0}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="32px" h="32px" as={MdBuild} color={brandColor} />}
            />
          }
          name="Maintenance Vehicles"
          value={data.maintenanceVehicles || 0}
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
          name="Total Vehicles"
          value={
            (data.availableVehicles || 0) +
            (data.rentedVehicles || 0) +
            (data.maintenanceVehicles || 0)
          }
        />
      </SimpleGrid>

      {data.vehicleDistributionByStation && data.vehicleDistributionByStation.length > 0 && (
        <Card p="20px" mb="20px">
          <Text fontSize="xl" fontWeight="700" mb="15px" color={textColor}>
            Vehicle Distribution by Station
          </Text>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>Station Name</Th>
                <Th borderColor={borderColor}>Address</Th>
                <Th borderColor={borderColor} isNumeric>Total Vehicles</Th>
                <Th borderColor={borderColor} isNumeric>Available</Th>
                <Th borderColor={borderColor} isNumeric>Rented</Th>
                <Th borderColor={borderColor} isNumeric>Maintenance</Th>
                <Th borderColor={borderColor} isNumeric>Utilization Rate</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.vehicleDistributionByStation.map((station, index) => (
                <Tr key={index}>
                  <Td borderColor={borderColor}>{station.stationName}</Td>
                  <Td borderColor={borderColor}>{station.stationAddress || "N/A"}</Td>
                  <Td borderColor={borderColor} isNumeric>{station.totalVehicles || 0}</Td>
                  <Td borderColor={borderColor} isNumeric>{station.availableVehicles || 0}</Td>
                  <Td borderColor={borderColor} isNumeric>{station.rentedVehicles || 0}</Td>
                  <Td borderColor={borderColor} isNumeric>{station.maintenanceVehicles || 0}</Td>
                  <Td borderColor={borderColor} isNumeric>
                    {(station.utilizationRate || 0).toFixed(1)}%
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {data.topPerformingModels && data.topPerformingModels.length > 0 && (
        <Card p="20px">
          <Text fontSize="xl" fontWeight="700" mb="15px" color={textColor}>
            Top Performing Models
          </Text>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>Model</Th>
                <Th borderColor={borderColor}>Brand</Th>
                <Th borderColor={borderColor} isNumeric>Total Rentals</Th>
                <Th borderColor={borderColor} isNumeric>Revenue</Th>
                <Th borderColor={borderColor} isNumeric>Utilization Rate</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.topPerformingModels.map((model, index) => (
                <Tr key={index}>
                  <Td borderColor={borderColor}>{model.modelName || "N/A"}</Td>
                  <Td borderColor={borderColor}>{model.brandName || "N/A"}</Td>
                  <Td borderColor={borderColor} isNumeric>{model.totalRentals || 0}</Td>
                  <Td borderColor={borderColor} isNumeric>
                    {formatVND(model.totalRevenue)}
                  </Td>
                  <Td borderColor={borderColor} isNumeric>
                    {(model.utilizationRate || 0).toFixed(1)}%
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
