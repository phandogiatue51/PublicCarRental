// API configuration and service functions
// Use direct backend URL for now to avoid proxy issues
const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'https://publiccarrental-production-b7c5.up.railway.app/api'  // Updated backend URL
  : process.env.REACT_APP_API_URL || 'https://publiccarrental-production-b7c5.up.railway.app/api';

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Determine if we're sending FormData
  const isFormData = options.body instanceof FormData;

  const config = {
    headers: {
      // Only set Content-Type for JSON, let browser set it for FormData
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      'accept': '*/*',
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

// Account API services
export const accountAPI = {
  // Login user
  login: (credentials) => apiRequest('/Account/login', {
    method: 'POST',
    body: JSON.stringify({
      Identifier: credentials.Identifier,
      Password: credentials.Password
    })
  }),

  register: (userData) => apiRequest('/Account/register', {
    method: 'POST',
    body: JSON.stringify({
      FullName: userData.fullName,       
      Email: userData.email,           
      Password: userData.password,       
      PhoneNumber: userData.phoneNumber, 
      IdentityCardNumber: userData.identityCardNumber, 
      LicenseNumber: userData.licenseNumber 
    })
  }),

  // Logout user
  logout: () => apiRequest('/Account/logout', {
    method: 'POST'
  }),

  // Verify email
  verifyEmail: (token) => apiRequest(`/Account/verify-email?token=${token}`, {
    method: 'GET'
  }),

  // Change password
  changePassword: (passwordData) => apiRequest('/Account/change-password', {
    method: 'POST',
    body: JSON.stringify(passwordData)
  }),

  // Forgot password
  forgotPassword: (email) => apiRequest('/Account/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),

  // Reset password
  resetPassword: (resetData) => apiRequest('/Account/reset-password', {
    method: 'POST',
    body: JSON.stringify(resetData)
  }),
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
  getById: (id) => apiRequest(`/Model/${id}`),

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

  // Filter models by brand, type, and station
  filterModels: (brandId, typeId, stationId) => {
    const params = new URLSearchParams();
    if (brandId) params.append('brandId', brandId);
    if (typeId) params.append('typeId', typeId);
    if (stationId) params.append('stationId', stationId);
    
    return apiRequest(`/Model/filter-models?${params.toString()}`);
  },
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

  // Change staff status
  changeStatus: (id) => apiRequest(`/Staff/change-status/${id}`, {
    method: 'POST',
  }),
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

  // Change renter status
  changeStatus: (id) => apiRequest(`/EVRenter/change-status/${id}`, {
    method: 'POST',
  }),
};

// Contract API services
export const contractAPI = {
  // Get all contracts
  getAll: () => apiRequest('/Contract/all'),

  // Get contract by ID
  getById: (id) => apiRequest(`/Contract/${id}`),

  // Handover vehicle (active contract)
  handoverVehicle: (contractId, staffId, imageFile) => {
    const formData = new FormData();
    formData.append('ContractId', contractId);
    formData.append('StaffId', staffId);
    formData.append('ImageFile', imageFile);
    
    return apiRequest('/Contract/active-contract', {
      method: 'POST',
      body: formData,
    });
  },

  // Return vehicle (finish contract)
  returnVehicle: (contractId, imageFile) => {
    const formData = new FormData();
    formData.append('ContractId', contractId);
    formData.append('imageFile', imageFile);
    
    return apiRequest('/Contract/finish-contract', {
      method: 'POST',
      body: formData,
    });
  },
};

// Vehicle API services
export const vehicleAPI = {
  // Get all vehicles
  getAll: () => apiRequest('/Vehicle/get-all'),

  // Get vehicle by ID
  getById: (id) => apiRequest(`/Vehicle/${id}`),

  // Delete vehicle
  delete: (id) => apiRequest(`/Vehicle/delete-vehicle/${id}`, {
    method: 'DELETE',
  }),

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
};

// Invoice API services
export const invoiceAPI = {
  // Get all invoices
  getAll: () => apiRequest('/Invoice/all-invoices'),

  // Get invoice by ID
  getById: (id) => apiRequest(`/Invoice/${id}`),
};

export default apiRequest;
