// Inventory related types

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AdjustmentReason {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: number;
  product: number;
  product_name?: string;
  location: number;
  location_name?: string;
  stock_quantity: number;
  reserved_quantity: number;
  non_saleable_quantity: number;
  on_order_quantity: number;
  in_transit_quantity: number;
  returned_quantity: number;
  hold_quantity: number;
  backorder_quantity: number;
  available_quantity: number;
  is_lot_tracked: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryLot {
  id: number;
  inventory: number;
  lot_number: string;
  quantity: number;
  reserved_quantity: number;
  expiry_date: string | null;
  cost_price_per_unit: number | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryAdjustment {
  id: number;
  inventory: number;
  adjustment_type: string;
  reason: number;
  reason_name?: string;
  quantity: number;
  lot_number?: string;
  expiry_date?: string;
  notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryAdjustmentFormData {
  product: string;
  location: string;
  adjustmentType: string;
  quantity: string;
  reason: string;
  serialLotNumber?: string;
  expiryDate?: string;
  notes?: string;
}
