"use client";

/**
 * Edit Customer Group Page
 */
import React from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Box, CircularProgress, Container, Breadcrumbs, Link } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useFetchCustomerGroup, useUpdateCustomerGroup } from '@/app/hooks/api/pricing';
import CustomerGroupForm from '@/app/components/admin/pricing/forms/CustomerGroupForm';
import { CustomerGroupFormValues } from '@/app/components/admin/pricing/schemas';
import { toast } from 'react-hot-toast';

interface EditCustomerGroupPageProps {
  params: {
    id: string;
  };
}

export default function EditCustomerGroupPage({ params }: EditCustomerGroupPageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const id = parseInt(params.id, 10);
  
  const { data: customerGroup, isLoading } = useFetchCustomerGroup(id);
  const { mutate: updateCustomerGroup, isPending: isUpdating } = useUpdateCustomerGroup();

  const handleSubmit = (data: CustomerGroupFormValues) => {
    if (!customerGroup) return;
    
    updateCustomerGroup(
      { 
        ...customerGroup,
        ...data
      },
      {
        onSuccess: () => {
          toast.success(t('pricing.customerGroup.updateSuccess'));
          router.push('/Masters/pricing/customer-groups');
        },
        onError: (error) => {
          console.error('Error updating customer group:', error);
          toast.error(t('pricing.customerGroup.updateError'));
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

  if (!customerGroup) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          {t('pricing.customerGroup.notFound')}
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('pricing.customerGroup.edit')}
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href="/Masters">
            {t('common.masters')}
          </Link>
          <Link color="inherit" href="/Masters/pricing">
            {t('common.pricing')}
          </Link>
          <Link color="inherit" href="/Masters/pricing/customer-groups">
            {t('pricing.customerGroups')}
          </Link>
          <Typography color="textPrimary">{t('common.edit')}</Typography>
        </Breadcrumbs>
      </Box>

      <CustomerGroupForm 
        defaultValues={{
          name: customerGroup.name,
          code: customerGroup.code,
          description: customerGroup.description || '',
          is_active: customerGroup.is_active
        }}
        onSubmit={handleSubmit} 
        isSubmitting={isUpdating} 
      />
    </Container>
  );
}
