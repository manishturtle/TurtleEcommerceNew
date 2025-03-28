import React from 'react';
import { 
  DataGrid, 
  GridColDef, 
  GridRowSelectionModel,
  GridPaginationModel,
  GridRowParams,
  GridCallbackDetails,
  GridToolbar
} from '@mui/x-data-grid';
import { Box } from '@mui/material';

interface CustomDataGridProps {
  rows: any[];
  columns: GridColDef[];
  paginationModel?: GridPaginationModel;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  pageSizeOptions?: number[];
  rowSelectionModel?: GridRowSelectionModel;
  onRowSelectionModelChange?: (
    rowSelectionModel: GridRowSelectionModel,
    details: GridCallbackDetails
  ) => void;
  onRowClick?: (params: GridRowParams) => void;
  loading?: boolean;
  checkboxSelection?: boolean;
  disableRowSelectionOnClick?: boolean;
  autoHeight?: boolean;
  getRowId?: (row: any) => string | number;
  className?: string;
  hideToolbar?: boolean;
}

const CustomDataGrid: React.FC<CustomDataGridProps> = ({
  rows,
  columns,
  paginationModel,
  onPaginationModelChange,
  pageSizeOptions = [5, 10, 20],
  rowSelectionModel,
  onRowSelectionModelChange,
  onRowClick,
  loading = false,
  checkboxSelection = false,
  disableRowSelectionOnClick = false,
  autoHeight = true,
  getRowId,
  className,
  hideToolbar = false
}) => {
  return (
    <DataGrid
      rows={rows}
      columns={columns}
      paginationModel={paginationModel}
      onPaginationModelChange={onPaginationModelChange}
      pageSizeOptions={pageSizeOptions}
      autoHeight={autoHeight}
      checkboxSelection={checkboxSelection}
      disableRowSelectionOnClick={disableRowSelectionOnClick}
      rowSelectionModel={rowSelectionModel}
      onRowSelectionModelChange={onRowSelectionModelChange}
      onRowClick={onRowClick}
      loading={loading}
      getRowId={getRowId}
      className={className}
      slots={{
        toolbar: hideToolbar ? undefined : GridToolbar,
      }}
      slotProps={{
        toolbar: {
          showQuickFilter: true,
          quickFilterProps: { debounceMs: 500 },
        },
      }}
      sx={{
        '& .MuiDataGrid-root': {
          border: 'none',
        },
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid',
          borderColor: 'divider',
          padding: '0px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid',
          borderColor: 'divider',
        },
        '& .MuiDataGrid-virtualScroller': {
          backgroundColor: '#fff',
        },
        '& .MuiDataGrid-cell:focus': {
          outline: 'none',
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
        '& .MuiDataGrid-columnHeader': {
          color: 'text.secondary',
          fontWeight: 600,
          fontSize: '0.875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        },
        '& .MuiDataGrid-footerContainer': {
          borderTop: '1px solid',
          borderColor: 'divider',
        },
        '& .MuiDataGrid-columnHeaderCheckbox .MuiDataGrid-columnHeaderTitleContainer': {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '0px'
        },
        '& .MuiDataGrid-checkboxInput': {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '2px'
        },
        '& .MuiCheckbox-root': {
          padding: '0px'
        },
        '& .MuiDataGrid-toolbarContainer': {
          padding: '8px',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid',
          borderColor: 'divider',
        },
        '& .MuiButton-root': {
          textTransform: 'none',
        }
      }}
    />
  );
};

export default CustomDataGrid;
