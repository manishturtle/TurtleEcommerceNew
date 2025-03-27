/**
 * Selling Channel Form Component
 * 
 * Form for creating and editing selling channels
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
import { sellingChannelSchema, SellingChannelFormValues } from '../schemas';

interface SellingChannelFormProps {
  defaultValues?: Partial<SellingChannelFormValues>;
  onSubmit: (data: SellingChannelFormValues) => void;
  isSubmitting?: boolean;
}

const SellingChannelForm: React.FC<SellingChannelFormProps> = ({
  defaultValues = {
    name: '',
    code: '',
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
  } = useForm<SellingChannelFormValues>({
    resolver: zodResolver(sellingChannelSchema),
    defaultValues: defaultValues as SellingChannelFormValues
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
                  label={t('pricing.sellingChannel.name')}
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
                  label={t('pricing.sellingChannel.code')}
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
                  label={t('pricing.sellingChannel.description')}
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
                  label={t('pricing.sellingChannel.isActive')}
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

export default SellingChannelForm;
