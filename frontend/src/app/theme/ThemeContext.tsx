'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, alpha } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeMode = 'light' | 'dark';
type ThemeColor = 'blue' | 'purple' | 'green' | 'teal' | 'indigo' | 'amber';

interface ThemeContextType {
  mode: ThemeMode;
  color: ThemeColor;
  toggleTheme: () => void;
  changeThemeColor: (color: ThemeColor) => void;
}

const themeColors = {
  blue: {
    light: { 
      primary: '#1976d2', 
      secondary: '#f50057',
      background: '#f5f7fa',
      paper: '#ffffff',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    },
    dark: { 
      primary: '#90caf9', 
      secondary: '#f48fb1',
      background: '#121212',
      paper: '#1e1e1e',
      success: '#81c784',
      warning: '#ffb74d',
      error: '#e57373',
      info: '#64b5f6'
    },
  },
  purple: {
    light: { 
      primary: '#7b1fa2', 
      secondary: '#00bcd4',
      background: '#f8f6fc',
      paper: '#ffffff',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    },
    dark: { 
      primary: '#ba68c8', 
      secondary: '#80deea',
      background: '#121212',
      paper: '#1e1e1e',
      success: '#81c784',
      warning: '#ffb74d',
      error: '#e57373',
      info: '#64b5f6'
    },
  },
  green: {
    light: { 
      primary: '#2e7d32', 
      secondary: '#ff5722',
      background: '#f1f8e9',
      paper: '#ffffff',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    },
    dark: { 
      primary: '#81c784', 
      secondary: '#ff8a65',
      background: '#121212',
      paper: '#1e1e1e',
      success: '#81c784',
      warning: '#ffb74d',
      error: '#e57373',
      info: '#64b5f6'
    },
  },
  teal: {
    light: { 
      primary: '#00796b', 
      secondary: '#ec407a',
      background: '#e0f2f1',
      paper: '#ffffff',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    },
    dark: { 
      primary: '#4db6ac', 
      secondary: '#f48fb1',
      background: '#121212',
      paper: '#1e1e1e',
      success: '#81c784',
      warning: '#ffb74d',
      error: '#e57373',
      info: '#64b5f6'
    },
  },
  indigo: {
    light: { 
      primary: '#3f51b5', 
      secondary: '#ff4081',
      background: '#e8eaf6',
      paper: '#ffffff',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    },
    dark: { 
      primary: '#7986cb', 
      secondary: '#ff80ab',
      background: '#121212',
      paper: '#1e1e1e',
      success: '#81c784',
      warning: '#ffb74d',
      error: '#e57373',
      info: '#64b5f6'
    },
  },
  amber: {
    light: { 
      primary: '#ff8f00', 
      secondary: '#448aff',
      background: '#fff8e1',
      paper: '#ffffff',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    },
    dark: { 
      primary: '#ffd54f', 
      secondary: '#82b1ff',
      background: '#121212',
      paper: '#1e1e1e',
      success: '#81c784',
      warning: '#ffb74d',
      error: '#e57373',
      info: '#64b5f6'
    },
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [color, setColor] = useState<ThemeColor>('blue');

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('themeMode') as ThemeMode;
      const savedColor = localStorage.getItem('themeColor') as ThemeColor;
      
      if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
        setMode(savedMode);
      }
      
      if (savedColor && themeColors[savedColor] && Object.keys(themeColors).includes(savedColor)) {
        setColor(savedColor);
      }
    } catch (error) {
      console.error('Error loading theme from localStorage:', error);
      // Reset to defaults if there's an error
      setMode('light');
      setColor('blue');
    }
  }, []);

  // Ensure we have valid values before creating the theme
  const safeMode = mode === 'light' || mode === 'dark' ? mode : 'light';
  const safeColor = themeColors[color] ? color : 'blue';

  const theme = createTheme({
    palette: {
      mode: safeMode,
      primary: {
        main: themeColors[safeColor][safeMode].primary,
      },
      secondary: {
        main: themeColors[safeColor][safeMode].secondary,
      },
      background: {
        default: themeColors[safeColor][safeMode].background,
        paper: themeColors[safeColor][safeMode].paper,
      },
      success: {
        main: themeColors[safeColor][safeMode].success,
      },
      warning: {
        main: themeColors[safeColor][safeMode].warning,
      },
      error: {
        main: themeColors[safeColor][safeMode].error,
      },
      info: {
        main: themeColors[safeColor][safeMode].info,
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: safeMode === 'light' 
              ? '0 2px 4px rgba(0,0,0,0.08)' 
              : '0 2px 4px rgba(0,0,0,0.15)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: safeMode === 'light' 
              ? 'linear-gradient(rgba(255,255,255,0.05), rgba(255,255,255,0.05))' 
              : 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15))',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: safeMode === 'light' 
              ? '0 2px 8px rgba(0,0,0,0.06)' 
              : '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'box-shadow 0.3s ease-in-out',
            '&:hover': {
              boxShadow: safeMode === 'light' 
                ? '0 4px 12px rgba(0,0,0,0.1)' 
                : '0 4px 12px rgba(0,0,0,0.3)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '8px',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            },
          },
        },
      },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 600,
      },
      h2: {
        fontWeight: 600,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      button: {
        fontWeight: 500,
      },
    },
  });

  const toggleTheme = () => {
    const newMode = safeMode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  const changeThemeColor = (newColor: ThemeColor) => {
    setColor(newColor);
    localStorage.setItem('themeColor', newColor);
  };

  return (
    <ThemeContext.Provider value={{ mode: safeMode, color: safeColor, toggleTheme, changeThemeColor }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
