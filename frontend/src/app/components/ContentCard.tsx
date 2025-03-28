import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface ContentCardProps {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  sx?: any;
}

const ContentCard: React.FC<ContentCardProps> = ({ 
  title, 
  children, 
  action,
  sx = {} 
}) => {
  return (
    <Paper 
      elevation={0}
      sx={{ 
        borderRadius: 3,
        overflow: 'hidden',
        ...sx
      }}
    >
      {title && (
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {action && (
            <Box>
              {action}
            </Box>
          )}
        </Box>
      )}
      <Box sx={{ p: title ? 0 : 3 }}>
        {children}
      </Box>
    </Paper>
  );
};

export default ContentCard;
