/**
 * Zod validation schemas for pricing forms
 * 
 * This file defines Zod schemas for validating form inputs for pricing entities.
 */
import { z } from 'zod';

// Customer Group schema
export const customerGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  code: z.string().min(1, 'Code is required').max(50, 'Code must be less than 50 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  is_active: z.boolean().default(true),
});

export type CustomerGroupFormValues = z.infer<typeof customerGroupSchema>;

// Selling Channel schema
export const sellingChannelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  code: z.string().min(1, 'Code is required').max(50, 'Code must be less than 50 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  is_active: z.boolean().default(true),
});

export type SellingChannelFormValues = z.infer<typeof sellingChannelSchema>;

// Country schema for use in TaxRegion
export const countrySchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
});

// Tax Region schema
export const taxRegionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  code: z.string().min(1, 'Code is required').max(50, 'Code must be less than 50 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  is_active: z.boolean().default(true),
  countries: z.array(z.number()).min(1, 'At least one country must be selected'),
});

export type TaxRegionFormValues = z.infer<typeof taxRegionSchema>;

// Tax Rate schema
export const taxRateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  code: z.string().min(1, 'Code is required').max(50, 'Code must be less than 50 characters'),
  rate: z.number().min(0, 'Rate must be positive').max(100, 'Rate must be less than or equal to 100'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  is_active: z.boolean().default(true),
});

export type TaxRateFormValues = z.infer<typeof taxRateSchema>;

// Tax Rate Profile schema
export const taxRateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  code: z.string().min(1, 'Code is required').max(50, 'Code must be less than 50 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  is_active: z.boolean().default(true),
  tax_rates: z.array(z.number()).min(1, 'At least one tax rate must be selected'),
  is_default: z.boolean().default(false),
});

export type TaxRateProfileFormValues = z.infer<typeof taxRateProfileSchema>;
