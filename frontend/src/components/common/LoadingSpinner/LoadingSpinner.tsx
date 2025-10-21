import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message = 'Cargando...'
}) => {
  const getSizeInPixels = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'medium':
        return 40;
      case 'large':
        return 56;
      default:
        return 40;
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      padding={4}
    >
      <CircularProgress
        size={size}
        thickness={4}
        sx={{
          color: 'primary.main',
        }}
      />
      {message && (
        <Typography
          variant="body2"
          sx={{
            marginTop: 2,
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;