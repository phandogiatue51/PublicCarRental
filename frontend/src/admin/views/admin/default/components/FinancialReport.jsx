import React, { useState, useEffect, useMemo } from "react";
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
  Select,
} from "@chakra-ui/react";
import { adminDashboardAPI } from "../../../../../services/api";
import Card from "../../../../components/card/Card";
import LineChart from "./../../../../../admin/components/charts/LineChart.js";
import BarChart from "./../../../../../admin/components/charts/BarChart.js";

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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearlyData, setYearlyData] = useState(null);
  const [yearlyLoading, setYearlyLoading] = useState(false);

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const cardBg = useColorModeValue("white", "gray.700");
  const axisLabelColor = useColorModeValue("#A3AED0", "#CBD5E0");
  const gridColor = useColorModeValue("rgba(163, 174, 208, 0.2)", "rgba(203, 213, 224, 0.2)");

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

  // Fetch yearly data for revenue chart
  const fetchYearlyData = async (year) => {
    try {
      setYearlyLoading(true);
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      const report = await adminDashboardAPI.getFinancialReport({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      setYearlyData(report);
    } catch (err) {
      console.error("Error fetching yearly data:", err);
      setYearlyData(null);
    } finally {
      setYearlyLoading(false);
    }
  };

  // Fetch yearly data when year changes
  useEffect(() => {
    fetchYearlyData(selectedYear);
  }, [selectedYear]);

  // Process monthly revenue data from daily revenue
  const monthlyRevenueData = useMemo(() => {
    if (!yearlyData?.dailyRevenue || yearlyData.dailyRevenue.length === 0) {
      return null;
    }

    // Initialize months array with 12 months
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      monthName: new Date(selectedYear, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      revenue: 0,
    }));

    // Group daily revenue by month (ensure revenue is always >= 0)
    yearlyData.dailyRevenue.forEach((daily) => {
      const date = new Date(daily.date);
      if (date.getFullYear() === selectedYear) {
        const monthIndex = date.getMonth();
        const revenue = Math.max(daily.revenue || 0, 0); // Ensure no negative values
        months[monthIndex].revenue += revenue;
      }
    });

    return months;
  }, [yearlyData, selectedYear]);

  // Get the month with highest revenue for highlighting
  const highestRevenueMonth = useMemo(() => {
    if (!monthlyRevenueData) return -1;
    const revenues = monthlyRevenueData.map(m => m.revenue || 0);
    const maxRevenue = Math.max(...revenues);
    // Only highlight if there's at least some revenue
    if (maxRevenue <= 0) return -1;
    return revenues.findIndex(r => r === maxRevenue);
  }, [monthlyRevenueData]);

  // Generate chart data and options for monthly revenue
  const revenueChartData = useMemo(() => {
    if (!monthlyRevenueData) return { chartData: [], chartOptions: {} };

    const categories = monthlyRevenueData.map(m => m.monthName);
    // Ensure revenue values are always >= 0 and convert to thousands
    const revenueValues = monthlyRevenueData.map(m => Math.max((m.revenue || 0), 0) / 1000);

    // Calculate max value with better scaling
    const actualMax = revenueValues.length > 0 ? Math.max(...revenueValues) : 0;
    const maxValue = Math.max(actualMax, 10); // At least 10k for better scaling
    const roundedMax = Math.ceil(maxValue / 10) * 10; // Round up to nearest 10

    const barColors = monthlyRevenueData.map((_, index) => 
      index === highestRevenueMonth ? "#4318FF" : "#E2E8F0"
    );

    return {
      chartData: [
        {
          name: "Revenue",
          data: revenueValues,
        },
      ],
      chartOptions: {
        chart: {
          toolbar: { show: false },
        },
        plotOptions: {
          bar: {
            borderRadius: 4,
            columnWidth: "60%",
            distributed: true,
          },
        },
        dataLabels: {
          enabled: false,
        },
        xaxis: {
          categories: categories,
          labels: {
            style: {
              colors: axisLabelColor,
              fontSize: "12px",
              fontWeight: "500",
            },
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        yaxis: {
          min: 0, // Always start from 0, no negative values
          max: roundedMax,
          tickAmount: 5,
          labels: {
            formatter: (val) => `${Math.round(val)}k`,
            style: {
              colors: axisLabelColor,
              fontSize: "12px",
            },
          },
        },
        grid: {
          show: true,
          borderColor: gridColor,
          strokeDashArray: 5,
          xaxis: {
            lines: {
              show: false,
            },
          },
          yaxis: {
            lines: {
              show: true,
            },
          },
        },
        colors: barColors,
        tooltip: {
          y: {
            formatter: (val) => formatVND(val * 1000),
          },
        },
      },
    };
  }, [monthlyRevenueData, highestRevenueMonth, axisLabelColor, gridColor]);

  // Generate year options (current year and previous 4 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

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

      {/* Revenue Chart - Independent section */}
      <Card p="20px" mt="20px">
        <Flex align="center" justify="space-between" mb="15px">
          <Text fontSize="xl" fontWeight="700" color={textColor}>
            Revenue Chart
          </Text>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            w="150px"
            variant="filled"
            size="sm">
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year === new Date().getFullYear() ? "This Year" : year}
              </option>
            ))}
          </Select>
        </Flex>
        
        {yearlyLoading ? (
          <Flex justify="center" align="center" h="300px">
            <Spinner size="xl" />
          </Flex>
        ) : revenueChartData.chartData.length > 0 && monthlyRevenueData ? (
          <Box minH="300px">
            <BarChart
              chartData={revenueChartData.chartData}
              chartOptions={revenueChartData.chartOptions}
            />
          </Box>
        ) : (
          <Flex justify="center" align="center" h="300px">
            <Text color="gray.400">No revenue data available for this year</Text>
          </Flex>
        )}
      </Card>

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