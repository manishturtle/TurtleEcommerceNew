"use client";

/**
 * Tax Regions Listing Page
 */
import React from 'react';
import { Typography, Box, Button, Container, Paper, Breadcrumbs, Link } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { useFetchTaxRegions, useDeleteTaxRegion } from '@/app/hooks/api/pricing';
import { TaxRegion, Country } from '@/app/types/pricing';
import { toast } from 'react-hot-toast';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/app/components/common/ConfirmDialog';

export default function TaxRegionsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = React.useState<{open: boolean, id: number | null}>({
    open: false,
    id: null
  });
  
  const { data: taxRegionsData, isLoading } = useFetchTaxRegions();
  const { mutate: deleteTaxRegion, isPending: isDeleting } = useDeleteTaxRegion();

  const handleEdit = (id: number) => {
    router.push(`/Masters/pricing/tax-regions/edit/${id}`);
  };

  const handleDelete = (id: number) => {
    setConfirmDelete({ open: true, id });
  };

  const confirmDeleteAction = () => {
    if (confirmDelete.id) {
      deleteTaxRegion(confirmDelete.id, {
        onSuccess: () => {
          toast.success(t('pricing.taxRegion.deleteSuccess'));
          setConfirmDelete({ open: false, id: null });
        },
        onError: (error) => {
          console.error('Error deleting tax region:', error);
          toast.error(t('pricing.taxRegion.deleteError'));
          setConfirmDelete({ open: false, id: null });
        }
      });
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: t('pricing.taxRegion.name'), flex: 1 },
    { field: 'code', headerName: t('pricing.taxRegion.code'), width: 150 },
    { 
      field: 'countries', 
      headerName: t('pricing.taxRegion.countries'), 
      width: 200,
      valueGetter: (params: { value: any }) => {
        const countries = params.value as Country[] | undefined;
        return countries?.map(country => country.name).join(', ') || '';
      }
    },
    { field: 'is_active', headerName: t('common.status'), width: 120,
      valueFormatter: (params: { value: any }) => params.value ? t('common.active') : t('common.inactive')
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 120,
      renderCell: (params: GridRenderCellParams<TaxRegion>) => (
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
          {t('pricing.taxRegions')}
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href="/Masters">
            {t('common.masters')}
          </Link>
          <Link color="inherit" href="/Masters/pricing">
            {t('common.pricing')}
          </Link>
          <Typography color="textPrimary">{t('pricing.taxRegions')}</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => router.push('/Masters/pricing/tax-regions/add')}
        >
          {t('common.add')}
        </Button>
      </Box>

      <Paper elevation={2}>
        <DataGrid
          rows={taxRegionsData?.results || []}
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
        title={t('pricing.taxRegion.deleteConfirmTitle')}
        content={t('pricing.taxRegion.deleteConfirmMessage')}
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
        isLoading={isDeleting}
      />
    </Container>
  );
}
