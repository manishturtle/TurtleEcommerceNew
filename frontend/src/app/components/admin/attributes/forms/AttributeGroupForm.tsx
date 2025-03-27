/**
 * Attribute Group Form Component
 * 
 * Form for creating and editing attribute groups
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
  FormHelperText
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { attributeGroupSchema, AttributeGroupFormValues } from '../schemas';

interface AttributeGroupFormProps {
  defaultValues?: Partial<AttributeGroupFormValues>;
  onSubmit: (data: AttributeGroupFormValues) => void;
  isSubmitting?: boolean;
}

const AttributeGroupForm: React.FC<AttributeGroupFormProps> = ({
  defaultValues = {
    name: '',
    display_order: 0,
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
  } = useForm<AttributeGroupFormValues>({
    resolver: zodResolver(attributeGroupSchema),
    defaultValues: defaultValues as AttributeGroupFormValues
  });

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('attributes.attributeGroup.name')}
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name ? errors.name.message : ''}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Controller
              name="display_order"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <TextField
                  {...field}
                  type="number"
                  label={t('attributes.attributeGroup.displayOrder')}
                  value={value === undefined ? '' : value}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : Number(e.target.value);
                    onChange(val);
                  }}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0, step: 1 }
                  }}
                  error={!!errors.display_order}
                  helperText={errors.display_order ? errors.display_order.message : ''}
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
                  label={t('attributes.attributeGroup.isActive')}
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

export default AttributeGroupForm;
