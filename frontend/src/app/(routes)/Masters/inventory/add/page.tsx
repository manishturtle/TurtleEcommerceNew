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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Card,
  CardContent,
  Breadcrumbs
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import Link from 'next/link';

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
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  
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
      setAdjustmentQuantity(0);
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

  return (
    <div className="space-y-4">
      <PageTitle 
        title="Add Inventory" 
        description="Add or adjust inventory items"
      />
      
      {/* Header section with title and buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
            <Link href="/Masters" style={{ textDecoration: 'none', color: 'inherit' }}>
              Masters
            </Link>
            <Link href="/Masters/inventory" style={{ textDecoration: 'none', color: 'inherit' }}>
              Inventory
            </Link>
            <Typography color="text.primary">Add Inventory</Typography>
          </Breadcrumbs>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Add Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add or adjust inventory items
          </Typography>
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            sx={{ mr: 1 }}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />}
            onClick={handleSubmit(handleFormSubmit)}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Box sx={{ mt: 2 }}>
          {/* Basic Information Section */}
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="basic-info-content"
              id="basic-info-header"
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                Basic Information
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="product"
                    control={control}
                    render={({ field }) => (
                      <FormControl error={!!errors.product} fullWidth>
                        <TextField
                          {...field}
                          label="Product *"
                          variant="outlined"
                          error={!!errors.product}
                          helperText={errors.product?.message}
                          placeholder="Search product by name or SKU"
                          InputProps={{
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
                <Grid item xs={12} md={6}>
                  <Controller
                    name="location"
                    control={control}
                    render={({ field }) => (
                      <FormControl error={!!errors.location} fullWidth>
                        <InputLabel id="location-label">Location *</InputLabel>
                        <Select
                          {...field}
                          labelId="location-label"
                          label="Location *"
                          error={!!errors.location}
                          displayEmpty
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
            </AccordionDetails>
          </Accordion>

          {/* Product Details Section */}
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="product-details-content"
              id="product-details-header"
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                Product Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="serialLotNumber"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <TextField
                          {...field}
                          label="Serial/Lot Number"
                          variant="outlined"
                          placeholder="Enter serial/lot number"
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
                          label="Expiry Date"
                          type="date"
                          value={expiryDateStr}
                          onChange={(e) => {
                            const dateStr = e.target.value;
                            setExpiryDateStr(dateStr);
                            field.onChange(dateStr);
                          }}
                          InputLabelProps={{ shrink: true }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <CalendarTodayIcon />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Adjustment Details Section */}
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="adjustment-details-content"
              id="adjustment-details-header"
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                Adjustment Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="adjustmentType"
                    control={control}
                    render={({ field }) => (
                      <FormControl error={!!errors.adjustmentType} fullWidth>
                        <InputLabel id="adjustment-type-label">Adjustment Type *</InputLabel>
                        <Select
                          {...field}
                          labelId="adjustment-type-label"
                          label="Adjustment Type *"
                          error={!!errors.adjustmentType}
                          displayEmpty
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
                        <InputLabel id="reason-label">Reason *</InputLabel>
                        <Select
                          {...field}
                          labelId="reason-label"
                          label="Reason *"
                          error={!!errors.reason}
                          displayEmpty
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
                        <TextField
                          {...field}
                          label="Quantity *"
                          variant="outlined"
                          type="number"
                          error={!!errors.quantity}
                          helperText={errors.quantity?.message}
                          placeholder="Enter quantity"
                        />
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Current Stock Levels Section */}
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="stock-levels-content"
              id="stock-levels-header"
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                Current Stock Levels
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Paper elevation={0} sx={{ p: 2, flex: '1 0 20%', minWidth: '120px', bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">Stock Quantity</Typography>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>{currentStock.stockQuantity}</Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, flex: '1 0 20%', minWidth: '120px', bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">Reserved</Typography>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>{currentStock.reserved}</Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, flex: '1 0 20%', minWidth: '120px', bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">Non-Saleable</Typography>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>{currentStock.nonSaleable}</Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, flex: '1 0 20%', minWidth: '120px', bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">On Order</Typography>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>{currentStock.onOrder}</Typography>
                    </Paper>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Paper elevation={0} sx={{ p: 2, flex: '1 0 20%', minWidth: '120px', bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">In Transit</Typography>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>{currentStock.inTransit}</Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, flex: '1 0 20%', minWidth: '120px', bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">Returned</Typography>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>{currentStock.returned}</Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, flex: '1 0 20%', minWidth: '120px', bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">On Hold</Typography>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>{currentStock.onHold}</Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, flex: '1 0 20%', minWidth: '120px', bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">Backorder</Typography>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>{currentStock.backorder}</Typography>
                    </Paper>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Additional Notes Section */}
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="notes-content"
              id="notes-header"
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                Additional Notes
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <TextField
                      {...field}
                      label="Notes"
                      variant="outlined"
                      multiline
                      rows={4}
                      placeholder="Enter additional notes"
                    />
                  </FormControl>
                )}
              />
            </AccordionDetails>
          </Accordion>

          {/* Adjustment Summary Section */}
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="summary-content"
              id="summary-header"
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                Adjustment Summary
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">Current Stock</Typography>
                    <Typography variant="h6" color="text.primary" sx={{ fontWeight: 'bold' }}>{currentStock.stockQuantity}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">Adjustment</Typography>
                    <Typography 
                      variant="h6" 
                      color={adjustmentQuantity >= 0 ? 'success.main' : 'error.main'} 
                      sx={{ fontWeight: 'bold' }}
                    >
                      {adjustmentQuantity >= 0 ? `+${adjustmentQuantity}` : adjustmentQuantity}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">New Stock Level</Typography>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>{newStockLevel}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.light', border: '1px solid', borderColor: 'success.main' }}>
                    <Typography variant="caption" color="success.contrastText">Status</Typography>
                    <Typography variant="h6" color="success.contrastText" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon sx={{ mr: 0.5 }} fontSize="small" />
                      Valid Adjustment
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* Bottom action buttons for mobile view */}
        <Box sx={{ mt: 4, display: { sm: 'none' } }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button 
                variant="outlined" 
                fullWidth
                startIcon={<ArrowBackIcon />} 
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button 
                variant="contained" 
                fullWidth
                startIcon={<SaveIcon />}
                type="submit"
              >
                Save
              </Button>
            </Grid>
          </Grid>
        </Box>
      </form>
    </div>
  );
}
