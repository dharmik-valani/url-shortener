import { Box, Container, CssBaseline, ThemeProvider } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { theme } from '../styles/theme';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          py: { xs: 4, md: 8 },
          px: 2,
        }}
      >
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
          },
        }}
      />
    </ThemeProvider>
  );
};
