import React from 'react';
import { 
  DataGrid, 
  GridColDef, 
  GridRowSelectionModel,
  GridPaginationModel,
  GridRowParams,
  GridCallbackDetails,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExportContainer,
  GridCsvExportMenuItem,
  GridPrintExportMenuItem,
  GridExportMenuItemProps
} from '@mui/x-data-grid';
import { Box, Button, Divider } from '@mui/material';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FilterListIcon from '@mui/icons-material/FilterList';
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Custom toolbar component
// function CustomToolbar() {
//   return (
//     <Box
//       sx={{
//         p: 1,
//         display: 'flex',
//         justifyContent: 'flex-end',
//         alignItems: 'center',
//         borderBottom: '1px solid',
//         borderColor: 'divider',
//         backgroundColor: '#f9fafb',
//       }}
//     >
//       <Button
//         size="small"
//         startIcon={<ViewColumnIcon />}
//         sx={{ 
//           textTransform: 'none',
//           mr: 1,
//           color: 'text.secondary'
//         }}
//         component={GridToolbarColumnsButton}
//       >
//         Columns
//       </Button>
//       <Button
//         size="small"
//         startIcon={<FilterListIcon />}
//         sx={{ 
//           textTransform: 'none',
//           mr: 1,
//           color: 'text.secondary'
//         }}
//         component={GridToolbarFilterButton}
//       >
//         Filters
//       </Button>
//       <Button
//         size="small"
//         startIcon={<DensityMediumIcon />}
//         sx={{ 
//           textTransform: 'none',
//           mr: 1,
//           color: 'text.secondary'
//         }}
//         component={GridToolbarDensitySelector}
//       >
//         Density
//       </Button>
//       <GridToolbarExportContainer
//         component={Button}
//         size="small"
//         startIcon={<FileDownloadIcon />}
//         sx={{ 
//           textTransform: 'none',
//           color: 'text.secondary'
//         }}
//       >
//         Export
//       </GridToolbarExportContainer>
//     </Box>
//   );
// }

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
  viewMode?: 'list' | 'grid';
  density?: 'compact' | 'standard' | 'comfortable';
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
  hideToolbar = false,
  viewMode = 'grid',
  density: propDensity
}) => {
  // Adjust density based on view mode if not explicitly provided
  const density = propDensity || (viewMode === 'list' ? 'compact' : 'standard');
  
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
      // slots={{
      //   toolbar: hideToolbar ? undefined : CustomToolbar,
      // }}
      density={density}
      sx={{
        '& .MuiDataGrid-root': {
          border: 'none',
        },
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid',
          borderColor: 'divider',
          padding: viewMode === 'list' ? '4px 16px' : '0px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: viewMode === 'list' ? 'flex-start' : 'center',
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
        }
      }}
    />
  );
};

export default CustomDataGrid;
