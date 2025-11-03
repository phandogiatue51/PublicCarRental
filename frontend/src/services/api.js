const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'https://publiccarrental-production-b7c5.up.railway.app/api'
  : process.env.REACT_APP_API_URL || 'https://publiccarrental-production-b7c5.up.railway.app/api';

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const isFormData = options.body instanceof FormData;

  const token = typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null;
  const config = {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      'accept': '*/*',
      ...(!options.skipAuth && token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    mode: 'cors', // Enable CORS
    credentials: 'omit', // Don't send credentials for CORS
    ...options,
  };

  try {
    console.log('Making API request to:', url, 'with config:', config);

    if (config.body instanceof FormData) {
      console.log('Sending FormData with entries:');
      for (let [key, value] of config.body.entries()) {
        console.log(`${key}:`, value);
        if (value instanceof File) {
          console.log(`  File details:`, {
            name: value.name,
            size: value.size,
            type: value.type
          });
        }
      }
      console.log('Content-Type header:', config.headers['Content-Type']);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }


    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      try {
        const data = await response.json();
        console.log('API Response (JSON):', data);
        return data;
      } catch (e) {
        console.warn('Warning: Response was application/json but parsing failed. Assuming success with generic message.', e);
        return { message: 'Operation successful, but response format was unexpected.', status: response.status };
      }
    } else {
      console.log('API Response (Non-JSON/Empty):', response);
      return { message: 'Operation successful', status: response.status };
    }
  } catch (error) {
    console.error('API request failed:', error);

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to the server. Please check if the backend is running and accessible.');
    }

    throw error;
  }
};

// Brand API services
export const brandAPI = {
  // Get all brands
  getAll: () => apiRequest('/Brand/get-all'),

  // Get brand by ID
  getById: (id) => apiRequest(`/Brand/${id}`),

  // Create new brand
  create: (brandData) => apiRequest('/Brand/create-brand', {
    method: 'POST',
    body: JSON.stringify(brandData),
  }),

  // Update brand
  update: (id, brandData) => apiRequest(`/Brand/update-brand/${id}`, {
    method: 'PUT',
    body: JSON.stringify(brandData),
  }),

  // Delete brand
  delete: (id) => apiRequest(`/Brand/delete-brand/${id}`, {
    method: 'DELETE',
  }),
};

// Model API services
export const modelAPI = {
  // Get all models
  getAll: () => apiRequest('/Model/get-all'),

  // Get model by ID
  getById: async (id) => {
    try {
      const response = await apiRequest(`/Model/${id}`);
      return response.result || response;
    } catch (error) {
      console.error('Error fetching model by ID:', error);
      return null;
    }
  },

  // Filter models by brand, type, and station - FIXED
  filterModels: async (brandId, typeId, stationId) => {
    try {
      const params = new URLSearchParams();
      if (brandId) params.append('brandId', brandId);
      if (typeId) params.append('typeId', typeId);
      if (stationId) params.append('stationId', stationId);

      const response = await apiRequest(`/Model/filter-models?${params.toString()}`);
      return response.result || response || [];
    } catch (error) {
      console.error('Error filtering models:', error);
      return [];
    }
  },

  getStationFromModel: async (modelId) => {
    try {
      const response = await apiRequest(`/Model/get-station-from-model/${modelId}`);
      console.log('Raw API response:', response);
      return response || [];
    } catch (error) {
      console.error('Error fetching stations from model:', error);
      return [];
    }
  },

  create: (modelData) => apiRequest('/Model/create-model', {
    method: 'POST',
    body: modelData,
  }),

  update: (id, modelData) => apiRequest(`/Model/update-model/${id}`, {
    method: 'PUT',
    body: modelData,
  }),

  delete: (id) => apiRequest(`/Model/delete-model/${id}`, {
    method: 'DELETE',
  }),

  getAvailableCount: async (modelId, stationId, startTime, endTime) => {
    try {
      const response = await apiRequest('/Model/get-available-count', {
        method: 'POST',
        body: JSON.stringify({
          modelId: modelId,
          stationId: stationId,
          startTime: startTime,
          endTime: endTime
        })
      });
      return response.result || response || 0;
    } catch (error) {
      console.error('Error fetching available count:', error);
      return 0;
    }
  }
};

export const typeAPI = {
  getAll: () => apiRequest('/Type/get-all'),
};

