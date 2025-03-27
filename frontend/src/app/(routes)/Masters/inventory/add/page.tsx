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
  Breadcrumbs,
  CircularProgress,
  Alert
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
import { useAdjustmentReasons } from '@/app/hooks/useAdjustmentReasons';
import { useAdjustmentTypes } from '@/app/hooks/useAdjustmentTypes';
import { fetchCurrentStock, createInventoryAdjustment } from '@/app/services/api';

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

  // Initialize react-hook-form with zod resolver
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting: isFormSubmitting }
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

  // Use the adjustment reasons hook
  const { reasons, isLoading: isLoadingReasons, error: reasonsError } = useAdjustmentReasons();
  const { adjustmentTypes, isLoading: isLoadingTypes } = useAdjustmentTypes();
  
  // State for current stock
  const [currentStock, setCurrentStock] = useState({
    id: 0,
    stockQuantity: 0,
    reservedQuantity: 0,
    availableQuantity: 0,
    backorder: 0
  });
  
  // State for loading and error handling
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Get form values for calculations
  const adjustmentType = watch('adjustmentType');
  const quantityStr = watch('quantity');
  const productId = watch('product');
  const locationId = watch('location');
  
  // Calculate adjustment quantity based on type and value
  const quantity = parseFloat(quantityStr) || 0;
  const adjustmentQuantity = 
    adjustmentType === 'ADD' ? quantity :
    adjustmentType === 'REMOVE' ? -quantity :
    0;
  
  // Calculate new stock level based on current stock and adjustment quantity
  const newStockLevel = currentStock.stockQuantity + adjustmentQuantity;

  // Fetch current stock when product and location change
  useEffect(() => {
    const fetchStock = async () => {
      if (!productId || !locationId) return;
      
      try {
        setIsLoadingStock(true);
        setStockError(null);
        const stock = await fetchCurrentStock(parseInt(productId), parseInt(locationId));
        
        if (stock) {
          setCurrentStock({
            id: stock.id,
            stockQuantity: stock.quantity,
            reservedQuantity: stock.reserved_quantity,
            availableQuantity: stock.available_quantity,
            backorder: stock.backorder || 0
          });
        } else {
          // No existing inventory found
          setCurrentStock({
            id: 0,
            stockQuantity: 0,
            reservedQuantity: 0,
            availableQuantity: 0,
            backorder: 0
          });
        }
      } catch (error) {
        console.error('Error fetching stock:', error);
        setStockError('Failed to fetch current stock levels');
      } finally {
        setIsLoadingStock(false);
      }
    };
    
    fetchStock();
  }, [productId, locationId]);

  // Form submission handler
  const onSubmit = async (data: InventoryAdjustmentFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      // Prepare data for API
      const adjustmentData = {
        inventory: currentStock.id || 0,
        adjustment_type: data.adjustmentType,
        reason: parseInt(data.reason),
        quantity: parseFloat(data.quantity),
        lot_number: data.serialLotNumber || undefined,
        expiry_date: data.expiryDate || undefined,
        notes: data.notes || undefined
      };
      
      // Submit to API
      await createInventoryAdjustment(adjustmentData);
      
      // Redirect to inventory list on success
      router.push('/Masters/inventory');
    } catch (error) {
      console.error('Error submitting adjustment:', error);
      setSubmitError('Failed to submit inventory adjustment');
    } finally {
      setIsSubmitting(false);
    }
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
          color="primary" 
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
        >
          {isSubmitting ? 'Saving...' : 'Save Adjustment'}
        </Button>
      </Box>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
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
                        value={field.value}
                        onChange={(e) => {
                          const dateStr = e.target.value;
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
                        {isLoadingTypes ? (
                          <MenuItem disabled>Loading...</MenuItem>
                        ) : (
                          adjustmentTypes.map((type) => (
                            <MenuItem key={type.code} value={type.code}>
                              {type.name}
                            </MenuItem>
                          ))
                        )}
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
                      <InputLabel shrink htmlFor="reason-input" sx={{ bgcolor: 'background.paper', px: 0.5 }}>
                        Reason
                      </InputLabel>
                      <Select
                        {...field}
                        id="reason-input"
                        variant="outlined"
                        displayEmpty
                        size="small"
                        sx={{ mt: 1 }}
                        startAdornment={
                          <InputAdornment position="start">
                            <ReportProblemIcon fontSize="small" color="action" />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="" disabled>
                          <em>Select a reason</em>
                        </MenuItem>
                        {isLoadingReasons ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} />
                            <Box sx={{ ml: 1 }}>Loading reasons...</Box>
                          </MenuItem>
                        ) : reasonsError ? (
                          <MenuItem disabled>
                            <Box sx={{ color: 'error.main' }}>Error loading reasons</Box>
                          </MenuItem>
                        ) : (
                          reasons.map((reason) => (
                            <MenuItem key={reason.id} value={reason.id.toString()}>
                              {reason.name}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                      {errors.reason && (
                        <FormHelperText error>{errors.reason.message}</FormHelperText>
                      )}
                      {reasonsError && !errors.reason && (
                        <FormHelperText error>Failed to load reasons. Please try again.</FormHelperText>
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
              {isLoadingStock ? (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                    <Typography sx={{ ml: 2 }}>Loading stock levels...</Typography>
                  </Box>
                </Grid>
              ) : stockError ? (
                <Grid item xs={12}>
                  <Alert severity="error">{stockError}</Alert>
                </Grid>
              ) : (
                <>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">Current Stock</Typography>
                      <Typography variant="h6" color="text.primary" fontWeight="bold">{currentStock.stockQuantity}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">Reserved</Typography>
                      <Typography variant="h6" color="text.primary" fontWeight="bold">{currentStock.reservedQuantity}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">Available</Typography>
                      <Typography variant="h6" color="text.primary" fontWeight="bold">{currentStock.availableQuantity}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">Backorder</Typography>
                      <Typography variant="h6" color="text.primary" fontWeight="bold">{currentStock.backorder}</Typography>
                    </Box>
                  </Grid>
                </>
              )}
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
                  <Typography variant="h6" color="text.primary" fontWeight="bold">{currentStock.stockQuantity}</Typography>
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
                    {adjustmentQuantity > 0 ? `+${adjustmentQuantity}` : adjustmentQuantity}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">New Stock Level</Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">{newStockLevel}</Typography>
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
