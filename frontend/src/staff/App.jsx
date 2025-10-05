import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import initialTheme from '../admin/theme/theme';
import StaffLayout from './layouts/StaffLayout';
import StaffDashboard from './Pages/StaffDashboard';
import RenterList from './Pages/RenterList';
import VehicleList from './Pages/VehicleList';
import ContractList from './Pages/Contract/ContractList';
import InvoiceList from './Pages/InvoiceList';
import ModelList from './Pages/ModelList';

export default function StaffApp() {
    return (
        <ChakraProvider theme={initialTheme}>
            <Routes>
                <Route path="/" element={<StaffLayout />}>
                    <Route index element={<Navigate to="/staff/dashboard" replace />} />
                    <Route path="dashboard" element={<StaffDashboard />} />
                    <Route path="renters" element={<RenterList />} />
                    <Route path="vehicles" element={<VehicleList />} />
                    <Route path="contracts" element={<ContractList />} />
                    <Route path="invoices" element={<InvoiceList />} />
                    <Route path="models" element={<ModelList />} />
                </Route>
            </Routes>
        </ChakraProvider>
    );
}