export const staffAPI = {
  getAll: () => apiRequest('/Staff/all-staff'),

  getById: (id) => apiRequest(`/Staff/${id}`),

  create: (staffData) => apiRequest('/Staff/register-staff', {
    method: 'POST',
    body: JSON.stringify(staffData),
  }),

  // Update staff
  update: (id, staffData) => apiRequest(`/Staff/update-staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(staffData),
  }),

  // Delete staff
  delete: (id) => apiRequest(`/Staff/delete-staff/${id}`, {
    method: 'DELETE',
  }),

  // Change staff status
  changeStatus: (id) => apiRequest(`/Staff/change-status/${id}`, {
    method: 'POST',
  }),

  // Search staff by parameter (optional station and contract filter)
  searchByParam: (param, stationId, contractId) => {
    const queryParams = new URLSearchParams();
    if (param) queryParams.append('param', param);
    if (stationId) queryParams.append('stationId', stationId);
    if (contractId) queryParams.append('contractId', contractId);
    return apiRequest(`/Staff/search-by-param?${queryParams.toString()}`);
  },
};

// Station API services
export const stationAPI = {
  // Get all stations
  getAll: () => apiRequest('/Station/all-stations'),

  // Get station by ID
  getById: (id) => apiRequest(`/Station/${id}`),

  // Create new station
  create: (stationData) => apiRequest('/Station/create-station', {
    method: 'POST',
    body: JSON.stringify(stationData),
  }),

  // Update station
  update: (id, stationData) => apiRequest(`/Station/update-station/${id}`, {
    method: 'PUT',
    body: JSON.stringify(stationData),
  }),

  // Delete station
  delete: (id) => apiRequest(`/Station/delete-station/${id}`, {
    method: 'DELETE',
  }),

};

// Renter API services
export const renterAPI = {
  // Get all renters
  getAll: () => apiRequest('/EVRenter/all-renters'),

  // Get renter by ID
  getById: (id) => apiRequest(`/EVRenter/${id}`),

  // Filter renters by parameter
  filterByParam: (param) => apiRequest(`/EVRenter/filter-by-param/${param}`),

  filter: (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.search) queryParams.append('param', filters.search);
    if (filters.status !== undefined && filters.status !== "") queryParams.append('status', filters.status);
    const queryString = queryParams.toString();
    return apiRequest(`/EVRenter/filter${queryString ? `?${queryString}` : ''}`);
  },
  // Update renter
  updateRenter: (id, renterData) => apiRequest(`/EVRenter/update-renter/${id}`, {
    method: 'PUT',
    body: JSON.stringify(renterData),
  }),

  changePassword: (id, passwordData) => {
    const formData = new FormData();
    formData.append('id', id);
    formData.append('OldPassword', passwordData.currentPassword);
    formData.append('NewPassword', passwordData.newPassword);
    formData.append('ConfirmPassword', passwordData.confirmPassword);
    return apiRequest('/EVRenter/change-password', {
      method: 'POST',
      body: formData,
    });
  },

  // Delete renter
  deleteRenter: (id) => apiRequest(`/EVRenter/delete-renter/${id}`, {
    method: 'DELETE',
  }),

  // Change renter status
  changeStatus: (id) => apiRequest(`/EVRenter/change-status/${id}`, {
    method: 'POST',
  }),

  // Get renter favorites
  getFavorites: (renterId) => apiRequest(`/EVRenter/${renterId}/favorites`),

  // Add favorite model
  addFavorite: (renterId, modelId) => apiRequest(`/EVRenter/${renterId}/favorites/${modelId}`, {
    method: 'POST',
  }),

  // Remove favorite model
  removeFavorite: (renterId, modelId) => apiRequest(`/EVRenter/${renterId}/favorites/${modelId}`, {
    method: 'DELETE',
  }),

  // Get renter contracts
  getContracts: (renterId) => apiRequest(`/EVRenter/${renterId}/contracts`),

  // Get renter invoices
  getInvoices: (renterId) => apiRequest(`/EVRenter/${renterId}/invoices`),
};

// Account API services
export const accountAPI = {
  // Get all accounts
  getAll: () => apiRequest('/Account/get-all'),

  // Get account by ID
  getById: (id) => apiRequest(`/Account/${id}`),

  // Login
  login: (payload) => apiRequest('/Account/login', {
    method: 'POST',
    body: JSON.stringify({
      Identifier: payload.Identifier,
      Password: payload.Password,
    }),
    // For login, don't send Authorization header
    skipAuth: true,
  }),

  // Register EVRenter
  register: (payload) => apiRequest('/Account/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: payload.fullName,
      email: payload.email,
      phoneNumber: payload.phoneNumber,
      identityCardNumber: payload.identityCardNumber,
      licenseNumber: payload.licenseNumber,
      password: payload.password,
    }),
    skipAuth: true,
  }),

  // Logout
  logout: () => apiRequest('/Account/logout', {
    method: 'POST',
  }),

  // Verify email
  verifyEmail: (token) => apiRequest(`/Account/verify-email?token=${token}`),

  // Forgot password
  forgotPassword: (email) => {
    const formData = new FormData();
    formData.append('email', email);

    return apiRequest('/Account/forgot-password', {
      method: 'POST',
      body: formData,
      skipAuth: true,
    });
  },

  // Reset password
  resetPassword: (token, newPassword) => {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('newPassword', newPassword);

    return apiRequest('/Account/reset-password', {
      method: 'POST',
      body: formData,
      skipAuth: true,
    });
  },
};

// Contract API services
export const contractAPI = {
  // Get all contracts
  getAll: () => apiRequest('/Contract/all'),

  // Get contract by ID
  getById: (id) => apiRequest(`/Contract/${id}`),

  // Update contract
  updateContract: (id, contractData) => apiRequest(`/Contract/update-contract/${id}`, {
    method: 'POST',
    body: JSON.stringify(contractData),
  }),

  // Active contract (confirm handover)
  activeContract: (formData) => apiRequest('/Contract/active-contract', {
    method: 'POST',
    body: formData,
  }),

  // Finish contract (return vehicle)
  finishContract: (formData) => apiRequest('/Contract/finish-contract', {
    method: 'POST',
    body: formData,
  }),

  // Delete contract
  deleteContract: (id) => apiRequest(`/Contract/delete-contract/${id}`, {
    method: 'DELETE',
  }),

  // Get contracts by station ID
  getByStation: (stationId) => apiRequest(`/Contract/get-by-station/${stationId}`),

  // Filter contracts with multiple parameters
  filter: (filters) => {
    const queryParams = new URLSearchParams();
    if (filters.stationId) queryParams.append('stationId', filters.stationId);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.renterId) queryParams.append('renterId', filters.renterId);
    if (filters.staffId) queryParams.append('staffId', filters.staffId);
    if (filters.vehicleId) queryParams.append('vehicleId', filters.vehicleId);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);

    const queryString = queryParams.toString();
    return apiRequest(`/Contract/filter${queryString ? `?${queryString}` : ''}`);
  },

  // Download contract PDF
  downloadContractPdf: (contractId) => apiRequest(`/Contract/contracts/${contractId}/pdf`),
};

// Vehicle API services
export const vehicleAPI = {
  // Get all vehicles
  getAll: () => apiRequest('/Vehicle/get-all'),

  // Get vehicle by ID
  getById: (id) => apiRequest(`/Vehicle/${id}`),

  // Create vehicle
  create: (vehicleData) => apiRequest('/Vehicle/create-vehicle', {
    method: 'POST',
    body: JSON.stringify(vehicleData),
  }),

  // Update vehicle
  update: (id, vehicleData) => apiRequest(`/Vehicle/update-vehicle/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vehicleData),
  }),

  // Delete vehicle
  delete: (id) => apiRequest(`/Vehicle/delete-vehicle/${id}`, {
    method: 'DELETE',
  }),

  // Get available vehicles
  getAvailableVehicles: (modelId, stationId, startTime, endTime) => {
    const queryParams = new URLSearchParams();
    queryParams.append('modelId', modelId);
    queryParams.append('stationId', stationId);
    queryParams.append('startTime', startTime);
    queryParams.append('endTime', endTime);

    return apiRequest(`/Vehicle/available-vehicles?${queryParams.toString()}`);
  },

  filter: (filters) => {
    const queryParams = new URLSearchParams();

    if (filters.stationId !== undefined && filters.stationId !== null)
      queryParams.append('stationId', filters.stationId);
    if (filters.status !== undefined && filters.status !== null)
      queryParams.append('status', filters.status);
    if (filters.modelId !== undefined && filters.modelId !== null)
      queryParams.append('modelId', filters.modelId);
    if (filters.typeId !== undefined && filters.typeId !== null)
      queryParams.append('typeId', filters.typeId);
    if (filters.brandId !== undefined && filters.brandId !== null)
      queryParams.append('brandId', filters.brandId);

    const queryString = queryParams.toString();
    return apiRequest(`/Vehicle/filter-vehicle${queryString ? `?${queryString}` : ''}`);
  },

  getAvaiable: (stationId, startTime, endTime) => {
    const queryParams = new URLSearchParams();
    if (stationId) queryParams.append('stationId', stationId);
    if (startTime) queryParams.append('startDate', startTime);
    if (endTime) queryParams.append('endDate', endTime);

    return apiRequest(`/Vehicle/check-availability?${queryParams.toString()}`, {
      method: 'POST', // This should be POST, not GET
      // If your backend expects a body, you might need this instead:
      // body: JSON.stringify({ stationId, startTime, endTime }),
    });
  }
};

