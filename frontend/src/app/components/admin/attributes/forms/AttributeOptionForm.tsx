/**
 * Attribute Option Form Component
 * 
 * Form for creating and editing attribute options for SELECT and MULTI_SELECT attributes
 */
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  TextField,
  Button,
  Grid,
  Paper,
  FormHelperText,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { attributeOptionSchema, AttributeOptionFormValues } from '../schemas';
import { useFetchAttributes } from '@/app/hooks/api/attributes';
import { AttributeDataType } from '@/app/types/attributes';

interface AttributeOptionFormProps {
  defaultValues?: Partial<AttributeOptionFormValues>;
  onSubmit: (data: AttributeOptionFormValues) => void;
  isSubmitting?: boolean;
  attributeId?: number; // Optional: If provided, the attribute will be pre-selected and disabled
}

const AttributeOptionForm: React.FC<AttributeOptionFormProps> = ({
  defaultValues = {
    attribute: 0,
    option_label: '',
    option_value: '',
    sort_order: 0
  },
  onSubmit,
  isSubmitting = false,
  attributeId
}) => {
  const { t } = useTranslation();
  
  // Fetch attributes for the dropdown (only SELECT and MULTI_SELECT types)
  const { data: attributesData, isLoading: isLoadingAttributes } = useFetchAttributes({
    data_type: `${AttributeDataType.SELECT},${AttributeDataType.MULTI_SELECT}`
  });
  
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<AttributeOptionFormValues>({
    resolver: zodResolver(attributeOptionSchema),
    defaultValues: {
      ...defaultValues,
      attribute: attributeId || defaultValues.attribute
    } as AttributeOptionFormValues
  });

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.attribute}>
              <FormLabel>{t('attributes.attributeOption.attribute')}</FormLabel>
              <Controller
                name="attribute"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    displayEmpty
                    disabled={!!attributeId}
                    error={!!errors.attribute}
                  >
                    {!attributeId && (
                      <MenuItem value={0} disabled>
                        {isLoadingAttributes 
                          ? t('common.loading') 
                          : t('attributes.attributeOption.selectAttribute')}
                      </MenuItem>
                    )}
                    {attributesData?.results?.map((attribute) => (
                      <MenuItem key={attribute.id} value={attribute.id}>
                        {attribute.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.attribute && (
                <FormHelperText error>{String(errors.attribute.message)}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Controller
              name="option_label"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('attributes.attributeOption.optionLabel')}
                  fullWidth
                  required
                  error={!!errors.option_label}
                />
              )}
            />
            {errors.option_label && (
              <FormHelperText error>{String(errors.option_label.message)}</FormHelperText>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Controller
              name="option_value"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('attributes.attributeOption.optionValue')}
                  fullWidth
                  required
                  error={!!errors.option_value}
                />
              )}
            />
            {errors.option_value && (
              <FormHelperText error>{String(errors.option_value.message)}</FormHelperText>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Controller
              name="sort_order"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <TextField
                  {...field}
                  type="number"
                  label={t('attributes.attributeOption.sortOrder')}
                  value={value === undefined ? '' : value}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                    onChange(val);
                  }}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0, step: 1 }
                  }}
                  error={!!errors.sort_order}
                />
              )}
            />
            {errors.sort_order && (
              <FormHelperText error>{String(errors.sort_order.message)}</FormHelperText>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting || (isLoadingAttributes && !attributeId)}
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

export default AttributeOptionForm;
