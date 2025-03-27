/**
 * Zod validation schemas for catalogue forms
 * 
 * This file defines Zod schemas for validating form inputs for catalogue entities.
 */
import { z } from 'zod';

// Division schema
export const divisionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  is_active: z.boolean().default(true),
  image: z.string().url('Invalid URL format').optional().nullable(),
  image_alt_text: z.string().max(200, 'Alt text must be less than 200 characters').optional(),
});

export type DivisionFormValues = z.infer<typeof divisionSchema>;

// Category schema
export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  is_active: z.boolean().default(true),
  division: z.number({ required_error: 'Division is required' }),
  image_url: z.string().url('Invalid URL format').optional().nullable(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

// Subcategory schema
export const subcategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  is_active: z.boolean().default(true),
  category: z.number({ required_error: 'Category is required' }),
  image_url: z.string().url('Invalid URL format').optional().nullable(),
});

export type SubcategoryFormValues = z.infer<typeof subcategorySchema>;

// Unit of Measure schema
export const unitOfMeasureSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  symbol: z.string().min(1, 'Symbol is required').max(10, 'Symbol must be less than 10 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  is_active: z.boolean().default(true),
});

export type UnitOfMeasureFormValues = z.infer<typeof unitOfMeasureSchema>;

// Product Status schema
export const productStatusSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  is_active: z.boolean().default(true),
  color: z.string().optional(),
});

export type ProductStatusFormValues = z.infer<typeof productStatusSchema>;
