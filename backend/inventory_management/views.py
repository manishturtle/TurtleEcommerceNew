from django.shortcuts import render
from django.http import JsonResponse

# Create your views here.

def get_inventory(request):
    # Dummy data
    inventory_items = [
        {
            "id": 1,
            "name": "Laptop",
            "quantity": 10,
            "price": 999.99
        },
        {
            "id": 2,
            "name": "Mouse",
            "quantity": 20,
            "price": 29.99
        }
    ]
    return JsonResponse({"status": "success", "data": inventory_items})
