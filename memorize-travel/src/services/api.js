import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

// Request interceptor to log outgoing requests
api.interceptors.request.use(
  (config) => {
    const isFileUpload = config.headers['Content-Type'] === 'multipart/form-data';
    console.log(
      `→ ${config.method?.toUpperCase()} ${config.url}`,
      isFileUpload ? '📁' : '',
      config.data || ''
    );
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to log responses and backend debug info
api.interceptors.response.use(
  (response) => {
    const debug = response.data.debugInfo;
    if (debug?.images) {
      console.log(`← ${debug.prompt}:`, debug.images);
    } else {
      console.log(`← Response:`, response.data.success ? '✅' : response.data);
    }
    return response;
  },
  (error) => {
    console.error(`❌ ${error.config?.url}:`, error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export const landService = {
  createLand: async (landName = '', startDate = null, endDate = null, backgroundType = 'sand') => {
    const response = await api.post('/trips/create', { 
      tripName: landName,
      startDate: startDate,
      endDate: endDate,
      backgroundType: backgroundType
    });
    // Transform the response to use land terminology
    const data = response.data;
    return {
      ...data,
      landId: data.tripId
    };
  },

  getAllLands: async () => {
    const response = await api.get('/trips');
    // Transform the response to use land terminology
    const data = response.data;
    return {
      ...data,
      lands: data.trips
    };
  },

  getLand: async (landId) => {
    const response = await api.get(`/trips/${landId}`);
    return response.data;
  }
};

export const miniatureService = {
  generateMiniature: async (file, landId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tripId', landId);

    const response = await api.post('/miniatures/generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  addToWorld: async (landId, miniatureId, backgroundImage = null) => {
    const response = await api.post('/miniatures/add-to-world', {
      tripId: landId,
      miniatureId,
      backgroundImage
    });
    return response.data;
  },

  regenerateComposite: async (landId, miniatureId, previousBackground) => {
    const response = await api.post('/miniatures/regenerate', {
      tripId: landId,
      miniatureId,
      previousBackground
    });
    return response.data;
  },

  confirmComposite: async (landId, compositePath, miniatureData, previousBackground) => {
    const response = await api.post('/miniatures/confirm', {
      tripId: landId,
      compositePath,
      miniatureData,
      previousBackground
    });
    return response.data;
  }
};

export default api;