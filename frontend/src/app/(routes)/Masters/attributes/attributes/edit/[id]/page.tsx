"use client";

/**
 * Edit Attribute Page
 */
import React from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Box, CircularProgress, Container, Breadcrumbs, Link } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useFetchAttribute, useUpdateAttribute } from '@/app/hooks/api/attributes';
import AttributeForm from '@/app/components/admin/attributes/forms/AttributeForm';
import { AttributeFormValues } from '@/app/components/admin/attributes/schemas';
import { toast } from 'react-hot-toast';

interface EditAttributePageProps {
  params: {
    id: string;
  };
}

export default function EditAttributePage({ params }: EditAttributePageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const id = parseInt(params.id, 10);
  
  const { data: attribute, isLoading } = useFetchAttribute(id);
  const { mutate: updateAttribute, isPending: isUpdating } = useUpdateAttribute();

  const handleSubmit = (data: AttributeFormValues) => {
    if (!attribute) return;
    
    updateAttribute(
      { 
        ...attribute,
        ...data
      },
      {
        onSuccess: () => {
          toast.success(t('attributes.attribute.updateSuccess'));
          router.push('/Masters/attributes/attributes');
        },
        onError: (error) => {
          console.error('Error updating attribute:', error);
          toast.error(t('attributes.attribute.updateError'));
        }
      }
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!attribute) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          {t('attributes.attribute.notFound')}
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('attributes.attribute.edit')}
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href="/Masters">
            {t('common.masters')}
          </Link>
          <Link color="inherit" href="/Masters/attributes">
            {t('common.attributes')}
          </Link>
          <Link color="inherit" href="/Masters/attributes/attributes">
            {t('attributes.attributes')}
          </Link>
          <Typography color="textPrimary">{t('common.edit')}</Typography>
        </Breadcrumbs>
      </Box>

      <AttributeForm 
        defaultValues={{
          name: attribute.name,
          code: attribute.code,
          data_type: attribute.data_type,
          description: attribute.description || '',
          is_active: attribute.is_active,
          is_variant_attribute: attribute.is_variant_attribute,
          is_required: attribute.is_required,
          display_on_pdp: attribute.display_on_pdp,
          validation_rules: attribute.validation_rules || {},
          groups: attribute.groups.map(group => typeof group === 'number' ? group : group.id)
        }}
        onSubmit={handleSubmit} 
        isSubmitting={isUpdating} 
      />
    </Container>
  );
}
