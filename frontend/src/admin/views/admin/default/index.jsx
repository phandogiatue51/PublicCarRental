import React from "react";
import { Box } from "@chakra-ui/react";

// Dashboard components - named to match endpoints
import Overview from "./components/Overview";
import FinancialReport from "./components/FinancialReport";
import CustomerAnalytics from "./components/CustomerAnalytics";
import RiskCustomers from "./components/RiskCustomers";
import FleetManagement from "./components/FleetManagement";
import StaffPerformance from "./components/StaffPerformance";
import RatingAnalytics from "./components/RatingAnalytics";
import StationsPerformance from "./components/StationsPerformance";

export default function AdminDashboard() {
  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      {/* Overview */}
      <Overview />

      {/* Financial Report */}
      <FinancialReport />

      {/* Customer Analytics */}
      <CustomerAnalytics />

      {/* Risk Customers */}
      <RiskCustomers />

      {/* Fleet Management */}
      <FleetManagement />

      {/* Staff Performance */}
      <StaffPerformance />

      {/* Rating Analytics */}
      <RatingAnalytics />

      {/* Stations Performance */}
      <StationsPerformance />
    </Box>
  );
}