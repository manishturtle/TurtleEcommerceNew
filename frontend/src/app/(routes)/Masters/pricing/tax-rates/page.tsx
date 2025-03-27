"use client";

/**
 * Tax Rates Listing Page
 */
import React from 'react';
import { Typography, Box, Button, Container, Paper, Breadcrumbs, Link } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { useFetchTaxRates, useDeleteTaxRate } from '@/app/hooks/api/pricing';
import { TaxRate } from '@/app/types/pricing';
import { toast } from 'react-hot-toast';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/app/components/common/ConfirmDialog';

export default function TaxRatesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = React.useState<{open: boolean, id: number | null}>({
    open: false,
    id: null
  });
  
  const { data: taxRatesData, isLoading } = useFetchTaxRates();
  const { mutate: deleteTaxRate, isPending: isDeleting } = useDeleteTaxRate();

  const handleEdit = (id: number) => {
    router.push(`/Masters/pricing/tax-rates/edit/${id}`);
  };

  const handleDelete = (id: number) => {
    setConfirmDelete({ open: true, id });
  };

  const confirmDeleteAction = () => {
    if (confirmDelete.id) {
      deleteTaxRate(confirmDelete.id, {
        onSuccess: () => {
          toast.success(t('pricing.taxRate.deleteSuccess'));
          setConfirmDelete({ open: false, id: null });
        },
        onError: (error) => {
          console.error('Error deleting tax rate:', error);
          toast.error(t('pricing.taxRate.deleteError'));
          setConfirmDelete({ open: false, id: null });
        }
      });
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: t('pricing.taxRate.name'), flex: 1 },
    { field: 'code', headerName: t('pricing.taxRate.code'), width: 150 },
    { 
      field: 'rate', 
      headerName: t('pricing.taxRate.rate'), 
      width: 150,
      valueFormatter: (params: { value: any }) => `${params.value}%`
    },
    { field: 'is_active', headerName: t('common.status'), width: 120,
      valueFormatter: (params: { value: any }) => params.value ? t('common.active') : t('common.inactive')
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 120,
      renderCell: (params: GridRenderCellParams<TaxRate>) => (
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
          {t('pricing.taxRates')}
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href="/Masters">
            {t('common.masters')}
          </Link>
          <Link color="inherit" href="/Masters/pricing">
            {t('common.pricing')}
          </Link>
          <Typography color="textPrimary">{t('pricing.taxRates')}</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => router.push('/Masters/pricing/tax-rates/add')}
        >
          {t('common.add')}
        </Button>
      </Box>

      <Paper elevation={2}>
        <DataGrid
          rows={taxRatesData?.results || []}
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
        title={t('pricing.taxRate.deleteConfirmTitle')}
        content={t('pricing.taxRate.deleteConfirmMessage')}
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
        isLoading={isDeleting}
      />
    </Container>
  );
}
