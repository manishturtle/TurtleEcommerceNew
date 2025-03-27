'use client';

import { useState, useMemo } from 'react';
import PageTitle from '@/app/components/PageTitle';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  TextField,
  InputAdornment,
  Paper,
  Chip,
  IconButton
} from '@mui/material';
import { 
  DataGrid, 
  GridColDef, 
  GridRenderCellParams,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarQuickFilter
} from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// Custom toolbar component
function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarFilterButton />
      <GridToolbarExport />
      <GridToolbarQuickFilter debounceMs={500} />
    </GridToolbarContainer>
  );
}

// Data sanitization utility
const sanitizeString = (value: string | null | undefined): string => {
  if (value === null || value === undefined) return '';
  // Remove potentially dangerous HTML/script tags
  return String(value).replace(/<\/?[^>]+(>|$)/g, '');
};

const sanitizeNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Define inventory item type
interface InventoryItem {
  id: number;
  customer: string;
  invoice: string;
  status: string;
  amount: string;
  issueDate: string;
  created: string;
  dueDate: string;
}

// Mock data for demonstration - sanitize data as it's added
const mockInventoryItems: InventoryItem[] = [
  {
    id: 1,
    customer: sanitizeString('DEVOTEAM'),
    invoice: sanitizeString('F-010223-68'),
    status: sanitizeString('Open Invoice'),
    amount: sanitizeString('$8,76.39'),
    issueDate: sanitizeString('17 Jan 2025'),
    created: sanitizeString('17 Jan 2025, Wed 1:20pm'),
    dueDate: sanitizeString('03 Mar 2025')
  },
  {
    id: 2,
    customer: sanitizeString('ACME CORP'),
    invoice: sanitizeString('F-010224-12'),
    status: sanitizeString('Paid'),
    amount: sanitizeString('$1,234.56'),
    issueDate: sanitizeString('20 Jan 2025'),
    created: sanitizeString('20 Jan 2025, Mon 9:45am'),
    dueDate: sanitizeString('20 Mar 2025')
  },
  {
    id: 3,
    customer: sanitizeString('GLOBEX'),
    invoice: sanitizeString('F-010225-33'),
    status: sanitizeString('Pending'),
    amount: sanitizeString('$567.89'),
    issueDate: sanitizeString('22 Jan 2025'),
    created: sanitizeString('22 Jan 2025, Wed 2:30pm'),
    dueDate: sanitizeString('22 Mar 2025')
  },
  {
    id: 4,
    customer: sanitizeString('INITECH'),
    invoice: sanitizeString('F-010226-45'),
    status: sanitizeString('Overdue'),
    amount: sanitizeString('$890.12'),
    issueDate: sanitizeString('25 Jan 2025'),
    created: sanitizeString('25 Jan 2025, Sat 11:15am'),
    dueDate: sanitizeString('25 Feb 2025')
  },
  {
    id: 5,
    customer: sanitizeString('UMBRELLA'),
    invoice: sanitizeString('F-010227-78'),
    status: sanitizeString('Open Invoice'),
    amount: sanitizeString('$345.67'),
    issueDate: sanitizeString('28 Jan 2025'),
    created: sanitizeString('28 Jan 2025, Tue 4:20pm'),
    dueDate: sanitizeString('28 Mar 2025')
  }
];

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('01/01/2025 - 12/31/2025');
  const [pageSize, setPageSize] = useState(5);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleDateRangeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(event.target.value);
  };

  // Define columns for the DataGrid
  const columns: GridColDef[] = useMemo(() => [
    { 
      field: 'customer', 
      headerName: 'CUSTOMER', 
      flex: 1
    },
    { 
      field: 'invoice', 
      headerName: 'INVOICE', 
      flex: 1
    },
    { 
      field: 'status', 
      headerName: 'STATUS', 
      flex: 1,
      renderCell: (params) => {
        const status = params.value as string;
        let color = 'primary';
        
        if (status === 'Paid') color = 'success';
        if (status === 'Overdue') color = 'error';
        if (status === 'Pending') color = 'warning';
        
        return (
          <Chip 
            label={status} 
            size="small" 
            color={color as any} 
            variant="outlined" 
          />
        );
      }
    },
    { 
      field: 'amount', 
      headerName: 'AMOUNT', 
      flex: 1
    },
    { 
      field: 'issueDate', 
      headerName: 'ISSUE DATE', 
      flex: 1
    },
    { 
      field: 'created', 
      headerName: 'CREATED', 
      flex: 1.5
    },
    { 
      field: 'dueDate', 
      headerName: 'DUE DATE', 
      flex: 1
    },
    { 
      field: 'actions', 
      headerName: 'ACTIONS', 
      flex: 0.5,
      sortable: false,
      filterable: false,
      renderCell: () => (
        <IconButton size="small">
          <MoreVertIcon />
        </IconButton>
      )
    }
  ], []);

  return (
    <div className="space-y-4">
      <PageTitle 
        titleKey="pages.masters.inventory.title" 
        descriptionKey="pages.masters.inventory.description"
      />
      
      {/* Header section with title and buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Inventory Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add or adjust inventory items
          </Typography>
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<FileDownloadIcon />} 
            sx={{ mr: 1 }}
          >
            Export
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
          >
            New Item
          </Button>
        </Box>
      </Box>

      {/* Stats cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Items
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                466.2k
              </Typography>
              <Typography variant="body2" color="success.main">
                ↑ 20.8%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Draft
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                500
              </Typography>
              <Typography variant="body2" color="error.main">
                ↓ 5.5%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                In Transit
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                134.4k
              </Typography>
              <Typography variant="body2" color="success.main">
                ↑ 20.9%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Low Stock
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                800
              </Typography>
              <Typography variant="body2" color="success.main">
                ↑ 60.2%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Search inventory..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: '300px' }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              value={dateRange}
              onChange={handleDateRangeChange}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Button 
              variant="outlined" 
              startIcon={<FilterListIcon />}
            >
              More Filters
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Inventory data grid */}
      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={mockInventoryItems}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          onPaginationModelChange={(model) => setPageSize(model.pageSize)}
          checkboxSelection
          disableRowSelectionOnClick
          slots={{ toolbar: CustomToolbar }}
          sx={{
            '& .MuiDataGrid-cell:hover': {
              cursor: 'pointer',
            },
          }}
        />
      </Paper>
    </div>
  );
}