"use client";

/**
 * Attributes Listing Page
 */
import React from 'react';
import { Typography, Box, Button, Container, Paper, Breadcrumbs, Link, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { useFetchAttributes, useDeleteAttribute } from '@/app/hooks/api/attributes';
import { Attribute, AttributeDataType } from '@/app/types/attributes';
import { toast } from 'react-hot-toast';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import ConfirmDialog from '@/app/components/common/ConfirmDialog';

export default function AttributesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = React.useState<{open: boolean, id: number | null}>({
    open: false,
    id: null
  });
  
  const { data: attributesData, isLoading } = useFetchAttributes();
  const { mutate: deleteAttribute, isPending: isDeleting } = useDeleteAttribute();

  const handleEdit = (id: number) => {
    router.push(`/Masters/attributes/attributes/edit/${id}`);
  };

  const handleDelete = (id: number) => {
    setConfirmDelete({ open: true, id });
  };

  const confirmDeleteAction = () => {
    if (confirmDelete.id) {
      deleteAttribute(confirmDelete.id, {
        onSuccess: () => {
          toast.success(t('attributes.attribute.deleteSuccess'));
          setConfirmDelete({ open: false, id: null });
        },
        onError: (error) => {
          console.error('Error deleting attribute:', error);
          toast.error(t('attributes.attribute.deleteError'));
          setConfirmDelete({ open: false, id: null });
        }
      });
    }
  };

  // Helper function to get data type label
  const getDataTypeLabel = (dataType: AttributeDataType) => {
    switch (dataType) {
      case AttributeDataType.TEXT:
        return t('attributes.dataTypes.text');
      case AttributeDataType.NUMBER:
        return t('attributes.dataTypes.number');
      case AttributeDataType.BOOLEAN:
        return t('attributes.dataTypes.boolean');
      case AttributeDataType.DATE:
        return t('attributes.dataTypes.date');
      case AttributeDataType.SELECT:
        return t('attributes.dataTypes.select');
      case AttributeDataType.MULTI_SELECT:
        return t('attributes.dataTypes.multiSelect');
      default:
        return dataType;
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: t('attributes.attribute.name'), flex: 1 },
    { field: 'code', headerName: t('attributes.attribute.code'), width: 150 },
    { 
      field: 'data_type', 
      headerName: t('attributes.attribute.dataType'), 
      width: 150,
      renderCell: (params: GridRenderCellParams<Attribute>) => (
        <Chip 
          label={getDataTypeLabel(params.value)} 
          color="primary" 
          variant="outlined" 
        />
      )
    },
    { 
      field: 'is_variant_attribute', 
      headerName: t('attributes.attribute.isVariantAttribute'), 
      width: 150,
      renderCell: (params: GridRenderCellParams<Attribute>) => (
        params.value ? 
          <Chip label={t('common.yes')} color="success" size="small" /> : 
          <Chip label={t('common.no')} color="default" size="small" />
      )
    },
    { 
      field: 'is_active', 
      headerName: t('common.status'), 
      width: 120,
      renderCell: (params: GridRenderCellParams<Attribute>) => (
        <Box sx={{ 
          bgcolor: params.value ? 'success.main' : 'error.main',
          color: 'white',
          px: 2,
          py: 0.5,
          borderRadius: 1
        }}>
          {params.value ? t('common.active') : t('common.inactive')}
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Attribute>) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => handleEdit(params.row.id)}
          >
            {t('common.edit')}
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => handleDelete(params.row.id)}
          >
            {t('common.delete')}
          </Button>
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            {t('attributes.attributes')}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => router.push('/Masters/attributes/attributes/add')}
          >
            {t('attributes.attribute.addNew')}
          </Button>
        </Box>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href="/Masters">
            {t('common.masters')}
          </Link>
          <Link color="inherit" href="/Masters/attributes">
            {t('common.attributes')}
          </Link>
          <Typography color="textPrimary">{t('attributes.attributes')}</Typography>
        </Breadcrumbs>
      </Box>

      <Paper elevation={2} sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={attributesData?.results || []}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
        />
      </Paper>

      <ConfirmDialog
        open={confirmDelete.open}
        title={t('attributes.attribute.confirmDelete')}
        content={t('attributes.attribute.confirmDeleteMessage')}
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
        isLoading={isDeleting}
      />
    </Container>
  );
}
