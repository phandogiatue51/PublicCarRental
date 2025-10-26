const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'https://publiccarrental-production-b7c5.up.railway.app/api'
  : process.env.REACT_APP_API_URL || 'https://publiccarrental-production-b7c5.up.railway.app/api';

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Determine if we're sending FormData
  const isFormData = options.body instanceof FormData;

  // Inject Authorization header from stored JWT by default
  const token = typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null;
  const config = {
    headers: {
      // Only set Content-Type for JSON, let browser set it for FormData
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      'accept': '*/*',
      // Attach Authorization header unless caller opts out via skipAuth
      ...(!options.skipAuth && token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    mode: 'cors', // Enable CORS
    credentials: 'omit', // Don't send credentials for CORS
    ...options,
  };

  try {
    console.log('Making API request to:', url, 'with config:', config);

    // Debug FormData if it's FormData
    if (config.body instanceof FormData) {
      console.log('Sending FormData with entries:');
      for (let [key, value] of config.body.entries()) {
        console.log(`${key}:`, value);
        if (value instanceof File) {
          console.log(`  File details:`, {
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

    // Handle empty responses (like DELETE operations)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('API Response:', data);
      return data;
    } else {
      // For non-JSON responses, return the response object
      console.log('API Response (non-JSON):', response);
      return { message: 'Operation successful', status: response.status };
    }
  } catch (error) {
    console.error('API request failed:', error);

    // More specific error messages
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
      return response.result || response || [];
    } catch (error) {
      console.error('Error fetching stations from model:', error);
      return [];
    }
  },


  // Create new model
  create: (modelData) => apiRequest('/Model/create-model', {
    method: 'POST',
    body: modelData, // Send FormData directly, don't stringify
  }),

  // Update model
  update: (id, modelData) => apiRequest(`/Model/update-model/${id}`, {
    method: 'PUT',
    body: modelData, // Send FormData directly, don't stringify
  }),

  // Delete model
  delete: (id) => apiRequest(`/Model/delete-model/${id}`, {
    method: 'DELETE',
  }),

  // Get available images
  getAvailableImages: () => apiRequest('/Model/available-images'),

  // Check model availability
  checkAvailable: (availabilityData) => apiRequest('/Model/check-available', {
    method: 'POST',
    body: JSON.stringify(availabilityData),
  }),
};

// Type API services
export const typeAPI = {
  // Get all types
  getAll: () => apiRequest('/Type/get-all'),
};

// Staff API services
export const staffAPI = {
  // Get all staff
  getAll: () => apiRequest('/Staff/all-staff'),

  // Get staff by ID
  getById: (id) => apiRequest(`/Staff/${id}`),

  // Create new staff
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

  // Update renter
  updateRenter: (id, renterData) => apiRequest(`/EVRenter/update-renter/${id}`, {
    method: 'PUT',
    body: JSON.stringify(renterData),
  }),

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

  // Change password
  changePassword: (accountId, passwordData) => {
    const formData = new FormData();
    formData.append('accountId', accountId);
    formData.append('CurrentPassword', passwordData.currentPassword);
    formData.append('NewPassword', passwordData.newPassword);
    formData.append('ConfirmPassword', passwordData.confirmPassword);

    return apiRequest('/Account/change-password', {
      method: 'POST',
      body: formData,
    });
  },

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

  // Filter vehicles
  filter: (filters) => {
    const queryParams = new URLSearchParams();
    if (filters.stationId) queryParams.append('stationId', filters.stationId);
    if (filters.status !== undefined) queryParams.append('status', filters.status);
    if (filters.modelId) queryParams.append('modelId', filters.modelId);
    if (filters.typeId) queryParams.append('typeId', filters.typeId);
    if (filters.brandId) queryParams.append('brandId', filters.brandId);

    const queryString = queryParams.toString();
    return apiRequest(`/Vehicle/filter-vehicle${queryString ? `?${queryString}` : ''}`);
  },
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

// Document API services
export const documentAPI = {
  // Get all documents
  getAll: () => apiRequest('/Document/get-all'),

  // Get documents by renter ID
  getByRenterId: (renterId) => apiRequest(`/Document/get-by-renter-id/${renterId}`),

  // Get documents by staff ID
  getByStaffId: (staffId) => apiRequest(`/Document/get-by-staff-id/${staffId}`),

  // Upload staff identity card
  uploadStaffId: (staffId, formData) => apiRequest('/Document/upload-staff-id', {
    method: 'POST',
    body: formData,
  }),

  // Upload all renter documents
  uploadRenterAll: (renterId, formData) => apiRequest(`/Document/upload-renter-all/${renterId}`, {
    method: 'POST',
    body: formData,
  }),

  // Staff verify renter documents
  staffVerifyRenter: (staffId, verifyData) => apiRequest(`/Document/staff-verify-renter/${staffId}`, {
    method: 'POST',
    body: JSON.stringify(verifyData),
  }),

  // Filter documents by verification status
  filterDocument: (isVerified) => {
    const queryParams = new URLSearchParams();
    if (isVerified !== null && isVerified !== undefined) {
      queryParams.append('isVerified', isVerified);
    }
    const queryString = queryParams.toString();
    return apiRequest(`/Document/filter-document${queryString ? `?${queryString}` : ''}`);
  },
};

// Transaction API services
export const transactionAPI = {
  // Get all transactions
  getAll: () => apiRequest('/Transaction/get-all'),
};

// Accident API services
export const accidentAPI = {
  // Get all accidents
  getAll: () => apiRequest('/Accident/get-all'),

  // Get accident by ID
  getById: (id) => apiRequest(`/Accident/${id}`),

  // Create contract accident report
  createContractReport: (formData) => apiRequest('/Accident/create-contract-report', {
    method: 'POST',
    body: formData,
  }),

  // Create vehicle accident report
  createVehicleReport: (formData) => apiRequest('/Accident/create-vehicle-report', {
    method: 'POST',
    body: formData,
  }),

  // Delete accident report
  deleteReport: (id) => apiRequest(`/Accident/delete-report/${id}`, {
    method: 'DELETE',
  }),

  // Update accident report status
  updateReportStatus: (id, newStatus) => apiRequest(`/Accident/update-report-status/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ newStatus }),
  }),
};

// Payment API
export const paymentAPI = {
  // Create payment
  createPayment: (paymentData) => apiRequest('/Payment/create-payment', {
    method: 'POST',
    body: JSON.stringify(paymentData)
  }),
};


export default apiRequest;
