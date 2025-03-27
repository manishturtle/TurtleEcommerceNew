/**
 * Division Form Component
 * 
 * Form for creating and editing divisions in the catalogue
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
  Stack
} from '@mui/material';
import { divisionSchema, DivisionFormValues } from '../schemas';

interface DivisionFormProps {
  defaultValues?: DivisionFormValues;
  onSubmit: (data: DivisionFormValues) => void;
  isSubmitting?: boolean;
  readOnly?: boolean;
}

const DivisionForm: React.FC<DivisionFormProps> = ({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  readOnly = false
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<DivisionFormValues>({
    resolver: zodResolver(divisionSchema),
    defaultValues: defaultValues || {
      name: '',
      description: '',
      is_active: true,
      image: '',
      image_alt_text: ''
    }
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="h6" gutterBottom>
        Division Information
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Division Name"
                fullWidth
                required
                error={!readOnly && !!errors.name}
                helperText={!readOnly && errors.name?.message}
                disabled={readOnly}
                InputProps={{
                  readOnly: readOnly
                }}
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
                error={!readOnly && !!errors.description}
                helperText={!readOnly && errors.description?.message}
                disabled={readOnly}
                InputProps={{
                  readOnly: readOnly
                }}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Controller
            name="image"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Image URL"
                fullWidth
                error={!readOnly && !!errors.image}
                helperText={!readOnly && errors.image?.message}
                disabled={readOnly}
                InputProps={{
                  readOnly: readOnly
                }}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Controller
            name="image_alt_text"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Image Alt Text"
                fullWidth
                error={!readOnly && !!errors.image_alt_text}
                helperText={!readOnly && errors.image_alt_text?.message}
                disabled={readOnly}
                InputProps={{
                  readOnly: readOnly
                }}
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
                    disabled={readOnly}
                  />
                }
                label="Active"
              />
            )}
          />
        </Grid>
        
        {!readOnly && (
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              sx={{ mt: 2 }}
            >
              {isSubmitting ? 'Saving...' : 'Save Division'}
            </Button>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DivisionForm;
