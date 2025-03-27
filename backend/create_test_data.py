"""
Script to create test data for inventory adjustments.
"""
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_backend.settings')
django.setup()

# Import necessary models
from inventory.models import AdjustmentReason

def create_test_data():
    """Create test data for inventory adjustments."""
    print("Creating test data for inventory adjustments...")
    
    # Create adjustment reasons if they don't exist
    reasons = [
        {"name": "Stock Count", "description": "Adjustment based on physical inventory count"},
        {"name": "Damaged Goods", "description": "Items damaged in warehouse"},
        {"name": "Quality Control", "description": "Items failed quality inspection"},
        {"name": "System Error", "description": "Correction of system error"},
        {"name": "Customer Return", "description": "Items returned by customer"}
    ]
    
    created_count = 0
    for reason_data in reasons:
        reason, created = AdjustmentReason.objects.get_or_create(
            name=reason_data["name"],
            defaults={"description": reason_data["description"]}
        )
        if created:
            created_count += 1
            print(f"Created adjustment reason: {reason.name}")
        else:
            print(f"Adjustment reason already exists: {reason.name}")
    
    print(f"Created {created_count} new adjustment reasons.")
    print("Test data creation complete!")

if __name__ == "__main__":
    create_test_data()
