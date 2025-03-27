/**
 * Subcategories Listing Page
 * 
 * Page component for listing, filtering, and managing subcategories
 */
'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  IconButton,
  Chip,
  Alert,
  Grid,
  FormControlLabel,
  Switch,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useFetchSubcategories, useDeleteSubcategory, useFetchCategories } from '@/app/hooks/api/catalogue';
import DeleteConfirmationDialog from '@/app/components/admin/catalogue/DeleteConfirmationDialog';
import { Subcategory, CatalogueFilter, Category } from '@/app/types/catalogue';
import Loader from '@/app/components/common/Loader';
import Notification from '@/app/components/common/Notification';
import useNotification from '@/app/hooks/useNotification';
import { formatDateTime } from '@/app/utils/dateUtils';

const SubcategoriesPage = () => {
  const { t } = useTranslation();
  
  // State for filters
  const [filters, setFilters] = useState<CatalogueFilter>({});
  
  // State for search term
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<Subcategory | null>(null);
  
  // Notification state
  const { 
    notification, 
    showSuccess, 
    showError, 
    hideNotification 
  } = useNotification();
  
  // Fetch subcategories with filters
  const { 
    data, 
    isLoading: isLoadingSubcategories, 
    isError: isSubcategoriesError,
    error: subcategoriesError,
    refetch: refetchSubcategories
  } = useFetchSubcategories(filters);
  
  // Fetch categories for filtering
  const { 
    data: categories, 
    isLoading: isLoadingCategories 
  } = useFetchCategories();
  
  // Delete subcategory mutation
  const { 
    mutate: deleteSubcategory, 
    isPending: isDeleting,
    isError: isDeleteError,
    error: deleteError
  } = useDeleteSubcategory();
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value) {
      setFilters(prev => ({ ...prev, search: e.target.value }));
    } else {
      const { search, ...rest } = filters;
      setFilters(rest);
    }
  };
  
  // Handle category filter change
  const handleCategoryChange = (e: SelectChangeEvent<string>) => {
    setFilters(prev => ({
      ...prev,
      category: e.target.value === '' ? undefined : Number(e.target.value)
    }));
  };
  
  // Handle delete button click
  const handleDeleteClick = (subcategory: Subcategory) => {
    setSubcategoryToDelete(subcategory);
    setDeleteDialogOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (subcategoryToDelete) {
      deleteSubcategory(subcategoryToDelete.id, {
        onSuccess: () => {
          showSuccess(t('catalogue.subcategory.deleteSuccess'));
          setDeleteDialogOpen(false);
          refetchSubcategories();
        },
        onError: (error: unknown) => {
          showError(error instanceof Error ? error.message : t('error'));
        }
      });
    }
  };
  
  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };
  
  // DataGrid columns definition
  const columns: GridColDef[] = [
    { 
      field: 'id', 
      headerName: t('id'), 
      width: 70 
    },
    { 
      field: 'name', 
      headerName: t('name'), 
      width: 200,
      flex: 1
    },
    { 
      field: 'description', 
      headerName: t('description'), 
      width: 300,
      flex: 1
    },
    { 
      field: 'category_name', 
      headerName: t('catalogue.category'), 
      width: 200,
      valueGetter: (params: GridRenderCellParams<any>) => {
        return params.row.category?.name || '';
      }
    },
    { 
      field: 'is_active', 
      headerName: t('isActive'), 
      width: 120,
      renderCell: (params: GridRenderCellParams<any>) => (
        <Chip 
          label={params.row.is_active ? t('yes') : t('no')} 
          color={params.row.is_active ? 'success' : 'default'} 
          size="small"
        />
      )
    },
    { 
      field: 'created_at', 
      headerName: t('createdAt'), 
      width: 180,
    },
    { 
      field: 'created_by', 
      headerName: t('createdBy'), 
      width: 150,
      valueGetter: (params: GridRenderCellParams<any>) => {
        return params.row.created_by?.username || '';
      }
    },
    { 
      field: 'actions', 
      headerName: t('catalogue.actions'), 
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams<any>) => (
        <Box>
          <Tooltip title={t('edit')}>
            <IconButton 
              component={Link} 
              href={`/Masters/catalogue/subcategories/${params.row.id}/edit`}
              size="small"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('delete')}>
            <IconButton 
              onClick={() => handleDeleteClick(params.row as Subcategory)}
              size="small"
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {t('catalogue.subcategories')}
        </Typography>
        <Button 
          component={Link} 
          href="/Masters/catalogue/subcategories/add"
          variant="contained" 
          startIcon={<AddIcon />}
        >
          {t('add')}
        </Button>
      </Box>
      
      {/* Error alerts */}
      {isSubcategoriesError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {subcategoriesError instanceof Error ? subcategoriesError.message : t('error')}
        </Alert>
      )}
      
      {isDeleteError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {deleteError instanceof Error ? deleteError.message : t('error')}
        </Alert>
      )}
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label={t('search')}
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={t('catalogue.searchSubcategories')}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="category-filter-label">{t('catalogue.category')}</InputLabel>
              <Select
                labelId="category-filter-label"
                value={filters.category?.toString() || ''}
                onChange={handleCategoryChange}
                label={t('catalogue.category')}
              >
                <MenuItem value="">
                  <em>{t('all')}</em>
                </MenuItem>
                {categories?.results?.map((category: Category) => (
                  <MenuItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.is_active === true}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters({ ...filters, is_active: true });
                    } else {
                      const { is_active, ...rest } = filters;
                      setFilters(rest);
                    }
                  }}
                />
              }
              label={t('showOnlyActive')}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Data grid */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={data?.results || []}
          columns={columns}
          loading={isLoadingSubcategories || isLoadingCategories}
          slots={{
            loadingOverlay: () => <Loader fullScreen={false} />,
            toolbar: GridToolbar
          }}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </Paper>
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        title={t('catalogue.deleteSubcategory')}
        content={t('catalogue.deleteSubcategoryConfirmation', { name: subcategoryToDelete?.name })}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteDialogClose}
        isDeleting={isDeleting}
      />
      
      {/* Notification */}
      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={hideNotification}
      />
    </Box>
  );
};

export default SubcategoriesPage;
