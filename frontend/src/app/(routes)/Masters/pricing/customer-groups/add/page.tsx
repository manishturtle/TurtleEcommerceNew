"use client";

/**
 * Add Customer Group Page
 */
import React from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Box, Container, Breadcrumbs, Link } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCreateCustomerGroup } from '@/app/hooks/api/pricing';
import CustomerGroupForm from '@/app/components/admin/pricing/forms/CustomerGroupForm';
import { CustomerGroupFormValues } from '@/app/components/admin/pricing/schemas';
import { toast } from 'react-hot-toast';

export default function AddCustomerGroupPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutate: createCustomerGroup, isPending } = useCreateCustomerGroup();

  const handleSubmit = (data: CustomerGroupFormValues) => {
    createCustomerGroup(data, {
      onSuccess: () => {
        toast.success(t('pricing.customerGroup.createSuccess'));
        router.push('/Masters/pricing/customer-groups');
      },
      onError: (error) => {
        console.error('Error creating customer group:', error);
        toast.error(t('pricing.customerGroup.createError'));
      }
    });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('pricing.customerGroup.addNew')}
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
          <Typography color="textPrimary">{t('common.add')}</Typography>
        </Breadcrumbs>
      </Box>

      <CustomerGroupForm onSubmit={handleSubmit} isSubmitting={isPending} />
    </Container>
  );
}
