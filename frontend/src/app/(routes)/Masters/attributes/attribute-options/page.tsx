"use client";

/**
 * Attribute Options Listing Page
 */
import React, { useState } from 'react';
import { Typography, Box, Button, Container, Paper, Breadcrumbs, Link, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { useFetchAttributeOptions, useDeleteAttributeOption, useFetchAttributes } from '@/app/hooks/api/attributes';
import { AttributeOption, AttributeDataType } from '@/app/types/attributes';
import { toast } from 'react-hot-toast';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import ConfirmDialog from '@/app/components/common/ConfirmDialog';

export default function AttributeOptionsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedAttributeId, setSelectedAttributeId] = useState<number | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<{open: boolean, id: number | null}>({
    open: false,
    id: null
  });
  
  // Fetch attributes for the filter dropdown (only SELECT and MULTI_SELECT types)
  const { data: attributesData, isLoading: isLoadingAttributes } = useFetchAttributes({
    data_type: [AttributeDataType.SELECT, AttributeDataType.MULTI_SELECT].join(',')
  });
  
  // Fetch attribute options, filtered by attribute if one is selected
  const { data: attributeOptionsData, isLoading } = useFetchAttributeOptions(selectedAttributeId);
  const { mutate: deleteAttributeOption, isPending: isDeleting } = useDeleteAttributeOption();

  const handleEdit = (id: number) => {
    router.push(`/Masters/attributes/attribute-options/edit/${id}`);
  };

  const handleDelete = (id: number) => {
    setConfirmDelete({ open: true, id });
  };

  const confirmDeleteAction = () => {
    if (confirmDelete.id) {
      deleteAttributeOption(confirmDelete.id, {
        onSuccess: () => {
          toast.success(t('attributes.attributeOption.deleteSuccess'));
          setConfirmDelete({ open: false, id: null });
        },
        onError: (error) => {
          console.error('Error deleting attribute option:', error);
          toast.error(t('attributes.attributeOption.deleteError'));
          setConfirmDelete({ open: false, id: null });
        }
      });
    }
  };

  const handleAttributeChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setSelectedAttributeId(value === 'all' ? undefined : Number(value));
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { 
      field: 'attribute', 
      headerName: t('attributes.attributeOption.attribute'), 
      width: 200,
      valueGetter: (params: { value: any; row: any }) => {
        // Handle both direct attribute ID and attribute object
        if (typeof params.value === 'number') {
          const attribute = attributesData?.results?.find(a => a.id === params.value);
          // Extract only the simple name without any prefixes
          return attribute?.name ? attribute.name.split('.').pop() || attribute.name : params.value;
        }
        // Extract only the simple name without any prefixes
        return params.value?.name ? params.value.name.split('.').pop() || params.value.name : '';
      }
    },
    { field: 'option_label', headerName: t('attributes.attributeOption.optionLabel'), flex: 1 },
    { field: 'option_value', headerName: t('attributes.attributeOption.optionValue'), width: 200 },
    { field: 'sort_order', headerName: t('attributes.attributeOption.sortOrder'), width: 120 },
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
      renderCell: (params: GridRenderCellParams<AttributeOption>) => (
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
            {t('attributes.attributeOptions')}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => router.push('/Masters/attributes/attribute-options/add')}
          >
            {t('attributes.attributeOption.addNew')}
          </Button>
        </Box>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href="/Masters">
            {t('common.masters')}
          </Link>
          <Link color="inherit" href="/Masters/attributes">
            {t('common.attributes')}
          </Link>
          <Typography color="textPrimary">{t('attributes.attributeOptions')}</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel id="attribute-filter-label">{t('attributes.attributeOption.filterByAttribute')}</InputLabel>
          <Select
            labelId="attribute-filter-label"
            value={selectedAttributeId?.toString() || 'all'}
            onChange={handleAttributeChange}
            label={t('attributes.attributeOption.filterByAttribute')}
          >
            <MenuItem value="all">{t('common.all')}</MenuItem>
            {attributesData?.results?.map((attribute) => (
              <MenuItem key={attribute.id} value={attribute.id.toString()}>
                {attribute.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={2} sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={attributeOptionsData?.results || []}
          columns={columns}
          loading={isLoading || isLoadingAttributes}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
        />
      </Paper>

      <ConfirmDialog
        open={confirmDelete.open}
        title={t('attributes.attributeOption.confirmDelete')}
        content={t('attributes.attributeOption.confirmDeleteMessage')}
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
        isLoading={isDeleting}
      />
    </Container>
  );
}
