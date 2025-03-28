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
import { fetchCurrentStock, createInventoryAdjustment, fetchLocations, fetchInventoryItems, FulfillmentLocation } from '@/app/services/api';

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
  
  // State for locations
  const [locations, setLocations] = useState<FulfillmentLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  
  // Mock locations data for development
  const mockLocations: FulfillmentLocation[] = [
    { id: 1, name: 'Warehouse A', code: 'WH-A', type: 'WAREHOUSE', is_active: true },
    { id: 2, name: 'Warehouse B', code: 'WH-B', type: 'WAREHOUSE', is_active: true },
    { id: 3, name: 'Store Location 1', code: 'ST-1', type: 'STORE', is_active: true },
    { id: 4, name: 'Distribution Center', code: 'DC-1', type: 'DISTRIBUTION', is_active: true },
    { id: 5, name: 'Returns Processing', code: 'RP-1', type: 'RETURNS', is_active: true }
  ];
  
  // State for current stock
  const [currentStock, setCurrentStock] = useState({
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
    quantity; // Default to positive for UI display
  
  // Calculate new stock level based on current stock and adjustment quantity
  const newStockLevel = currentStock.stockQuantity + adjustmentQuantity;

  // Fetch locations when component mounts
  useEffect(() => {
    const getLocations = async () => {
      try {
        setIsLoadingLocations(true);
        setLocationsError(null);
        
        // Use the actual API call now that the backend issue is fixed
        const response = await fetchLocations({ is_active: true });
        setLocations(response.results);
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLocationsError('Failed to load locations');
        
        // Fallback to mock data if API still fails
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
        
        // Use fetchInventoryItems API to get current quantities from the correct endpoint
        const response = await fetchInventoryItems({ 
          product: parseInt(productId), 
          location: parseInt(locationId)
        });
        
        console.log('Inventory response:', response); // Log the response for debugging
        
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
          // If no stock record exists, reset to zeros
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
        setStockError('Failed to fetch current stock levels');
        
        // Reset to zeros on error
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

  return (
    <Box>
      {/* Header */}
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
            Add Adjustment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Adjust inventory quantities and manage lot information
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          sx={{ 
            bgcolor: '#003366', 
            '&:hover': { bgcolor: '#002244' },
            borderRadius: 2,
            px: 3,
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {/* Main Content */}
      <Box component="main">
        {submitError && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
            {submitError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Paper sx={{ 
            p: { xs: 2, sm: 3 }, 
            borderRadius: 3,
            mb: 4,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <Grid container spacing={{ xs: 2, sm: 4 }}>
              {/* Left Column */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
                  {/* Product Field */}
                  <Box>
                    <Controller
                      name="product"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Product *"
                          placeholder="Search product by name or SKU"
                          variant="outlined"
                          error={!!errors.product}
                          helperText={errors.product?.message}
                          fullWidth
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <SearchIcon fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Box>

                  {/* Location Field */}
                  <Box>
                    <Controller
                      name="location"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          label="Location *"
                          variant="outlined"
                          error={!!errors.location}
                          helperText={errors.location?.message || locationsError}
                          fullWidth
                          disabled={isLoadingLocations}
                        >
                          <MenuItem value="">Select location</MenuItem>
                          {isLoadingLocations ? (
                            <MenuItem disabled>Loading locations...</MenuItem>
                          ) : (
                            locations.map((location) => (
                              <MenuItem key={location.id} value={location.id.toString()}>
                                {location.name}
                              </MenuItem>
                            ))
                          )}
                        </TextField>
                      )}
                    />
                  </Box>

                  {/* Serial/Lot Number and Expiry Date */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="serialLotNumber"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Serial/Lot Number"
                            placeholder="Enter serial/lot number"
                            variant="outlined"
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="expiryDate"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Expiry Date"
                            type="date"
                            variant="outlined"
                            fullWidth
                            InputLabelProps={{
                              shrink: true,
                            }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>

                  {/* Adjustment Type */}
                  <Box>
                    <Controller
                      name="adjustmentType"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          label="Adjustment Type *"
                          variant="outlined"
                          error={!!errors.adjustmentType}
                          helperText={errors.adjustmentType?.message}
                          fullWidth
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
                        </TextField>
                      )}
                    />
                  </Box>

                  {/* Quantity */}
                  <Box>
                    <Controller
                      name="quantity"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Quantity *"
                          placeholder="Enter quantity"
                          variant="outlined"
                          type="number"
                          error={!!errors.quantity}
                          helperText={errors.quantity?.message || "Enter a positive or negative number based on adjustment type"}
                          fullWidth
                        />
                      )}
                    />
                  </Box>

                  {/* Notes */}
                  <Box>
                    <Controller
                      name="notes"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Additional Notes"
                          placeholder="Enter additional notes"
                          variant="outlined"
                          multiline
                          rows={3}
                          fullWidth
                        />
                      )}
                    />
                  </Box>
                </Box>
              </Grid>
              
              {/* Right Column */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
                  {/* Reason */}
                  <Box>
                    <Controller
                      name="reason"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          label="Reason *"
                          variant="outlined"
                          error={!!errors.reason}
                          helperText={errors.reason?.message}
                          fullWidth
                        >
                          <MenuItem value="">Select reason</MenuItem>
                          {isLoadingReasons ? (
                            <MenuItem disabled>Loading...</MenuItem>
                          ) : (
                            reasons.map((reason) => (
                              <MenuItem key={reason.id} value={reason.id.toString()}>
                                {reason.name}
                              </MenuItem>
                            ))
                          )}
                        </TextField>
                      )}
                    />
                  </Box>

                  {/* Current Quantities */}
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body1" fontWeight="500" mb={1.5}>
                      Current Quantities
                    </Typography>
                    {isLoadingStock ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : stockError ? (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {stockError}
                      </Alert>
                    ) : (
                      <Paper sx={{ 
                        p: 2, 
                        bgcolor: '#f9fafb', 
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'auto' // Add overflow auto to handle content
                      }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Stock Quantity</Typography>
                            <Typography variant="body1" fontWeight="500">{currentStock.stockQuantity.toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Reserved Quantity</Typography>
                            <Typography variant="body1" fontWeight="500">{currentStock.reservedQuantity.toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Non-Saleable</Typography>
                            <Typography variant="body1" fontWeight="500">{currentStock.nonSaleable.toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">On Order</Typography>
                            <Typography variant="body1" fontWeight="500">{currentStock.onOrder.toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">In Transit</Typography>
                            <Typography variant="body1" fontWeight="500">{currentStock.inTransit.toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Returned</Typography>
                            <Typography variant="body1" fontWeight="500">{currentStock.returned.toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">On Hold</Typography>
                            <Typography variant="body1" fontWeight="500">{currentStock.onHold.toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Backorder</Typography>
                            <Typography variant="body1" fontWeight="500">{currentStock.backorder.toLocaleString()}</Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Adjustment Summary */}
          <Paper sx={{ 
            p: { xs: 2, sm: 3 }, 
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            mb: { xs: 6, sm: 3 } // Increase bottom margin for mobile
          }}>
            <Typography variant="h6" fontWeight="500" mb={2}>
              Adjustment Summary
            </Typography>
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={6} sm={6} md={3}>
                <Paper sx={{ 
                  p: { xs: 1.5, sm: 2 }, // Smaller padding on mobile
                  bgcolor: '#f9fafb', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Typography variant="body2" color="text.secondary">Current Stock</Typography>
                  <Typography 
                    variant="h6" 
                    fontWeight="600" 
                    mt={0.5}
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} // Smaller font on mobile
                  >
                    {currentStock.stockQuantity.toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <Paper sx={{ 
                  p: { xs: 1.5, sm: 2 }, // Smaller padding on mobile
                  bgcolor: '#f9fafb', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Typography variant="body2" color="text.secondary">Adjustment</Typography>
                  <Typography 
                    variant="h6" 
                    fontWeight="600" 
                    mt={0.5}
                    color={adjustmentQuantity >= 0 ? 'success.main' : 'error.main'}
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} // Smaller font on mobile
                  >
                    {adjustmentQuantity >= 0 ? `+${adjustmentQuantity}` : adjustmentQuantity}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <Paper sx={{ 
                  p: { xs: 1.5, sm: 2 }, // Smaller padding on mobile
                  bgcolor: '#f9fafb', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Typography variant="body2" color="text.secondary">New Stock Level</Typography>
                  <Typography 
                    variant="h6" 
                    fontWeight="600" 
                    mt={0.5}
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} // Smaller font on mobile
                  >
                    {newStockLevel.toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <Paper sx={{ 
                  p: { xs: 1.5, sm: 2 }, // Smaller padding on mobile
                  bgcolor: '#f9fafb', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'success.light',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <CheckCircleIcon sx={{ 
                      color: 'success.main', 
                      mr: 0.5,
                      fontSize: { xs: '1rem', sm: '1.25rem' } // Smaller icon on mobile
                    }} />
                    <Typography 
                      variant="body1" 
                      fontWeight="500" 
                      color="success.main"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }} // Smaller font on mobile
                    >
                      Valid Adjustment
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </form>
      </Box>
    </Box>
  );
}
