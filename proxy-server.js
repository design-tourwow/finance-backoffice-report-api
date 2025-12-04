// Backend Middleware for Tour Image Manager
// Run with: node proxy-server.js

const http = require('http');
const https = require('https');
const url = require('url');

const API_KEY = 'KiroAccessb9746df17c49ee50175db1c7b2b0cb843d5267c0ce25fdb36f7fe041c9784a99';
const INSTANCE_ID = '54566_image_test';
const API_BASE_URL = 'api.nocodebackend.com';
const PORT = 3000;

// Helper function to call NoCodeBackend API
function callAPI(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    params.Instance = INSTANCE_ID;
    
    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const options = {
      hostname: API_BASE_URL,
      path: `${endpoint}?${queryString}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'secret_key': API_KEY
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Calculate usage statistics for an image
async function calculateImageStats(imageId) {
  try {
    // Get all tour_images for this image
    const tourImagesResponse = await callAPI('/read/tour_images', {
      image_id: imageId,
      limit: 1000
    });
    
    if (!tourImagesResponse.data || tourImagesResponse.data.length === 0) {
      return {
        usage_count: 0,
        banner_first_count: 0,
        banner_other_count: 0,
        tour_detail_count: 0,
        programs: []
      };
    }
    
    // Get active tours
    const tourIds = [...new Set(tourImagesResponse.data.map(ti => ti.tour_id))];
    const toursResponse = await callAPI('/read/tours', {
      'id[in]': tourIds.join(','),
      is_active: 1,
      limit: 1000
    });
    
    const activeTourIds = new Set(
      (toursResponse.data || []).map(t => t.id)
    );
    
    // Filter only active tours
    const activeTourImages = tourImagesResponse.data.filter(ti => 
      activeTourIds.has(ti.tour_id)
    );
    
    // Calculate counts
    const bannerFirst = activeTourImages.filter(ti => 
      ti.usage_type === 'banner' && ti.sequence === 1
    ).length;
    
    const bannerOther = activeTourImages.filter(ti => 
      ti.usage_type === 'banner' && ti.sequence > 1
    ).length;
    
    const tourDetail = activeTourImages.filter(ti => 
      ti.usage_type === 'detail'
    ).length;
    
    // Get program details
    const programs = [];
    for (const tour of (toursResponse.data || [])) {
      // Get wholesale info
      const wholesaleResponse = await callAPI(`/read/wholesales/${tour.wholesale_id}`);
      const wholesaleName = wholesaleResponse.data?.name || 'Unknown';
      
      programs.push({
        id: tour.id,
        code: tour.code,
        wholesale: wholesaleName,
        updated_at: tour.updated_at,
        url: `#tour-${tour.id}`
      });
    }
    
    return {
      usage_count: activeTourImages.length,
      banner_first_count: bannerFirst,
      banner_other_count: bannerOther,
      tour_detail_count: tourDetail,
      programs: programs
    };
  } catch (error) {
    console.error(`Error calculating stats for image ${imageId}:`, error);
    return {
      usage_count: 0,
      banner_first_count: 0,
      banner_other_count: 0,
      tour_detail_count: 0,
      programs: []
    };
  }
}

// Enhanced images endpoint
async function getEnhancedImages(params) {
  try {
    // Get images from API
    const imagesResponse = await callAPI('/read/images', params);
    
    if (!imagesResponse.data || imagesResponse.data.length === 0) {
      return imagesResponse;
    }
    
    // Get country names
    const countriesResponse = await callAPI('/read/countries', { limit: 100 });
    const countryMap = {};
    (countriesResponse.data || []).forEach(c => {
      countryMap[c.id] = c.name;
    });
    
    // Enhance each image with statistics
    const enhancedImages = await Promise.all(
      imagesResponse.data.map(async (image) => {
        const stats = await calculateImageStats(image.id);
        
        return {
          ...image,
          country_name: countryMap[image.country_id] || 'ไม่ระบุ',
          ...stats
        };
      })
    );
    
    return {
      ...imagesResponse,
      data: enhancedImages
    };
  } catch (error) {
    console.error('Error getting enhanced images:', error);
    throw error;
  }
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const query = parsedUrl.query;
  
  console.log(`[${req.method}] ${path}`);
  
  try {
    // Enhanced images endpoint
    if (path === '/read/images' && req.method === 'GET') {
      const result = await getEnhancedImages(query);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }
    
    // Countries endpoint (pass through)
    if (path === '/read/countries' && req.method === 'GET') {
      const result = await callAPI(path, query);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }
    
    // Default: proxy to NoCodeBackend
    query.Instance = INSTANCE_ID;
    const queryString = Object.keys(query)
      .map(key => `${key}=${encodeURIComponent(query[key])}`)
      .join('&');
    
    const options = {
      hostname: API_BASE_URL,
      path: `${path}?${queryString}`,
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'secret_key': API_KEY
      }
    };
    
    const proxyReq = https.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (error) => {
      console.error('Proxy error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    });
    
    if (req.method === 'POST' || req.method === 'PUT') {
      req.pipe(proxyReq);
    } else {
      proxyReq.end();
    }
    
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'failed',
      error: error.message 
    }));
  }
});

server.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   🚀 Tour Image Manager - Backend Middleware          ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🔗 Forwarding to: https://${API_BASE_URL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 20)}...`);
  console.log('');
  console.log('✨ Features:');
  console.log('   • Auto-calculate usage statistics');
  console.log('   • Join data from multiple tables');
  console.log('   • Add country names');
  console.log('   • Filter active tours only');
  console.log('');
  console.log('📝 Update config.js:');
  console.log(`   API_BASE_URL: 'http://localhost:${PORT}'`);
  console.log('');
  console.log('⏳ Waiting for requests...');
  console.log('');
});
