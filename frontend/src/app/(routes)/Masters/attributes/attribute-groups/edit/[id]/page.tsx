"use client";

/**
 * Edit Attribute Group Page
 */
import React from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Box, CircularProgress, Container, Breadcrumbs, Link } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useFetchAttributeGroup, useUpdateAttributeGroup } from '@/app/hooks/api/attributes';
import AttributeGroupForm from '@/app/components/admin/attributes/forms/AttributeGroupForm';
import { AttributeGroupFormValues } from '@/app/components/admin/attributes/schemas';
import { toast } from 'react-hot-toast';

interface EditAttributeGroupPageProps {
  params: {
    id: string;
  };
}

export default function EditAttributeGroupPage({ params }: EditAttributeGroupPageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const id = parseInt(params.id, 10);
  
  const { data: attributeGroup, isLoading } = useFetchAttributeGroup(id);
  const { mutate: updateAttributeGroup, isPending: isUpdating } = useUpdateAttributeGroup();

  const handleSubmit = (data: AttributeGroupFormValues) => {
    if (!attributeGroup) return;
    
    updateAttributeGroup(
      { 
        ...attributeGroup,
        ...data
      },
      {
        onSuccess: () => {
          toast.success(t('attributes.attributeGroup.updateSuccess'));
          router.push('/Masters/attributes/attribute-groups');
        },
        onError: (error) => {
          console.error('Error updating attribute group:', error);
          toast.error(t('attributes.attributeGroup.updateError'));
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

  if (!attributeGroup) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          {t('attributes.attributeGroup.notFound')}
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('attributes.attributeGroup.edit')}
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
          <Typography color="textPrimary">{t('common.edit')}</Typography>
        </Breadcrumbs>
      </Box>

      <AttributeGroupForm 
        defaultValues={{
          name: attributeGroup.name,
          display_order: attributeGroup.display_order,
          is_active: attributeGroup.is_active
        }}
        onSubmit={handleSubmit} 
        isSubmitting={isUpdating} 
      />
    </Container>
  );
}
