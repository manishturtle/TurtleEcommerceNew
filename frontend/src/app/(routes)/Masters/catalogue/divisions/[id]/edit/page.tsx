/**
 * Edit Division Page
 * 
 * Page component for editing an existing division
 */
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  Breadcrumbs, 
  Link as MuiLink, 
  Alert, 
  Button,
  Paper,
  Stack
} from '@mui/material';
import Link from 'next/link';
import EditIcon from '@mui/icons-material/Edit';
import { useFetchDivision, useUpdateDivision } from '@/app/hooks/api/catalogue';
import DivisionForm from '@/app/components/admin/catalogue/forms/DivisionForm';
import { DivisionFormValues } from '@/app/components/admin/catalogue/schemas';
import { Division } from '@/app/types/catalogue';
import Loader from '@/app/components/common/Loader';
import Notification from '@/app/components/common/Notification';
import useNotification from '@/app/hooks/useNotification';

const EditDivisionPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const divisionId = typeof params.id === 'string' ? Number(params.id) : -1;
  
  // State to track if edit mode is enabled
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Notification state
  const { 
    notification, 
    showSuccess, 
    showError, 
    hideNotification 
  } = useNotification();
  
  // Fetch division data
  const { 
    data: division, 
    isLoading, 
    isError: isFetchError, 
    error: fetchError 
  } = useFetchDivision(divisionId);
  
  // Update division mutation
  const { 
    mutate: updateDivision, 
    isPending: isUpdating, 
    isError: isUpdateError, 
    error: updateError 
  } = useUpdateDivision();
  
  // Toggle edit mode
  const handleEnableEdit = () => {
    setIsEditMode(true);
  };
  
  // Handle form submission
  const handleSubmit = (data: DivisionFormValues) => {
    if (division) {
      // Create a properly typed update object that matches the Division interface
      const updateData = {
        id: divisionId,
        name: data.name,
        description: data.description || null,
        is_active: data.is_active,
        image: data.image || null,
        image_alt_text: data.image_alt_text || null,
        org_id: division.org_id,
        created_at: division.created_at,
        updated_at: division.updated_at,
        created_by: division.created_by,
        updated_by: division.updated_by
      };
      
      updateDivision(updateData, {
        onSuccess: () => {
          // Show success notification
          showSuccess(t('catalogue.division.updateSuccess'));
          // Redirect to divisions list page on success
          router.push('/Masters/catalogue/divisions');
        },
        onError: (error: unknown) => {
          showError(error instanceof Error ? error.message : t('error'));
        }
      });
    }
  };

  // Show loading state while fetching division data
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <Loader message={t('catalogue.loading')} />
      </Box>
    );
  }

  // Show error message if division not found or invalid ID
  if (!division || divisionId === -1) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {t('catalogue.divisionNotFound')}
        </Alert>
        <Button 
          component={Link} 
          href="/Masters/catalogue/divisions"
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
        <MuiLink component={Link} href="/Masters/catalogue/divisions" underline="hover" color="inherit">
          {t('catalogue.divisions')}
        </MuiLink>
        <Typography color="text.primary">
          {isEditMode ? t('edit') : t('view')}
        </Typography>
      </Breadcrumbs>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {isEditMode ? t('Division Edit') : t('Division Details')}: {division.name}
        </Typography>
        
        {!isEditMode && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleEnableEdit}
          >
            {t('edit')}
          </Button>
        )}
      </Box>
      
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
      
      {/* Division form */}
      <Paper sx={{ p: 3 }}>
        {isUpdating ? (
          <Loader message={t('catalogue.saving')} />
        ) : (
          <DivisionForm 
            defaultValues={{
              name: division.name,
              description: division.description || '',
              is_active: division.is_active,
              image: division.image || '',
              image_alt_text: division.image_alt_text || '',
            }}
            onSubmit={handleSubmit}
            isSubmitting={isUpdating}
            readOnly={!isEditMode}
          />
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

export default EditDivisionPage;
