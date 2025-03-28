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
  Tooltip,
  Checkbox
} from '@mui/material';
import { 
  DataGrid, 
  GridColDef, 
  GridRenderCellParams,
  GridRowId,
  GridRowSelectionModel
} from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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
    costPricePerUnit: '$7.99'
  },
  {
    id: 2,
    product: sanitizeString('Calcium Magnesium Zinc'),
    sku: sanitizeString('CMZ-500MG'),
    location: sanitizeString('Store Front'),
    availableQuantity: 120,
    status: sanitizeString('Active'),
    lotTracked: false
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
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 5,
    page: 0
  });
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [lotExpiryDateStr, setLotExpiryDateStr] = useState<string>('');
  const [selectionModel, setSelectionModel] = useState<GridRowId[]>([]);

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
    }
  });

  // Watch the lotTracked field to conditionally show lot management fields
  const lotTracked = watch('lotTracked');

  // Filter items based on search term
  useEffect(() => {
    const filtered = inventoryItems.filter(item => {
      const matchesSearch = 
        item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Add date filtering logic here if needed
      
      return matchesSearch;
    });
    
    setFilteredItems(filtered);
  }, [searchTerm, inventoryItems, startDate, endDate]);

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Handle date range change
  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
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
      field: 'selection',
      headerName: '',
      width: 50,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderHeader: () => (
        <Checkbox
          indeterminate={selectionModel.length > 0 && selectionModel.length < filteredItems.length}
          checked={selectionModel.length > 0 && selectionModel.length === filteredItems.length}
          onChange={(event) => {
            const newSelectionModel = event.target.checked 
              ? filteredItems.map(item => item.id) 
              : [];
            setSelectionModel(newSelectionModel);
          }}
        />
      ),
      renderCell: (params) => {
        const isSelected = selectionModel.includes(params.row.id);
        return (
          <Checkbox
            checked={isSelected}
            onChange={() => {
              const id = params.row.id;
              const newSelectionModel = [...selectionModel];
              
              if (!isSelected) {
                if (!newSelectionModel.includes(id)) {
                  newSelectionModel.push(id);
                }
              } else {
                const index = newSelectionModel.indexOf(id);
                if (index > -1) {
                  newSelectionModel.splice(index, 1);
                }
              }
              
              setSelectionModel(newSelectionModel);
            }}
          />
        );
      }
    },
    { 
      field: 'product', 
      headerName: 'Product', 
      flex: 2,
      minWidth: 250,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => {
        const product = params.row.product;
        
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 2,
            width: '100%',
            height: '100%',
            pl: 1
          }}>
            <Box 
              component="img"
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0Nss1BY7Ntq2mHZyaaPs3yWzseQ78Ou3OFg&s"
              alt="Refresh"
              sx={{ 
                width: 24, 
                height: 24, 
                objectFit: 'contain'
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {product}
            </Typography>
          </Box>
        );
      }
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
    const handleRowSelectionChange = (newSelectionModel: GridRowId[]) => {
      setSelectionModel(newSelectionModel);
    };

    return () => {
      handleRowSelectionChange([]);
    };
  }, []);

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
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Items
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              466.2k
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
              <Box component="span" sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mr: 0.5,
                fontSize: '0.875rem'
              }}>
                ↑ 20.6%
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Draft
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              500
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
              <Box component="span" sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mr: 0.5,
                fontSize: '0.875rem'
              }}>
                ↓ 5.5%
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              In Transit
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              134.4k
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
              <Box component="span" sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mr: 0.5,
                fontSize: '0.875rem'
              }}>
                ↑ 20.9%
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Low Stock
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              800
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
              <Box component="span" sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mr: 0.5,
                fontSize: '0.875rem'
              }}>
                ↑ 60.2%
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Search and filter section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          width: { xs: '100%', sm: 'auto' }
        }}>
          <TextField
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            variant="outlined"
            size="small"
            sx={{ 
              flex: { xs: '1', sm: '1 1 300px' },
              maxWidth: { sm: '300px' }
            }}
          />
          
          <TextField
            placeholder="01/01/2025 - 12/31/2025"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarTodayIcon />
                </InputAdornment>
              )
            }}
            variant="outlined"
            size="small"
            sx={{ 
              flex: { xs: '1', sm: '1 1 300px' },
              maxWidth: { sm: '300px' }
            }}
          />
        </Box>
        
        <Button 
          variant="outlined" 
          startIcon={<FilterListIcon />}
          sx={{ color: 'text.secondary', borderColor: 'divider' }}
        >
          More Filters
        </Button>
      </Paper>

      {/* Data grid */}
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          '& .MuiDataGrid-root': {
            border: 'none',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid',
            borderColor: 'divider',
            padding: '0px',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid',
            borderColor: 'divider',
          },
          '& .MuiDataGrid-virtualScroller': {
            backgroundColor: '#fff',
          },
          '& .MuiDataGrid-columnHeaderCheckbox': {
            '& .MuiDataGrid-columnHeaderTitleContainer': {
              display: 'none'
            }
          }
        }}
      >
        <DataGrid
          rows={filteredItems}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 20]}
          disableRowSelectionOnClick
          autoHeight
          checkboxSelection={false}
          rowSelectionModel={selectionModel}
          onRowSelectionModelChange={(newSelectionModel: GridRowSelectionModel) => {
            // Convert readonly array to mutable array
            setSelectionModel([...newSelectionModel]);
          }}
          slots={{
            pagination: () => (
              <Box sx={{ 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ borderRadius: 1 }}
                    disabled={paginationModel.page === 0}
                    onClick={() => setPaginationModel({
                      ...paginationModel,
                      page: Math.max(0, paginationModel.page - 1)
                    })}
                  >
                    Previous
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    Page {paginationModel.page + 1} of {Math.ceil(filteredItems.length / paginationModel.pageSize)}
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ borderRadius: 1 }}
                  disabled={paginationModel.page >= Math.ceil(filteredItems.length / paginationModel.pageSize) - 1}
                  onClick={() => setPaginationModel({
                    ...paginationModel,
                    page: Math.min(
                      Math.ceil(filteredItems.length / paginationModel.pageSize) - 1,
                      paginationModel.page + 1
                    )
                  })}
                >
                  Next
                </Button>
              </Box>
            )
          }}
          sx={{
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
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid',
              borderColor: 'divider',
            }
          }}
        />
      </Paper>

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