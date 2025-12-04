// Seed Data Script for Tour Image Manager
// Run this in browser console to populate test data

(async function seedData() {
  'use strict';

  console.log('🌱 Starting seed data process...');

  // Sample countries data
  const countries = [
    { name: 'ญี่ปุ่น' },
    { name: 'เกาหลี' },
    { name: 'ไทย' },
    { name: 'จีน' },
    { name: 'ไต้หวัน' }
  ];

  // Sample images data (20 items)
  const images = [
    { file_name: 'ภูเขาไฟฟูจิ-1', file_path: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600', country_id: 1 },
    { file_name: 'Osaka-castle-ปราสาทโอซาก้า', file_path: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600', country_id: 1 },
    { file_name: 'Tokyo-Tower-โตเกียวทาวเวอร์', file_path: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600', country_id: 1 },
    { file_name: 'Kyoto-Temple-วัดเกียวโต', file_path: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600', country_id: 1 },
    { file_name: 'Shibuya-Crossing-ชิบูย่า', file_path: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600', country_id: 1 },
    
    { file_name: 'Seoul-Tower-หอคอยโซล', file_path: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=600', country_id: 2 },
    { file_name: 'Gyeongbokgung-Palace-พระราชวังเคียงบก', file_path: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600', country_id: 2 },
    { file_name: 'Busan-Beach-หาดปูซาน', file_path: 'https://images.unsplash.com/photo-1578193661550-3d0e9a2a0f6e?w=600', country_id: 2 },
    { file_name: 'Jeju-Island-เกาะเชจู', file_path: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600', country_id: 2 },
    { file_name: 'Myeongdong-Shopping-ช้อปปิ้งเมียงดง', file_path: 'https://images.unsplash.com/photo-1601024445121-e5b82f020549?w=600', country_id: 2 },
    
    { file_name: 'Grand-Palace-วัดพระแก้ว', file_path: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600', country_id: 3 },
    { file_name: 'Phuket-Beach-หาดภูเก็ต', file_path: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=600', country_id: 3 },
    { file_name: 'Chiang-Mai-Temple-วัดเชียงใหม่', file_path: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600', country_id: 3 },
    { file_name: 'Ayutthaya-Historical-Park-อยุธยา', file_path: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600', country_id: 3 },
    { file_name: 'Floating-Market-ตลาดน้ำ', file_path: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600', country_id: 3 },
    
    { file_name: 'Great-Wall-กำแพงเมืองจีน', file_path: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600', country_id: 4 },
    { file_name: 'Shanghai-Skyline-เซี่ยงไฮ้', file_path: 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=600', country_id: 4 },
    { file_name: 'Forbidden-City-พระราชวังต้องห้าม', file_path: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=600', country_id: 4 },
    
    { file_name: 'Taipei-101-ไทเป-101', file_path: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=600', country_id: 5 },
    { file_name: 'Taroko-Gorge-ทาโรโกะ', file_path: 'https://images.unsplash.com/photo-1562992932-a7b042e9d0c5?w=600', country_id: 5 }
  ];

  try {
    // Step 1: Create Countries
    console.log('📍 Creating countries...');
    const countryIds = [];
    
    for (const country of countries) {
      try {
        const response = await API.post(CONFIG.ENDPOINTS.COUNTRIES_CREATE, country);
        console.log(`✅ Created country: ${country.name}`, response);
        if (response.id) {
          countryIds.push(response.id);
        }
      } catch (error) {
        console.warn(`⚠️ Country might already exist: ${country.name}`);
      }
    }

    // Step 2: Create Images
    console.log('🖼️ Creating images...');
    const imageIds = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imageData = {
        ...image,
        updated_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      try {
        const response = await API.post(CONFIG.ENDPOINTS.IMAGES_CREATE, imageData);
        console.log(`✅ Created image ${i + 1}/${images.length}: ${image.file_name}`, response);
        if (response.id) {
          imageIds.push(response.id);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`❌ Failed to create image: ${image.file_name}`, error);
      }
    }

    console.log('🎉 Seed data completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Countries: ${countryIds.length}`);
    console.log(`   - Images: ${imageIds.length}`);
    console.log('\n✨ You can now refresh the page and search for data!');
    
    return {
      success: true,
      countryIds,
      imageIds
    };

  } catch (error) {
    console.error('❌ Seed data failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
})();
