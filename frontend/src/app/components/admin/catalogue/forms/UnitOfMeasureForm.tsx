/**
 * Unit of Measure Form Component
 * 
 * Form for creating and editing units of measure in the catalogue
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
  Paper
} from '@mui/material';
import { unitOfMeasureSchema, UnitOfMeasureFormValues } from '../schemas';

interface UnitOfMeasureFormProps {
  defaultValues?: UnitOfMeasureFormValues;
  onSubmit: (data: UnitOfMeasureFormValues) => void;
  isSubmitting?: boolean;
}

const UnitOfMeasureForm: React.FC<UnitOfMeasureFormProps> = ({
  defaultValues,
  onSubmit,
  isSubmitting = false
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<UnitOfMeasureFormValues>({
    resolver: zodResolver(unitOfMeasureSchema),
    defaultValues: defaultValues || {
      name: '',
      symbol: '',
      description: '',
      is_active: true
    }
  });

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Typography variant="h6" gutterBottom>
          Unit of Measure Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Name"
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Controller
              name="symbol"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Symbol"
                  fullWidth
                  required
                  error={!!errors.symbol}
                  helperText={errors.symbol?.message}
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
              {isSubmitting ? 'Saving...' : 'Save Unit of Measure'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default UnitOfMeasureForm;
