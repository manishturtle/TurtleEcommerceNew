"use client";

/**
 * Add Attribute Option Page
 */
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Typography, Box, Container, Breadcrumbs, Link } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCreateAttributeOption } from '@/app/hooks/api/attributes';
import AttributeOptionForm from '@/app/components/admin/attributes/forms/AttributeOptionForm';
import { AttributeOptionFormValues } from '@/app/components/admin/attributes/schemas';
import { toast } from 'react-hot-toast';

export default function AddAttributeOptionPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check if an attribute ID was passed in the URL
  const attributeId = searchParams.get('attributeId') 
    ? parseInt(searchParams.get('attributeId')!, 10) 
    : undefined;
  
  const { mutate: createAttributeOption, isPending } = useCreateAttributeOption();

  const handleSubmit = (data: AttributeOptionFormValues) => {
    createAttributeOption(data, {
      onSuccess: () => {
        toast.success(t('attributes.attributeOption.createSuccess'));
        // If we came from a specific attribute, redirect back to that attribute's options
        if (attributeId) {
          router.push(`/Masters/attributes/attribute-options?attributeId=${attributeId}`);
        } else {
          router.push('/Masters/attributes/attribute-options');
        }
      },
      onError: (error) => {
        console.error('Error creating attribute option:', error);
        toast.error(t('attributes.attributeOption.createError'));
      }
    });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('attributes.attributeOption.addNew')}
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
          <Typography color="textPrimary">{t('common.add')}</Typography>
        </Breadcrumbs>
      </Box>

      <AttributeOptionForm 
        onSubmit={handleSubmit} 
        isSubmitting={isPending} 
        attributeId={attributeId}
      />
    </Container>
  );
}
