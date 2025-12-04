#!/usr/bin/env python3
"""
NoCodeBackend API Client - Tour Images Fetcher
Fetches data from 54566_image_test instance
"""

import requests
from typing import Dict, List, Optional, Any
import json


# Configuration
BASE_URL = "https://api.nocodebackend.com"
API_KEY = "b9746df17c49ee50175db1c7b2b0cb843d5267c0ce25fdb36f7fe041c9784a99"
INSTANCE_ID = "54566_image_test"

# Headers for authentication
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}


def get_all_images(limit: int = 100) -> Dict[str, Any]:
    """
    Fetches all records from /read/tour_images
    
    Args:
        limit: Maximum number of records to fetch (default: 100)
    
    Returns:
        Dictionary containing status, data, and metadata
    """
    endpoint = f"{BASE_URL}/read/tour_images"
    params = {
        "Instance": INSTANCE_ID,
        "limit": limit
    }
    
    try:
        response = requests.get(endpoint, headers=HEADERS, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching all images: {e}")
        return {"status": "failed", "error": str(e)}


def get_image_by_id(image_id: int) -> Dict[str, Any]:
    """
    Fetches a single record from /read/tour_images/{image_id}
    
    Args:
        image_id: The ID of the image to fetch
    
    Returns:
        Dictionary containing the image data
    """
    endpoint = f"{BASE_URL}/read/tour_images/{image_id}"
    params = {
        "Instance": INSTANCE_ID
    }
    
    try:
        response = requests.get(endpoint, headers=HEADERS, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching image {image_id}: {e}")
        return {"status": "failed", "error": str(e)}


def search_images(filters: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetches records with query parameters
    
    Args:
        filters: Dictionary of filter parameters
                 Example: {'country': 'Japan'}
                 Supports operators: {'total_usage[gt]': 10}
    
    Returns:
        Dictionary containing filtered results
    """
    endpoint = f"{BASE_URL}/read/tour_images"
    
    # Add Instance to params
    params = {
        "Instance": INSTANCE_ID,
        **filters
    }
    
    try:
        response = requests.get(endpoint, headers=HEADERS, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Error searching images: {e}")
        return {"status": "failed", "error": str(e)}


def print_separator(title: str = ""):
    """Print a nice separator line"""
    if title:
        print(f"\n{'='*60}")
        print(f"  {title}")
        print(f"{'='*60}\n")
    else:
        print(f"{'='*60}\n")


def main():
    """Main execution function"""
    
    print("\n🚀 NoCodeBackend API Client - Tour Images Fetcher")
    print(f"📦 Instance: {INSTANCE_ID}")
    print(f"🔗 Base URL: {BASE_URL}\n")
    
    # Task 1: Get all images and print first 2 results
    print_separator("Task 1: Fetch All Images")
    
    all_images = get_all_images()
    
    if all_images.get("status") == "success":
        data = all_images.get("data", [])
        total = len(data)
        
        print(f"✅ Successfully fetched {total} images")
        
        if total > 0:
            print(f"\n📋 First 2 results:\n")
            for i, image in enumerate(data[:2], 1):
                print(f"Image {i}:")
                print(json.dumps(image, indent=2, ensure_ascii=False))
                print()
        else:
            print("⚠️  No images found in database")
    else:
        print(f"❌ Failed to fetch images: {all_images.get('error')}")
    
    
    # Task 2: Search images by country
    print_separator("Task 2: Search Images by Country")
    
    search_filters = {'country': 'Japan'}
    print(f"🔍 Searching for images with filters: {search_filters}\n")
    
    search_results = search_images(search_filters)
    
    if search_results.get("status") == "success":
        data = search_results.get("data", [])
        count = len(data)
        
        print(f"✅ Found {count} images matching the criteria")
        
        if count > 0:
            print(f"\n📋 Sample result:")
            print(json.dumps(data[0], indent=2, ensure_ascii=False))
    else:
        print(f"❌ Search failed: {search_results.get('error')}")
    
    
    # Bonus: Example with operators
    print_separator("Bonus: Search with Operators")
    
    operator_filters = {'total_usage[gt]': 10}
    print(f"🔍 Searching for images with filters: {operator_filters}\n")
    
    operator_results = search_images(operator_filters)
    
    if operator_results.get("status") == "success":
        data = operator_results.get("data", [])
        count = len(data)
        print(f"✅ Found {count} images with total_usage > 10")
    else:
        print(f"❌ Search failed: {operator_results.get('error')}")
    
    
    # Example: Get specific image by ID
    print_separator("Bonus: Get Image by ID")
    
    if all_images.get("status") == "success" and len(all_images.get("data", [])) > 0:
        first_image_id = all_images["data"][0].get("id")
        print(f"🔍 Fetching image with ID: {first_image_id}\n")
        
        image_detail = get_image_by_id(first_image_id)
        
        if image_detail.get("status") == "success":
            print(f"✅ Successfully fetched image details:")
            print(json.dumps(image_detail.get("data"), indent=2, ensure_ascii=False))
        else:
            print(f"❌ Failed to fetch image: {image_detail.get('error')}")
    else:
        print("⚠️  No images available to fetch by ID")
    
    print_separator()
    print("✨ Script execution completed!\n")


if __name__ == "__main__":
    main()
