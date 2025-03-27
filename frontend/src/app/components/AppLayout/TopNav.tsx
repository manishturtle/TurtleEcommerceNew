'use client';

import {
  AppBar,
  IconButton,
  Toolbar,
  Typography,
  useTheme,
  Menu,
  MenuItem,
  Box,
  Tooltip,
  Avatar,
  Divider,
  alpha,
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Brightness4, 
  Brightness7,
  ColorLens,
  Translate,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useThemeContext } from '@/app/theme/ThemeContext';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { getTranslation } from '@/app/i18n/languageUtils';

interface TopNavProps {
  onMenuClick: () => void;
  isDrawerOpen: boolean;
}

export default function TopNav({ onMenuClick, isDrawerOpen }: TopNavProps) {
  const theme = useTheme();
  const { mode, color, toggleTheme, changeThemeColor } = useThemeContext();
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  const [colorMenuAnchor, setColorMenuAnchor] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [langMenuAnchor, setLangMenuAnchor] = useState<null | HTMLElement>(null);

  // Function to translate text
  const t = (key: string) => getTranslation(key, currentLanguage);

  const handleColorMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setColorMenuAnchor(event.currentTarget);
  };

  const handleColorMenuClose = () => {
    setColorMenuAnchor(null);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  const handleLangMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLangMenuAnchor(event.currentTarget);
  };

  const handleLangMenuClose = () => {
    setLangMenuAnchor(null);
  };

  const colorOptions = [
    { name: 'Blue', value: 'blue', color: '#1976d2' },
    { name: 'Purple', value: 'purple', color: '#7b1fa2' },
    { name: 'Green', value: 'green', color: '#2e7d32' },
    { name: 'Teal', value: 'teal', color: '#00796b' },
    { name: 'Indigo', value: 'indigo', color: '#3f51b5' },
    { name: 'Amber', value: 'amber', color: '#ff8f00' },
  ];

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: (theme) => theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        boxShadow: 'none',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) => 
          theme.palette.mode === 'light' 
            ? theme.palette.background.paper
            : theme.palette.background.paper,
      }}
    >
      <Toolbar component="nav" role="navigation" aria-label="Main navigation">
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography 
          variant="h6" 
          noWrap 
          component="div" 
          sx={{ flexGrow: 1 }}
        >
          {t('app.title')}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Language selector */}
          <Tooltip title="Change language">
            <IconButton 
              color="inherit" 
              onClick={handleLangMenuOpen}
              sx={{ ml: 1 }}
            >
              <Translate />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={langMenuAnchor}
            open={Boolean(langMenuAnchor)}
            onClose={handleLangMenuClose}
            PaperProps={{
              elevation: 3,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                width: 180,
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 600 }}>
              Select Language
            </Typography>
            <Divider />
            {languages.map((lang) => (
              <MenuItem 
                key={lang.code} 
                onClick={() => {
                  changeLanguage(lang.code);
                  handleLangMenuClose();
                }}
                selected={currentLanguage === lang.code}
                sx={{ py: 1.5 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{t(`languages.${lang.code}`)}</span>
                  {currentLanguage === lang.code && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                      }}
                    />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Menu>
          
          {/* Theme toggle button */}
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton 
              color="inherit" 
              onClick={toggleTheme} 
              sx={{ ml: 1 }}
            >
              {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
            </IconButton>
          </Tooltip>
          
          {/* Color theme selector */}
          <Tooltip title="Change theme color">
            <IconButton 
              color="inherit" 
              onClick={handleColorMenuOpen}
              sx={{ ml: 1 }}
            >
              <ColorLens />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={colorMenuAnchor}
            open={Boolean(colorMenuAnchor)}
            onClose={handleColorMenuClose}
            PaperProps={{
              elevation: 3,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                width: 180,
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 600 }}>
              {t('app.theme.colors')}
            </Typography>
            <Divider />
            {colorOptions.map((option) => (
              <MenuItem 
                key={option.value} 
                onClick={() => {
                  changeThemeColor(option.value as any);
                  handleColorMenuClose();
                }}
                selected={color === option.value}
                sx={{ py: 1.5 }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: option.color,
                    mr: 2,
                    border: '2px solid',
                    borderColor: color === option.value ? 'primary.main' : 'transparent',
                  }}
                />
                {option.name}
              </MenuItem>
            ))}
          </Menu>
          
          {/* User menu */}
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleUserMenuOpen}
              sx={{ ml: 2 }}
              aria-controls={Boolean(userMenuAnchor) ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(userMenuAnchor) ? 'true' : undefined}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>U</Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            id="account-menu"
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            PaperProps={{
              elevation: 3,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                width: 180,
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleUserMenuClose}>{t('app.menu.profile')}</MenuItem>
            <MenuItem onClick={handleUserMenuClose}>{t('app.menu.settings')}</MenuItem>
            <Divider />
            <MenuItem onClick={handleUserMenuClose}>{t('app.menu.logout')}</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
