/**
 * Add Division Page
 * 
 * Page component for adding a new division
 */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Paper, Breadcrumbs, Link as MuiLink, Alert } from '@mui/material';
import Link from 'next/link';
import { useCreateDivision } from '@/app/hooks/api/catalogue';
import DivisionForm from '@/app/components/admin/catalogue/forms/DivisionForm';
import { DivisionFormValues } from '@/app/components/admin/catalogue/schemas';
import Loader from '@/app/components/common/Loader';
import Notification from '@/app/components/common/Notification';
import useNotification from '@/app/hooks/useNotification';

const AddDivisionPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  
  // Notification state
  const { 
    notification, 
    showSuccess, 
    showError, 
    hideNotification 
  } = useNotification();
  
  // Create division mutation
  const { mutate: createDivision, isPending, isError, error } = useCreateDivision();
  
  // Handle form submission
  const handleSubmit = (data: DivisionFormValues) => {
    // Ensure all fields are properly typed for the API
    const formData = {
      name: data.name,
      description: data.description || null,
      is_active: data.is_active,
      image: data.image || null,
      image_alt_text: data.image_alt_text || null
    };
    
    createDivision(formData, {
      onSuccess: () => {
        // Show success notification
        showSuccess(t('catalogue.division.createSuccess'));
        // Redirect to divisions list page on success
        router.push('/Masters/catalogue/divisions');
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
        <MuiLink component={Link} href="/Masters/catalogue/divisions" underline="hover" color="inherit">
          {t('catalogue.divisions')}
        </MuiLink>
        <Typography color="text.primary">{t('add')}</Typography>
      </Breadcrumbs>
      
      <Typography variant="h4" gutterBottom>
        {t('catalogue.division.add')}
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
          <DivisionForm onSubmit={handleSubmit} isSubmitting={isPending} />
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

export default AddDivisionPage;
