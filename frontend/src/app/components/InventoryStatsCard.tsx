import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface InventoryStatsCardProps {
  title: string;
  value: string;
  changeValue?: string;
  changeDirection?: 'up' | 'down' | 'neutral';
  sx?: any;
}

const InventoryStatsCard: React.FC<InventoryStatsCardProps> = ({ 
  title, 
  value, 
  changeValue, 
  changeDirection = 'neutral',
  sx = {}
}) => {
  // Determine color based on direction
  const getChangeColor = () => {
    switch (changeDirection) {
      case 'up':
        return 'success.main';
      case 'down':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  // Determine arrow symbol based on direction
  const getChangeSymbol = () => {
    switch (changeDirection) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '';
    }
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 3,
        height: '100%',
        ...sx
      }}
    >
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
        {value}
      </Typography>
      {changeValue && (
        <Box sx={{ display: 'flex', alignItems: 'center', color: getChangeColor() }}>
          <Box component="span" sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mr: 0.5,
            fontSize: '0.875rem'
          }}>
            {getChangeSymbol()} {changeValue}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default InventoryStatsCard;
