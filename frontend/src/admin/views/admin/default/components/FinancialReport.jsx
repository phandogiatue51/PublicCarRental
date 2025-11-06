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
import LineChart from "./../../../../../admin/components/charts/LineChart.js";

// Helper function to format VND currency
const formatVND = (amount) => {
  return `${(amount || 0).toLocaleString('vi-VN')} ₫`;
};

// Helper to format percentage values
const formatPercent = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "0%";
  return `${Number(value).toFixed(2)}%`;
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
        <>
          {/* Period Summary (if available) */}
          {data.period && (
            <Card p="20px" mb="20px">
              <Text fontSize="md" color={textColor}>
                Period: {new Date(data.period.startDate).toLocaleDateString()} - {new Date(data.period.endDate).toLocaleDateString()}
              </Text>
            </Card>
          )}

          {/* Top KPIs */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px" mb="20px">
            <Card p="20px">
              <Text fontSize="sm" color="gray.400" mb="5px">Total Revenue</Text>
              <Text fontSize="2xl" fontWeight="700" color={textColor}>
                {formatVND(data.totalRevenue ?? data.totalIncome)}
              </Text>
            </Card>           
            <Card p="20px">
              <Text fontSize="sm" color="gray.400" mb="5px">Total Refunds</Text>
              <Text fontSize="2xl" fontWeight="700" color={textColor}>
                {formatVND(data.totalRefunds)}
              </Text>
            </Card>
            <Card p="20px">
              <Text fontSize="sm" color="gray.400" mb="5px">Net Revenue</Text>
              <Text fontSize="2xl" fontWeight="700" color={textColor}>
                {formatVND(data.netRevenue)}
              </Text>
            </Card>
            <Card p="20px">
              <Text fontSize="sm" color="gray.400" mb="5px">Full Refunds Count</Text>
              <Text fontSize="2xl" fontWeight="700" color={textColor}>
                {data.fullRefundsCount ?? 0}
              </Text>
            </Card>
          </SimpleGrid>

          {/* Extended KPIs */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px" mb="20px">
            <Card p="20px">
              <Text fontSize="sm" color="gray.400" mb="5px">Total Invoices</Text>
              <Text fontSize="2xl" fontWeight="700" color={textColor}>
                {data.totalInvoices ?? 0}
              </Text>
            </Card>
            <Card p="20px">
              <Text fontSize="sm" color="gray.400" mb="5px">Total Invoice Amount</Text>
              <Text fontSize="2xl" fontWeight="700" color={textColor}>
                {formatVND(data.totalInvoiceAmount)}
              </Text>
            </Card>
            <Card p="20px">
              <Text fontSize="sm" color="gray.400" mb="5px">Total Amount Paid</Text>
              <Text fontSize="2xl" fontWeight="700" color={textColor}>
                {formatVND(data.totalAmountPaid)}
              </Text>
            </Card>
            <Card p="20px">
              <Text fontSize="sm" color="gray.400" mb="5px">Refund Rate</Text>
              <Text fontSize="2xl" fontWeight="700" color={textColor}>
                {formatPercent(data.refundRate)}
              </Text>
            </Card>
          </SimpleGrid>

        </>
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
                <Th borderColor={borderColor} isNumeric>Total Rentals</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.revenueByStation.map((station, index) => (
                <Tr key={index}>
                  <Td borderColor={borderColor}>{station.stationName}</Td>
                  <Td borderColor={borderColor} isNumeric>
                    {formatVND(station.revenue)}
                  </Td>
                  <Td borderColor={borderColor} isNumeric>
                    {station.totalRentals ?? 0}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {data?.dailyRevenue && data.dailyRevenue.length > 0 && (() => {
        const dailyCategories = data.dailyRevenue.map((d) =>
          new Date(d.date).toLocaleDateString()
        );
        const dailySeriesData = data.dailyRevenue.map((d) => d.revenue ?? 0);

        const lineChartData = [
          { name: "Revenue", data: dailySeriesData },
        ];

        const lineChartOptions = {
          chart: { toolbar: { show: false } },
          dataLabels: { enabled: false },
          stroke: { curve: "smooth", width: 3 },
          xaxis: { categories: dailyCategories, labels: { rotate: -45 } },
          yaxis: {
            labels: {
              formatter: (val) => `${(val || 0).toLocaleString('vi-VN')} ₫`,
            },
          },
          tooltip: {
            y: { formatter: (val) => formatVND(val) },
          },
        };

        return (
          <Card p="20px" mt="20px">
            <Text fontSize="xl" fontWeight="700" mb="15px" color={textColor}>
              Daily Revenue
            </Text>
            <Box minH="260px" mb="20px">
              <LineChart chartData={lineChartData} chartOptions={lineChartOptions} />
            </Box>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th borderColor={borderColor}>Date</Th>
                  <Th borderColor={borderColor} isNumeric>Revenue</Th>
                  <Th borderColor={borderColor} isNumeric>Rental Count</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.dailyRevenue.map((d, idx) => (
                  <Tr key={idx}>
                    <Td borderColor={borderColor}>{new Date(d.date).toLocaleDateString()}</Td>
                    <Td borderColor={borderColor} isNumeric>{formatVND(d.revenue)}</Td>
                    <Td borderColor={borderColor} isNumeric>{d.rentalCount ?? 0}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        );
      })()}

      {data?.revenueByVehicleType && data.revenueByVehicleType.length > 0 && (
        <Card p="20px" mt="20px">
          <Text fontSize="xl" fontWeight="700" mb="15px" color={textColor}>
            Revenue by Vehicle Type
          </Text>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>Vehicle Type</Th>
                <Th borderColor={borderColor} isNumeric>Revenue</Th>
                <Th borderColor={borderColor} isNumeric>Rental Count</Th>
                <Th borderColor={borderColor} isNumeric>Market Share</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.revenueByVehicleType.map((v, idx) => (
                <Tr key={idx}>
                  <Td borderColor={borderColor}>{v.vehicleType}</Td>
                  <Td borderColor={borderColor} isNumeric>{formatVND(v.revenue)}</Td>
                  <Td borderColor={borderColor} isNumeric>{v.rentalCount ?? 0}</Td>
                  <Td borderColor={borderColor} isNumeric>{formatPercent(v.marketShare)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {data?.refundsByStation && data.refundsByStation.length > 0 && (
        <Card p="20px" mt="20px">
          <Text fontSize="xl" fontWeight="700" mb="15px" color={textColor}>
            Refunds by Station
          </Text>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>Station Name</Th>
                <Th borderColor={borderColor} isNumeric>Refund Amount</Th>
                <Th borderColor={borderColor} isNumeric>Refund Count</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.refundsByStation.map((r, idx) => (
                <Tr key={idx}>
                  <Td borderColor={borderColor}>{r.stationName}</Td>
                  <Td borderColor={borderColor} isNumeric>{formatVND(r.refundAmount)}</Td>
                  <Td borderColor={borderColor} isNumeric>{r.refundCount ?? 0}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {data?.invoiceStatusBreakdown && data.invoiceStatusBreakdown.length > 0 && (
        <Card p="20px" mt="20px">
          <Text fontSize="xl" fontWeight="700" mb="15px" color={textColor}>
            Invoice Status Breakdown
          </Text>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>Status</Th>
                <Th borderColor={borderColor} isNumeric>Count</Th>
                <Th borderColor={borderColor} isNumeric>Total Amount</Th>
                <Th borderColor={borderColor} isNumeric>Percentage</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.invoiceStatusBreakdown.map((s, idx) => (
                <Tr key={idx}>
                  <Td borderColor={borderColor}>{s.status}</Td>
                  <Td borderColor={borderColor} isNumeric>{s.count ?? 0}</Td>
                  <Td borderColor={borderColor} isNumeric>{formatVND(s.totalAmount)}</Td>
                  <Td borderColor={borderColor} isNumeric>{formatPercent(s.percentage)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}
    </Box>
  );
}