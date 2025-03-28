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
  Drawer,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Popover,
  Paper,
  Card,
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  DataGrid, 
  GridColDef, 
  GridValueGetter, 
  GridRenderCellParams, 
  GridRowSelectionModel,
  GridPaginationModel,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarQuickFilter,
  GridToolbarFilterButton
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
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import QrCodeIcon from '@mui/icons-material/QrCode';
import EventIcon from '@mui/icons-material/Event';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import NumbersIcon from '@mui/icons-material/Numbers';
import SummarizeIcon from '@mui/icons-material/Summarize';
import SaveIcon from '@mui/icons-material/Save';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import ContentCard from '@/app/components/ContentCard';
import InventoryStatsCard from '@/app/components/InventoryStatsCard';
import CustomDataGrid from '@/app/components/CustomDataGrid';
import { useAdjustmentReasons } from '@/app/hooks/useAdjustmentReasons';
import { useAdjustmentTypes } from '@/app/hooks/useAdjustmentTypes';
import { fetchCurrentStock, createInventoryAdjustment, fetchLocations, fetchInventoryItems, FulfillmentLocation } from '@/app/services/api';

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

// Define Zod schema for inventory adjustment validation
const inventoryAdjustmentSchema = z.object({
  product: z.string().min(1, 'Product is required'),
  location: z.string().min(1, 'Location is required'),
  serialLotNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  adjustmentType: z.string().min(1, 'Adjustment type is required'),
  reason: z.string().min(1, 'Reason is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  notes: z.string().optional()
});

// TypeScript type derived from Zod schema
type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;
type InventoryAdjustmentFormData = z.infer<typeof inventoryAdjustmentSchema>;

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
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [dateAnchorEl, setDateAnchorEl] = useState<HTMLElement | null>(null);
  const [dateRangeText, setDateRangeText] = useState('This Week');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    pageSize: 5,
    page: 0
  });
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);
  const [loading, setLoading] = useState(false);
  
  // State for locations
  const [locations, setLocations] = useState<FulfillmentLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  
  // State for current stock
  const [currentStock, setCurrentStock] = useState({
    id: 0,
    stockQuantity: 1250,
    reservedQuantity: 50,
    availableQuantity: 0,
    nonSaleable: 10,
    onOrder: 200,
    inTransit: 75,
    returned: 5,
    onHold: 25,
    backorder: 100
  });
  
  // State for loading and error handling
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Use the adjustment reasons hook
  const { reasons, isLoading: isLoadingReasons, error: reasonsError } = useAdjustmentReasons();
  const { adjustmentTypes, isLoading: isLoadingTypes } = useAdjustmentTypes();
  
  // Mock locations data for development
  const mockLocations: FulfillmentLocation[] = [
    { id: 1, name: 'Warehouse A', code: 'WH-A', type: 'WAREHOUSE', is_active: true },
    { id: 2, name: 'Warehouse B', code: 'WH-B', type: 'WAREHOUSE', is_active: true },
    { id: 3, name: 'Store Location 1', code: 'ST-1', type: 'STORE', is_active: true },
    { id: 4, name: 'Distribution Center', code: 'DC-1', type: 'DISTRIBUTION', is_active: true },
    { id: 5, name: 'Returns Processing', code: 'RP-1', type: 'RETURNS', is_active: true }
  ];

  // Initialize react-hook-form with zod resolver
  const { 
    control, 
    handleSubmit, 
    watch, 
    reset, 
    formState: { errors } 
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
  
  // Initialize react-hook-form with zod resolver for the adjustment form
  const {
    control: adjustmentControl,
    handleSubmit: handleAdjustmentSubmit,
    watch: watchAdjustment,
    reset: resetAdjustment,
    formState: { errors: adjustmentErrors, isSubmitting: isAdjustmentSubmitting }
  } = useForm<InventoryAdjustmentFormData>({
    resolver: zodResolver(inventoryAdjustmentSchema),
    defaultValues: {
      product: '',
      location: '',
      adjustmentType: '',
      quantity: '',
      reason: '',
      serialLotNumber: '',
      expiryDate: '',
      notes: ''
    }
  });
  
  // Get form values for calculations
  const adjustmentType = watchAdjustment('adjustmentType');
  const quantityStr = watchAdjustment('quantity');
  const productId = watchAdjustment('product');
  const locationId = watchAdjustment('location');
  
  // Calculate adjustment quantity based on type and value
  const quantity = parseFloat(quantityStr) || 0;
  const adjustmentQuantity = 
    adjustmentType === 'ADD' ? quantity :
    adjustmentType === 'REMOVE' ? -quantity :
    0; // Default to 0 if no type selected
  
  // Calculate new stock level based on current stock and adjustment quantity
  const newStockLevel = currentStock.stockQuantity + adjustmentQuantity;

  // Fetch locations when component mounts
  useEffect(() => {
    const getLocations = async () => {
      try {
        setIsLoadingLocations(true);
        setLocationsError(null);
        
        // Use the actual API call
        const response = await fetchLocations({ is_active: true });
        setLocations(response.results);
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLocationsError('Failed to load locations');
        
        // Fallback to mock data if API fails
        setLocations(mockLocations);
      } finally {
        setIsLoadingLocations(false);
      }
    };
    
    getLocations();
  }, []);

  // Fetch current stock when product and location change
  useEffect(() => {
    const fetchStock = async () => {
      if (!productId || !locationId) return;
      
      try {
        setIsLoadingStock(true);
        setStockError(null);
        
        // Use fetchInventoryItems API to get current quantities
        const response = await fetchInventoryItems({ 
          product: parseInt(productId), 
          location: parseInt(locationId)
        });
        
        const stock = response.results.length > 0 ? response.results[0] : null;
        
        if (stock) {
          setCurrentStock({
            id: stock.id,
            stockQuantity: stock.stock_quantity || 0,
            reservedQuantity: stock.reserved_quantity || 0,
            availableQuantity: stock.available_to_promise || 0,
            nonSaleable: stock.non_saleable_quantity || 0,
            onOrder: stock.on_order_quantity || 0,
            inTransit: stock.in_transit_quantity || 0,
            returned: stock.returned_quantity || 0,
            onHold: stock.hold_quantity || 0,
            backorder: stock.backorder_quantity || 0
          });
        } else {
          // Reset to default values if no stock found
          setCurrentStock({
            id: 0,
            stockQuantity: 0,
            reservedQuantity: 0,
            availableQuantity: 0,
            nonSaleable: 0,
            onOrder: 0,
            inTransit: 0,
            returned: 0,
            onHold: 0,
            backorder: 0
          });
        }
      } catch (error) {
        console.error('Error fetching stock:', error);
        setStockError('Failed to load current stock');
      } finally {
        setIsLoadingStock(false);
      }
    };
    
    fetchStock();
  }, [productId, locationId]);
  
  // Handle form submission
  const onAdjustmentSubmit = async (data: InventoryAdjustmentFormData) => {
    try {
      setIsSubmittingAdjustment(true);
      setSubmitError(null);
      
      // Create the adjustment
      await createInventoryAdjustment({
        product: parseInt(data.product),
        location: parseInt(data.location),
        adjustment_type: data.adjustmentType,
        quantity: parseFloat(data.quantity),
        reason: parseInt(data.reason),
        lot_number: data.serialLotNumber || null,
        expiry_date: data.expiryDate || null,
        notes: data.notes || ''
      });
      
      // Close the form and reset
      setIsFormOpen(false);
      resetAdjustment();
      
      // Refresh inventory items
      // TODO: Implement refreshing inventory items after adjustment
      
    } catch (error) {
      console.error('Error creating adjustment:', error);
      setSubmitError('Failed to create inventory adjustment');
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

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
          case 'Custom Range':
            if (startDate && endDate) {
              dateFilterPassed = expiryDate >= startDate && expiryDate <= endDate;
            } else {
              dateFilterPassed = true;
            }
            break;
        }
      }
      
      return matchesSearch && dateFilterPassed;
    });
    
    setFilteredItems(filtered);
  }, [searchTerm, inventoryItems, dateFilter, startDate, endDate]);

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Handle date filter change
  const handleDateFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as string;
    setDateFilter(value);
    
    // Set date range based on selection
    const today = new Date();
    
    if (value === 'This Week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(today);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      setStartDate(startOfWeek);
      setEndDate(endOfWeek);
      setDateRangeText('This Week');
    } else if (value === 'Last Week') {
      const startOfLastWeek = new Date(today);
      startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
      const endOfLastWeek = new Date(today);
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
      setStartDate(startOfLastWeek);
      setEndDate(endOfLastWeek);
      setDateRangeText('Last Week');
    } else if (value === 'This Month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartDate(startOfMonth);
      setEndDate(endOfMonth);
      setDateRangeText('This Month');
    } else if (value === 'Last Month') {
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(startOfLastMonth);
      setEndDate(endOfLastMonth);
      setDateRangeText('Last Month');
    } else if (value === 'Custom Range') {
      // Open date picker dialog
      setDateRangeText('Custom Range');
    }
    
    setDateAnchorEl(null);
  };

  // Handle custom date range selection
  const handleCustomDateChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
    if (start && end) {
      setDateRangeText(`${start.toLocaleDateString()} - ${end.toLocaleDateString()}`);
    }
  };

  // Handle opening the date filter menu
  const handleDateFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
    setDateAnchorEl(event.currentTarget);
  };

  // Handle closing the date filter menu
  const handleDateFilterClose = () => {
    setDateAnchorEl(null);
  };

  const dateFilterOpen = Boolean(dateAnchorEl);

  // Open form dialog
  const handleOpenForm = (itemId?: number) => {
    if (itemId) {
      // Edit existing item
      setEditingItemId(itemId);
      const itemToEdit = inventoryItems.find(item => item.id === itemId);
      
      if (itemToEdit) {
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
      // Add new adjustment
      setEditingItemId(null);
      
      // Reset adjustment form with default values
      resetAdjustment({
        product: '',
        location: '',
        adjustmentType: '',
        quantity: '',
        reason: '',
        serialLotNumber: '',
        expiryDate: '',
        notes: ''
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

  // Handle filter menu open
  const handleFilterClick = () => {
    const filterButton = document.querySelector('.MuiDataGrid-toolbarFilterButton');
    if (filterButton) {
      (filterButton as HTMLElement).click();
    }
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

  const [drawerWidth, setDrawerWidth] = useState(550);

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
            onClick={() => handleOpenForm()}
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
      <ContentCard
        title="Inventory Items"
        action={
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Search and filter group */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 0.5
            }}>
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
                  variant="standard"
                  InputProps={{
                    disableUnderline: true
                  }}
                  sx={{ ml: 1, width: 150 }}
                />
              )}
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <IconButton
                size="small"
                onClick={handleFilterClick}
                sx={{ color: 'text.secondary' }}
              >
                <FilterListIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Divider orientation="vertical" flexItem />
            
            {/* View mode group */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 0.5
            }}>
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
            </Box>
            
            <Divider orientation="vertical" flexItem />
            
            {/* Date filter group */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 0.5
            }}>
              <IconButton
                size="small"
                onClick={handleDateFilterOpen}
                sx={{ color: 'text.secondary' }}
              >
                <CalendarTodayIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2" sx={{ ml: 0.5 }}>
                {dateRangeText}
              </Typography>
              <Popover
                open={dateFilterOpen}
                anchorEl={dateAnchorEl}
                onClose={handleDateFilterClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
              >
                <Box sx={{ p: 2, width: 200 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Date Range</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {['This Week', 'Last Week', 'This Month', 'Last Month', 'Custom Range'].map((option) => (
                      <MenuItem 
                        key={option} 
                        value={option}
                        selected={dateFilter === option}
                        onClick={() => handleDateFilterChange({ target: { value: option } } as any)}
                      >
                        {option}
                      </MenuItem>
                    ))}
                  </Box>
                  
                  {dateFilter === 'Custom Range' && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" sx={{ mb: 1 }}>Start Date</Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        value={startDate ? startDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          handleCustomDateChange(date, endDate);
                        }}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption" sx={{ mb: 1 }}>End Date</Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        value={endDate ? endDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          handleCustomDateChange(startDate, date);
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Popover>
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
          viewMode={view}
          loading={loading}
          getRowId={(row) => row.id}
        />
      </ContentCard>

      {/* Item Form Drawer */}
      <Drawer
        anchor="right"
        open={isFormOpen}
        onClose={handleCloseForm}
        sx={{
          '& .MuiDrawer-paper': { 
            width: drawerWidth,
            maxWidth: '100%',
            p: 0
          },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6">
                Add Adjustment
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleAdjustmentSubmit(onAdjustmentSubmit)}
                startIcon={<SaveIcon />}
                size="small"
                disabled={isSubmittingAdjustment || isAdjustmentSubmitting}
                sx={{ 
                  bgcolor: '#003366',
                  '&:hover': {
                    bgcolor: '#002244'
                  }
                }}
              >
                Save
              </Button>
              <IconButton 
                size="small" 
                onClick={() => setDrawerWidth(drawerWidth === 550 ? 800 : 550)} 
                sx={{ ml: 1 }}
                title={drawerWidth === 550 ? "Expand drawer" : "Collapse drawer"}
              >
                {drawerWidth === 550 ? <FullscreenIcon fontSize="small" /> : <FullscreenExitIcon fontSize="small" />}
              </IconButton>
              <IconButton 
                size="small" 
                onClick={handleCloseForm} 
                sx={{ ml: 0.5 }}
                title="Close drawer"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ 
            flexGrow: 1, 
            overflow: 'auto',
            p: 3
          }}>
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}
            
            <form id="adjustment-form" onSubmit={handleAdjustmentSubmit(onAdjustmentSubmit)}>
              {/* Product & Location Details */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Add Adjustment
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleAdjustmentSubmit(onAdjustmentSubmit)}
                    startIcon={<SaveIcon />}
                    size="small"
                    disabled={isSubmittingAdjustment || isAdjustmentSubmitting}
                    sx={{ 
                      bgcolor: '#003366',
                      '&:hover': {
                        bgcolor: '#002244'
                      }
                    }}
                  >
                    Save
                  </Button>
                  <IconButton 
                    size="small" 
                    onClick={() => setDrawerWidth(drawerWidth === 550 ? 800 : 550)} 
                    sx={{ ml: 1 }}
                    title={drawerWidth === 550 ? "Expand drawer" : "Collapse drawer"}
                  >
                    {drawerWidth === 550 ? <FullscreenIcon fontSize="small" /> : <FullscreenExitIcon fontSize="small" />}
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={handleCloseForm} 
                    sx={{ ml: 0.5 }}
                    title="Close drawer"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Controller
                    name="product"
                    control={adjustmentControl}
                    render={({ field }) => (
                      <FormControl error={!!adjustmentErrors.product} fullWidth>
                        <TextField
                          {...field}
                          label="Product *"
                          variant="outlined"
                          error={!!adjustmentErrors.product}
                          helperText={adjustmentErrors.product?.message}
                          placeholder="Search product by name or SKU"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <InventoryIcon color="action" />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <SearchIcon />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </FormControl>
                    )}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Controller
                    name="location"
                    control={adjustmentControl}
                    render={({ field }) => (
                      <FormControl error={!!adjustmentErrors.location} fullWidth>
                        <TextField
                          {...field}
                          select
                          label="Location *"
                          variant="outlined"
                          error={!!adjustmentErrors.location}
                          helperText={adjustmentErrors.location?.message}
                          disabled={isLoadingLocations}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationOnIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        >
                          <MenuItem value="">Select location</MenuItem>
                          {locations.map((location) => (
                            <MenuItem key={location.id} value={location.id.toString()}>
                              {location.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>
              
              {/* Inventory Details */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Inventory Details
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="serialLotNumber"
                      control={adjustmentControl}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <TextField
                            {...field}
                            label="Serial/Lot Number"
                            variant="outlined"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <QrCodeIcon color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </FormControl>
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="expiryDate"
                      control={adjustmentControl}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <TextField
                            {...field}
                            label="Expiry Date"
                            variant="outlined"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <EventIcon color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </FormControl>
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Controller
                      name="adjustmentType"
                      control={adjustmentControl}
                      render={({ field }) => (
                        <FormControl error={!!adjustmentErrors.adjustmentType} fullWidth>
                          <TextField
                            {...field}
                            select
                            label="Adjustment Type *"
                            variant="outlined"
                            error={!!adjustmentErrors.adjustmentType}
                            helperText={adjustmentErrors.adjustmentType?.message}
                            disabled={isLoadingTypes}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SwapVertIcon color="action" />
                                </InputAdornment>
                              ),
                            }}
                          >
                            <MenuItem value="">Select type</MenuItem>
                            {adjustmentTypes?.map((type) => (
                              <MenuItem key={type.id} value={type.code}>
                                {type.name}
                              </MenuItem>
                            )) || (
                              <>
                                <MenuItem value="ADD">Add</MenuItem>
                                <MenuItem value="REMOVE">Remove</MenuItem>
                              </>
                            )}
                          </TextField>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Controller
                      name="reason"
                      control={adjustmentControl}
                      render={({ field }) => (
                        <FormControl error={!!adjustmentErrors.reason} fullWidth>
                          <TextField
                            {...field}
                            select
                            label="Reason *"
                            variant="outlined"
                            error={!!adjustmentErrors.reason}
                            helperText={adjustmentErrors.reason?.message}
                            disabled={isLoadingReasons}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <ReportProblemIcon color="action" />
                                </InputAdornment>
                              ),
                            }}
                          >
                            <MenuItem value="">Select reason</MenuItem>
                            {reasons?.map((reason) => (
                              <MenuItem key={reason.id} value={reason.id.toString()}>
                                {reason.name}
                              </MenuItem>
                            )) || (
                              <>
                                <MenuItem value="1">Initial Stock</MenuItem>
                                <MenuItem value="2">Stock Count</MenuItem>
                                <MenuItem value="3">Damaged</MenuItem>
                                <MenuItem value="4">Expired</MenuItem>
                                <MenuItem value="5">Lost</MenuItem>
                              </>
                            )}
                          </TextField>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Controller
                      name="quantity"
                      control={adjustmentControl}
                      render={({ field }) => (
                        <FormControl error={!!adjustmentErrors.quantity} fullWidth>
                          <TextField
                            {...field}
                            label="Quantity *"
                            variant="outlined"
                            type="number"
                            error={!!adjustmentErrors.quantity}
                            helperText={adjustmentErrors.quantity?.message}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <NumbersIcon color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </FormControl>
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>
              
              {/* Current Quantities */}
              {(productId && locationId) && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Current Quantities
                  </Typography>
                  
                  {isLoadingStock ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : stockError ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {stockError}
                    </Alert>
                  ) : (
                    <Card variant="outlined" sx={{ mb: 3 }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                              Stock Quantity
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {currentStock.stockQuantity}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                              Reserved Quantity
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {currentStock.reservedQuantity}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                              Non-Saleable
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {currentStock.nonSaleable}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                              On Order
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {currentStock.onOrder}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                              In Transit
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {currentStock.inTransit}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                              Returned
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {currentStock.returned}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                              On Hold
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {currentStock.onHold}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                              Backorder
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {currentStock.backorder}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              )}
              
              {/* Additional Notes */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Additional Notes
                </Typography>
                <Controller
                  name="notes"
                  control={adjustmentControl}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <TextField
                        {...field}
                        label="Notes"
                        variant="outlined"
                        multiline
                        rows={4}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                              <SummarizeIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </FormControl>
                  )}
                />
              </Box>
              
              {/* Adjustment Summary */}
              {(adjustmentType && quantity > 0) && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Adjustment Summary
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">
                            Current Stock
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {currentStock.stockQuantity}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">
                            Adjustment
                          </Typography>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: adjustmentQuantity >= 0 ? 'success.main' : 'error.main'
                            }}
                          >
                            {adjustmentQuantity >= 0 ? '+' : ''}{adjustmentQuantity}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">
                            New Stock Level
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {newStockLevel}
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%', 
                            bgcolor: 'success.main',
                            mr: 1 
                          }} 
                        />
                        <Typography variant="body2" color="text.secondary">
                          Valid Adjustment
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </form>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}