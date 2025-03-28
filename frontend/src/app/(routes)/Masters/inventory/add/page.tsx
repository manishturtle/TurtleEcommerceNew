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
    stockQuantity: 1250, // Default values for UI display
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
            nonSaleable: stock.non_saleable || 10,
            onOrder: stock.on_order || 200,
            inTransit: stock.in_transit || 75,
            returned: stock.returned || 5,
            onHold: stock.on_hold || 25,
            backorder: stock.backorder || 100
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

  return (
    <Box sx={{ 
      bgcolor: '#f9fafb', 
      minHeight: 'calc(100vh - 73px)',
      display: 'flex',
      flexDirection: 'column',
      pb: { xs: 8, sm: 4 } // Add extra padding at the bottom
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        gap: { xs: 2, sm: 0 },
        p: { xs: 2, sm: 2 },
        px: { xs: 2, sm: 4 }
      }}>
        <Typography variant="h5" fontWeight="600">
          Add Inventory
        </Typography>
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
      <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 4 } }}>
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
                    <Typography variant="body2" fontWeight="500" color="text.secondary" mb={0.5}>
                      Product <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                    </Typography>
                    <Controller
                      name="product"
                      control={control}
                      render={({ field }) => (
                        <FormControl error={!!errors.product} fullWidth>
                          <TextField
                            {...field}
                            placeholder="Search product by name or SKU"
                            variant="outlined"
                            error={!!errors.product}
                            helperText={errors.product?.message}
                            size="small"
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <SearchIcon fontSize="small" color="action" />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5
                              }
                            }}
                          />
                        </FormControl>
                      )}
                    />
                  </Box>

                  {/* Location Field */}
                  <Box>
                    <Typography variant="body2" fontWeight="500" color="text.secondary" mb={0.5}>
                      Location <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                    </Typography>
                    <Controller
                      name="location"
                      control={control}
                      render={({ field }) => (
                        <FormControl error={!!errors.location} fullWidth>
                          <Select
                            {...field}
                            displayEmpty
                            size="small"
                            error={!!errors.location}
                            sx={{ 
                              borderRadius: 1.5
                            }}
                          >
                            <MenuItem value="">Select location</MenuItem>
                            <MenuItem value="wa">Warehouse A</MenuItem>
                            <MenuItem value="wb">Warehouse B</MenuItem>
                          </Select>
                          {errors.location && (
                            <FormHelperText error>{errors.location.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Box>

                  {/* Serial/Lot Number and Expiry Date */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" fontWeight="500" color="text.secondary" mb={0.5}>
                        Serial/Lot Number
                      </Typography>
                      <Controller
                        name="serialLotNumber"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            placeholder="Enter serial/lot number"
                            variant="outlined"
                            size="small"
                            fullWidth
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5
                              }
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" fontWeight="500" color="text.secondary" mb={0.5}>
                        Expiry Date
                      </Typography>
                      <Controller
                        name="expiryDate"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="date"
                            variant="outlined"
                            size="small"
                            fullWidth
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5
                              }
                            }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>

                  {/* Adjustment Type */}
                  <Box>
                    <Typography variant="body2" fontWeight="500" color="text.secondary" mb={0.5}>
                      Adjustment Type <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                    </Typography>
                    <Controller
                      name="adjustmentType"
                      control={control}
                      render={({ field }) => (
                        <FormControl error={!!errors.adjustmentType} fullWidth>
                          <Select
                            {...field}
                            displayEmpty
                            size="small"
                            error={!!errors.adjustmentType}
                            sx={{ 
                              borderRadius: 1.5
                            }}
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
                  </Box>

                  {/* Quantity */}
                  <Box>
                    <Typography variant="body2" fontWeight="500" color="text.secondary" mb={0.5}>
                      Quantity <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                    </Typography>
                    <Controller
                      name="quantity"
                      control={control}
                      render={({ field }) => (
                        <FormControl error={!!errors.quantity} fullWidth>
                          <TextField
                            {...field}
                            placeholder="Enter quantity"
                            variant="outlined"
                            type="number"
                            error={!!errors.quantity}
                            helperText={errors.quantity?.message || "Enter a positive or negative number based on adjustment type"}
                            size="small"
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5
                              }
                            }}
                          />
                        </FormControl>
                      )}
                    />
                  </Box>

                  {/* Notes */}
                  <Box>
                    <Typography variant="body2" fontWeight="500" color="text.secondary" mb={0.5}>
                      Notes
                    </Typography>
                    <Controller
                      name="notes"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          placeholder="Enter additional notes"
                          variant="outlined"
                          multiline
                          rows={4}
                          fullWidth
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5
                            }
                          }}
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
                    <Typography variant="body2" fontWeight="500" color="text.secondary" mb={0.5}>
                      Reason <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                    </Typography>
                    <Controller
                      name="reason"
                      control={control}
                      render={({ field }) => (
                        <FormControl error={!!errors.reason} fullWidth>
                          <Select
                            {...field}
                            displayEmpty
                            size="small"
                            error={!!errors.reason}
                            sx={{ 
                              borderRadius: 1.5
                            }}
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
                          </Select>
                          {errors.reason && (
                            <FormHelperText error>{errors.reason.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Box>

                  {/* Current Quantities */}
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body1" fontWeight="500" mb={1.5}>
                      Current Quantities
                    </Typography>
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
