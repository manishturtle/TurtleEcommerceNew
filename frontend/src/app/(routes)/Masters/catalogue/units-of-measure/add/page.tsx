/**
 * Add Unit of Measure Page
 * 
 * Page component for adding a new unit of measure
 */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Breadcrumbs, Link as MuiLink, Alert } from '@mui/material';
import Link from 'next/link';
import { useCreateUnitOfMeasure } from '@/app/hooks/api/catalogue';
import UnitOfMeasureForm from '@/app/components/admin/catalogue/forms/UnitOfMeasureForm';
import { UnitOfMeasureFormValues } from '@/app/components/admin/catalogue/schemas';

const AddUnitOfMeasurePage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  
  // Create unit of measure mutation
  const { mutate: createUnitOfMeasure, isPending, isError, error } = useCreateUnitOfMeasure();
  
  // Handle form submission
  const handleSubmit = (data: UnitOfMeasureFormValues) => {
    createUnitOfMeasure(data, {
      onSuccess: () => {
        // Redirect to units of measure list page on success
        router.push('/Masters/catalogue/units-of-measure');
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
        <MuiLink component={Link} href="/Masters/catalogue/units-of-measure" underline="hover" color="inherit">
          {t('catalogue.unitOfMeasures')}
        </MuiLink>
        <Typography color="text.primary">{t('catalogue.addUnitOfMeasure')}</Typography>
      </Breadcrumbs>
      
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('catalogue.addUnitOfMeasure')}
      </Typography>
      
      {/* Error message */}
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error instanceof Error ? error.message : t('error')}
        </Alert>
      )}
      
      {/* Unit of Measure form */}
      <UnitOfMeasureForm 
        onSubmit={handleSubmit}
        isSubmitting={isPending}
      />
    </Box>
  );
};

export default AddUnitOfMeasurePage;