// Invoice API services
export const invoiceAPI = {
  // Get all invoices
  getAll: () => apiRequest('/Invoice/all-invoices'),

  // Get invoice by ID
  getById: (id) => apiRequest(`/Invoice/${id}`),

  // Get invoice by contract ID
  getByContractId: (contractId) => apiRequest(`/Invoice/by-contract/${contractId}`),

  // Get invoice by order code
  getByOrderCode: (orderCode) => apiRequest(`/Invoice/by-order-code/${orderCode}`),

  // Get invoices by station ID
  getByStation: (stationId) => apiRequest(`/Invoice/get-by-station/${stationId}`),

  // 🔍 Filter invoices (new)
  filter: (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.contractId) queryParams.append('contractId', filters.contractId);
    if (filters.orderCode) queryParams.append('orderCode', filters.orderCode);
    if (filters.stationId) queryParams.append('stationId', filters.stationId);

    const queryString = queryParams.toString();
    return apiRequest(`/Invoice/filter${queryString ? `?${queryString}` : ''}`);
  },

  // Cancel invoice by order code
  cancelInvoice: (orderCode) => apiRequest(`/Invoice/cancel-invoice/${orderCode}`, {
    method: 'DELETE',
  }),
};

// Booking API
export const bookingAPI = {
  // Create booking request
  createBooking: (bookingData) => apiRequest('/Booking/request', {
    method: 'POST',
    body: JSON.stringify(bookingData)
  }),

  // Get booking summary by token
  getBookingSummary: (bookingToken) => apiRequest(`/Booking/summary/${bookingToken}`),
};

