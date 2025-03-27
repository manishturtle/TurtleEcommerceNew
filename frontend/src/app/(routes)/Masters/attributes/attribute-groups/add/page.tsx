"use client";

/**
 * Add Attribute Group Page
 */
import React from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Box, Paper, Breadcrumbs, Link, Container } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCreateAttributeGroup } from '@/app/hooks/api/attributes';
import AttributeGroupForm from '@/app/components/admin/attributes/forms/AttributeGroupForm';
import { AttributeGroupFormValues } from '@/app/components/admin/attributes/schemas';
import { toast } from 'react-hot-toast';

export default function AddAttributeGroupPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutate: createAttributeGroup, isPending } = useCreateAttributeGroup();

  const handleSubmit = (data: AttributeGroupFormValues) => {
    createAttributeGroup(data, {
      onSuccess: () => {
        toast.success(t('attributes.attributeGroup.createSuccess'));
        router.push('/Masters/attributes/attribute-groups');
      },
      onError: (error) => {
        console.error('Error creating attribute group:', error);
        toast.error(t('attributes.attributeGroup.createError'));
      }
    });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('attributes.attributeGroup.addNew')}
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href="/Masters">
            {t('common.masters')}
          </Link>
          <Link color="inherit" href="/Masters/attributes">
            {t('common.attributes')}
          </Link>
          <Link color="inherit" href="/Masters/attributes/attribute-groups">
            {t('attributes.attributeGroups')}
          </Link>
          <Typography color="textPrimary">{t('common.add')}</Typography>
        </Breadcrumbs>
      </Box>

      <AttributeGroupForm onSubmit={handleSubmit} isSubmitting={isPending} />
    </Container>
  );
}
