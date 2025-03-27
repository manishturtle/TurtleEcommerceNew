"use client";

/**
 * Tax Rate Profiles Listing Page
 */
import React from 'react';
import { Typography, Box, Button, Container, Paper, Breadcrumbs, Link } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { useFetchTaxRateProfiles, useDeleteTaxRateProfile } from '@/app/hooks/api/pricing';
import { TaxRateProfile, TaxRate } from '@/app/types/pricing';
import { toast } from 'react-hot-toast';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/app/components/common/ConfirmDialog';

export default function TaxRateProfilesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = React.useState<{open: boolean, id: number | null}>({
    open: false,
    id: null
  });
  
  const { data: taxRateProfilesData, isLoading } = useFetchTaxRateProfiles();
  const { mutate: deleteTaxRateProfile, isPending: isDeleting } = useDeleteTaxRateProfile();

  const handleEdit = (id: number) => {
    router.push(`/Masters/pricing/tax-rate-profiles/edit/${id}`);
  };

  const handleDelete = (id: number) => {
    setConfirmDelete({ open: true, id });
  };

  const confirmDeleteAction = () => {
    if (confirmDelete.id) {
      deleteTaxRateProfile(confirmDelete.id, {
        onSuccess: () => {
          toast.success(t('pricing.taxRateProfile.deleteSuccess'));
          setConfirmDelete({ open: false, id: null });
        },
        onError: (error) => {
          console.error('Error deleting tax rate profile:', error);
          toast.error(t('pricing.taxRateProfile.deleteError'));
          setConfirmDelete({ open: false, id: null });
        }
      });
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: t('pricing.taxRateProfile.name'), flex: 1 },
    { field: 'code', headerName: t('pricing.taxRateProfile.code'), width: 150 },
    { 
      field: 'tax_rates', 
      headerName: t('pricing.taxRateProfile.taxRates'), 
      width: 200,
      valueGetter: (params: { value: any }) => {
        const taxRates = params.value as TaxRate[] | undefined;
        return taxRates?.map(rate => rate.name).join(', ') || '';
      }
    },
    { field: 'is_default', headerName: t('pricing.taxRateProfile.isDefault'), width: 120,
      valueFormatter: (params: { value: any }) => params.value ? t('common.yes') : t('common.no')
    },
    { field: 'is_active', headerName: t('common.status'), width: 120,
      valueFormatter: (params: { value: any }) => params.value ? t('common.active') : t('common.inactive')
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 120,
      renderCell: (params: GridRenderCellParams<TaxRateProfile>) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            size="small" 
            variant="outlined" 
            color="primary" 
            onClick={() => handleEdit(params.row.id)}
          >
            <EditIcon fontSize="small" />
          </Button>
          <Button 
            size="small" 
            variant="outlined" 
            color="error" 
            onClick={() => handleDelete(params.row.id)}
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          {t('pricing.taxRateProfiles')}
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href="/Masters">
            {t('common.masters')}
          </Link>
          <Link color="inherit" href="/Masters/pricing">
            {t('common.pricing')}
          </Link>
          <Typography color="textPrimary">{t('pricing.taxRateProfiles')}</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => router.push('/Masters/pricing/tax-rate-profiles/add')}
        >
          {t('common.add')}
        </Button>
      </Box>

      <Paper elevation={2}>
        <DataGrid
          rows={taxRateProfilesData?.results || []}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection={false}
          disableRowSelectionOnClick
          autoHeight
          loading={isLoading}
        />
      </Paper>

      <ConfirmDialog 
        open={confirmDelete.open}
        title={t('pricing.taxRateProfile.deleteConfirmTitle')}
        content={t('pricing.taxRateProfile.deleteConfirmMessage')}
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
        isLoading={isDeleting}
      />
    </Container>
  );
}
