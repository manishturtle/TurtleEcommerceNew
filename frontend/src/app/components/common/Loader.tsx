/**
 * Reusable loader component
 */
import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoaderProps {
  size?: number;
  message?: string;
  fullScreen?: boolean;
}

const Loader: React.FC<LoaderProps> = ({
  size = 40,
  message = 'Loading...',
  fullScreen = false,
}) => {
  const content = (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap={2}
      p={3}
    >
      <CircularProgress size={size} />
      {message && <Typography variant="body2" color="text.secondary">{message}</Typography>}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bgcolor="rgba(255, 255, 255, 0.8)"
        zIndex={9999}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        {content}
      </Box>
    );
  }

  return content;
};

export default Loader;
