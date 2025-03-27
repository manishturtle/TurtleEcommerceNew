'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../i18n/LanguageContext';
import { 
  formatDate, 
  formatRelativeDate, 
  formatTimeDistance, 
  formatNumber, 
  formatCurrency 
} from '@/lib/formatUtils';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Divider,
  Paper
} from '@mui/material';

export default function I18nDemoPage() {
  const { t } = useTranslation('common');
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  
  // Sample data for formatting examples
  const now = new Date();
  const pastDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
  const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days in future
  const sampleNumber = 1234567.89;
  const samplePrice = 1299.99;

  // Handle language change without page reload
  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t('appName')} - Internationalization Demo
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          {t('language')} Selection
        </Typography>
        
        <FormControl sx={{ minWidth: 200, mb: 2 }}>
          <InputLabel id="language-select-label">{t('language')}</InputLabel>
          <Select
            labelId="language-select-label"
            value={currentLanguage}
            label={t('language')}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            {languages.map((lang) => (
              <MenuItem key={lang.code} value={lang.code}>
                {lang.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">
            Current language: <strong>{currentLanguage}</strong>
          </Typography>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Basic Translations
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  App Title: <strong>{t('app.title')}</strong>
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Profile: <strong>{t('app.menu.profile')}</strong>
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Settings: <strong>{t('app.menu.settings')}</strong>
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Search: <strong>{t('app.search')}</strong>
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Button variant="contained" color="primary">
                  {t('app.menu.profile')}
                </Button>{' '}
                <Button variant="outlined" color="secondary">
                  {t('app.menu.logout')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Date & Number Formatting
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Current Date: <strong>{formatDate(now)}</strong>
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Past Date: <strong>{formatDate(pastDate)}</strong>
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Relative Time (Past): <strong>{formatTimeDistance(pastDate)}</strong>
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Relative Time (Future): <strong>{formatTimeDistance(futureDate)}</strong>
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Number: <strong>{formatNumber(sampleNumber)}</strong>
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Currency: <strong>{formatCurrency(samplePrice)}</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
