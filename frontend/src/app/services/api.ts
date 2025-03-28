import axios, { InternalAxiosRequestConfig } from 'axios';
import { PaginatedResponse, AdjustmentReason, InventoryItem, InventoryAdjustment } from '../types/inventory';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 10000,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Use the hardcoded token for authorization
    
    const token = 'b1a353664017dd6b5171cd3c39f42d2c2e086a59';
    
    // Set the Authorization header with the token
    config.headers.Authorization = `Token ${token}`;
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interface for API params
interface ApiParams {
  [key: string]: any;
}

// Fetch adjustment reasons
export const fetchAdjustmentReasons = async (params?: ApiParams): Promise<PaginatedResponse<AdjustmentReason>> => {
  const response = await api.get('/inventory/adjustment-reasons/', { params });
  return response.data;
};

// Fetch inventory items
export const fetchInventoryItems = async (params?: ApiParams): Promise<PaginatedResponse<InventoryItem>> => {
  const response = await api.get('/inventory/', { params });
  return response.data;
};

// Interface for AdjustmentType
export interface AdjustmentType {
  code: string;
  name: string;
}

// Interface for FulfillmentLocation
export interface FulfillmentLocation {
  id: number;
  name: string;
  code: string;
  type: string;
  address?: string;
  is_active: boolean;
}

// Fetch adjustment types
export const fetchAdjustmentTypes = async (): Promise<AdjustmentType[]> => {
  const response = await api.get('/inventory/adjustment-types/');
  return response.data;
};

// Fetch fulfillment locations
export const fetchLocations = async (params?: ApiParams): Promise<PaginatedResponse<FulfillmentLocation>> => {
  const response = await api.get('/inventory/fulfillment-locations/', { params });
  return response.data;
};

// Fetch a single inventory item
export const fetchInventoryItem = async (id: number): Promise<InventoryItem> => {
  const response = await api.get(`/inventory/${id}/`);
  return response.data;
};

// Fetch inventory adjustments for a specific inventory item
export const fetchInventoryAdjustments = async (inventoryId: number, params?: ApiParams): Promise<PaginatedResponse<InventoryAdjustment>> => {
  const response = await api.get(`/inventory/${inventoryId}/adjustments/`, { params });
  return response.data;
};

// Create a new inventory adjustment
export interface CreateAdjustmentParams {
  inventory: number;
  adjustment_type: string;
  reason: number;
  quantity: number;
  lot_number?: string;
  expiry_date?: string;
  notes?: string;
}

export const createInventoryAdjustment = async (data: CreateAdjustmentParams): Promise<InventoryAdjustment> => {
  const response = await api.post('/inventory-adjustments/', data);
  return response.data;
};

// Fetch current stock levels for a product at a location
export const fetchCurrentStock = async (productId: number, locationId: number): Promise<InventoryItem> => {
  const response = await api.get('/inventory/', { 
    params: { 
      product: productId, 
      location: locationId,
      page_size: 1
    } 
  });
  
  // If inventory exists, return the first item, otherwise return null
  return response.data.results.length > 0 ? response.data.results[0] : null;
};

// Export the api instance for other services
export default api;
