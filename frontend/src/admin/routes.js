import React from 'react';

import { Icon } from '@chakra-ui/react';
import {
  MdBarChart,
  MdPerson,
  MdHome,
  MdLock,
  MdOutlineShoppingCart,
  MdExitToApp,
} from 'react-icons/md';

// Admin Imports
import MainDashboard from '@admin/views/admin/default';
import NFTMarketplace from '@admin/views/admin/marketplace';
import Profile from '@admin/views/admin/profile';
import DataTables from '@admin/views/admin/dataTables';
import RTL from '@admin/views/admin/rtl';
import RenterList from '@admin/views/admin/renter/RenterList';
import BrandList from '@admin/views/admin/brand/BrandList';
import ModelList from '@admin/views/admin/model/ModelList';
import VehicleList from '@admin/views/admin/vehicle/VehicleList';
import ContractList from '@admin/views/admin/contract/ContractList';
import InvoiceList from '@admin/views/admin/invoice/InvoiceList';
import StaffList from '@admin/views/admin/staff/StaffList';
import StationList from '@admin/views/admin/station/StationList';

import Home from 'Pages/Home';


const routes = [
  {
    name: 'Main Dashboard',
    layout: '/admin',
    path: '/default',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <MainDashboard />,
  },
 
  {
  name: 'Renter',
  layout: '/admin',
  path: '/renter',
  icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
  component: <RenterList />,
  },
  {
    name: 'Brand',
    layout: '/admin',
    path: '/brand',
    icon: <Icon as={MdBarChart} width="20px" height="20px" color="inherit" />,
    component: <BrandList />,
  },
  {
    name: 'Model',
    layout: '/admin',
    path: '/model',
    icon: <Icon as={MdBarChart} width="20px" height="20px" color="inherit" />,
    component: <ModelList />,
  },
  {
    name: 'Vehicle',
    layout: '/admin',
    path: '/vehicle',
    icon: <Icon as={MdBarChart} width="20px" height="20px" color="inherit" />,
    component: <VehicleList />,
  },
  {
    name: 'Contract',
    layout: '/admin',
    path: '/contract',
    icon: <Icon as={MdBarChart} width="20px" height="20px" color="inherit" />,
    component: <ContractList />,
  },
  {
    name: 'Invoice',
    layout: '/admin',
    path: '/invoice',
    icon: <Icon as={MdBarChart} width="20px" height="20px" color="inherit" />,
    component: <InvoiceList />,
  },
  {
    name: 'Staff',
    layout: '/admin',
    path: '/staff',
    icon: <Icon as={MdBarChart} width="20px" height="20px" color="inherit" />,
    component: <StaffList />,
  },
  {
    name: 'Station',
    layout: '/admin',
    path: '/station',
    icon: <Icon as={MdBarChart} width="20px" height="20px" color="inherit" />,
    component: <StationList />,
  },
  {
    name: 'Return to Home',
    layout: '/',
    path: '/',
    icon: <Icon as={MdExitToApp} width="20px" height="20px" color="inherit" />,
    component: <Home />,
  },
];


export default routes;
