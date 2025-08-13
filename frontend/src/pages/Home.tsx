import { useState } from 'react';
import { Box, Typography, Link } from '@mui/material';
import { UrlForm } from '../features/url-shortener/components/UrlForm';
import { UrlResult } from '../features/url-shortener/components/UrlResult';
import { SecurityBadges } from '../components/SecurityBadges';

interface UrlData {
  shortUrl: string;
  originalUrl: string;
  qrCode: string;
}

export const Home = () => {
  const [urlData, setUrlData] = useState<UrlData | null>(null);

  return (
    <Box sx={{ 
      maxWidth: '800px',
      mx: 'auto',
      textAlign: 'center',
    }}>
      <Typography
        variant="h1"
        sx={{
          mb: 2,
          background: 'linear-gradient(45deg, #111827 30%, #374151 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Free URL
        <br />
        shortener & QR
        <br />
        code generator
      </Typography>

      {!urlData ? (
        <>
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: '1.125rem',
              mb: 6,
            }}
          >
            Create short, memorable links perfect for sharing on WhatsApp, SMS, QR codes, and social media.
          </Typography>

          <UrlForm onSuccess={setUrlData} />

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.875rem',
            }}
          >
            By clicking "Shorten for free", you agree to our{' '}
            <Link href="#" sx={{ color: 'primary.main' }}>
              Terms of Use
            </Link>
            ,{' '}
            <Link href="#" sx={{ color: 'primary.main' }}>
              Privacy Policy
            </Link>
            {' '}and{' '}
            <Link href="#" sx={{ color: 'primary.main' }}>
              Cookie Policy
            </Link>
            .
          </Typography>
        </>
      ) : (
        <UrlResult 
          urlData={urlData} 
          onReset={() => setUrlData(null)} 
        />
      )}

      <SecurityBadges />
    </Box>
  );
};
