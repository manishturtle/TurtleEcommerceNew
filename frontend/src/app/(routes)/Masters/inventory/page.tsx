'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Grid, 
  Typography, 
  IconButton, 
  InputAdornment, 
  MenuItem,
  Divider,
  Switch,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  FormControlLabel,
  Checkbox,
  Tooltip
} from '@mui/material';
import { 
  DataGrid, 
  GridColDef, 
  GridValueGetterParams, 
  GridRenderCellParams, 
  GridRowSelectionModel,
  GridPaginationModel,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarQuickFilter
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import ContentCard from '@/app/components/ContentCard';
import InventoryStatsCard from '@/app/components/InventoryStatsCard';
import CustomDataGrid from '@/app/components/CustomDataGrid';

// Define Zod schema for inventory item validation
const inventoryItemSchema = z.object({
  product: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  location: z.string().min(1, 'Location is required'),
  availableQuantity: z.string().min(1, 'Available quantity is required'),
  status: z.enum(['Active', 'Inactive', 'Low Stock'], {
    errorMap: () => ({ message: 'Please select a valid status' }),
  }),
  lotTracked: z.boolean().optional(),
  lotNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  lotStrategy: z.enum(['FIFO', 'FEFO']).optional(),
  costPricePerUnit: z.string().optional(),
  customer: z.string().optional(),
});

// TypeScript type derived from Zod schema
type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

// Custom toolbar component
function CustomToolbar() {
  return (
    <GridToolbarContainer>
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
  product: string;
  sku: string;
  location: string;
  availableQuantity: number;
  status: string;
  lotTracked?: boolean;
  lotNumber?: string;
  expiryDate?: string;
  lotStrategy?: 'FIFO' | 'FEFO';
  costPricePerUnit?: string;
  customer?: string;
}

// Mock data for demonstration - sanitize data as it's added
const mockInventoryItems: InventoryItem[] = [
  {
    id: 1,
    product: sanitizeString('Vitamin D3 Supplement'),
    sku: sanitizeString('VD3-1000IU'),
    location: sanitizeString('Warehouse A'),
    availableQuantity: 75,
    status: sanitizeString('Active'),
    lotTracked: true,
    lotNumber: 'LOT-2025-001',
    expiryDate: '2026-03-17',
    lotStrategy: 'FIFO',
    costPricePerUnit: '$7.99',
    customer: 'CUSTOMER'
  },
  {
    id: 2,
    product: sanitizeString('Calcium Magnesium Zinc'),
    sku: sanitizeString('CMZ-500MG'),
    location: sanitizeString('Store Front'),
    availableQuantity: 120,
    status: sanitizeString('Active'),
    lotTracked: false,
    customer: 'DEVOTEAM'
  },
  {
    id: 3,
    product: sanitizeString('Omega-3 Fish Oil'),
    sku: sanitizeString('OMG-1000MG'),
    location: sanitizeString('Warehouse B'),
    availableQuantity: 15,
    status: sanitizeString('Low Stock'),
    lotTracked: true,
    lotNumber: 'LOT-2025-002',
    expiryDate: '2026-01-22',
    lotStrategy: 'FEFO',
    costPricePerUnit: '$12.50'
  },
  {
    id: 4,
    product: sanitizeString('Multivitamin Daily'),
    sku: sanitizeString('MVD-100CT'),
    location: sanitizeString('Store Front'),
    availableQuantity: 0,
    status: sanitizeString('Inactive'),
    lotTracked: false
  },
  {
    id: 5,
    product: sanitizeString('Protein Powder Vanilla'),
    sku: sanitizeString('PPV-2LB'),
    location: sanitizeString('Warehouse A'),
    availableQuantity: 42,
    status: sanitizeString('Active'),
    lotTracked: true,
    lotNumber: 'LOT-2025-003',
    expiryDate: '2026-06-28',
    lotStrategy: 'FIFO',
    costPricePerUnit: '$29.99'
  }
];

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [dateFilter, setDateFilter] = useState('This Week');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    pageSize: 5,
    page: 0
  });
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [lotExpiryDateStr, setLotExpiryDateStr] = useState<string>('');
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);
  const [view, setView] = useState('grid');

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
      product: '',
      sku: '',
      location: '',
      availableQuantity: '',
      status: 'Active',
      lotTracked: false,
      lotNumber: '',
      expiryDate: '',
      lotStrategy: 'FIFO',
      costPricePerUnit: '',
      customer: ''
    }
  });

  // Watch the lotTracked field to conditionally show lot management fields
  const lotTracked = watch('lotTracked');

  // Filter items based on search term
  useEffect(() => {
    const filtered = inventoryItems.filter(item => {
      const matchesSearch = 
        Object.values(item).some(value => 
          value !== null && 
          value !== undefined && 
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // Add date filtering logic based on dateFilter
      let dateFilterPassed = true;
      if (dateFilter && item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        const today = new Date();
        
        switch(dateFilter) {
          case 'This Week':
            const endOfWeek = new Date(today);
            endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
            dateFilterPassed = expiryDate <= endOfWeek;
            break;
          case 'Last Week':
            const startOfLastWeek = new Date(today);
            startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
            const endOfLastWeek = new Date(today);
            endOfLastWeek.setDate(today.getDate() - today.getDay() - 1);
            dateFilterPassed = expiryDate >= startOfLastWeek && expiryDate <= endOfLastWeek;
            break;
          case 'This Month':
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            dateFilterPassed = expiryDate <= endOfMonth;
            break;
          case 'Last Month':
            const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            dateFilterPassed = expiryDate >= startOfLastMonth && expiryDate <= endOfLastMonth;
            break;
          // Custom range would be handled separately
        }
      }
      
      return matchesSearch && dateFilterPassed;
    });
    
    setFilteredItems(filtered);
  }, [searchTerm, inventoryItems, dateFilter]);

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Handle date filter change
  const handleDateFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setDateFilter(event.target.value as string);
  };

  // Open form dialog
  const handleOpenForm = (itemId?: number) => {
    if (itemId) {
      // Edit existing item
      setEditingItemId(itemId);
      const itemToEdit = inventoryItems.find(item => item.id === itemId);
      
      if (itemToEdit) {
        // Set expiry date string for the date picker
        if (itemToEdit.expiryDate) {
          setLotExpiryDateStr(itemToEdit.expiryDate);
        } else {
          setLotExpiryDateStr('');
        }
        
        // Reset form with existing item data
        reset({
          product: itemToEdit.product,
          sku: itemToEdit.sku,
          location: itemToEdit.location,
          availableQuantity: itemToEdit.availableQuantity.toString(),
          status: itemToEdit.status as 'Active' | 'Inactive' | 'Low Stock',
          lotTracked: itemToEdit.lotTracked || false,
          lotNumber: itemToEdit.lotNumber || '',
          expiryDate: itemToEdit.expiryDate || '',
          lotStrategy: itemToEdit.lotStrategy || 'FIFO',
          costPricePerUnit: itemToEdit.costPricePerUnit || '',
          customer: itemToEdit.customer || ''
        });
      }
    } else {
      // Add new item
      setEditingItemId(null);
      setLotExpiryDateStr('');
      
      // Reset form with default values
      reset({
        product: '',
        sku: '',
        location: '',
        availableQuantity: '',
        status: 'Active',
        lotTracked: false,
        lotNumber: '',
        expiryDate: '',
        lotStrategy: 'FIFO',
        costPricePerUnit: '',
        customer: ''
      });
    }
    
    setIsFormOpen(true);
  };

  // Close form dialog
  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  // Handle form submission
  const onSubmit = (data: InventoryItemFormData) => {
    // Sanitize all input data
    const sanitizedData = {
      product: sanitizeString(data.product),
      sku: sanitizeString(data.sku),
      location: sanitizeString(data.location),
      availableQuantity: sanitizeNumber(data.availableQuantity),
      status: sanitizeString(data.status),
      lotTracked: !!data.lotTracked,
      lotNumber: data.lotTracked ? sanitizeString(data.lotNumber || '') : undefined,
      expiryDate: data.lotTracked ? sanitizeString(data.expiryDate || '') : undefined,
      lotStrategy: data.lotTracked ? data.lotStrategy : undefined,
      costPricePerUnit: data.lotTracked ? sanitizeString(data.costPricePerUnit || '') : undefined,
      customer: sanitizeString(data.customer || '')
    };
    
    if (editingItemId) {
      // Update existing item
      setInventoryItems(prevItems => 
        prevItems.map(item => 
          item.id === editingItemId 
            ? { ...item, ...sanitizedData } 
            : item
        )
      );
    } else {
      // Add new item with a new ID
      const newId = Math.max(0, ...inventoryItems.map(item => item.id)) + 1;
      setInventoryItems(prevItems => [
        ...prevItems,
        {
          id: newId,
          ...sanitizedData
        }
      ]);
    }
    
    // Close the form dialog
    handleCloseForm();
  };

  // Define columns for the DataGrid
  const columns: GridColDef[] = useMemo(() => [
    { 
      field: '__check__',
      headerName: '',
      width: 50,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: 'center',
      headerAlign: 'center',
    },
    { 
      field: 'product', 
      headerName: 'Product', 
      flex: 1,
      minWidth: 200,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ 
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="body2">
            {params.value}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'location', 
      headerName: 'Location', 
      flex: 1,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ 
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="body2">
            {params.value}
          </Typography>
        </Box>
      )
    },
   
    { 
      field: 'availableQuantity', 
      headerName: 'Available Qty', 
      flex: 1,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const availableQty = params.value as number;
        
        let textColor = '#00a854'; // Green for normal
        if (availableQty <= 0) textColor = '#f44336'; // Red for zero
        else if (availableQty < 20) textColor = '#ffab00'; // Amber for low
        
        return (
          <Box sx={{ 
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography variant="body2" sx={{ color: textColor, fontWeight: 500 }}>
              {availableQty}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 1,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const status = params.value as string;
        let textColor = '#00a854'; // Green text for Active
        
        if (status === 'Inactive') {
          textColor = '#f44336'; // Red text
        } else if (status === 'Low Stock') {
          textColor = '#ffab00'; // Amber text
        }
        
        return (
          <Box sx={{ 
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography variant="body2" sx={{ color: textColor, fontWeight: 500 }}>
              {status}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      flex: 0.5,
      minWidth: 100,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ 
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              size="small" 
              onClick={() => handleOpenForm(params.row.id)}
              sx={{ color: '#5f5fc4' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )
    }
  ], []);

  useEffect(() => {
    const handleRowSelectionChange = (newSelectionModel: GridRowSelectionModel) => {
      setSelectionModel(newSelectionModel);
    };

    return () => {
      handleRowSelectionChange([]);
    };
  }, []);

  // Handle view mode change
  const handleViewChange = (newView: 'list' | 'grid') => {
    setView(newView);
  };

  return (
    <Box sx={{ 
      // bgcolor: '#f9fafb', 
      // minHeight: 'calc(100vh - 73px)',
      // p: { xs: 2, sm: 3 }
    }}>
      {/* Page Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        gap: { xs: 2, sm: 0 },
        mb: 3 
      }}>
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Inventory Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add or adjust inventory items
          </Typography>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          width: { xs: '100%', sm: 'auto' }
        }}>
          <Button 
            variant="outlined" 
            startIcon={<FileDownloadIcon />} 
            sx={{ flex: { xs: 1, sm: 'none' } }}
          >
            Export
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            component={Link}
            href="/Masters/inventory/add"
            sx={{ 
              flex: { xs: 1, sm: 'none' },
              bgcolor: '#003366',
              '&:hover': {
                bgcolor: '#002244'
              }
            }}
          >
            New Item
          </Button>
        </Box>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <InventoryStatsCard 
            title="Total Items"
            value="466.2k"
            changeValue="20.6%"
            changeDirection="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <InventoryStatsCard 
            title="Draft"
            value="500"
            changeValue="5.5%"
            changeDirection="down"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <InventoryStatsCard 
            title="In Transit"
            value="134.4k"
            changeValue="20.9%"
            changeDirection="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <InventoryStatsCard 
            title="Low Stock"
            value="800"
            changeValue="60.2%"
            changeDirection="up"
          />
        </Grid>
      </Grid>

      {/* Search and filter section */}
   
      {/* Data grid */}
      <ContentCard
        title="Inventory Items"
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                size="small"
                onClick={() => setShowSearch(!showSearch)}
                sx={{ color: 'text.secondary' }}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
              {showSearch && (
                <TextField
                  size="small"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  sx={{ ml: 1, width: 200 }}
                />
              )}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  size="small"
                  onClick={() => handleViewChange('list')}
                  sx={{ 
                    color: view === 'list' ? 'primary.main' : 'text.secondary',
                    bgcolor: view === 'list' ? 'action.hover' : 'transparent'
                  }}
                >
                  <ViewListIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleViewChange('grid')}
                  sx={{ 
                    color: view === 'grid' ? 'primary.main' : 'text.secondary',
                    bgcolor: view === 'grid' ? 'action.hover' : 'transparent'
                  }}
                >
                  <GridViewIcon fontSize="small" />
                </IconButton>
                <TextField
                  select
                  size="small"
                  value={dateFilter}
                  variant="standard"
                  InputProps={{
                    disableUnderline: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    ml: 1,
                    '& .MuiSelect-select': {
                      py: 0,
                      fontSize: '0.875rem',
                    }
                  }}
                  onChange={handleDateFilterChange}
                >
                  <MenuItem value="This Week">This Week</MenuItem>
                  <MenuItem value="Last Week">Last Week</MenuItem>
                  <MenuItem value="This Month">This Month</MenuItem>
                  <MenuItem value="Last Month">Last Month</MenuItem>
                  <MenuItem value="Custom Range">Custom Range</MenuItem>
                </TextField>
              </Box>
            </Box>
          </Box>
        }
        sx={{
          '& .MuiDataGrid-root': {
            border: 'none',
          }
        }}
      >
        <CustomDataGrid
          rows={filteredItems}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 20]}
          autoHeight
          checkboxSelection
          disableRowSelectionOnClick={false}
          rowSelectionModel={selectionModel}
          onRowSelectionModelChange={(newSelectionModel: GridRowSelectionModel) => {
            // Convert readonly array to mutable array
            setSelectionModel([...newSelectionModel]);
          }}
          hideToolbar={false}
          viewMode={view as 'list' | 'grid'}
        />
      </ContentCard>

      {/* Item Form Dialog */}
      <Dialog
        open={isFormOpen}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {editingItemId ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </Typography>
            <IconButton onClick={handleCloseForm} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <form id="inventory-form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="product"
                  control={control}
                  render={({ field }) => (
                    <FormControl error={!!errors.product} fullWidth>
                      <TextField
                        {...field}
                        label="Product Name"
                        variant="outlined"
                        error={!!errors.product}
                        helperText={errors.product?.message}
                      />
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="sku"
                  control={control}
                  render={({ field }) => (
                    <FormControl error={!!errors.sku} fullWidth>
                      <TextField
                        {...field}
                        label="SKU"
                        variant="outlined"
                        error={!!errors.sku}
                        helperText={errors.sku?.message}
                      />
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <FormControl error={!!errors.location} fullWidth>
                      <TextField
                        {...field}
                        label="Location"
                        variant="outlined"
                        error={!!errors.location}
                        helperText={errors.location?.message}
                      />
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="availableQuantity"
                  control={control}
                  render={({ field }) => (
                    <FormControl error={!!errors.availableQuantity} fullWidth>
                      <TextField
                        {...field}
                        label="Available Quantity"
                        variant="outlined"
                        type="number"
                        error={!!errors.availableQuantity}
                        helperText={errors.availableQuantity?.message}
                      />
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormControl error={!!errors.status} fullWidth>
                      <TextField
                        {...field}
                        select
                        label="Status"
                        variant="outlined"
                        error={!!errors.status}
                        helperText={errors.status?.message}
                      >
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Inactive">Inactive</MenuItem>
                        <MenuItem value="Low Stock">Low Stock</MenuItem>
                      </TextField>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="customer"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <TextField
                        {...field}
                        select
                        label="Customer/Team"
                        variant="outlined"
                      >
                        <MenuItem value="CUSTOMER">CUSTOMER</MenuItem>
                        <MenuItem value="DEVOTEAM">DEVOTEAM</MenuItem>
                      </TextField>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
                        label="Lot Tracked"
                      />
                    )}
                  />
                  <Tooltip title="Enable lot tracking for this inventory item">
                    <HelpOutlineIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                  </Tooltip>
                </Box>
              </Grid>

              {lotTracked && (
                <>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="lotNumber"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <TextField
                            {...field}
                            label="Lot Number"
                            variant="outlined"
                          />
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="expiryDate"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <TextField
                            {...field}
                            label="Expiry Date"
                            variant="outlined"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                          />
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="lotStrategy"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <TextField
                            {...field}
                            select
                            label="Lot Strategy"
                            variant="outlined"
                          >
                            <MenuItem value="FIFO">FIFO (First In, First Out)</MenuItem>
                            <MenuItem value="FEFO">FEFO (First Expired, First Out)</MenuItem>
                          </TextField>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="costPricePerUnit"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <TextField
                            {...field}
                            label="Cost Price Per Unit"
                            variant="outlined"
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                          />
                        </FormControl>
                      )}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm} color="inherit">
            Cancel
          </Button>
          <Button 
            type="submit"
            form="inventory-form"
            variant="contained"
            disabled={isSubmitting}
            sx={{ 
              bgcolor: '#003366',
              '&:hover': {
                bgcolor: '#002244'
              }
            }}
          >
            {editingItemId ? 'Update' : 'Add'} Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}