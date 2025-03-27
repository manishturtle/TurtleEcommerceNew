/**
 * Tax Rate Form Component
 * 
 * Form for creating and editing tax rates
 */
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Grid,
  Paper,
  FormHelperText,
  InputAdornment
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { taxRateSchema, TaxRateFormValues } from '../schemas';

interface TaxRateFormProps {
  defaultValues?: Partial<TaxRateFormValues>;
  onSubmit: (data: TaxRateFormValues) => void;
  isSubmitting?: boolean;
}

const TaxRateForm: React.FC<TaxRateFormProps> = ({
  defaultValues = {
    name: '',
    code: '',
    rate: 0,
    description: '',
    is_active: true
  },
  onSubmit,
  isSubmitting = false
}) => {
  const { t } = useTranslation();
  
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<TaxRateFormValues>({
    resolver: zodResolver(taxRateSchema),
    defaultValues: defaultValues as TaxRateFormValues
  });

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('pricing.taxRate.name')}
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
              name="code"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('pricing.taxRate.code')}
                  fullWidth
                  required
                  error={!!errors.code}
                  helperText={errors.code?.message}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Controller
              name="rate"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <TextField
                  {...field}
                  type="number"
                  label={t('pricing.taxRate.rate')}
                  value={value}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                    onChange(val);
                  }}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    inputProps: { min: 0, max: 100, step: 0.01 }
                  }}
                  error={!!errors.rate}
                  helperText={errors.rate?.message}
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
                  label={t('pricing.taxRate.description')}
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
              render={({ field: { value, onChange, ...field } }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={value}
                      onChange={onChange}
                      {...field}
                    />
                  }
                  label={t('pricing.taxRate.isActive')}
                />
              )}
            />
            {errors.is_active && (
              <FormHelperText error>{errors.is_active.message}</FormHelperText>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('common.saving') : t('common.save')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default TaxRateForm;
