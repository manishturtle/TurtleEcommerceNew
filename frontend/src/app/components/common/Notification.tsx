/**
 * Reusable notification component using Snackbar and Alert
 */
import React from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface NotificationProps {
  open: boolean;
  message: string;
  severity: AlertColor;
  onClose: () => void;
  autoHideDuration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 5000,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert 
        onClose={onClose} 
        severity={severity} 
        sx={{ width: '100%' }}
        variant="filled"
        elevation={6}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Notification;
