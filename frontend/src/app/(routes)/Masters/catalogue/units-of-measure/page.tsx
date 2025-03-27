/**
 * Units of Measure Listing Page
 * 
 * Page component for listing, filtering, and managing units of measure
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
  CircularProgress,
  Alert,
  Grid,
  FormControlLabel,
  Switch,
  Tooltip
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
  GridLoadingOverlay
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useFetchUnitOfMeasures, useDeleteUnitOfMeasure } from '@/app/hooks/api/catalogue';
import DeleteConfirmationDialog from '@/app/components/admin/catalogue/DeleteConfirmationDialog';
import { UnitOfMeasure, CatalogueFilter } from '@/app/types/catalogue';

// Custom loading overlay component
const CustomLoadingOverlay = () => {
  return (
    <GridLoadingOverlay sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <CircularProgress />
    </GridLoadingOverlay>
  );
};

const UnitsOfMeasurePage = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<CatalogueFilter>({
    search: '',
    is_active: undefined
  });
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<UnitOfMeasure | null>(null);
  
  // Fetch units of measure with filters
  const { data, isLoading, isError, error } = useFetchUnitOfMeasures(filters);
  
  // Delete unit of measure mutation
  const { mutate: deleteUnitOfMeasure, isPending: isDeleting } = useDeleteUnitOfMeasure();
  
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
  
  // Handle delete button click
  const handleDeleteClick = (unit: UnitOfMeasure) => {
    setUnitToDelete(unit);
    setDeleteDialogOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (unitToDelete) {
      deleteUnitOfMeasure(unitToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setUnitToDelete(null);
        }
      });
    }
  };
  
  // DataGrid columns definition
  const columns: GridColDef[] = [
    { 
      field: 'name', 
      headerName: t('name'), 
      flex: 1,
      minWidth: 150
    },
    { 
      field: 'symbol', 
      headerName: t('catalogue.symbol'), 
      width: 120
    },
    { 
      field: 'description', 
      headerName: t('description'), 
      flex: 2,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<UnitOfMeasure>) => (
        <Tooltip title={params.value || ''}>
          <Typography variant="body2" sx={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%'
          }}>
            {params.value}
          </Typography>
        </Tooltip>
      )
    },
    { 
      field: 'is_active', 
      headerName: t('catalogue.active'), 
      width: 120,
      renderCell: (params: GridRenderCellParams<UnitOfMeasure>) => (
        <Chip 
          label={params.value ? t('yes') : t('no')} 
          color={params.value ? 'success' : 'default'} 
          size="small"
        />
      )
    },
    { 
      field: 'actions', 
      headerName: t('catalogue.actions'), 
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams<UnitOfMeasure>) => (
        <Box>
          <Tooltip title={t('edit')}>
            <IconButton 
              component={Link} 
              href={`/Masters/catalogue/units-of-measure/${params.row.id}/edit`}
              size="small"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('delete')}>
            <IconButton 
              onClick={() => handleDeleteClick(params.row)}
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
        <Typography variant="h4">{t('catalogue.unitOfMeasures')}</Typography>
        <Button
          component={Link}
          href="/Masters/catalogue/units-of-measure/add"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          {t('catalogue.addUnitOfMeasure')}
        </Button>
      </Box>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              label={t('search')}
              variant="outlined"
              fullWidth
              value={filters.search}
              onChange={handleSearchChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
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
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error instanceof Error ? error.message : t('error')}
        </Alert>
      )}
      
      {/* Data grid */}
      <Paper sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={data?.results || []}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } }
          }}
          slots={{
            toolbar: GridToolbar,
            loadingOverlay: CustomLoadingOverlay
          }}
        />
      </Paper>
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        title={t('delete')}
        message={t('catalogue.confirmDeleteUnitOfMeasure')}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </Box>
  );
};

export default UnitsOfMeasurePage;
