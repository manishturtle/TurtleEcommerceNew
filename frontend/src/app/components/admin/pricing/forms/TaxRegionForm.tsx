/**
 * Tax Region Form Component
 * 
 * Form for creating and editing tax regions with country selection
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
import { taxRegionSchema, TaxRegionFormValues } from '../schemas';
import { useFetchCountries } from '@/app/hooks/api/pricing';
import { Country } from '@/app/types/pricing';

interface TaxRegionFormProps {
  defaultValues?: Partial<TaxRegionFormValues>;
  onSubmit: (data: TaxRegionFormValues) => void;
  isSubmitting?: boolean;
}

const TaxRegionForm: React.FC<TaxRegionFormProps> = ({
  defaultValues = {
    name: '',
    code: '',
    description: '',
    is_active: true,
    countries: []
  },
  onSubmit,
  isSubmitting = false
}) => {
  const { t } = useTranslation();
  
  // Fetch countries for the dropdown
  const { data: countriesData, isLoading: isLoadingCountries } = useFetchCountries();
  
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<TaxRegionFormValues>({
    resolver: zodResolver(taxRegionSchema),
    defaultValues: defaultValues as TaxRegionFormValues
  });

  // Create a map of country IDs to country objects for the Autocomplete
  const countriesMap = React.useMemo(() => {
    if (!countriesData) return new Map<number, Country>();
    
    const map = new Map<number, Country>();
    countriesData.forEach(country => {
      map.set(country.id, country);
    });
    
    return map;
  }, [countriesData]);

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
                  label={t('pricing.taxRegion.name')}
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
                  label={t('pricing.taxRegion.code')}
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
                  label={t('pricing.taxRegion.description')}
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
            <FormControl fullWidth error={!!errors.countries}>
              <FormLabel>{t('pricing.taxRegion.countries')}</FormLabel>
              <Controller
                name="countries"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    id="countries"
                    options={countriesData || []}
                    getOptionLabel={(option) => {
                      // Handle both Country objects and country IDs
                      if (typeof option === 'number') {
                        return countriesMap.get(option)?.name || String(option);
                      }
                      return option.name;
                    }}
                    loading={isLoadingCountries}
                    value={field.value.map(id => countriesMap.get(id) || { id, name: String(id), code: '' })}
                    onChange={(_, newValue) => {
                      field.onChange(newValue.map(item => item.id));
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option.name}
                          {...getTagProps({ index })}
                          key={option.id}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        error={!!errors.countries}
                        placeholder={t('pricing.taxRegion.selectCountries')}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <React.Fragment>
                              {isLoadingCountries ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </React.Fragment>
                          ),
                        }}
                      />
                    )}
                  />
                )}
              />
              {errors.countries && (
                <FormHelperText error>{errors.countries.message}</FormHelperText>
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
                  label={t('pricing.taxRegion.isActive')}
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
                disabled={isSubmitting || isLoadingCountries}
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

export default TaxRegionForm;
