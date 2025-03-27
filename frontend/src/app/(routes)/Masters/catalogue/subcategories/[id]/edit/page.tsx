/**
 * Edit Subcategory Page
 * 
 * Page component for editing an existing subcategory
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
import { useFetchSubcategory, useUpdateSubcategory } from '@/app/hooks/api/catalogue';
import SubcategoryForm from '@/app/components/admin/catalogue/forms/SubcategoryForm';
import { SubcategoryFormValues } from '@/app/components/admin/catalogue/schemas';
import { Subcategory } from '@/app/types/catalogue';

const EditSubcategoryPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const subcategoryId = typeof params.id === 'string' ? Number(params.id) : -1;
  
  // Fetch subcategory data
  const { 
    data: subcategory, 
    isLoading, 
    isError: isFetchError, 
    error: fetchError 
  } = useFetchSubcategory(subcategoryId);
  
  // Update subcategory mutation
  const { 
    mutate: updateSubcategory, 
    isPending: isUpdating, 
    isError: isUpdateError, 
    error: updateError 
  } = useUpdateSubcategory();
  
  // Handle form submission
  const handleSubmit = (data: SubcategoryFormValues) => {
    if (subcategory) {
      // Create a properly typed update object that matches the Subcategory interface
      const updateData: Subcategory = {
        id: subcategoryId,
        name: data.name,
        description: data.description || undefined,
        is_active: data.is_active,
        category: data.category,
        image_url: data.image_url || undefined,
        created_at: subcategory.created_at,
        updated_at: subcategory.updated_at,
        // Include any other fields from the original subcategory that aren't in the form
        category_name: subcategory.category_name
      };
      
      updateSubcategory(updateData, {
        onSuccess: () => {
          // Redirect to subcategories list page on success
          router.push('/Masters/catalogue/subcategories');
        }
      });
    }
  };

  // Show loading state while fetching subcategory data
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error message if subcategory not found or invalid ID
  if (!subcategory || subcategoryId === -1) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {t('catalogue.subcategoryNotFound')}
        </Alert>
        <Button 
          component={Link} 
          href="/Masters/catalogue/subcategories"
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
        <MuiLink component={Link} href="/Masters/catalogue/subcategories" underline="hover" color="inherit">
          {t('catalogue.subcategories')}
        </MuiLink>
        <Typography color="text.primary">
          {t('catalogue.editSubcategory')}
        </Typography>
      </Breadcrumbs>
      
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('catalogue.editSubcategory')}: {subcategory.name}
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
      
      {/* Subcategory form */}
      <SubcategoryForm 
        defaultValues={{
          name: subcategory.name,
          description: subcategory.description || '',
          is_active: subcategory.is_active,
          category: subcategory.category,
          image_url: subcategory.image_url || ''
        }}
        onSubmit={handleSubmit}
        isSubmitting={isUpdating}
      />
    </Box>
  );
};

export default EditSubcategoryPage;
