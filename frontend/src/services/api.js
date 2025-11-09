const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'https://localhost:7230/api'
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
    mode: 'cors',
    credentials: 'omit',
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

export const brandAPI = {
  getAll: () => apiRequest('/Brand/get-all'),

  getById: (id) => apiRequest(`/Brand/${id}`),

  create: (brandData) => apiRequest('/Brand/create-brand', {
    method: 'POST',
    body: JSON.stringify(brandData),
  }),

  update: (id, brandData) => apiRequest(`/Brand/update-brand/${id}`, {
    method: 'PUT',
    body: JSON.stringify(brandData),
  }),

  delete: (id) => apiRequest(`/Brand/delete-brand/${id}`, {
    method: 'DELETE',
  }),
};

export const modelAPI = {
  getAll: () => apiRequest('/Model/get-all'),

  getById: async (id) => {
    try {
      const response = await apiRequest(`/Model/${id}`);
      return response.result || response;
    } catch (error) {
      console.error('Error fetching model by ID:', error);
      return null;
    }
  },

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
  },

  getAvailableCounts: async (stationId, startTime, endTime) => {
    try {
      const response = await apiRequest('/Model/get-available-counts', {
        method: 'POST',
        body: JSON.stringify({
          stationId: stationId,
          startTime: startTime,
          endTime: endTime
        })
      });
      return response || [];
    } catch (error) {
      console.error('Error fetching available counts:', error);
      throw error;
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

  update: (id, staffData) => apiRequest(`/Staff/update-staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(staffData),
  }),

  delete: (id) => apiRequest(`/Staff/delete-staff/${id}`, {
    method: 'DELETE',
  }),

  changeStatus: (id) => apiRequest(`/Staff/change-status/${id}`, {
    method: 'POST',
  }),

  searchByParam: (param, stationId, contractId) => {
    const queryParams = new URLSearchParams();
    if (param) queryParams.append('param', param);
    if (stationId) queryParams.append('stationId', stationId);
    if (contractId) queryParams.append('contractId', contractId);
    return apiRequest(`/Staff/search-by-param?${queryParams.toString()}`);
  },
};

export const stationAPI = {
  getAll: () => apiRequest('/Station/all-stations'),

  getById: (id) => apiRequest(`/Station/${id}`),

  create: (stationData) => apiRequest('/Station/create-station', {
    method: 'POST',
    body: JSON.stringify(stationData),
  }),

  update: (id, stationData) => apiRequest(`/Station/update-station/${id}`, {
    method: 'PUT',
    body: JSON.stringify(stationData),
  }),

  delete: (id) => apiRequest(`/Station/delete-station/${id}`, {
    method: 'DELETE',
  }),

};

export const renterAPI = {
  getAll: () => apiRequest('/EVRenter/all-renters'),

  getById: (id) => apiRequest(`/EVRenter/${id}`),

  filterByParam: (param) => apiRequest(`/EVRenter/filter-by-param/${param}`),

  filter: (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.search) queryParams.append('param', filters.search);
    if (filters.status !== undefined && filters.status !== "") queryParams.append('status', filters.status);
    const queryString = queryParams.toString();
    return apiRequest(`/EVRenter/filter${queryString ? `?${queryString}` : ''}`);
  },
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

  deleteRenter: (id) => apiRequest(`/EVRenter/delete-renter/${id}`, {
    method: 'DELETE',
  }),

  changeStatus: (id) => apiRequest(`/EVRenter/change-status/${id}`, {
    method: 'POST',
  }),

  getFavorites: (renterId) => apiRequest(`/EVRenter/${renterId}/favorites`),

  addFavorite: (renterId, modelId) => apiRequest(`/EVRenter/${renterId}/favorites/${modelId}`, {
    method: 'POST',
  }),

  isModelFavorite: (renterId, modelId) =>
    apiRequest(`/EVRenter/${renterId}/favorites/${modelId}/check`),

  removeFavorite: (renterId, modelId) => apiRequest(`/EVRenter/${renterId}/favorites/${modelId}`, {
    method: 'DELETE',
  }),

  getContracts: (renterId) => apiRequest(`/EVRenter/${renterId}/contracts`),

  getInvoices: (renterId) => apiRequest(`/EVRenter/${renterId}/invoices`),
};

export const accountAPI = {
  getAll: () => apiRequest('/Account/get-all'),

  getById: (id) => apiRequest(`/Account/${id}`),

  login: (payload) => apiRequest('/Account/login', {
    method: 'POST',
    body: JSON.stringify({
      Identifier: payload.Identifier,
      Password: payload.Password,
    }),
    skipAuth: true,
  }),

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

  logout: () => apiRequest('/Account/logout', {
    method: 'POST',
  }),

  verifyEmail: (token) => apiRequest(`/Account/verify-email?token=${token}`),

  forgotPassword: (email) => {
    const formData = new FormData();
    formData.append('email', email);

    return apiRequest('/Account/forgot-password', {
      method: 'POST',
      body: formData,
      skipAuth: true,
    });
  },

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

export const contractAPI = {
  getAll: () => apiRequest('/Contract/all'),

  getById: (id) => apiRequest(`/Contract/${id}`),

  updateContract: (id, contractData) => apiRequest(`/Contract/update-contract/${id}`, {
    method: 'POST',
    body: JSON.stringify(contractData),
  }),

  activeContract: (formData) => apiRequest('/Contract/active-contract', {
    method: 'POST',
    body: formData,
  }),

  finishContract: (formData) => apiRequest('/Contract/finish-contract', {
    method: 'POST',
    body: formData,
  }),

  deleteContract: (id) => apiRequest(`/Contract/delete-contract/${id}`, {
    method: 'DELETE',
  }),

  getByStation: (stationId) => apiRequest(`/Contract/get-by-station/${stationId}`),

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

  downloadContractPdf: (contractId) => apiRequest(`/Contract/contracts/${contractId}/pdf`),

  getRefundPreview: (contractId) => apiRequest(`/Contract/refund-preview?contractId=${contractId}`)
};

export const vehicleAPI = {
  getAll: () => apiRequest('/Vehicle/get-all'),

  getById: (id) => apiRequest(`/Vehicle/${id}`),

  create: (vehicleData) => apiRequest('/Vehicle/create-vehicle', {
    method: 'POST',
    body: JSON.stringify(vehicleData),
  }),

  update: (id, vehicleData) => apiRequest(`/Vehicle/update-vehicle/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vehicleData),
  }),

  delete: (id) => apiRequest(`/Vehicle/delete-vehicle/${id}`, {
    method: 'DELETE',
  }),

  getAvailableVehicles: (modelId, stationId, startTime, endTime) => {
    const queryParams = new URLSearchParams();
    queryParams.append('modelId', modelId);
    queryParams.append('stationId', stationId);

    queryParams.append('startTime', new Date(startTime).toISOString());
    queryParams.append('endTime', new Date(endTime).toISOString());

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
      method: 'POST',
    });
  }
};

