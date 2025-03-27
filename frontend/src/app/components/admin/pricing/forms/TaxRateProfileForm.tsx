/**
 * Tax Rate Profile Form Component
 * 
 * Form for creating and editing tax rate profiles with tax rate selection
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
  Autocomplete,
  Chip,
  CircularProgress,
  FormControl,
  FormLabel
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { taxRateProfileSchema, TaxRateProfileFormValues } from '../schemas';
import { useFetchTaxRates } from '@/app/hooks/api/pricing';
import { TaxRate } from '@/app/types/pricing';

interface TaxRateProfileFormProps {
  defaultValues?: Partial<TaxRateProfileFormValues>;
  onSubmit: (data: TaxRateProfileFormValues) => void;
  isSubmitting?: boolean;
}

const TaxRateProfileForm: React.FC<TaxRateProfileFormProps> = ({
  defaultValues = {
    name: '',
    code: '',
    description: '',
    is_active: true,
    tax_rates: [],
    is_default: false
  },
  onSubmit,
  isSubmitting = false
}) => {
  const { t } = useTranslation();
  
  // Fetch tax rates for the dropdown
  const { data: taxRatesData, isLoading: isLoadingTaxRates } = useFetchTaxRates();
  
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<TaxRateProfileFormValues>({
    resolver: zodResolver(taxRateProfileSchema),
    defaultValues: defaultValues as TaxRateProfileFormValues
  });

  // Create a map of tax rate IDs to tax rate objects for the Autocomplete
  const taxRatesMap = React.useMemo(() => {
    if (!taxRatesData?.results) return new Map<number, TaxRate>();
    
    const map = new Map<number, TaxRate>();
    taxRatesData.results.forEach(taxRate => {
      map.set(taxRate.id, taxRate);
    });
    
    return map;
  }, [taxRatesData]);

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
                  label={t('pricing.taxRateProfile.name')}
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
                  label={t('pricing.taxRateProfile.code')}
                  fullWidth
                  required
                  error={!!errors.code}
                  helperText={errors.code?.message}
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
                  label={t('pricing.taxRateProfile.description')}
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
            <FormControl fullWidth error={!!errors.tax_rates}>
              <FormLabel>{t('pricing.taxRateProfile.taxRates')}</FormLabel>
              <Controller
                name="tax_rates"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    id="tax_rates"
                    options={taxRatesData?.results || []}
                    getOptionLabel={(option) => {
                      // Handle both TaxRate objects and tax rate IDs
                      if (typeof option === 'number') {
                        return taxRatesMap.get(option)?.name || String(option);
                      }
                      return option.name;
                    }}
                    loading={isLoadingTaxRates}
                    value={field.value.map(id => taxRatesMap.get(id) || { 
                      id, 
                      name: String(id), 
                      code: '', 
                      rate: 0, 
                      is_active: true,
                      created_at: '',
                      updated_at: ''
                    })}
                    onChange={(_, newValue) => {
                      field.onChange(newValue.map(item => item.id));
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={`${option.name} (${option.rate}%)`}
                          {...getTagProps({ index })}
                          key={option.id}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        error={!!errors.tax_rates}
                        placeholder={t('pricing.taxRateProfile.selectTaxRates')}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <React.Fragment>
                              {isLoadingTaxRates ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </React.Fragment>
                          ),
                        }}
                      />
                    )}
                  />
                )}
              />
              {errors.tax_rates && (
                <FormHelperText error>{errors.tax_rates.message}</FormHelperText>
              )}
            </FormControl>
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
                  label={t('pricing.taxRateProfile.isActive')}
                />
              )}
            />
            {errors.is_active && (
              <FormHelperText error>{errors.is_active.message}</FormHelperText>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Controller
              name="is_default"
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
                  label={t('pricing.taxRateProfile.isDefault')}
                />
              )}
            />
            {errors.is_default && (
              <FormHelperText error>{errors.is_default.message}</FormHelperText>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting || isLoadingTaxRates}
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

export default TaxRateProfileForm;
