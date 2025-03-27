/**
 * Edit Unit of Measure Page
 * 
 * Page component for editing an existing unit of measure
 */
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  Breadcrumbs, 
  Link as MuiLink, 
  Alert, 
  CircularProgress,
  Button
} from '@mui/material';
import Link from 'next/link';
import { useFetchUnitOfMeasure, useUpdateUnitOfMeasure } from '@/app/hooks/api/catalogue';
import UnitOfMeasureForm from '@/app/components/admin/catalogue/forms/UnitOfMeasureForm';
import { UnitOfMeasureFormValues } from '@/app/components/admin/catalogue/schemas';

const EditUnitOfMeasurePage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const unitId = typeof params.id === 'string' ? Number(params.id) : -1;
  
  // Fetch unit of measure data
  const { 
    data: unit, 
    isLoading, 
    isError: isFetchError, 
    error: fetchError 
  } = useFetchUnitOfMeasure(unitId);
  
  // Update unit of measure mutation
  const { 
    mutate: updateUnitOfMeasure, 
    isPending: isUpdating, 
    isError: isUpdateError, 
    error: updateError 
  } = useUpdateUnitOfMeasure();
  
  // Handle form submission
  const handleSubmit = (data: UnitOfMeasureFormValues) => {
    if (unit) {
      // Include the required timestamp fields from the original unit
      updateUnitOfMeasure(
        { 
          id: unitId, 
          ...data,
          created_at: unit.created_at,
          updated_at: unit.updated_at
        },
        {
          onSuccess: () => {
            // Redirect to units of measure list page on success
            router.push('/Masters/catalogue/units-of-measure');
          }
        }
      );
    }
  };

  // Show loading state while fetching unit of measure data
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error message if unit not found or invalid ID
  if (!unit || unitId === -1) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {t('catalogue.unitOfMeasureNotFound')}
        </Alert>
        <Button 
          component={Link} 
          href="/Masters/catalogue/units-of-measure"
          variant="contained" 
          sx={{ mt: 2 }}
        >
          {t('back')}
        </Button>
      </Box>
    );
  }

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
        <Typography color="text.primary">
          {t('catalogue.editUnitOfMeasure')}
        </Typography>
      </Breadcrumbs>
      
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('catalogue.editUnitOfMeasure')}: {unit.name}
      </Typography>
      
      {/* Error messages */}
      {isFetchError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {fetchError instanceof Error ? fetchError.message : t('error')}
        </Alert>
      )}
      
      {isUpdateError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {updateError instanceof Error ? updateError.message : t('error')}
        </Alert>
      )}
      
      {/* Unit of Measure form */}
      <UnitOfMeasureForm 
        defaultValues={{
          name: unit.name,
          symbol: unit.symbol,
          description: unit.description || '',
          is_active: unit.is_active
        }}
        onSubmit={handleSubmit}
        isSubmitting={isUpdating}
      />
    </Box>
  );
};

export default EditUnitOfMeasurePage;
