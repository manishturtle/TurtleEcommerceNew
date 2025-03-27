"use client";

/**
 * Pricing Index Page
 * 
 * This page serves as a navigation hub for all pricing-related pages
 */
import React from 'react';
import { Typography, Box, Container, Grid, Paper, Breadcrumbs, Link } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import GroupIcon from '@mui/icons-material/Group';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PublicIcon from '@mui/icons-material/Public';
import PercentIcon from '@mui/icons-material/Percent';
import ReceiptIcon from '@mui/icons-material/Receipt';

export default function PricingIndexPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const sections = [
    {
      title: t('pricing.customerGroups'),
      description: t('pricing.customerGroups.description'),
      icon: <GroupIcon fontSize="large" color="primary" />,
      path: '/Masters/pricing/customer-groups'
    },
    {
      title: t('pricing.sellingChannels'),
      description: t('pricing.sellingChannels.description'),
      icon: <StorefrontIcon fontSize="large" color="primary" />,
      path: '/Masters/pricing/selling-channels'
    },
    {
      title: t('pricing.taxRegions'),
      description: t('pricing.taxRegions.description'),
      icon: <PublicIcon fontSize="large" color="primary" />,
      path: '/Masters/pricing/tax-regions'
    },
    {
      title: t('pricing.taxRates'),
      description: t('pricing.taxRates.description'),
      icon: <PercentIcon fontSize="large" color="primary" />,
      path: '/Masters/pricing/tax-rates'
    },
    {
      title: t('pricing.taxRateProfiles'),
      description: t('pricing.taxRateProfiles.description'),
      icon: <ReceiptIcon fontSize="large" color="primary" />,
      path: '/Masters/pricing/tax-rate-profiles'
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('common.pricing')}
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href="/Masters">
            {t('common.masters')}
          </Link>
          <Typography color="textPrimary">{t('common.pricing')}</Typography>
        </Breadcrumbs>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
          {t('pricing.indexDescription')}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {sections.map((section) => (
          <Grid item xs={12} md={4} key={section.path}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6
                }
              }}
              onClick={() => router.push(section.path)}
            >
              <Box sx={{ mb: 2 }}>{section.icon}</Box>
              <Typography variant="h6" component="h2" gutterBottom>
                {section.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {section.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
