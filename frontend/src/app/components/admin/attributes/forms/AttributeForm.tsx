/**
 * Attribute Form Component
 * 
 * Form for creating and editing attributes with data type selection and validation rules
 */
import React, { useEffect } from 'react';
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
  FormLabel,
  MenuItem,
  Select,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';
import { attributeSchema, AttributeFormValues } from '../schemas';
import { useFetchAttributeGroups } from '@/app/hooks/api/attributes';
import { AttributeGroup, AttributeDataType } from '@/app/types/attributes';

interface AttributeFormProps {
  defaultValues?: Partial<AttributeFormValues>;
  onSubmit: (data: AttributeFormValues) => void;
  isSubmitting?: boolean;
}

const AttributeForm: React.FC<AttributeFormProps> = ({
  defaultValues = {
    name: '',
    code: '',
    data_type: AttributeDataType.TEXT,
    description: '',
    is_active: true,
    is_variant_attribute: false,
    is_required: false,
    display_on_pdp: true,
    validation_rules: {},
    groups: []
  },
  onSubmit,
  isSubmitting = false
}) => {
  const { t } = useTranslation();
  
  // Fetch attribute groups for the dropdown
  const { data: attributeGroupsData, isLoading: isLoadingAttributeGroups } = useFetchAttributeGroups();
  
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeSchema),
    defaultValues: defaultValues as AttributeFormValues
  });

  // Watch data_type to conditionally render validation fields
  const dataType = watch('data_type');
  
  // Reset validation rules when data type changes
  useEffect(() => {
    // Only reset validation rules if the data type changes
    setValue('validation_rules', {});
  }, [dataType, setValue]);

  // Create a map of attribute group IDs to attribute group objects for the Autocomplete
  const attributeGroupsMap = React.useMemo(() => {
    if (!attributeGroupsData?.results) return new Map<number, AttributeGroup>();
    
    const map = new Map<number, AttributeGroup>();
    attributeGroupsData.results.forEach(group => {
      map.set(group.id, group);
    });
    
    return map;
  }, [attributeGroupsData]);

  // Render validation fields based on data type
  const renderValidationFields = () => {
    switch (dataType) {
      case AttributeDataType.TEXT:
        return (
          <>
            <Grid item xs={12} md={6}>
              <Controller
                name="validation_rules.min_length"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <TextField
                    {...field}
                    type="number"
                    label={t('attributes.attribute.minLength')}
                    value={value === undefined ? '' : value}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : Number(e.target.value);
                      onChange(val);
                    }}
                    fullWidth
                    InputProps={{
                      inputProps: { min: 0, step: 1 }
                    }}
                    error={!!errors.validation_rules?.min_length}
                  />
                )}
              />
              {errors.validation_rules?.min_length && (
                <FormHelperText error>{String(errors.validation_rules.min_length.message)}</FormHelperText>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="validation_rules.max_length"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <TextField
                    {...field}
                    type="number"
                    label={t('attributes.attribute.maxLength')}
                    value={value === undefined ? '' : value}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : Number(e.target.value);
                      onChange(val);
                    }}
                    fullWidth
                    InputProps={{
                      inputProps: { min: 1, step: 1 }
                    }}
                    error={!!errors.validation_rules?.max_length}
                  />
                )}
              />
              {errors.validation_rules?.max_length && (
                <FormHelperText error>{String(errors.validation_rules.max_length.message)}</FormHelperText>
              )}
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="validation_rules.regex_pattern"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('attributes.attribute.regexPattern')}
                    fullWidth
                    error={!!errors.validation_rules?.regex_pattern}
                  />
                )}
              />
              {errors.validation_rules?.regex_pattern && (
                <FormHelperText error>{String(errors.validation_rules.regex_pattern.message)}</FormHelperText>
              )}
            </Grid>
          </>
        );
      case AttributeDataType.NUMBER:
        return (
          <>
            <Grid item xs={12} md={6}>
              <Controller
                name="validation_rules.min_value"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <TextField
                    {...field}
                    type="number"
                    label={t('attributes.attribute.minValue')}
                    value={value === undefined ? '' : value}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : Number(e.target.value);
                      onChange(val);
                    }}
                    fullWidth
                    error={!!errors.validation_rules?.min_value}
                  />
                )}
              />
              {errors.validation_rules?.min_value && (
                <FormHelperText error>{String(errors.validation_rules.min_value.message)}</FormHelperText>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="validation_rules.max_value"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <TextField
                    {...field}
                    type="number"
                    label={t('attributes.attribute.maxValue')}
                    value={value === undefined ? '' : value}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : Number(e.target.value);
                      onChange(val);
                    }}
                    fullWidth
                    error={!!errors.validation_rules?.max_value}
                  />
                )}
              />
              {errors.validation_rules?.max_value && (
                <FormHelperText error>{String(errors.validation_rules.max_value.message)}</FormHelperText>
              )}
            </Grid>
          </>
        );
      case AttributeDataType.DATE:
        return (
          <>
            <Grid item xs={12} md={6}>
              <Controller
                name="validation_rules.date_format"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('attributes.attribute.dateFormat')}
                    fullWidth
                    error={!!errors.validation_rules?.date_format}
                  />
                )}
              />
              {errors.validation_rules?.date_format ? (
                <FormHelperText error>{String(errors.validation_rules.date_format.message)}</FormHelperText>
              ) : (
                <FormHelperText>e.g., YYYY-MM-DD</FormHelperText>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="validation_rules.min_date"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('attributes.attribute.minDate')}
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.validation_rules?.min_date}
                  />
                )}
              />
              {errors.validation_rules?.min_date && (
                <FormHelperText error>{String(errors.validation_rules.min_date.message)}</FormHelperText>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="validation_rules.max_date"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('attributes.attribute.maxDate')}
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.validation_rules?.max_date}
                  />
                )}
              />
              {errors.validation_rules?.max_date && (
                <FormHelperText error>{String(errors.validation_rules.max_date.message)}</FormHelperText>
              )}
            </Grid>
          </>
        );
      default:
        return null;
    }
  };

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
                  label={t('attributes.attribute.name')}
                  fullWidth
                  required
                  error={!!errors.name}
                />
              )}
            />
            {errors.name && (
              <FormHelperText error>{String(errors.name.message)}</FormHelperText>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('attributes.attribute.code')}
                  fullWidth
                  required
                  error={!!errors.code}
                />
              )}
            />
            {errors.code && (
              <FormHelperText error>{String(errors.code.message)}</FormHelperText>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.data_type}>
              <FormLabel>{t('attributes.attribute.dataType')}</FormLabel>
              <Controller
                name="data_type"
                control={control}
                render={({ field }) => (
                  <Select {...field} displayEmpty>
                    <MenuItem value={AttributeDataType.TEXT}>{t('attributes.dataTypes.text')}</MenuItem>
                    <MenuItem value={AttributeDataType.NUMBER}>{t('attributes.dataTypes.number')}</MenuItem>
                    <MenuItem value={AttributeDataType.BOOLEAN}>{t('attributes.dataTypes.boolean')}</MenuItem>
                    <MenuItem value={AttributeDataType.DATE}>{t('attributes.dataTypes.date')}</MenuItem>
                    <MenuItem value={AttributeDataType.SELECT}>{t('attributes.dataTypes.select')}</MenuItem>
                    <MenuItem value={AttributeDataType.MULTI_SELECT}>{t('attributes.dataTypes.multiSelect')}</MenuItem>
                  </Select>
                )}
              />
              {errors.data_type && (
                <FormHelperText error>{errors.data_type.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('attributes.attribute.description')}
                  fullWidth
                  multiline
                  rows={3}
                  error={!!errors.description}
                />
              )}
            />
            {errors.description && (
              <FormHelperText error>{String(errors.description.message)}</FormHelperText>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.groups}>
              <FormLabel>{t('attributes.attribute.groups')}</FormLabel>
              <Controller
                name="groups"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    id="groups"
                    options={attributeGroupsData?.results || []}
                    getOptionLabel={(option) => {
                      // Handle both AttributeGroup objects and group IDs
                      if (typeof option === 'number') {
                        return attributeGroupsMap.get(option)?.name || String(option);
                      }
                      return option.name;
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (typeof value === 'number') {
                        return option.id === value;
                      }
                      return option.id === value.id;
                    }}
                    loading={isLoadingAttributeGroups}
                    value={field.value.map(id => {
                      const group = attributeGroupsMap.get(id);
                      if (group) return group;
                      return { 
                        id, 
                        name: String(id), 
                        display_order: 0,
                        is_active: true,
                        created_at: '',
                        updated_at: ''
                      };
                    })}
                    onChange={(_, newValue) => {
                      field.onChange(newValue.map(item => typeof item === 'number' ? item : item.id));
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
                        error={!!errors.groups}
                        placeholder={t('attributes.attribute.selectGroups')}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <React.Fragment>
                              {isLoadingAttributeGroups ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </React.Fragment>
                          ),
                        }}
                      />
                    )}
                  />
                )}
              />
              {errors.groups && (
                <FormHelperText error>{errors.groups.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
            <Typography variant="subtitle1" sx={{ my: 2 }}>
              {t('attributes.attribute.attributeOptions')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Controller
              name="is_variant_attribute"
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
                  label={t('attributes.attribute.isVariantAttribute')}
                />
              )}
            />
            {errors.is_variant_attribute && (
              <FormHelperText error>{errors.is_variant_attribute.message}</FormHelperText>
            )}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Controller
              name="is_required"
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
                  label={t('attributes.attribute.isRequired')}
                />
              )}
            />
            {errors.is_required && (
              <FormHelperText error>{errors.is_required.message}</FormHelperText>
            )}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Controller
              name="display_on_pdp"
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
                  label={t('attributes.attribute.displayOnPdp')}
                />
              )}
            />
            {errors.display_on_pdp && (
              <FormHelperText error>{errors.display_on_pdp.message}</FormHelperText>
            )}
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
                  label={t('attributes.attribute.isActive')}
                />
              )}
            />
            {errors.is_active && (
              <FormHelperText error>{errors.is_active.message}</FormHelperText>
            )}
          </Grid>
          
          {(dataType === AttributeDataType.TEXT || 
            dataType === AttributeDataType.NUMBER || 
            dataType === AttributeDataType.DATE) && (
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{t('attributes.attribute.validationRules')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    {renderValidationFields()}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting || isLoadingAttributeGroups}
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

export default AttributeForm;