export const documentAPI = {
  getAll: () => apiRequest('/Document/get-all'),

  getByRenterId: (renterId) => apiRequest(`/Document/get-by-renter-id/${renterId}`),

  getByStaffId: (staffId) => apiRequest(`/Document/get-by-staff-id/${staffId}`),

  uploadStaffId: (staffId, formData) => {
    const url = `/Document/upload-staff-id?staffId=${staffId}`;
    return apiRequest(url, {
      method: 'POST',
      body: formData,
    });
  },

  uploadRenterAll: (renterId, formData) => apiRequest(`/Document/upload-renter-all/${renterId}`, {
    method: 'POST',
    body: formData,
  }),
};

export const transactionAPI = {
  getAll: () => apiRequest('/Transaction/get-all'),
};

export const accidentAPI = {
  getAll: async () => {
    const data = await apiRequest('/Accident/get-all');
    return data;
  },

  getById: async (id) => {
    const data = await apiRequest(`/Accident/${id}`);
    return data;
  },

  createVehicleAccident: async (formData) => {
    try {
      const response = await apiRequest('/Accident/vehicle-report', {
        method: 'POST',
        body: formData,
      });

      console.log('Vehicle accident response:', response);

      // Handle the actual response structure from your backend
      if (response && response.status === 200) {
        return { success: true, message: response.message };
      }

      return { success: false, message: response.message || 'Unknown error' };
    } catch (error) {
      console.error('Vehicle accident API call failed:', error);
      throw error;
    }
  },

  createContractAccident: async (formData) => {
    try {
      const response = await apiRequest('/Accident/contract-report', {
        method: 'POST',
        body: formData,
      });

      console.log('Contract accident response:', response);

      // Handle the actual response structure from your backend
      if (response && response.status === 200) {
        return { success: true, message: response.message };
      }

      return { success: false, message: response.message || 'Unknown error' };
    } catch (error) {
      console.error('Contract accident API call failed:', error);
      throw error;
    }
  },

  deleteAcc: (id) => apiRequest(`/Accident/${id}`, {
    method: 'DELETE',
  }),

   updateAccident: (id, updateData) => apiRequest(`/Accident/update-accident/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData)
  }),

  filter: (filters) => apiRequest('/Accident/filter', {
    method: 'GET',
    queryParams: filters
  }),

  getReplacementPreview: async (accidentId) => {
    const data = await apiRequest(`/Accident/${accidentId}/replacement-preview`);
    return data;
  },

  executeReplacement: async (accidentId) => {
    const data = await apiRequest(`/Accident/${accidentId}/execute-replacement`, {
      method: 'POST'
    });
    return data;
  }
};

export const modificationAPI = {
  changeModel: async (contractId, requestData) => {
    const data = await apiRequest(`/contracts/${contractId}/modifications/renter/change-model`, {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    return data;
  },

  extendTime: async (contractId, requestData) => {
    const data = await apiRequest(`/contracts/${contractId}/modifications/renter/extend-time`, {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    return data;
  },

  changeVehicle: async (contractId, requestData) => {
    const data = await apiRequest(`/contracts/${contractId}/modifications/renter/change-vehicle`, {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    return data;
  },

  cancelContract: async (contractId, requestData) => {
    const data = await apiRequest(`/contracts/${contractId}/modifications/renter/cancel-contract`, {
      method: 'DELETE',
      body: JSON.stringify(requestData)
    });
    return data;
  }
};

export const ratingsAPI = {
  getAll: () => apiRequest('/Ratings'),

  getById: (id) => apiRequest(`/Ratings/${id}`),

  create: (ratingData) => apiRequest('/Ratings', {
    method: 'POST',
    body: JSON.stringify(ratingData),
  }),

  update: (id, ratingData) => apiRequest(`/Ratings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(ratingData),
  }),

  delete: (id) => apiRequest(`/Ratings/${id}`, {
    method: 'DELETE',
  }),

  getByContract: (contractId) => apiRequest(`/Ratings/contract/${contractId}`),

  getByRenter: (renterId) => apiRequest(`/Ratings/renter/${renterId}`),

  getByModel: (modelId) => apiRequest(`/Ratings/model/${modelId}`),

  getByVehicle: (vehicleId) => apiRequest(`/Ratings/vehicle/${vehicleId}`),

  getModelStatistics: (modelId) => apiRequest(`/Ratings/model/${modelId}/statistics`),

  getRenterStatistics: (renterId) => apiRequest(`/Ratings/renter/${renterId}/statistics`),

  getRecent: (count = 10) => apiRequest(`/Ratings/recent?count=${count}`),

  getByStar: (starRating) => apiRequest(`/Ratings/stars/${starRating}`),

  canRateContract: (contractId, renterId) =>
    apiRequest(`/Ratings/contract/${contractId}/can-rate/${renterId}`),

  hasRatedContract: (contractId, renterId) =>
    apiRequest(`/Ratings/contract/${contractId}/has-rated/${renterId}`),
};

