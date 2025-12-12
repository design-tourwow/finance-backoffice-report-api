// Tour Image Manager API Service
const TourImageAPI = {
  baseURL: 'https://fin-api-staging2.tourwow.com',
  token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0b3Vyd293IiwiYXVkIjoiZmluYW5jZSIsImV4cCI6MTc5NzA4MTc3NSwidXNlciI6eyJhZ2VuY3kiOnsiaWQiOjE3M30sImFnZW5jeV9tZW1iZXIiOnsiaWQiOjU1NSwicm9sZXNfc2x1ZyI6ImFkbWluIiwidGVhbSI6NSwibW9iaWxlX251bWJlciI6IjA4NTU5Nzk5NTkiLCJmaXJzdF9uYW1lIjoiTnV0dGhhcGhvbiIsImxhc3RfbmFtZSI6IlQiLCJuaWNrX25hbWUiOiJHQVAiLCJqb2JfcG9zaXRpb24iOm51bGx9LCJhZ2VuY3lfY29uZmlnIjp7ImlkIjoxNzN9fX0.M4VfWWp_pSUT-tDz9N-Z4yRe-QhiIA5JR0UHnNebxB0',

  /**
   * Get Pre Product File Reports
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>}
   */
  async getPreProductFileReports(filters = {}) {
    try {
      console.log('🔄 Calling API with filters:', filters);
      const url = new URL(`${this.baseURL}/pre_product_file_reports`);
      
      // Add filters as query parameter if provided
      if (Object.keys(filters).length > 0) {
        url.searchParams.append('filters', JSON.stringify(filters));
      }

      console.log('📡 Fetching:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'authorization': this.token
        }
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('✅ API Response:', data);
      
      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      console.error('❌ Error details:', error.message);
      throw error;
    }
  },

  /**
   * Remake All Pre Product File Reports (POST)
   * @returns {Promise<Object>}
   */
  async remakePreProductFileReports() {
    try {
      const url = `${this.baseURL}/pre_product_file_reports`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'authorization': this.token
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('✅ Remake API Response:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Remake API Error:', error);
      throw error;
    }
  },

  /**
   * Get Countries
   * @param {string} sortBy - Sort order: 'country_name_th_by_asc' or 'country_name_th_by_desc'
   * @returns {Promise<Object>}
   */
  async getCountries(sortBy = 'country_name_th_by_asc') {
    try {
      const url = new URL(`${this.baseURL}/pre_product_file_reports/countries`);
      
      // Add sort_by parameter if provided
      if (sortBy) {
        url.searchParams.append('sort_by', sortBy);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'authorization': this.token
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('✅ Countries API Response:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Countries API Error:', error);
      throw error;
    }
  },

  /**
   * Get Suppliers
   * @returns {Promise<Object>}
   */
  async getSuppliers() {
    try {
      const url = `${this.baseURL}/pre_product_file_reports/suppliers`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'authorization': this.token
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('✅ Suppliers API Response:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Suppliers API Error:', error);
      throw error;
    }
  },

  /**
   * Search with filters
   * @param {Object} searchParams
   * @returns {Promise<Object>}
   */
  async search(searchParams = {}) {
    const filters = {};

    // Map search params to API filters
    if (searchParams.imageName) {
      filters.name = searchParams.imageName;
    }

    if (searchParams.tourCode) {
      filters.product_tour_code = searchParams.tourCode;
    }

    if (searchParams.supplier_id) {
      filters.supplier_id = searchParams.supplier_id;
    }

    if (searchParams.country_id) {
      filters.country_id = searchParams.country_id;
    }

    if (searchParams.min_file_count) {
      filters.min_file_count = searchParams.min_file_count;
    }

    if (searchParams.dateRange) {
      filters.last_file_created_at_between = {
        min_date: searchParams.dateRange.start,
        max_date: searchParams.dateRange.end
      };
    }

    return await this.getPreProductFileReports(filters);
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TourImageAPI;
}
