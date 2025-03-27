/**
 * Add Category Page
 * 
 * Page component for adding a new category
 */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Breadcrumbs, Link as MuiLink, Alert, Paper } from '@mui/material';
import Link from 'next/link';
import { useCreateCategory } from '@/app/hooks/api/catalogue';
import CategoryForm from '@/app/components/admin/catalogue/forms/CategoryForm';
import { CategoryFormValues } from '@/app/components/admin/catalogue/schemas';
import { Category } from '@/app/types/catalogue';
import Loader from '@/app/components/common/Loader';
import Notification from '@/app/components/common/Notification';
import useNotification from '@/app/hooks/useNotification';

const AddCategoryPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  
  // Notification state
  const { 
    notification, 
    showSuccess, 
    showError, 
    hideNotification 
  } = useNotification();
  
  // Create category mutation
  const { mutate: createCategory, isPending, isError, error } = useCreateCategory();
  
  // Handle form submission
  const handleSubmit = (data: CategoryFormValues) => {
    // Ensure data matches the expected type for the API call
    // The API expects Omit<Category, 'id' | 'created_at' | 'updated_at'>
    const categoryData = {
      name: data.name,
      description: data.description || undefined,
      is_active: data.is_active,
      division: data.division,
      image_url: data.image_url || undefined
    };
    
    createCategory(categoryData, {
      onSuccess: () => {
        // Show success notification
        showSuccess(t('catalogue.category.createSuccess'));
        // Redirect to categories list page on success
        router.push('/Masters/catalogue/categories');
      },
      onError: (error: unknown) => {
        showError(error instanceof Error ? error.message : t('error'));
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
        <MuiLink component={Link} href="/Masters/catalogue/categories" underline="hover" color="inherit">
          {t('catalogue.categories')}
        </MuiLink>
        <Typography color="text.primary">{t('add')}</Typography>
      </Breadcrumbs>
      
      <Typography variant="h4" gutterBottom>
        {t('catalogue.category.add')}
      </Typography>
      
      {/* Error message */}
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error instanceof Error ? error.message : t('error')}
        </Alert>
      )}
      
      {/* Form */}
      <Paper sx={{ p: 3 }}>
        {isPending ? (
          <Loader message={t('catalogue.saving')} />
        ) : (
          <CategoryForm onSubmit={handleSubmit} />
        )}
      </Paper>
      
      {/* Notification */}
      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={hideNotification}
      />
    </Box>
  );
};

export default AddCategoryPage;
