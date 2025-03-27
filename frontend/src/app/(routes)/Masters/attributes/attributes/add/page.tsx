"use client";
/**
 * Add Attribute Page
 */
import React from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Box, Container, Breadcrumbs, Link } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCreateAttribute } from '@/app/hooks/api/attributes';
import AttributeForm from '@/app/components/admin/attributes/forms/AttributeForm';
import { AttributeFormValues } from '@/app/components/admin/attributes/schemas';
import { toast } from 'react-hot-toast';

export default function AddAttributePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutate: createAttribute, isPending } = useCreateAttribute();

  const handleSubmit = (data: AttributeFormValues) => {
    createAttribute(data, {
      onSuccess: () => {
        toast.success(t('attributes.attribute.createSuccess'));
        router.push('/Masters/attributes/attributes');
      },
      onError: (error) => {
        console.error('Error creating attribute:', error);
        toast.error(t('attributes.attribute.createError'));
      }
    });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('attributes.attribute.addNew')}
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
          <Typography color="textPrimary">{t('common.add')}</Typography>
        </Breadcrumbs>
      </Box>

      <AttributeForm onSubmit={handleSubmit} isSubmitting={isPending} />
    </Container>
  );
}
