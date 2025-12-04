// Configuration for NoCode Backend
const CONFIG = {
  // NoCode Backend API Configuration
  API_BASE_URL: 'https://api.nocodebackend.com',
  INSTANCE_ID: '54566_image_test',
  API_KEY: 'b9746df17c49ee50175db1c7b2b0cb843d5267c0ce25fdb36f7fe041c9784a99',
  
  // API Endpoints (ตาม OpenAPI spec)
  ENDPOINTS: {
    COUNTRIES: '/read/countries',
    COUNTRIES_CREATE: '/create/countries',
    COUNTRIES_UPDATE: '/update/countries',
    COUNTRIES_DELETE: '/delete/countries',
    COUNTRIES_SEARCH: '/search/countries',
    
    IMAGES: '/read/tour_images',
    IMAGES_CREATE: '/create/tour_images',
    IMAGES_UPDATE: '/update/tour_images',
    IMAGES_DELETE: '/delete/tour_images',
    IMAGES_SEARCH: '/search/tour_images',
    
    TOUR_MANAGER: '/read/tour_image_manager',
    TOUR_MANAGER_CREATE: '/create/tour_image_manager',
    TOUR_MANAGER_UPDATE: '/update/tour_image_manager',
    TOUR_MANAGER_DELETE: '/delete/tour_image_manager',
    TOUR_MANAGER_SEARCH: '/search/tour_image_manager'
  },
  
  // Pagination
  ITEMS_PER_PAGE: 1000, // Show all at once
  
  // Request timeout (ms)
  TIMEOUT: 30000
};

// API Helper Functions
const API = {
  // Base fetch with authentication (NoCodeBackend.com format)
  async request(endpoint, options = {}) {
    // Add Instance parameter to URL
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${CONFIG.API_BASE_URL}${endpoint}${separator}Instance=${CONFIG.INSTANCE_ID}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`,
        'secret_key': CONFIG.API_KEY
      },
      timeout: CONFIG.TIMEOUT
    };
    
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
      
      const response = await fetch(url, {
        ...mergedOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  },
  
  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  },
  
  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, API };
}
