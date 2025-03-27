/**
 * Product Status Form Component
 * 
 * Form for creating and editing product statuses in the catalogue
 */
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Typography,
  Paper,
  MenuItem
} from '@mui/material';
import { productStatusSchema, ProductStatusFormValues } from '../schemas';

// Available color options for product statuses
const COLOR_OPTIONS = [
  { value: 'primary', label: 'Primary (Blue)' },
  { value: 'secondary', label: 'Secondary (Purple)' },
  { value: 'success', label: 'Success (Green)' },
  { value: 'error', label: 'Error (Red)' },
  { value: 'warning', label: 'Warning (Orange)' },
  { value: 'info', label: 'Info (Light Blue)' },
];

interface ProductStatusFormProps {
  defaultValues?: ProductStatusFormValues;
  onSubmit: (data: ProductStatusFormValues) => void;
  isSubmitting?: boolean;
}

const ProductStatusForm: React.FC<ProductStatusFormProps> = ({
  defaultValues,
  onSubmit,
  isSubmitting = false
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<ProductStatusFormValues>({
    resolver: zodResolver(productStatusSchema),
    defaultValues: defaultValues || {
      name: '',
      description: '',
      is_active: true,
      color: 'primary'
    }
  });

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Typography variant="h6" gutterBottom>
          Product Status Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Status Name"
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Color"
                  fullWidth
                  error={!!errors.color}
                  helperText={errors.color?.message || "Select a color for visual representation"}
                >
                  {COLOR_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Active"
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              sx={{ mt: 2 }}
            >
              {isSubmitting ? 'Saving...' : 'Save Product Status'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ProductStatusForm;