export const invoiceAPI = {
  getAll: () => apiRequest('/Invoice/all-invoices'),

  getById: (id) => apiRequest(`/Invoice/${id}`),

  getByContractId: (contractId) => apiRequest(`/Invoice/by-contract/${contractId}`),

  getByOrderCode: (orderCode) => apiRequest(`/Invoice/by-order-code/${orderCode}`),

  getByStation: (stationId) => apiRequest(`/Invoice/get-by-station/${stationId}`),

  filter: (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.contractId) queryParams.append('contractId', filters.contractId);
    if (filters.orderCode) queryParams.append('orderCode', filters.orderCode);
    if (filters.stationId) queryParams.append('stationId', filters.stationId);

    const queryString = queryParams.toString();
    return apiRequest(`/Invoice/filter${queryString ? `?${queryString}` : ''}`);
  },

  cancelInvoice: (orderCode) => apiRequest(`/Invoice/cancel-invoice/${orderCode}`, {
    method: 'DELETE',
  }),
};

export const bookingAPI = {
  createBooking: (bookingData) => apiRequest('/Booking/request', {
    method: 'POST',
    body: JSON.stringify(bookingData)
  }),

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

  filter: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return apiRequest(`/Accident/filter${query ? `?${query}` : ''}`);
  },

  getReplacementPreview: async (accidentId) => {
    const data = await apiRequest(`/Accident/${accidentId}/replacement-preview`);
    return data;
  },

  executeReplacement: async (accidentId) => {
    const data = await apiRequest(`/Accident/${accidentId}/execute-replacement`, {
      method: 'POST'
    });
    return data;
  },

  previewSingleContract: async (contractId) => {
    const data = await apiRequest(`/Accident/preview-replacement/${contractId}`);
    return data;
  },

  replaceSingleContract: async (contractId, lockKey, lockToken) => {
    const data = await apiRequest(`/Accident/contract/${contractId}/replace`, {
      method: 'POST',
      body: JSON.stringify({ lockKey, lockToken }),
    });
    return data;
  },

  confirmReplacement: async (contractId, lockKey, lockToken) => {
    const data = await apiRequest(`/Accident/confirm-replacement`, {
      method: 'POST',
      body: JSON.stringify({ contractId, lockKey, lockToken }),
    });
    return data;
  },

  getAvailableCounts: async (stationId, startTime, endTime) => {
    try {
      const response = await apiRequest('/Model/get-available-counts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stationId,
          startTime,
          endTime
        })
      });
      return response.data || response;
    } catch (error) {
      console.error('Error fetching available counts:', error);
      throw error;
    }
  },

  getAffectedContracts: async (vehicleId) => {
    try {
      const data = await apiRequest(`/Contract/get-affected-contract/${vehicleId}`);
      return data;
    } catch (error) {
      console.error('Error fetching affected contracts:', error);
      throw error;
    }
  },

  manualModelChange: async (contractId, modelId) => {
    try {
      const data = await apiRequest(`/Accident/change-model?contractId=${contractId}&modelId=${modelId}`, {
        method: 'POST'
      });
      return data;
    } catch (error) {
      console.error('Error in manual model change:', error);
      throw error;
    }
  },

  getRefundPreview: (contractId) => apiRequest(`/Accident/refund-preview?contractId=${contractId}`),
};

