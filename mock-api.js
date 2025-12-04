// Mock API Service - ใช้ข้อมูลจำลองแทน API จริง
(function () {
  'use strict';

  // Mock Data
  const MOCK_COUNTRIES = [
    { id: 1, name: 'ญี่ปุ่น' },
    { id: 2, name: 'เกาหลี' },
    { id: 3, name: 'ไทย' },
    { id: 4, name: 'จีน' },
    { id: 5, name: 'ไต้หวัน' }
  ];

  const MOCK_IMAGES = [
    { id: 1, file_name: 'ภูเขาไฟฟูจิ-1', file_path: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600', country_id: 1, country_name: 'ญี่ปุ่น', updated_at: '2024-11-15T10:30:00Z', usage_count: 10, banner_first_count: 8, banner_other_count: 3, tour_detail_count: 9, programs: [
      { id: 1, code: 'XJ295', wholesale: 'TTN PLUS', updated_at: '2024-05-12T10:00:00Z', url: '#' },
      { id: 2, code: 'XJ328', wholesale: 'TTN PLUS', updated_at: '2024-08-20T10:00:00Z', url: '#' },
      { id: 3, code: 'XJ293', wholesale: 'TTN PLUS', updated_at: '2024-12-30T10:00:00Z', url: '#' },
      { id: 4, code: 'ZOCTS-2519VZ', wholesale: 'ZEGO TRAVEL CO.,LTD.', updated_at: '2025-09-10T10:00:00Z', url: '#' },
      { id: 5, code: 'ZGHND-2525NH', wholesale: 'ZEGO TRAVEL CO.,LTD.', updated_at: '2025-11-13T10:00:00Z', url: '#' },
      { id: 6, code: 'ZOCTS-2520VZ', wholesale: 'ZEGO TRAVEL CO.,LTD.', updated_at: '2025-10-15T10:00:00Z', url: '#' }
    ] },
    { id: 2, file_name: 'Osaka-castle-ปราสาทโอซาก้า', file_path: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600', country_id: 1, country_name: 'ญี่ปุ่น', updated_at: '2024-11-20T14:20:00Z', usage_count: 8, banner_first_count: 6, banner_other_count: 3, tour_detail_count: 9, programs: [
      { id: 1, code: 'XJ295', wholesale: 'TTN PLUS', updated_at: '2024-05-12T10:00:00Z', url: '#' },
      { id: 2, code: 'XJ328', wholesale: 'TTN PLUS', updated_at: '2024-08-20T10:00:00Z', url: '#' },
      { id: 3, code: 'XJ293', wholesale: 'TTN PLUS', updated_at: '2024-12-30T10:00:00Z', url: '#' }
    ] },
    { id: 3, file_name: 'Tokyo-Tower-โตเกียวทาวเวอร์', file_path: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600', country_id: 1, country_name: 'ญี่ปุ่น', updated_at: '2024-11-25T09:15:00Z', usage_count: 12, banner_first_count: 10, banner_other_count: 5, tour_detail_count: 7, programs: [
      { id: 1, code: 'XJ295', wholesale: 'TTN PLUS', updated_at: '2024-05-12T10:00:00Z', url: '#' },
      { id: 2, code: 'XJ328', wholesale: 'TTN PLUS', updated_at: '2024-08-20T10:00:00Z', url: '#' },
      { id: 3, code: 'XJ293', wholesale: 'TTN PLUS', updated_at: '2024-12-30T10:00:00Z', url: '#' },
      { id: 4, code: 'ZOCTS-2519VZ', wholesale: 'ZEGO TRAVEL CO.,LTD.', updated_at: '2025-09-10T10:00:00Z', url: '#' },
      { id: 5, code: 'ZGHND-2525NH', wholesale: 'ZEGO TRAVEL CO.,LTD.', updated_at: '2025-11-13T10:00:00Z', url: '#' },
      { id: 6, code: 'XJ401', wholesale: 'TTN PLUS', updated_at: '2024-07-15T10:00:00Z', url: '#' },
      { id: 7, code: 'XJ402', wholesale: 'TTN PLUS', updated_at: '2024-09-22T10:00:00Z', url: '#' }
    ] },
    { id: 4, file_name: 'Kyoto-Temple-วัดเกียวโต', file_path: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600', country_id: 1, country_name: 'ญี่ปุ่น', updated_at: '2024-11-10T16:45:00Z', usage_count: 15, banner_first_count: 12, banner_other_count: 6, tour_detail_count: 11, programs: [
      { id: 1, code: 'XJ295', wholesale: 'TTN PLUS', updated_at: '2024-05-12T10:00:00Z', url: '#' },
      { id: 2, code: 'XJ328', wholesale: 'TTN PLUS', updated_at: '2024-08-20T10:00:00Z', url: '#' },
      { id: 3, code: 'XJ293', wholesale: 'TTN PLUS', updated_at: '2024-12-30T10:00:00Z', url: '#' },
      { id: 4, code: 'ZOCTS-2519VZ', wholesale: 'ZEGO TRAVEL CO.,LTD.', updated_at: '2025-09-10T10:00:00Z', url: '#' },
      { id: 5, code: 'ZGHND-2525NH', wholesale: 'ZEGO TRAVEL CO.,LTD.', updated_at: '2025-11-13T10:00:00Z', url: '#' }
    ] },
    { id: 5, file_name: 'Shibuya-Crossing-ชิบูย่า', file_path: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600', country_id: 1, country_name: 'ญี่ปุ่น', updated_at: '2024-11-18T11:30:00Z', usage_count: 7, banner_first_count: 5, banner_other_count: 2, tour_detail_count: 6, programs: [
      { id: 1, code: 'XJ295', wholesale: 'TTN PLUS', updated_at: '2024-05-12T10:00:00Z', url: '#' },
      { id: 2, code: 'XJ328', wholesale: 'TTN PLUS', updated_at: '2024-08-20T10:00:00Z', url: '#' }
    ] },
    { id: 6, file_name: 'Seoul-Tower-หอคอยโซล', file_path: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=600', country_id: 2, country_name: 'เกาหลี', updated_at: '2024-11-12T13:20:00Z', usage_count: 9, banner_first_count: 7, banner_other_count: 4, tour_detail_count: 8, programs: [
      { id: 10, code: 'KR501', wholesale: 'TTN PLUS', updated_at: '2024-06-10T10:00:00Z', url: '#' },
      { id: 11, code: 'KR502', wholesale: 'ZEGO TRAVEL CO.,LTD.', updated_at: '2024-07-15T10:00:00Z', url: '#' },
      { id: 12, code: 'KR503', wholesale: 'TTN PLUS', updated_at: '2024-08-20T10:00:00Z', url: '#' }
    ] },
    { id: 7, file_name: 'Gyeongbokgung-Palace-พระราชวังเคียงบก', file_path: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600', country_id: 2, country_name: 'เกาหลี', updated_at: '2024-11-22T15:10:00Z', usage_count: 11, banner_first_count: 9, banner_other_count: 5, tour_detail_count: 10, programs: [] },
    { id: 8, file_name: 'Busan-Beach-หาดปูซาน', file_path: 'https://images.unsplash.com/photo-1578193661550-3d0e9a2a0f6e?w=600', country_id: 2, country_name: 'เกาหลี', updated_at: '2024-11-08T10:00:00Z', usage_count: 6, banner_first_count: 4, banner_other_count: 2, tour_detail_count: 5, programs: [] },
    { id: 9, file_name: 'Jeju-Island-เกาะเชจู', file_path: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600', country_id: 2, country_name: 'เกาหลี', updated_at: '2024-11-14T12:30:00Z', usage_count: 13, banner_first_count: 11, banner_other_count: 6, tour_detail_count: 12, programs: [] },
    { id: 10, file_name: 'Myeongdong-Shopping-ช้อปปิ้งเมียงดง', file_path: 'https://images.unsplash.com/photo-1601024445121-e5b82f020549?w=600', country_id: 2, country_name: 'เกาหลี', updated_at: '2024-11-19T14:45:00Z', usage_count: 5, banner_first_count: 3, banner_other_count: 1, tour_detail_count: 4, programs: [] },
    { id: 11, file_name: 'Grand-Palace-วัดพระแก้ว', file_path: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600', country_id: 3, country_name: 'ไทย', updated_at: '2024-11-16T09:20:00Z', usage_count: 14, banner_first_count: 12, banner_other_count: 7, tour_detail_count: 13, programs: [] },
    { id: 12, file_name: 'Phuket-Beach-หาดภูเก็ต', file_path: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=600', country_id: 3, country_name: 'ไทย', updated_at: '2024-11-21T11:15:00Z', usage_count: 16, banner_first_count: 14, banner_other_count: 8, tour_detail_count: 15, programs: [] },
    { id: 13, file_name: 'Chiang-Mai-Temple-วัดเชียงใหม่', file_path: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600', country_id: 3, country_name: 'ไทย', updated_at: '2024-11-11T13:40:00Z', usage_count: 8, banner_first_count: 6, banner_other_count: 3, tour_detail_count: 7, programs: [] },
    { id: 14, file_name: 'Ayutthaya-Historical-Park-อยุธยา', file_path: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600', country_id: 3, country_name: 'ไทย', updated_at: '2024-11-17T15:25:00Z', usage_count: 10, banner_first_count: 8, banner_other_count: 4, tour_detail_count: 9, programs: [] },
    { id: 15, file_name: 'Floating-Market-ตลาดน้ำ', file_path: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600', country_id: 3, country_name: 'ไทย', updated_at: '2024-11-23T10:50:00Z', usage_count: 7, banner_first_count: 5, banner_other_count: 2, tour_detail_count: 6, programs: [] },
    { id: 16, file_name: 'Great-Wall-กำแพงเมืองจีน', file_path: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600', country_id: 4, country_name: 'จีน', updated_at: '2024-11-09T12:10:00Z', usage_count: 18, banner_first_count: 15, banner_other_count: 9, tour_detail_count: 17, programs: [] },
    { id: 17, file_name: 'Shanghai-Skyline-เซี่ยงไฮ้', file_path: 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=600', country_id: 4, country_name: 'จีน', updated_at: '2024-11-13T14:35:00Z', usage_count: 12, banner_first_count: 10, banner_other_count: 5, tour_detail_count: 11, programs: [] },
    { id: 18, file_name: 'Forbidden-City-พระราชวังต้องห้าม', file_path: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=600', country_id: 4, country_name: 'จีน', updated_at: '2024-11-24T16:20:00Z', usage_count: 9, banner_first_count: 7, banner_other_count: 3, tour_detail_count: 8, programs: [] },
    { id: 19, file_name: 'Taipei-101-ไทเป-101', file_path: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=600', country_id: 5, country_name: 'ไต้หวัน', updated_at: '2024-11-07T11:45:00Z', usage_count: 11, banner_first_count: 9, banner_other_count: 4, tour_detail_count: 10, programs: [] },
    { id: 20, file_name: 'Taroko-Gorge-ทาโรโกะ', file_path: 'https://images.unsplash.com/photo-1562992932-a7b042e9d0c5?w=600', country_id: 5, country_name: 'ไต้หวัน', updated_at: '2024-11-26T13:55:00Z', usage_count: 6, banner_first_count: 4, banner_other_count: 2, tour_detail_count: 5, programs: [] }
  ];

  // Helper function to simulate API delay
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Override ImageService with Mock
  window.ImageService = {
    async searchImages(filters = {}, page = 1, limit = 20) {
      await delay(500); // Simulate network delay
      
      let results = [...MOCK_IMAGES];
      
      // Apply filters
      if (filters.country && filters.country !== 'all') {
        results = results.filter(img => img.country_id === parseInt(filters.country));
      }
      
      if (filters.imageName) {
        results = results.filter(img => 
          img.file_name.toLowerCase().includes(filters.imageName.toLowerCase())
        );
      }
      
      // Pagination
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedResults = results.slice(start, end);
      
      return {
        status: 'success',
        data: paginatedResults,
        total: results.length,
        page: page,
        limit: limit
      };
    },

    async getImageById(imageId) {
      await delay(300);
      const image = MOCK_IMAGES.find(img => img.id === parseInt(imageId));
      
      if (image) {
        return {
          status: 'success',
          data: image
        };
      } else {
        throw new Error('ไม่พบรูปภาพ');
      }
    },

    async getAllImages(page = 1, limit = 20) {
      await delay(500);
      
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedResults = MOCK_IMAGES.slice(start, end);
      
      return {
        status: 'success',
        data: paginatedResults,
        total: MOCK_IMAGES.length,
        page: page,
        limit: limit
      };
    }
  };

  // Override CountryService with Mock
  window.CountryService = {
    async getAllCountries() {
      await delay(300);
      
      return {
        status: 'success',
        data: MOCK_COUNTRIES,
        total: MOCK_COUNTRIES.length
      };
    }
  };

  console.log('🎭 Mock API loaded - Using sample data instead of real API');
  console.log(`📊 Mock data: ${MOCK_COUNTRIES.length} countries, ${MOCK_IMAGES.length} images`);
})();
