/**
 * Pricing TypeScript type definitions
 * 
 * This file exports types and interfaces for pricing and tax entities:
 * CustomerGroup, SellingChannel, TaxRegion, TaxRate, TaxRateProfile
 */

// Base interface for common fields (following pattern from catalogue.ts)
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

// Customer Group entity
export interface CustomerGroup extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
}

// Selling Channel entity
export interface SellingChannel extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
}

// Country entity for use in TaxRegion
export interface Country {
  id: number;
  name: string;
  code: string;
}

// Tax Region entity
export interface TaxRegion extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  countries: Country[]; // Many-to-many relationship with countries
}

// Tax Rate entity
export interface TaxRate extends BaseEntity {
  name: string;
  code: string;
  rate: number; // Percentage value
  description?: string;
  is_active: boolean;
}

// Tax Rate Profile entity
export interface TaxRateProfile extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  tax_rates: TaxRate[]; // Many-to-many relationship with tax rates
  is_default: boolean;
}

// API response types for pricing entities
export interface PricingListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Filter types for pricing entities
export interface PricingFilter {
  search?: string;
  is_active?: boolean;
}
