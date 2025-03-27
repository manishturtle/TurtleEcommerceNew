/**
 * Subcategory Form Component
 * 
 * Form for creating and editing subcategories in the catalogue
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
import { subcategorySchema, SubcategoryFormValues } from '../schemas';
import { useFetchCategories } from '@/app/hooks/api/catalogue';

interface SubcategoryFormProps {
  defaultValues?: SubcategoryFormValues;
  onSubmit: (data: SubcategoryFormValues) => void;
  isSubmitting?: boolean;
  readOnly?: boolean;
}

const SubcategoryForm: React.FC<SubcategoryFormProps> = ({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  readOnly = false
}) => {
  // Fetch categories for the dropdown
  const { data: categoriesData, isLoading: isLoadingCategories } = useFetchCategories();
  
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: defaultValues || {
      name: '',
      description: '',
      is_active: true,
      category: 0,
      image_url: ''
    }
  });

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Typography variant="h6" gutterBottom>
          Subcategory Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Subcategory Name"
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
              name="category"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!readOnly && !!errors.category} disabled={readOnly}>
                  <InputLabel id="category-label">Category</InputLabel>
                  <Select
                    {...field}
                    labelId="category-label"
                    label="Category"
                    inputProps={{
                      readOnly: readOnly
                    }}
                  >
                    {isLoadingCategories ? (
                      <MenuItem value={0}>Loading categories...</MenuItem>
                    ) : (
                      categoriesData?.results.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {!readOnly && errors.category && (
                    <FormHelperText>{errors.category.message}</FormHelperText>
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
                disabled={isSubmitting || isLoadingCategories}
                sx={{ mt: 2 }}
              >
                {isSubmitting ? 'Saving...' : 'Save Subcategory'}
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>
    </Paper>
  );
};

export default SubcategoryForm;
