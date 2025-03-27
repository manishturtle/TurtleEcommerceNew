"use client";

/**
 * Edit Attribute Option Page
 */
import React from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Box, CircularProgress, Container, Breadcrumbs, Link } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useFetchAttributeOption, useUpdateAttributeOption } from '@/app/hooks/api/attributes';
import AttributeOptionForm from '@/app/components/admin/attributes/forms/AttributeOptionForm';
import { AttributeOptionFormValues } from '@/app/components/admin/attributes/schemas';
import { toast } from 'react-hot-toast';

interface EditAttributeOptionPageProps {
  params: {
    id: string;
  };
}

export default function EditAttributeOptionPage({ params }: EditAttributeOptionPageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const id = parseInt(params.id, 10);
  
  const { data: attributeOption, isLoading } = useFetchAttributeOption(id);
  const { mutate: updateAttributeOption, isPending: isUpdating } = useUpdateAttributeOption();

  const handleSubmit = (data: AttributeOptionFormValues) => {
    if (!attributeOption) return;
    
    updateAttributeOption(
      { 
        ...attributeOption,
        ...data
      },
      {
        onSuccess: () => {
          toast.success(t('attributes.attributeOption.updateSuccess'));
          router.push('/Masters/attributes/attribute-options');
        },
        onError: (error) => {
          console.error('Error updating attribute option:', error);
          toast.error(t('attributes.attributeOption.updateError'));
        }
      }
    );
  };

  if (isLoading || !attributeOption) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Extract attribute ID safely
  let attributeId = 0;
  if (typeof attributeOption.attribute === 'number') {
    attributeId = attributeOption.attribute;
  } else if (attributeOption.attribute && typeof attributeOption.attribute === 'object') {
    attributeId = attributeOption.attribute.id;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          {t('attributes.attributeOption.edit')}
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href="/Masters">
            {t('common.masters')}
          </Link>
          <Link color="inherit" href="/Masters/attributes">
            {t('common.attributes')}
          </Link>
          <Link color="inherit" href="/Masters/attributes/attribute-options">
            {t('attributes.attributeOptions')}
          </Link>
          <Typography color="textPrimary">{t('common.edit')}</Typography>
        </Breadcrumbs>
      </Box>

      <AttributeOptionForm 
        defaultValues={{
          attribute: attributeId,
          option_label: attributeOption.option_label || '',
          option_value: attributeOption.option_value || '',
          sort_order: attributeOption.sort_order || 0
        }}
        onSubmit={handleSubmit} 
        isSubmitting={isUpdating} 
        attributeId={attributeId}
      />
    </Container>
  );
}
