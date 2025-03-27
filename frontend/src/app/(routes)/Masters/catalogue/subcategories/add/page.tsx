/**
 * Add Subcategory Page
 * 
 * Page component for adding a new subcategory
 */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Breadcrumbs, Link as MuiLink, Alert } from '@mui/material';
import Link from 'next/link';
import { useCreateSubcategory } from '@/app/hooks/api/catalogue';
import SubcategoryForm from '@/app/components/admin/catalogue/forms/SubcategoryForm';
import { SubcategoryFormValues } from '@/app/components/admin/catalogue/schemas';
import { Subcategory } from '@/app/types/catalogue';

const AddSubcategoryPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  
  // Create subcategory mutation
  const { mutate: createSubcategory, isPending, isError, error } = useCreateSubcategory();
  
  // Handle form submission
  const handleSubmit = (data: SubcategoryFormValues) => {
    // Ensure data matches the expected type for the API call
    // The API expects Omit<Subcategory, 'id' | 'created_at' | 'updated_at'>
    const subcategoryData = {
      name: data.name,
      description: data.description || undefined,
      is_active: data.is_active,
      category: data.category,
      image_url: data.image_url || undefined
    };
    
    createSubcategory(subcategoryData, {
      onSuccess: () => {
        // Redirect to subcategories list page on success
        router.push('/Masters/catalogue/subcategories');
      }
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} href="/Masters" underline="hover" color="inherit">
          {t('dashboard')}
        </MuiLink>
        <MuiLink component={Link} href="/Masters/catalogue/subcategories" underline="hover" color="inherit">
          {t('catalogue.subcategories')}
        </MuiLink>
        <Typography color="text.primary">{t('catalogue.addSubcategory')}</Typography>
      </Breadcrumbs>
      
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('catalogue.addSubcategory')}
      </Typography>
      
      {/* Error message */}
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error instanceof Error ? error.message : t('error')}
        </Alert>
      )}
      
      {/* Subcategory form */}
      <SubcategoryForm 
        onSubmit={handleSubmit}
        isSubmitting={isPending}
      />
    </Box>
  );
};

export default AddSubcategoryPage;
