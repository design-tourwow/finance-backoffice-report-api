// API Service for Tour Image Manager
(function () {
  'use strict';

  // Image Service
  window.ImageService = {
    // Search images with filters
    async searchImages(filters = {}, page = 1, limit = 20) {
      try {
        const params = {
          page,
          limit
        };

        // Map filters to query parameters
        if (filters.country) params['country'] = filters.country;
        if (filters.imageName) params['image_name[like]'] = filters.imageName;
        if (filters.usageCount) params['total_usage'] = filters.usageCount;
        if (filters.dateRange) {
          // Parse date range if needed
          // Example: "01/01/2566 ถึง 31/12/2566"
          const dates = filters.dateRange.split(' ถึง ');
          if (dates.length === 2) {
            params['created_at[gte]'] = convertBuddhistToGregorian(dates[0]);
            params['created_at[lte]'] = convertBuddhistToGregorian(dates[1]);
          }
        }
        
        // Note: wholesale and tourCode filters need to be done client-side
        // because they are in related_programs_log JSON field

        // Remove empty filters
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] === null || params[key] === undefined) {
            delete params[key];
          }
        });

        const response = await API.get(CONFIG.ENDPOINTS.IMAGES, params);
        
        // Ensure response has correct structure
        if (response && response.data) {
          let filteredData = response.data;
          
          // Client-side filtering for wholesale and tourCode (in related_programs_log)
          if (filters.wholesale || filters.tourCode) {
            filteredData = filteredData.filter(image => {
              try {
                const programs = typeof image.related_programs_log === 'string'
                  ? JSON.parse(image.related_programs_log)
                  : image.related_programs_log || [];
                
                if (!Array.isArray(programs) || programs.length === 0) return false;
                
                // Check wholesale filter
                if (filters.wholesale) {
                  const hasWholesale = programs.some(p => 
                    p.name && p.name.toLowerCase().includes(filters.wholesale.toLowerCase())
                  );
                  if (!hasWholesale) return false;
                }
                
                // Check tourCode filter
                if (filters.tourCode) {
                  const hasTourCode = programs.some(p => 
                    p.code && p.code.toLowerCase().includes(filters.tourCode.toLowerCase())
                  );
                  if (!hasTourCode) return false;
                }
                
                return true;
              } catch (e) {
                return false;
              }
            });
          }
          
          // Client-side pagination
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const pageData = filteredData.slice(startIndex, endIndex);
          
          return {
            data: pageData,
            total: filteredData.length,
            page: page,
            limit: limit,
            hasMore: endIndex < filteredData.length
          };
        }
        
        return response;
      } catch (error) {
        console.error('Search Images Error:', error);
        throw new Error('ไม่สามารถค้นหารูปภาพได้ กรุณาลองใหม่อีกครั้ง');
      }
    },

    // Get image by ID
    async getImageById(imageId) {
      try {
        const response = await API.get(`${CONFIG.ENDPOINTS.IMAGES}/${imageId}`);
        return response;
      } catch (error) {
        console.error('Get Image Error:', error);
        throw new Error('ไม่สามารถโหลดข้อมูลรูปภาพได้');
      }
    },

    // Get all images (with client-side pagination)
    async getAllImages(page = 1, limit = 20) {
      try {
        // Get ALL data first (cache it)
        if (!window._allImagesCache) {
          const response = await API.get(CONFIG.ENDPOINTS.IMAGES, { 
            limit: 1000 // Get all
          });
          window._allImagesCache = response.data || [];
        }
        
        const allData = window._allImagesCache;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const pageData = allData.slice(startIndex, endIndex);
        
        return {
          data: pageData,
          total: allData.length,
          page: page,
          limit: limit,
          hasMore: endIndex < allData.length
        };
      } catch (error) {
        console.error('Get All Images Error:', error);
        throw new Error('ไม่สามารถโหลดรูปภาพได้');
      }
    }
  };

  // Helper function to convert Buddhist Era to Gregorian
  function convertBuddhistToGregorian(dateStr) {
    // Input format: "DD/MM/YYYY" (Buddhist Era)
    // Output format: "YYYY-MM-DD" (Gregorian)
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0];
      const month = parts[1];
      const year = parseInt(parts[2]) - 543; // Convert to Gregorian
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  }

  // Program Service
  window.ProgramService = {
    // Get programs by image ID
    async getProgramsByImageId(imageId) {
      try {
        const response = await API.get(`${CONFIG.ENDPOINTS.IMAGES}/${imageId}/programs`);
        return response;
      } catch (error) {
        console.error('Get Programs Error:', error);
        throw new Error('ไม่สามารถโหลดข้อมูลโปรแกรมได้');
      }
    },

    // Get program by ID
    async getProgramById(programId) {
      try {
        const response = await API.get(`${CONFIG.ENDPOINTS.PROGRAMS}/${programId}`);
        return response;
      } catch (error) {
        console.error('Get Program Error:', error);
        throw new Error('ไม่สามารถโหลดข้อมูลโปรแกรมได้');
      }
    }
  };

  // Wholesale Service
  window.WholesaleService = {
    // Get all wholesales
    async getAllWholesales() {
      try {
        const response = await API.get(CONFIG.ENDPOINTS.WHOLESALES);
        return response;
      } catch (error) {
        console.error('Get Wholesales Error:', error);
        throw new Error('ไม่สามารถโหลดข้อมูล Wholesale ได้');
      }
    }
  };

  // Country Service
  window.CountryService = {
    // Get all countries
    async getAllCountries() {
      try {
        const response = await API.get(CONFIG.ENDPOINTS.COUNTRIES, {
          limit: 100 // Get all countries
        });
        return response;
      } catch (error) {
        console.error('Get Countries Error:', error);
        throw new Error('ไม่สามารถโหลดข้อมูลประเทศได้');
      }
    }
  };

  // Data Formatter
  window.DataFormatter = {
    // Format image data for display
    formatImageData(image) {
      // Parse usage_stats if it's a JSON string
      let usageStats = { banner_1: 0, banner_other: 0, detail: 0 };
      if (image.usage_stats) {
        try {
          const parsed = typeof image.usage_stats === 'string' 
            ? JSON.parse(image.usage_stats) 
            : image.usage_stats;
          
          // Ensure all fields exist with default 0
          usageStats = {
            banner_1: parsed.banner_1 || 0,
            banner_other: parsed.banner_other || 0,
            detail: parsed.detail || 0
          };
        } catch (e) {
          console.warn('Failed to parse usage_stats:', e, image.usage_stats);
        }
      }

      // Parse related_programs_log if it's a JSON string
      let programs = [];
      if (image.related_programs_log) {
        try {
          programs = typeof image.related_programs_log === 'string'
            ? JSON.parse(image.related_programs_log)
            : image.related_programs_log;
          
          // Ensure it's an array
          if (!Array.isArray(programs)) {
            programs = [];
          }
        } catch (e) {
          console.warn('Failed to parse related_programs_log:', e, image.related_programs_log);
          programs = [];
        }
      }

      const formatted = {
        id: image.id || '',
        name: image.image_name || image.file_name || image.name || 'ไม่มีชื่อ',
        url: image.image_url || image.file_path || image.url || 'https://placehold.co/600x400/e0e0e0/666666?text=No+Image',
        thumbnail: image.image_url || image.file_path || image.thumbnail || image.url || 'https://placehold.co/300x200/e0e0e0/666666?text=No+Image',
        country: image.country || image.country_name || 'ไม่ระบุ',
        usageCount: image.total_usage || image.usage_count || 0,
        bannerFirst: usageStats.banner_1 || 0,
        bannerOther: usageStats.banner_other || 0,
        tourDetail: usageStats.detail || 0,
        updatedAt: image.created_at || image.updated_at || '',
        programs: programs || []
      };
      
      return formatted;
    },

    // Format program data for display
    formatProgramData(program) {
      return {
        id: program.id || '',
        code: program.code || '',
        wholesale: program.name || program.wholesale || '',
        updatedAt: program.date || program.updated_at || '',
        url: program.url || '#'
      };
    },

    // Format date to Thai format
    formatDateThai(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear() + 543;
      
      return `${day}/${month}/${year}`;
    }
  };

  console.log('API Services loaded successfully');
})();
