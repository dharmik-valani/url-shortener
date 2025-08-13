import { Box, Typography, Link, IconButton, Paper, Stack, Button } from '@mui/material';
import {
  ContentCopy as ContentCopyIcon,
  Share as ShareIcon,
  List as ListIcon,
  Lock as LockIcon,
  Analytics as AnalyticsIcon,
  Star as StarIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

interface UrlResultProps {
  urlData: {
    shortUrl: string;
    originalUrl: string;
    qrCode: string;
  };
  onReset: () => void;
}

export const UrlResult = ({ urlData, onReset }: UrlResultProps) => {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <>
      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: '1.125rem',
          mb: 6,
        }}
      >
        Well done! You created your first branded link and QR code
      </Typography>

      <Paper
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'grey.200',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            p: 3,
            borderBottom: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'secondary.main',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 3,
            }}
          >
            <LinkIcon sx={{ fontSize: 32 }} />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', mb: 1 }}
            >
              Your shortened trackable link
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
              }}
            >
              <Link
                href={urlData.shortUrl}
                target="_blank"
                sx={{
                  color: 'primary.main',
                  fontWeight: 500,
                  fontSize: '1.125rem',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {urlData.shortUrl}
              </Link>
              <IconButton
                onClick={(e) => {
                  e.preventDefault();
                  copyToClipboard(urlData.shortUrl);
                }}
                size="small"
                sx={{
                  color: 'primary.main',
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              Destination URL
            </Typography>
            <Typography sx={{ color: 'text.primary' }}>
              {urlData.originalUrl}
            </Typography>
          </Box>

          <Box sx={{ ml: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.open(urlData.qrCode, '_blank')}
              sx={{
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.light',
                },
              }}
            >
              Download QR
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
          }}
        >
          <Stack direction="row" spacing={1}>
            <IconButton size="small">
              <ShareIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <ListIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <LockIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <AnalyticsIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <StarIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          mt: 3,
          p: 3,
          bgcolor: 'background.paper',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'grey.200',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Ready to create more links?
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Get started for free and unlock your link management journey!
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={onReset}
          sx={{
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.light',
            },
          }}
        >
          Get started
        </Button>
      </Paper>
    </>
  );
};
