import { Box, Stack, Typography } from '@mui/material';

interface SecurityBadgeProps {
  color: string;
  text: string;
}

const SecurityBadge = ({ color, text }: SecurityBadgeProps) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      bgcolor: 'background.paper',
      px: 2,
      py: 1,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'grey.200',
    }}
  >
    <Box
      component="span"
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: color,
      }}
    />
    <Typography
      sx={{
        fontSize: '0.875rem',
        color: 'text.primary',
        fontWeight: 500,
      }}
    >
      {text}
    </Typography>
  </Box>
);

export const SecurityBadges = () => {
  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent="center"
      sx={{ mt: 4 }}
    >
      <SecurityBadge color="#22c55e" text="Secure & Fast" />
      <SecurityBadge color="#3b82f6" text="HTTPS Protected" />
    </Stack>
  );
};
