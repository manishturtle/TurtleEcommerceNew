'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PageTitle from '@/app/components/PageTitle';
import DateRangePicker from '@/app/components/DateRangePicker';
import Link from 'next/link';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  Stack,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip
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
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Define Zod schema for inventory item validation
const inventoryItemSchema = z.object({
  customer: z.string().min(1, 'Customer name is required'),
  invoice: z.string().min(1, 'Invoice number is required'),
  status: z.enum(['Open Invoice', 'Paid', 'Pending', 'Overdue'], {
    errorMap: () => ({ message: 'Please select a valid status' }),
  }),
  amount: z.string().min(1, 'Amount is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  // Lot management fields
  lotTracked: z.boolean().optional(),
  lotNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  lotStrategy: z.enum(['FIFO', 'FEFO']).optional(),
  costPricePerUnit: z.string().optional(),
});

// TypeScript type derived from Zod schema
type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

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
  lotTracked?: boolean;
  lotNumber?: string;
  expiryDate?: string;
  lotStrategy?: 'FIFO' | 'FEFO';
  costPricePerUnit?: string;
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
    dueDate: sanitizeString('03 Mar 2025'),
    lotTracked: true,
    lotNumber: 'LOT-2025-001',
    expiryDate: '2026-03-17',
    lotStrategy: 'FIFO',
    costPricePerUnit: '$7.50'
  },
  {
    id: 2,
    customer: sanitizeString('ACME CORP'),
    invoice: sanitizeString('F-010224-12'),
    status: sanitizeString('Paid'),
    amount: sanitizeString('$1,234.56'),
    issueDate: sanitizeString('20 Jan 2025'),
    created: sanitizeString('20 Jan 2025, Mon 9:45am'),
    dueDate: sanitizeString('20 Mar 2025'),
    lotTracked: false
  },
  {
    id: 3,
    customer: sanitizeString('GLOBEX'),
    invoice: sanitizeString('F-010225-33'),
    status: sanitizeString('Pending'),
    amount: sanitizeString('$567.89'),
    issueDate: sanitizeString('22 Jan 2025'),
    created: sanitizeString('22 Jan 2025, Wed 2:30pm'),
    dueDate: sanitizeString('22 Mar 2025'),
    lotTracked: true,
    lotNumber: 'LOT-2025-002',
    expiryDate: '2026-01-22',
    lotStrategy: 'FEFO',
    costPricePerUnit: '$4.25'
  },
  {
    id: 4,
    customer: sanitizeString('INITECH'),
    invoice: sanitizeString('F-010226-45'),
    status: sanitizeString('Overdue'),
    amount: sanitizeString('$890.12'),
    issueDate: sanitizeString('25 Jan 2025'),
    created: sanitizeString('25 Jan 2025, Sat 11:15am'),
    dueDate: sanitizeString('25 Feb 2025'),
    lotTracked: false
  },
  {
    id: 5,
    customer: sanitizeString('UMBRELLA'),
    invoice: sanitizeString('F-010227-78'),
    status: sanitizeString('Open Invoice'),
    amount: sanitizeString('$345.67'),
    issueDate: sanitizeString('28 Jan 2025'),
    created: sanitizeString('28 Jan 2025, Tue 4:20pm'),
    dueDate: sanitizeString('28 Mar 2025'),
    lotTracked: true,
    lotNumber: 'LOT-2025-003',
    expiryDate: '2026-06-28',
    lotStrategy: 'FIFO',
    costPricePerUnit: '$3.10'
  }
];

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [pageSize, setPageSize] = useState(5);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [lotExpiryDateStr, setLotExpiryDateStr] = useState<string>('');

  // Initialize react-hook-form with zod resolver
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      customer: '',
      invoice: '',
      status: 'Open Invoice',
      amount: '',
      issueDate: '',
      dueDate: '',
      lotTracked: false,
      lotNumber: '',
      expiryDate: '',
      lotStrategy: 'FIFO',
      costPricePerUnit: ''
    }
  });

  // Watch the lotTracked field to conditionally show lot management fields
  const isLotTracked = watch('lotTracked');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Apply filters whenever search term or dates change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, startDate, endDate, inventoryItems]);

  // Function to apply all filters
  const applyFilters = () => {
    let filtered = [...inventoryItems];
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.customer.toLowerCase().includes(searchLower) ||
        item.invoice.toLowerCase().includes(searchLower) ||
        item.status.toLowerCase().includes(searchLower) ||
        item.amount.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply date range filter
    if (startDate || endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.issueDate);
        
        // Extract just the date part for comparison
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        
        if (startDate && endDate) {
          const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          return itemDateOnly >= startDateOnly && itemDateOnly <= endDateOnly;
        } else if (startDate) {
          const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          return itemDateOnly >= startDateOnly;
        } else if (endDate) {
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          return itemDateOnly <= endDateOnly;
        }
        
        return true;
      });
    }
    
    setFilteredItems(filtered);
  };

  const handleOpenForm = (itemId?: number) => {
    if (itemId) {
      // Edit mode - find the item and set form values
      const itemToEdit = inventoryItems.find(item => item.id === itemId);
      if (itemToEdit) {
        reset({
          customer: itemToEdit.customer,
          invoice: itemToEdit.invoice,
          status: itemToEdit.status as any,
          amount: itemToEdit.amount,
          issueDate: itemToEdit.issueDate,
          dueDate: itemToEdit.dueDate,
          lotTracked: itemToEdit.lotTracked || false,
          lotNumber: itemToEdit.lotNumber || '',
          expiryDate: itemToEdit.expiryDate || '',
          lotStrategy: itemToEdit.lotStrategy || 'FIFO',
          costPricePerUnit: itemToEdit.costPricePerUnit || ''
        });
        
        // Set expiry date for the date input
        if (itemToEdit.expiryDate) {
          setLotExpiryDateStr(itemToEdit.expiryDate);
        } else {
          setLotExpiryDateStr('');
        }
        
        setEditingItemId(itemId);
      }
    } else {
      // Add mode - reset form to defaults
      reset({
        customer: '',
        invoice: '',
        status: 'Open Invoice',
        amount: '',
        issueDate: '',
        dueDate: '',
        lotTracked: false,
        lotNumber: '',
        expiryDate: '',
        lotStrategy: 'FIFO',
        costPricePerUnit: ''
      });
      setLotExpiryDateStr('');
      setEditingItemId(null);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const onSubmit = (data: InventoryItemFormData) => {
    // Sanitize all input data
    const sanitizedData = {
      customer: sanitizeString(data.customer),
      invoice: sanitizeString(data.invoice),
      status: sanitizeString(data.status),
      amount: sanitizeString(data.amount),
      issueDate: sanitizeString(data.issueDate),
      dueDate: sanitizeString(data.dueDate),
      lotTracked: data.lotTracked || false,
      lotNumber: data.lotTracked ? sanitizeString(data.lotNumber || '') : undefined,
      expiryDate: data.lotTracked ? sanitizeString(data.expiryDate || '') : undefined,
      lotStrategy: data.lotTracked ? data.lotStrategy : undefined,
      costPricePerUnit: data.lotTracked ? sanitizeString(data.costPricePerUnit || '') : undefined
    };

    if (editingItemId) {
      // Update existing item
      setInventoryItems(prevItems => 
        prevItems.map(item => 
          item.id === editingItemId 
            ? { 
                ...item, 
                ...sanitizedData
              } 
            : item
        )
      );
    } else {
      // Add new item
      const newItem: InventoryItem = {
        id: Math.max(0, ...inventoryItems.map(item => item.id)) + 1,
        ...sanitizedData,
        created: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          weekday: 'short',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      };
      setInventoryItems(prevItems => [...prevItems, newItem]);
    }

    // Close form after submission
    handleCloseForm();
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
      field: 'lotTracked',
      headerName: 'LOT TRACKED',
      flex: 0.8,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Yes' : 'No'} 
          size="small"
          color={params.value ? 'success' : 'default'}
          variant="outlined"
        />
      )
    },
    { 
      field: 'actions', 
      headerName: 'ACTIONS', 
      flex: 0.5,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton 
          size="small" 
          onClick={() => handleOpenForm(params.row.id)}
        >
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
            component={Link}
            href="/Masters/inventory/add"
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
                {inventoryItems.length}
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
                {inventoryItems.filter(item => item.status === 'Pending').length}
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
                {inventoryItems.filter(item => item.status === 'Open Invoice').length}
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
                {inventoryItems.filter(item => item.status === 'Overdue').length}
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
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              label="Filter by date"
              size="small"
              maxDate={new Date()} // Limit to today
              onFilterChange={applyFilters}
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
          rows={filteredItems}
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

      {/* Add/Edit Inventory Item Dialog */}
      <Dialog 
        open={isFormOpen} 
        onClose={handleCloseForm}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            {editingItemId ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            <IconButton edge="end" color="inherit" onClick={handleCloseForm} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Controller
                name="customer"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.customer} fullWidth>
                    <TextField
                      {...field}
                      label="Customer Name"
                      variant="outlined"
                      error={!!errors.customer}
                      helperText={errors.customer?.message}
                    />
                  </FormControl>
                )}
              />

              <Controller
                name="invoice"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.invoice} fullWidth>
                    <TextField
                      {...field}
                      label="Invoice Number"
                      variant="outlined"
                      error={!!errors.invoice}
                      helperText={errors.invoice?.message}
                    />
                  </FormControl>
                )}
              />

              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.status} fullWidth>
                    <Select
                      {...field}
                      displayEmpty
                      variant="outlined"
                      label="Status"
                    >
                      <MenuItem value="Open Invoice">Open Invoice</MenuItem>
                      <MenuItem value="Paid">Paid</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Overdue">Overdue</MenuItem>
                    </Select>
                    {errors.status && (
                      <FormHelperText error>{errors.status.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.amount} fullWidth>
                    <TextField
                      {...field}
                      label="Amount"
                      variant="outlined"
                      error={!!errors.amount}
                      helperText={errors.amount?.message}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </FormControl>
                )}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="issueDate"
                    control={control}
                    render={({ field }) => (
                      <FormControl error={!!errors.issueDate} fullWidth>
                        <TextField
                          {...field}
                          label="Issue Date"
                          type="date"
                          variant="outlined"
                          error={!!errors.issueDate}
                          helperText={errors.issueDate?.message}
                          InputLabelProps={{ shrink: true }}
                        />
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="dueDate"
                    control={control}
                    render={({ field }) => (
                      <FormControl error={!!errors.dueDate} fullWidth>
                        <TextField
                          {...field}
                          label="Due Date"
                          type="date"
                          variant="outlined"
                          error={!!errors.dueDate}
                          helperText={errors.dueDate?.message}
                          InputLabelProps={{ shrink: true }}
                        />
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>

              {/* Lot Management Section */}
              <Divider sx={{ my: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Lot Management
                </Typography>
              </Divider>

              <Controller
                name="lotTracked"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 0.5 }}>
                          Track by Lot
                        </Typography>
                        <Tooltip title="Enable lot tracking to manage inventory with FIFO/FEFO strategies, expiry dates, and lot-specific costing">
                          <HelpOutlineIcon fontSize="small" color="action" />
                        </Tooltip>
                      </Box>
                    }
                  />
                )}
              />

              {isLotTracked && (
                <>
                  <Controller
                    name="lotNumber"
                    control={control}
                    render={({ field }) => (
                      <FormControl error={!!errors.lotNumber} fullWidth>
                        <TextField
                          {...field}
                          label="Lot Number"
                          variant="outlined"
                          error={!!errors.lotNumber}
                          helperText={errors.lotNumber?.message}
                          placeholder="e.g., LOT-2025-001"
                        />
                      </FormControl>
                    )}
                  />

                  <Controller
                    name="expiryDate"
                    control={control}
                    render={({ field }) => (
                      <FormControl error={!!errors.expiryDate} fullWidth>
                        <TextField
                          label="Expiry Date"
                          type="date"
                          value={lotExpiryDateStr}
                          onChange={(e) => {
                            const dateStr = e.target.value;
                            setLotExpiryDateStr(dateStr);
                            field.onChange(dateStr);
                          }}
                          fullWidth
                          error={!!errors.expiryDate}
                          helperText={errors.expiryDate?.message}
                          InputLabelProps={{ shrink: true }}
                        />
                      </FormControl>
                    )}
                  />

                  <Controller
                    name="lotStrategy"
                    control={control}
                    render={({ field }) => (
                      <FormControl error={!!errors.lotStrategy} fullWidth>
                        <Select
                          {...field}
                          displayEmpty
                          variant="outlined"
                          label="Lot Strategy"
                        >
                          <MenuItem value="FIFO">FIFO (First In, First Out)</MenuItem>
                          <MenuItem value="FEFO">FEFO (First Expired, First Out)</MenuItem>
                        </Select>
                        {errors.lotStrategy && (
                          <FormHelperText error>{errors.lotStrategy.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />

                  <Controller
                    name="costPricePerUnit"
                    control={control}
                    render={({ field }) => (
                      <FormControl error={!!errors.costPricePerUnit} fullWidth>
                        <TextField
                          {...field}
                          label="Cost Price Per Unit"
                          variant="outlined"
                          error={!!errors.costPricePerUnit}
                          helperText={errors.costPricePerUnit?.message}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                        />
                      </FormControl>
                    )}
                  />
                </>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isSubmitting}
            >
              {editingItemId ? 'Update' : 'Add'} Item
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}