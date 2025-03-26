from django.shortcuts import render
from django.http import JsonResponse

# Create your views here.

def health_check(request):
    """
    Basic health check endpoint to verify server is running
    """
    return JsonResponse({
        'status': 'ok',
        'message': 'Server is running'
    })
