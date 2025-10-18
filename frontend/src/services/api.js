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

  // Filter models
  filterModels: (brandId, typeId, stationId) => {
    const queryParams = new URLSearchParams();
    if (brandId) queryParams.append('brandId', brandId);
    if (typeId) queryParams.append('typeId', typeId);
    if (stationId) queryParams.append('stationId', stationId);

    const queryString = queryParams.toString();
    return apiRequest(`/Model/filter-models${queryString ? `?${queryString}` : ''}`);
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

// Account API services
export const accountAPI = {
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
};

// Contract API services
export const contractAPI = {
  // Get all contracts
  getAll: () => apiRequest('/Contract/all'),

  // Get contract by ID
  getById: (id) => apiRequest(`/Contract/${id}`),
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

// Payment API
export const paymentAPI = {
    // Create payment link
    createPaymentLink: (paymentData) => apiRequest('/Payment/Create-Payment-Link', {
        method: 'POST',
        body: JSON.stringify(paymentData)
    }),
};


export default apiRequest;
