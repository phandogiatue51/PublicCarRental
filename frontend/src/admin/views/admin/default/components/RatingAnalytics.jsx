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
import { MdStar, MdComment, MdTrendingUp } from "react-icons/md";

export default function RatingAnalytics() {
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
        const analytics = await adminDashboardAPI.getRatingAnalytics();
        setData(analytics);
      } catch (err) {
        console.error("Error fetching rating analytics:", err);
        setError(err.message || "Failed to fetch rating analytics");
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
        Rating Analytics
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px" mb="20px">
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="32px" h="32px" as={MdStar} color={brandColor} />}
            />
          }
          name="Total Ratings"
          value={data.totalRatings || 0}
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
          name="Average Rating"
          value={(data.averageRating || 0).toFixed(1)}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<Icon w="32px" h="32px" as={MdComment} color={brandColor} />}
            />
          }
          name="Total Models Rated"
          value={data.totalModelsRated || 0}
        />
        {data.bestRatedModel && (
          <MiniStatistics
            name="Best Rated Model"
            value={data.bestRatedModel.modelName || "N/A"}
          />
        )}
      </SimpleGrid>

      {data.ratingDistribution && data.ratingDistribution.length > 0 && (
        <Card p="20px" mb="20px">
          <Text fontSize="xl" fontWeight="700" mb="15px" color={textColor}>
            Rating Distribution
          </Text>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>Stars</Th>
                <Th borderColor={borderColor} isNumeric>Count</Th>
                <Th borderColor={borderColor} isNumeric>Percentage</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.ratingDistribution.map((dist, index) => (
                <Tr key={index}>
                  <Td borderColor={borderColor}>{dist.stars || "N/A"} ⭐</Td>
                  <Td borderColor={borderColor} isNumeric>{dist.count || 0}</Td>
                  <Td borderColor={borderColor} isNumeric>{(dist.percentage || 0).toFixed(1)}%</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {data.recentComments && data.recentComments.length > 0 && (
        <Card p="20px" mb="20px">
          <Text fontSize="xl" fontWeight="700" mb="15px" color={textColor}>
            Recent Comments
          </Text>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>Customer</Th>
                <Th borderColor={borderColor}>Vehicle</Th>
                <Th borderColor={borderColor}>Comment</Th>
                <Th borderColor={borderColor}>Rating</Th>
                <Th borderColor={borderColor}>Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.recentComments.map((comment, index) => (
                <Tr key={index}>
                  <Td borderColor={borderColor}>{comment.renterName || "N/A"}</Td>
                  <Td borderColor={borderColor}>
                    {comment.brand || "N/A"} {comment.vehicleModel || ""}
                  </Td>
                  <Td borderColor={borderColor}>{comment.comment || "N/A"}</Td>
                  <Td borderColor={borderColor}>{comment.stars || 0} ⭐</Td>
                  <Td borderColor={borderColor}>
                    {comment.createdAt
                      ? new Date(comment.createdAt).toLocaleDateString()
                      : "N/A"}
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
            Top Performing Models by Rating
          </Text>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>Model</Th>
                <Th borderColor={borderColor}>Brand</Th>
                <Th borderColor={borderColor} isNumeric>Average Rating</Th>
                <Th borderColor={borderColor} isNumeric>Total Ratings</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.topPerformingModels.map((model, index) => (
                <Tr key={index}>
                  <Td borderColor={borderColor}>{model.modelName || "N/A"}</Td>
                  <Td borderColor={borderColor}>{model.brandName || "N/A"}</Td>
                  <Td borderColor={borderColor} isNumeric>
                    {(model.averageRating || 0).toFixed(1)} ⭐
                  </Td>
                  <Td borderColor={borderColor} isNumeric>{model.totalRatings || 0}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}
    </Box>
  );
}