export const paymentAPI = {
  createPayment: (paymentData) => apiRequest('/Payment/create-payment', {
    method: 'POST',
    body: JSON.stringify(paymentData)
  }),
};


// Staff Dashboard API services
export const staffDashboardAPI = {
  // Upcoming check-ins for a station
  getIncomingCheckins: (stationId, count = 5) =>
    apiRequest(`/StaffDashboard/station/${stationId}/incoming-checkins?count=${count}`),

  // Upcoming check-outs for a station
  getIncomingCheckouts: (stationId, count = 5) =>
    apiRequest(`/StaffDashboard/station/${stationId}/incoming-checkouts?count=${count}`),

  // Maintenance queue for a station
  getMaintenanceQueue: (stationId) =>
    apiRequest(`/StaffDashboard/station/${stationId}/maintenance-queue`),

  // Low-battery vehicles for a station
  getLowBatteryVehicles: (stationId) =>
    apiRequest(`/StaffDashboard/station/${stationId}/low-battery-vehicles`),

  // Available vehicles at a station
  getAvailableVehicles: (stationId) =>
    apiRequest(`/StaffDashboard/station/${stationId}/available-vehicles`),
};

// Admin Dashboard API services
export const adminDashboardAPI = {
  // Get system overview
  getOverview: () => apiRequest('/AdminDashboard/overview'),

  // Get financial report (POST with date range)
  getFinancialReport: (dateRange) => apiRequest('/AdminDashboard/financial-report', {
    method: 'POST',
    body: JSON.stringify({
      StartDate: dateRange.startDate,
      EndDate: dateRange.endDate,
    }),
  }),

  // Get customer analytics
  getCustomerAnalytics: () => apiRequest('/AdminDashboard/customer-analytics'),

  // Get risk customers
  getRiskCustomers: () => apiRequest('/AdminDashboard/risk-customers'),

  // Get fleet management
  getFleetManagement: () => apiRequest('/AdminDashboard/fleet-management'),

  // Get staff performance
  getStaffPerformance: () => apiRequest('/AdminDashboard/staff-performance'),

  // Get rating analytics
  getRatingAnalytics: () => apiRequest('/AdminDashboard/rating-analytics'),

  // Get stations performance
  getStationsPerformance: () => apiRequest('/AdminDashboard/stations-performance'),
};


export default apiRequest;
