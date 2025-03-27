/**
 * Divisions Listing Page
 * 
 * Page component for listing, filtering, and managing divisions
 */
'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  Alert,
  Tooltip
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useFetchDivisions, useDeleteDivision } from '@/app/hooks/api/catalogue';
import DeleteConfirmationDialog from '@/app/components/admin/catalogue/DeleteConfirmationDialog';
import { Division, CatalogueFilter } from '@/app/types/catalogue';
import { formatDate, formatDateTime } from '@/app/utils/dateUtils';
import Loader from '@/app/components/common/Loader';
import Notification from '@/app/components/common/Notification';
import useNotification from '@/app/hooks/useNotification';

const DivisionsPage = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<CatalogueFilter>({
    search: '',
    is_active: undefined
  });
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [divisionToDelete, setDivisionToDelete] = useState<Division | null>(null);
  
  // Fetch divisions with filters
  const { data, isLoading, isError, error } = useFetchDivisions(filters);
  console.log("wwwwwwwwwwwww",data)
  
  // Add more detailed debugging for the first item if available
  if (data && data.length > 0) {
    console.log("First item created_by:", data[0].created_by);
    console.log("First item updated_by:", data[0].updated_by);
  }
  
  // Process data to add username fields directly
  const processedData = useMemo(() => {
    if (!data) return [];
    
    return data.map(item => ({
      ...item,
      createdByUsername: item.created_by?.username || 'N/A',
      updatedByUsername: item.updated_by?.username || 'N/A',
      formattedCreatedAt: formatDateTime(item.created_at),
      formattedUpdatedAt: formatDateTime(item.updated_at)
    }));
  }, [data]);
  
  // Notification state
  const { 
    notification, 
    showSuccess, 
    showError, 
    hideNotification 
  } = useNotification();

  // Delete division mutation
  const { mutate: deleteDivision, isPending: isDeleting } = useDeleteDivision();
  

  
  // Handle delete button click
  const handleDeleteClick = (division: Division) => {
    setDivisionToDelete(division);
    setDeleteDialogOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (divisionToDelete) {
      deleteDivision(divisionToDelete.id, {
        onSuccess: () => {
          showSuccess(t('catalogue.division.deleteSuccess'));
          setDeleteDialogOpen(false);
          setDivisionToDelete(null);
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
      headerName: 'ID', 
      width: 70 
    },
    { 
      field: 'actions', 
      headerName: t('catalogue.actions'), 
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Division>) => (
        <Box>
          <Tooltip title={t('edit')}>
            <IconButton 
              component={Link} 
              href={`/Masters/catalogue/divisions/${params.row.id}/edit`}
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
    },
    { 
      field: 'name', 
      headerName: t('name'), 
      flex: 1,
      minWidth: 150
    },
    { 
      field: 'description', 
      headerName: t('description'), 
      flex: 2,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<Division>) => (
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
    },
    { 
      field: 'formattedCreatedAt', 
      headerName: t('createdAt'), 
      width: 180
    },
    { 
      field: 'createdByUsername', 
      headerName: t('createdBy'), 
      width: 150
    },
    { 
      field: 'formattedUpdatedAt', 
      headerName: t('updatedAt'), 
      width: 180
    },
    { 
      field: 'updatedByUsername', 
      headerName: t('updatedBy'), 
      width: 150
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">{t('catalogue.divisions')}</Typography>
        <Button
          component={Link}
          href="/Masters/catalogue/divisions/add"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          {t('catalogue.addDivision')}
        </Button>
      </Box>
      
      {/* Error message */}
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error instanceof Error ? error.message : t('error')}
        </Alert>
      )}

      {/* Loading indicator */}
      {isLoading && <Loader message={t('catalogue.loading')} />}
      
      {/* Data grid */}
      {!isLoading && (
        <Paper sx={{ width: '100%' }}>
          <DataGrid
            rows={Array.isArray(processedData) ? processedData : []}
            columns={columns}
            loading={false}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
              columns: {
                columnVisibilityModel: {
                  id: true,
                  actions: true,
                  name: true,
                  description: true,
                  is_active: true,
                  formattedCreatedAt: true,
                  createdByUsername: true,
                  formattedUpdatedAt: true,
                  updatedByUsername: true
                }
              }
            }}
            slots={{
              toolbar: GridToolbar
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
              }
            }}
            getRowId={(row) => row.id}
            autoHeight
            density="comfortable"
            sx={{
              '& .MuiDataGrid-cell': {
              }
            }}
          />
        </Paper>
      )}
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        title={"Confirm Delete"}
        content={t('catalogue.division.deleteConfirmation')}
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

export default DivisionsPage;
