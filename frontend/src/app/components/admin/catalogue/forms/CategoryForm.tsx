/**
 * Category Form Component
 * 
 * Form for creating and editing categories in the catalogue
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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';
import { categorySchema, CategoryFormValues } from '../schemas';
import { useFetchDivisions } from '@/app/hooks/api/catalogue';

interface CategoryFormProps {
  defaultValues?: CategoryFormValues;
  onSubmit: (data: CategoryFormValues) => void;
  isSubmitting?: boolean;
  readOnly?: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  readOnly = false
}) => {
  // Fetch divisions for the dropdown
  const { data: divisionsData, isLoading: isLoadingDivisions } = useFetchDivisions();
  
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: defaultValues || {
      name: '',
      description: '',
      is_active: true,
      division: 0,
      image_url: ''
    }
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="h6" gutterBottom>
        Category Information
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Category Name"
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
            name="division"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!readOnly && !!errors.division} disabled={readOnly}>
                <InputLabel id="division-label">Division</InputLabel>
                <Select
                  {...field}
                  labelId="division-label"
                  label="Division"
                  inputProps={{
                    readOnly: readOnly
                  }}
                >
                  {isLoadingDivisions ? (
                    <MenuItem value={0}>Loading divisions...</MenuItem>
                  ) : !divisionsData || !Array.isArray(divisionsData) ? (
                    <MenuItem value={0}>No divisions available</MenuItem>
                  ) : (
                    divisionsData.map((division) => (
                      <MenuItem key={division.id} value={division.id}>
                        {division.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {!readOnly && errors.division && (
                  <FormHelperText>{errors.division.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Controller
            name="image_url"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Image URL"
                fullWidth
                error={!readOnly && !!errors.image_url}
                helperText={!readOnly && errors.image_url?.message}
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
              {isSubmitting ? 'Saving...' : 'Save Category'}
            </Button>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default CategoryForm;
