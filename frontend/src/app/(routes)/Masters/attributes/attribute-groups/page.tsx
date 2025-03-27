"use client";

/**
 * Attribute Groups Listing Page
 */
import React from 'react';
import { Typography, Box, Button, Container, Paper, Breadcrumbs, Link } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { useFetchAttributeGroups, useDeleteAttributeGroup } from '@/app/hooks/api/attributes';
import { AttributeGroup } from '@/app/types/attributes';
import { toast } from 'react-hot-toast';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import ConfirmDialog from '@/app/components/common/ConfirmDialog';

export default function AttributeGroupsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = React.useState<{open: boolean, id: number | null}>({
    open: false,
    id: null
  });
  
  const { data: attributeGroupsData, isLoading } = useFetchAttributeGroups();
  const { mutate: deleteAttributeGroup, isPending: isDeleting } = useDeleteAttributeGroup();

  const handleEdit = (id: number) => {
    router.push(`/Masters/attributes/attribute-groups/edit/${id}`);
  };

  const handleDelete = (id: number) => {
    setConfirmDelete({ open: true, id });
  };

  const confirmDeleteAction = () => {
    if (confirmDelete.id) {
      deleteAttributeGroup(confirmDelete.id, {
        onSuccess: () => {
          toast.success(t('attributes.attributeGroup.deleteSuccess'));
          setConfirmDelete({ open: false, id: null });
        },
        onError: (error) => {
          console.error('Error deleting attribute group:', error);
          toast.error(t('attributes.attributeGroup.deleteError'));
          setConfirmDelete({ open: false, id: null });
        }
      });
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: t('attributes.attributeGroup.name'), flex: 1 },
    { field: 'display_order', headerName: t('attributes.attributeGroup.displayOrder'), width: 150 },
    { 
      field: 'is_active', 
      headerName: t('common.status'), 
      width: 120,
      renderCell: (params: GridRenderCellParams<AttributeGroup>) => (
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
      field: 'created_at', 
      headerName: t('common.createdAt'), 
      width: 180,
      valueFormatter: (params: { value: any }) => {
        return params.value ? format(new Date(params.value), 'PPpp') : '';
      }
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<AttributeGroup>) => (
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
            {t('attributes.attributeGroups')}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => router.push('/Masters/attributes/attribute-groups/add')}
          >
            {t('attributes.attributeGroup.addNew')}
          </Button>
        </Box>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href="/Masters">
            {t('common.masters')}
          </Link>
          <Link color="inherit" href="/Masters/attributes">
            {t('common.attributes')}
          </Link>
          <Typography color="textPrimary">{t('attributes.attributeGroups')}</Typography>
        </Breadcrumbs>
      </Box>

      <Paper elevation={2} sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={attributeGroupsData?.results || []}
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
        title={t('attributes.attributeGroup.confirmDelete')}
        content={t('attributes.attributeGroup.confirmDeleteMessage')}
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
        isLoading={isDeleting}
      />
    </Container>
  );
}
