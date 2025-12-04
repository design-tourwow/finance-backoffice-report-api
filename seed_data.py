#!/usr/bin/env python3
"""
Seed Data Script for Tour Images
Creates 50 sample records in tour_images table
Countries: Japan, Korea, China, Taiwan, Vietnam, Singapore, Malaysia, Indonesia
"""

import requests
import json
import random
import time
from datetime import datetime, timedelta


# Configuration
BASE_URL = "https://api.nocodebackend.com"
API_KEY = "b9746df17c49ee50175db1c7b2b0cb843d5267c0ce25fdb36f7fe041c9784a99"
INSTANCE_ID = "54566_image_test"

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}


# Sample data for different countries
COUNTRIES_DATA = {
    "Japan": [
        "Mount-Fuji-Sunrise", "Tokyo-Tower-Night", "Osaka-Castle-Spring",
        "Kyoto-Temple-Autumn", "Shibuya-Crossing", "Nara-Deer-Park",
        "Hakone-Lake-View", "Hiroshima-Peace-Memorial", "Nikko-Shrine",
        "Hokkaido-Snow-Festival"
    ],
    "Korea": [
        "Seoul-Tower-Sunset", "Gyeongbokgung-Palace", "Busan-Beach-Summer",
        "Jeju-Island-Waterfall", "Myeongdong-Shopping", "Namsan-Park",
        "Lotte-World-Tower", "Gangnam-District", "Incheon-Bridge",
        "Seoraksan-Mountain"
    ],
    "China": [
        "Great-Wall-Beijing", "Shanghai-Skyline", "Forbidden-City",
        "Terracotta-Warriors", "West-Lake-Hangzhou", "Guilin-Mountains",
        "Zhangjiajie-Avatar", "Huangshan-Yellow-Mountain", "Lijiang-Old-Town",
        "Chengdu-Panda-Base"
    ],
    "Taiwan": [
        "Taipei-101-Night", "Taroko-Gorge", "Sun-Moon-Lake",
        "Jiufen-Old-Street", "Alishan-Sunrise", "Kenting-Beach",
        "Yehliu-Geopark", "Tainan-Temple", "Kaohsiung-Harbor",
        "Hualien-Coast"
    ],
    "Vietnam": [
        "Halong-Bay-Cruise", "Hanoi-Old-Quarter", "Hoi-An-Lanterns",
        "Saigon-Notre-Dame", "Mekong-Delta", "Sapa-Rice-Terraces",
        "Hue-Imperial-City", "Danang-Golden-Bridge", "Nha-Trang-Beach",
        "Phong-Nha-Cave"
    ],
    "Singapore": [
        "Marina-Bay-Sands", "Gardens-By-The-Bay", "Merlion-Park",
        "Sentosa-Island", "Orchard-Road", "Clarke-Quay-Night",
        "Singapore-Flyer", "Chinatown-Heritage", "Little-India",
        "Universal-Studios"
    ],
    "Malaysia": [
        "Petronas-Towers", "Batu-Caves", "Penang-Street-Art",
        "Langkawi-Beach", "Cameron-Highlands", "Malacca-River",
        "KL-Tower-View", "Genting-Highlands", "Borneo-Rainforest",
        "Perhentian-Islands"
    ],
    "Indonesia": [
        "Bali-Rice-Terraces", "Borobudur-Temple", "Jakarta-Monument",
        "Komodo-Dragon", "Bromo-Volcano", "Ubud-Monkey-Forest",
        "Gili-Islands", "Yogyakarta-Palace", "Raja-Ampat-Diving",
        "Lombok-Waterfall"
    ]
}

WHOLESALES = ["TTN PLUS", "Tokyo Easy", "Seoul Express", "China Grand", "Asia Dream"]


def generate_image_data(index, country, location):
    """Generate a single image record"""
    
    # Random usage stats
    banner_1 = random.randint(0, 8)
    banner_other = random.randint(0, 5)
    detail = random.randint(0, 10)
    total_usage = banner_1 + banner_other + detail
    
    usage_stats = {
        "banner_1": banner_1,
        "banner_other": banner_other,
        "detail": detail
    }
    
    # Random related programs (1-3 programs)
    num_programs = random.randint(1, 3)
    related_programs = []
    for _ in range(num_programs):
        program_code = f"XJ{random.randint(200, 999)}"
        wholesale = random.choice(WHOLESALES)
        date = (datetime.now() + timedelta(days=random.randint(1, 90))).strftime("%Y-%m-%d")
        related_programs.append({
            "code": program_code,
            "name": wholesale,
            "date": date
        })
    
    # Generate image data
    image_name = f"{location}-{random.randint(1, 99):02d}.jpg"
    country_code = country[:2].lower()
    image_url = f"https://example.com/img/{country_code}/{location.lower()}-{index:03d}.jpg"
    
    return {
        "image_name": image_name,
        "image_url": image_url,
        "country": country,
        "total_usage": total_usage,
        "usage_stats": json.dumps(usage_stats),
        "related_programs_log": json.dumps(related_programs)
    }


def create_image(data):
    """Create a single image record via API"""
    endpoint = f"{BASE_URL}/create/tour_images"
    params = {"Instance": INSTANCE_ID}
    
    try:
        response = requests.post(endpoint, headers=HEADERS, params=params, json=data)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"status": "failed", "error": str(e)}


def main():
    """Main execution"""
    print("\n" + "="*70)
    print("  🌱 SEED DATA GENERATOR - Tour Images")
    print("="*70)
    print(f"\n📦 Instance: {INSTANCE_ID}")
    print(f"🎯 Target: 50 records")
    print(f"🌏 Countries: {', '.join(COUNTRIES_DATA.keys())}")
    print("\n" + "="*70 + "\n")
    
    # Generate 50 records
    all_locations = []
    for country, locations in COUNTRIES_DATA.items():
        for location in locations:
            all_locations.append((country, location))
    
    # Shuffle and take 50
    random.shuffle(all_locations)
    selected_locations = all_locations[:50]
    
    success_count = 0
    failed_count = 0
    
    print("🚀 Starting data creation...\n")
    
    for i, (country, location) in enumerate(selected_locations, 1):
        # Generate data
        image_data = generate_image_data(i, country, location)
        
        # Create via API
        result = create_image(image_data)
        
        if result.get("status") == "success":
            success_count += 1
            print(f"✅ [{i:2d}/50] Created: {image_data['image_name']:40s} | {country:12s} | ID: {result.get('id')}")
        else:
            failed_count += 1
            error_msg = result.get("error", "Unknown error")
            print(f"❌ [{i:2d}/50] Failed: {image_data['image_name']:40s} | Error: {error_msg}")
        
        # Small delay to avoid rate limiting
        time.sleep(0.3)
    
    # Summary
    print("\n" + "="*70)
    print("  📊 SUMMARY")
    print("="*70)
    print(f"\n✅ Success: {success_count}")
    print(f"❌ Failed:  {failed_count}")
    print(f"📈 Total:   {success_count + failed_count}")
    
    if success_count > 0:
        print(f"\n🎉 Successfully created {success_count} image records!")
    
    print("\n" + "="*70 + "\n")


if __name__ == "__main__":
    main()
