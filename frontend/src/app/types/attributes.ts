/**
 * Attributes TypeScript type definitions
 * 
 * This file exports types and interfaces for attribute entities:
 * AttributeGroup, Attribute, AttributeOption
 */

// Base interface for common fields (following pattern from catalogue.ts)
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

// AttributeGroup entity
export interface AttributeGroup extends BaseEntity {
  name: string;
  display_order?: number;
  is_active: boolean;
}

// Attribute data types enum
export enum AttributeDataType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT'
}

// ValidationRules interface for different attribute types
export interface ValidationRules {
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  regex_pattern?: string;
  date_format?: string;
  min_date?: string;
  max_date?: string;
  [key: string]: any; // Allow for custom validation rules
}

// Attribute entity
export interface Attribute extends BaseEntity {
  name: string;
  code: string;
  data_type: AttributeDataType;
  description?: string;
  is_active: boolean;
  is_variant_attribute: boolean;
  is_required: boolean;
  display_on_pdp: boolean;
  validation_rules?: ValidationRules;
  groups: AttributeGroup[] | number[]; // Allow both AttributeGroup objects and IDs
}

// AttributeOption entity
export interface AttributeOption extends BaseEntity {
  attribute: number | { id: number; name?: string; [key: string]: any }; // Can be either ID or Attribute object
  option_label: string;
  option_value: string;
  sort_order: number;
}

// API response types for attribute entities
export interface AttributesListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Filter types for attribute entities
export interface AttributesFilter {
  search?: string;
  is_active?: boolean;
  data_type?: AttributeDataType | string;
  is_variant_attribute?: boolean;
  group?: number; // Filter by attribute group
}