export const modificationAPI = {
  changeModel: async (contractId, requestData) => {
    const data = await apiRequest(`/contracts/${contractId}/modifications/renter/change-model`, {
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

  getRefundPreview: async (contractId) => {
    try {
      const data = await apiRequest(`/contracts/${contractId}/modifications/refund-preview`);
      return data;
    } catch (error) {
      console.error('Error fetching refund preview:', error);
      throw error;
    }
  },

  cancelContract: async (contractId, bankInfo) => {
    try {
      const data = await apiRequest(`/contracts/${contractId}/modifications/cancel-contract`, {
        method: 'POST',
        body: JSON.stringify(bankInfo)
      });
      return data;
    } catch (error) {
      console.error('Error cancelling contract:', error);
      throw error;
    }
  },

  getContractStatus: async (contractId) => {
    try {
      const response = await fetch(`/contracts/${contractId}/modifications/status`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching contract status:', error);
      throw error;
    }
  },
  
getPendingStatus: (contractId, invoiceId) => 
  apiRequest(`/contracts/${contractId}/modifications/pending-status/${invoiceId}`),
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

export const staffDashboardAPI = {
  getIncomingCheckins: (stationId, count = 5) =>
    apiRequest(`/StaffDashboard/station/${stationId}/incoming-checkins?count=${count}`),

  getIncomingCheckouts: (stationId, count = 5) =>
    apiRequest(`/StaffDashboard/station/${stationId}/incoming-checkouts?count=${count}`),

  getMaintenanceQueue: (stationId) =>
    apiRequest(`/StaffDashboard/station/${stationId}/maintenance-queue`),

  getLowBatteryVehicles: (stationId) =>
    apiRequest(`/StaffDashboard/station/${stationId}/low-battery-vehicles`),

  getAvailableVehicles: (stationId) =>
    apiRequest(`/StaffDashboard/station/${stationId}/available-vehicles`),
};

export const adminDashboardAPI = {
  getOverview: () => apiRequest('/AdminDashboard/overview'),

  getFinancialReport: (dateRange) => apiRequest('/AdminDashboard/financial-report', {
    method: 'POST',
    body: JSON.stringify({
      StartDate: dateRange.startDate,
      EndDate: dateRange.endDate,
    }),
  }),

  getCustomerAnalytics: () => apiRequest('/AdminDashboard/customer-analytics'),

  getRiskCustomers: () => apiRequest('/AdminDashboard/risk-customers'),

  getFleetManagement: () => apiRequest('/AdminDashboard/fleet-management'),

  getStaffPerformance: () => apiRequest('/AdminDashboard/staff-performance'),

  getRatingAnalytics: () => apiRequest('/AdminDashboard/rating-analytics'),

  getStationsPerformance: () => apiRequest('/AdminDashboard/stations-performance'),
};

export const refundAPI = {
  requestRefund: (requestData) => apiRequest('/Refund/request', {
    method: 'POST',
    body: JSON.stringify(requestData),
  }),

  processRefund: (refundId, bankInfo, fullRefund = false) => apiRequest(`/Refund/${refundId}/process`, {
    method: 'POST',
    body: JSON.stringify({ bankInfo, fullRefund }),
  }),

  staffRefund: (data) => apiRequest('/Refund/staff-refund', {
    method: 'POST',
    body: JSON.stringify(data),
  })
};

export default apiRequest;
