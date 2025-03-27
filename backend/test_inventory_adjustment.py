import requests
import json
from datetime import datetime

# Base URL for the API
BASE_URL = "http://localhost:8000/api/v1"

# Authentication token (replace with a valid token)
TOKEN = "b1a353664017dd6b5171cd3c39f42d2c2e086a59"

# Headers for API requests
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Token {TOKEN}"
}

def test_inventory_adjustment():
    """
    Test the inventory adjustment functionality by creating an adjustment
    and verifying the result.
    """
    print(f"=== Testing Inventory Adjustment at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===")
    
    # 1. First, get a list of inventory items to find one to adjust
    print("\n1. Fetching inventory items...")
    response = requests.get(f"{BASE_URL}/inventory/", headers=headers)
    
    if response.status_code != 200:
        print(f"Failed to get inventory items: {response.status_code}")
        print(response.text)
        return
    
    inventory_items = response.json().get("results", [])
    
    if not inventory_items:
        print("No inventory items found. Please create some inventory first.")
        return
    
    # Use the first inventory item for testing
    inventory_item = inventory_items[0]
    inventory_id = inventory_item["id"]
    current_quantity = inventory_item["stock_quantity"]
    
    print(f"Found inventory item: ID={inventory_id}, Product={inventory_item.get('product', {}).get('name', 'Unknown')}, Current Quantity={current_quantity}")
    
    # 2. Get adjustment reasons
    print("\n2. Fetching adjustment reasons...")
    response = requests.get(f"{BASE_URL}/adjustment-reasons/", headers=headers)
    
    if response.status_code != 200:
        print(f"Failed to get adjustment reasons: {response.status_code}")
        print(response.text)
        return
    
    reasons = response.json().get("results", [])
    
    if not reasons:
        print("No adjustment reasons found. Please create an adjustment reason first.")
        return
    
    # Use the first reason for testing
    reason_id = reasons[0]["id"]
    reason_name = reasons[0]["name"]
    
    print(f"Using adjustment reason: ID={reason_id}, Name={reason_name}")
    
    # 3. Create an inventory adjustment (addition)
    print("\n3. Creating inventory adjustment (addition)...")
    
    adjustment_data = {
        "inventory": inventory_id,
        "adjustment_type": "ADD",  # Addition
        "quantity_change": 5,  # Add 5 units
        "reason": reason_id,
        "notes": "Test adjustment via API"
    }
    
    response = requests.post(
        f"{BASE_URL}/adjustments/",
        headers=headers,
        data=json.dumps(adjustment_data)
    )
    
    if response.status_code == 201:
        print("Adjustment created successfully!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Failed to create adjustment: {response.status_code}")
        print(response.text)
    
    # 4. Verify the inventory was updated
    print("\n4. Verifying inventory update...")
    response = requests.get(f"{BASE_URL}/inventory/{inventory_id}/", headers=headers)
    
    if response.status_code != 200:
        print(f"Failed to get updated inventory: {response.status_code}")
        print(response.text)
        return
    
    updated_item = response.json()
    new_quantity = updated_item["stock_quantity"]
    
    print(f"Original quantity: {current_quantity}")
    print(f"New quantity: {new_quantity}")
    print(f"Expected quantity: {current_quantity + 5}")
    
    if new_quantity == current_quantity + 5:
        print("✅ Test PASSED: Inventory quantity was updated correctly!")
    else:
        print("❌ Test FAILED: Inventory quantity was not updated as expected.")
    
    # 5. Get adjustment history for this inventory item
    print("\n5. Fetching adjustment history...")
    response = requests.get(f"{BASE_URL}/inventory/{inventory_id}/adjustments/", headers=headers)
    
    if response.status_code != 200:
        print(f"Failed to get adjustment history: {response.status_code}")
        print(response.text)
        return
    
    adjustments = response.json().get("results", [])
    print(f"Found {len(adjustments)} adjustments for this inventory item.")
    
    if adjustments:
        print("Latest adjustment:")
        print(json.dumps(adjustments[0], indent=2))

if __name__ == "__main__":
    test_inventory_adjustment()
