/**
 * Categories Listing Page
 * 
 * Page component for listing, filtering, and managing categories
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
import { useFetchCategories, useDeleteCategory, useFetchDivisions } from '@/app/hooks/api/catalogue';
import DeleteConfirmationDialog from '@/app/components/admin/catalogue/DeleteConfirmationDialog';
import { Category, CatalogueFilter, Division } from '@/app/types/catalogue';
import Loader from '@/app/components/common/Loader';
import Notification from '@/app/components/common/Notification';
import useNotification from '@/app/hooks/useNotification';
import { formatDate, formatDateTime } from '@/app/utils/dateUtils';

const CategoriesPage = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<CatalogueFilter>({
    search: '',
    is_active: undefined,
    division: undefined
  });
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  // Notification state
  const { 
    notification, 
    showSuccess, 
    showError, 
    hideNotification 
  } = useNotification();

  // Fetch categories data
  const { 
    data, 
    isLoading: isLoadingCategories, 
    isError: isCategoriesError, 
    error: categoriesError 
  } = useFetchCategories(filters);
  
  // Fetch divisions for filter dropdown
  const { 
    data: divisions, 
    isLoading: isLoadingDivisions 
  } = useFetchDivisions();
  
  // Delete category mutation
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory();
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
  };
  
  // Handle active filter change
  const handleActiveFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ 
      ...filters, 
      is_active: e.target.checked ? true : undefined 
    });
  };
  
  // Handle division filter change
  const handleDivisionChange = (e: SelectChangeEvent<string>) => {
    setFilters(prev => ({
      ...prev,
      division: e.target.value === '' ? undefined : Number(e.target.value)
    }));
  };
  
  // Handle delete button click
  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id, {
        onSuccess: () => {
          showSuccess(t('catalogue.category.deleteSuccess'));
          setDeleteDialogOpen(false);
          setCategoryToDelete(null);
        },
        onError: (error: unknown) => {
          showError(error instanceof Error ? error.message : t('error'));
        }
      });
    }
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
      field: 'division_name', 
      headerName: t('catalogue.division'), 
      width: 200,
      valueGetter: (params: GridRenderCellParams<any>) => {
        return params.row.division?.name || '';
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
      field: 'actions', 
      headerName: t('catalogue.actions'), 
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams<any>) => (
        <Box>
          <Tooltip title={t('edit')}>
            <IconButton 
              component={Link} 
              href={`/Masters/catalogue/categories/${params.row.id}/edit`}
              size="small"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('delete')}>
            <IconButton 
              onClick={() => handleDeleteClick(params.row as Category)}
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">{t('catalogue.categories')}</Typography>
        <Button
          component={Link}
          href="/Masters/catalogue/categories/add"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          {t('catalogue.addCategory')}
        </Button>
      </Box>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label={t('search')}
              variant="outlined"
              fullWidth
              value={filters.search}
              onChange={handleSearchChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="division-filter-label">{t('catalogue.division')}</InputLabel>
              <Select
                labelId="division-filter-label"
                value={filters.division?.toString() || ''}
                onChange={handleDivisionChange}
                label={t('catalogue.division')}
              >
                <MenuItem value="">
                  <em>{t('all')}</em>
                </MenuItem>
                {divisions?.map((division: Division) => (
                  <MenuItem key={division.id} value={division.id.toString()}>
                    {division.name}
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
                  onChange={handleActiveFilterChange}
                />
              }
              label={t('catalogue.active')}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Error message */}
      {isCategoriesError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {categoriesError instanceof Error ? categoriesError.message : t('error')}
        </Alert>
      )}
      
      {/* Loading indicator */}
      {isLoadingCategories && <Loader message={t('catalogue.loading')} />}
      
      {/* Data grid */}
      {!isLoadingCategories && (
        <Paper sx={{ width: '100%' }}>
          <DataGrid
            rows={data?.results || []}
            columns={columns}
            loading={false}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } }
            }}
            slots={{
              toolbar: GridToolbar
            }}
          />
        </Paper>
      )}
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        title={t('catalogue.category.deleteTitle')}
        content={t('catalogue.category.deleteConfirmation')}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
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

export default CategoriesPage;
