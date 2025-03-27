/**
 * Tenant Settings Page
 * 
 * This page displays and allows editing of tenant-specific system-wide settings.
 */
import React from 'react';
import { Box, Typography, Paper, Breadcrumbs, Link } from '@mui/material';
import TenantSettingsForm from '@/app/components/admin/settings/TenantSettingsForm';
import { Settings as SettingsIcon } from '@mui/icons-material';

export default function TenantSettingsPage() {
  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SettingsIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" gutterBottom>
            Tenant Settings
          </Typography>
          <Breadcrumbs aria-label="breadcrumb">
            <Link color="inherit" href="/admin">
              Admin
            </Link>
            <Link color="inherit" href="/admin/settings">
              Settings
            </Link>
            <Typography color="textPrimary">Tenant Settings</Typography>
          </Breadcrumbs>
        </Box>
      </Box>

      {/* Description */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1">
          Configure system-wide settings for your tenant. These settings affect how the entire application behaves,
          including tax calculations, currency display, and product SKU generation.
        </Typography>
      </Paper>

      {/* Settings Form */}
      <TenantSettingsForm />
    </Box>
  );
}
