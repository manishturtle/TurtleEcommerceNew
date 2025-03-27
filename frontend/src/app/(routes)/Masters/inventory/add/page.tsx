'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import PageTitle from '@/app/components/PageTitle';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  InputLabel,
  Grid,
  Typography,
  Paper,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Card,
  CardContent,
  Breadcrumbs
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import Link from 'next/link';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import QrCodeIcon from '@mui/icons-material/QrCode';
import EventIcon from '@mui/icons-material/Event';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import NumbersIcon from '@mui/icons-material/Numbers';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NoteIcon from '@mui/icons-material/Note';
import SummarizeIcon from '@mui/icons-material/Summarize';
import BarChartIcon from '@mui/icons-material/BarChart';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

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
type InventoryAdjustmentFormData = z.infer<typeof inventoryAdjustmentSchema>;

export default function AddInventoryPage() {
  const router = useRouter();
  const [expiryDateStr, setExpiryDateStr] = useState<string>('');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(50);
  
  // Mock current stock data
  const currentStock = {
    stockQuantity: 1250,
    reserved: 50,
    nonSaleable: 10,
    onOrder: 200,
    inTransit: 75,
    returned: 5,
    onHold: 25,
    backorder: 100
  };
  
  // Calculate new stock level based on current stock and adjustment quantity
  const newStockLevel = currentStock.stockQuantity + adjustmentQuantity;

  // Initialize react-hook-form with zod resolver
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<InventoryAdjustmentFormData>({
    resolver: zodResolver(inventoryAdjustmentSchema),
    defaultValues: {
      product: '',
      location: '',
      serialLotNumber: '',
      expiryDate: '',
      adjustmentType: '',
      reason: '',
      quantity: '',
      notes: ''
    }
  });

  // Watch quantity field to update adjustment quantity
  const quantityValue = watch('quantity');
  const adjustmentTypeValue = watch('adjustmentType');

  // Update adjustment quantity when quantity or type changes
  useEffect(() => {
    const qty = parseFloat(quantityValue) || 0;
    if (adjustmentTypeValue === 'add') {
      setAdjustmentQuantity(qty);
    } else if (adjustmentTypeValue === 'remove') {
      setAdjustmentQuantity(-qty);
    } else {
      setAdjustmentQuantity(50); // Default for demo
    }
  }, [quantityValue, adjustmentTypeValue]);

  const handleFormSubmit = (data: InventoryAdjustmentFormData) => {
    console.log('Adjustment data:', data);
    // Here you would typically send this data to your backend API
    // and then update the inventory items accordingly
    
    // For now, let's just add a simple notification and redirect
    alert(`Inventory adjusted: ${data.quantity} units of ${data.product}`);
    router.push('/Masters/inventory');
  };

  const handleCancel = () => {
    router.push('/Masters/inventory');
  };

  // Section style
  const sectionStyle = {
    mb: 3,
    p: 2,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
    bgcolor: 'background.paper'
  };

  // Section header style
  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    mb: 2,
    pb: 1,
    borderBottom: '1px solid',
    borderColor: 'divider'
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight="bold">
          Add Inventory
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<SaveIcon />}
          onClick={handleSubmit(handleFormSubmit)}
          color="primary"
          sx={{ borderRadius: 1 }}
        >
          Save Changes
        </Button>
      </Box>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Box sx={{ mt: 2 }}>
          {/* Basic Information Section */}
          <Box sx={sectionStyle}>
            <Box sx={sectionHeaderStyle}>
              <InfoIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Basic Information
              </Typography>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="product"
                  control={control}
                  render={({ field }) => (
                    <FormControl error={!!errors.product} fullWidth>
                      <InputLabel shrink htmlFor="product-input" sx={{ bgcolor: 'background.paper', px: 0.5 }}>
                        Product *
                      </InputLabel>
                      <TextField
                        {...field}
                        id="product-input"
                        variant="outlined"
                        error={!!errors.product}
                        helperText={errors.product?.message}
                        placeholder="Search product by name or SKU"
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Inventory2Icon fontSize="small" color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <SearchIcon fontSize="small" color="action" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mt: 1 }}
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
                      <InputLabel shrink htmlFor="location-label" sx={{ bgcolor: 'background.paper', px: 0.5 }}>
                        Location *
                      </InputLabel>
                      <Select
                        {...field}
                        labelId="location-label"
                        id="location-select"
                        error={!!errors.location}
                        displayEmpty
                        size="small"
                        sx={{ mt: 1 }}
                        startAdornment={
                          <InputAdornment position="start">
                            <LocationOnIcon fontSize="small" color="action" />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="">Select location</MenuItem>
                        <MenuItem value="warehouse-1">Warehouse 1</MenuItem>
                        <MenuItem value="warehouse-2">Warehouse 2</MenuItem>
                        <MenuItem value="store-1">Store 1</MenuItem>
                      </Select>
                      {errors.location && (
                        <FormHelperText error>{errors.location.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Product Details Section */}
          <Box sx={sectionStyle}>
            <Box sx={sectionHeaderStyle}>
              <SearchIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Product Details
              </Typography>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="serialLotNumber"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel shrink htmlFor="serial-lot-input" sx={{ bgcolor: 'background.paper', px: 0.5 }}>
                        Serial/Lot Number
                      </InputLabel>
                      <TextField
                        {...field}
                        id="serial-lot-input"
                        variant="outlined"
                        placeholder="Enter serial/lot number"
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BarChartIcon fontSize="small" color="action" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mt: 1 }}
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
                      <InputLabel shrink htmlFor="expiry-date-input" sx={{ bgcolor: 'background.paper', px: 0.5 }}>
                        Expiry Date
                      </InputLabel>
                      <TextField
                        id="expiry-date-input"
                        type="date"
                        value={expiryDateStr}
                        onChange={(e) => {
                          const dateStr = e.target.value;
                          setExpiryDateStr(dateStr);
                          field.onChange(dateStr);
                        }}
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EventIcon fontSize="small" color="action" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mt: 1 }}
                      />
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Adjustment Details Section */}
          <Box sx={sectionStyle}>
            <Box sx={sectionHeaderStyle}>
              <SwapVertIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Adjustment Details
              </Typography>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="adjustmentType"
                  control={control}
                  render={({ field }) => (
                    <FormControl error={!!errors.adjustmentType} fullWidth>
                      <InputLabel shrink htmlFor="adjustment-type-label" sx={{ bgcolor: 'background.paper', px: 0.5 }}>
                        Adjustment Type *
                      </InputLabel>
                      <Select
                        {...field}
                        labelId="adjustment-type-label"
                        id="adjustment-type-select"
                        error={!!errors.adjustmentType}
                        displayEmpty
                        size="small"
                        sx={{ mt: 1 }}
                        startAdornment={
                          <InputAdornment position="start">
                            <AssignmentTurnedInIcon fontSize="small" color="action" />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="">Select type</MenuItem>
                        <MenuItem value="add">Add Inventory</MenuItem>
                        <MenuItem value="remove">Remove Inventory</MenuItem>
                        <MenuItem value="transfer">Transfer</MenuItem>
                        <MenuItem value="count">Inventory Count</MenuItem>
                      </Select>
                      {errors.adjustmentType && (
                        <FormHelperText error>{errors.adjustmentType.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="reason"
                  control={control}
                  render={({ field }) => (
                    <FormControl error={!!errors.reason} fullWidth>
                      <InputLabel shrink htmlFor="reason-label" sx={{ bgcolor: 'background.paper', px: 0.5 }}>
                        Reason *
                      </InputLabel>
                      <Select
                        {...field}
                        labelId="reason-label"
                        id="reason-select"
                        error={!!errors.reason}
                        displayEmpty
                        size="small"
                        sx={{ mt: 1 }}
                        startAdornment={
                          <InputAdornment position="start">
                            <ReportProblemIcon fontSize="small" color="action" />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="">Select reason</MenuItem>
                        <MenuItem value="purchase">Purchase</MenuItem>
                        <MenuItem value="sale">Sale</MenuItem>
                        <MenuItem value="return">Return</MenuItem>
                        <MenuItem value="damage">Damage</MenuItem>
                        <MenuItem value="loss">Loss</MenuItem>
                        <MenuItem value="adjustment">Adjustment</MenuItem>
                      </Select>
                      {errors.reason && (
                        <FormHelperText error>{errors.reason.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <FormControl error={!!errors.quantity} fullWidth>
                      <InputLabel shrink htmlFor="quantity-input" sx={{ bgcolor: 'background.paper', px: 0.5 }}>
                        Quantity *
                      </InputLabel>
                      <TextField
                        {...field}
                        id="quantity-input"
                        variant="outlined"
                        type="number"
                        error={!!errors.quantity}
                        helperText={errors.quantity?.message}
                        placeholder="Enter quantity"
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <NumbersIcon fontSize="small" color="action" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mt: 1 }}
                      />
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Current Stock Levels Section */}
          <Box sx={sectionStyle}>
            <Box sx={sectionHeaderStyle}>
              <BarChartIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Current Stock Levels
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Stock Quantity</Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">1,250</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Reserved</Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">50</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Non-Saleable</Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">10</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">On Order</Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">200</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">In Transit</Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">75</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Returned</Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">5</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">On Hold</Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">25</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Backorder</Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">100</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Additional Notes Section */}
          <Box sx={sectionStyle}>
            <Box sx={sectionHeaderStyle}>
              <NoteIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Additional Notes
              </Typography>
            </Box>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <TextField
                    {...field}
                    variant="outlined"
                    multiline
                    rows={4}
                    placeholder="Enter additional notes"
                  />
                </FormControl>
              )}
            />
          </Box>

          {/* Adjustment Summary Section */}
          <Box sx={sectionStyle}>
            <Box sx={sectionHeaderStyle}>
              <AssignmentTurnedInIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Adjustment Summary
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Current Stock</Typography>
                  <Typography variant="h6" color="text.primary" fontWeight="bold">1,250</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Adjustment</Typography>
                  <Typography 
                    variant="h6" 
                    color="success.main" 
                    fontWeight="bold"
                  >
                    +50
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">New Stock Level</Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">1,300</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ 
                  p: 1, 
                  border: '1px solid', 
                  borderColor: 'success.main', 
                  borderRadius: 1,
                  height: '100%'
                }}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Typography variant="h6" color="success.main" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon sx={{ mr: 0.5 }} fontSize="small" />
                    Valid Adjustment
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </form>
    </Box>
  );
}
