/**
 * Confirm Dialog Component
 * 
 * Reusable dialog for confirming actions like deletion
 */
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  content: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  content,
  onConfirm,
  onCancel,
  isLoading = false,
  confirmText,
  cancelText
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary" disabled={isLoading}>
          {cancelText || t('common.cancel')}
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error" 
          variant="contained" 
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? t('common.processing') : confirmText || t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
