import { useState } from 'react';
import { Box, TextField, Button, IconButton } from '@mui/material';
import {
  Code as CodeIcon,
  Link as LinkIcon,
  QrCode2 as QrCodeIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { validateUrl } from '../../../utils/validation';
import { useUrlShortener } from '../hooks/useUrlShortener';

import { UrlData } from '../../../types/api';

interface UrlFormProps {
  onSuccess: (data: UrlData) => void;
}

export const UrlForm = ({ onSuccess }: UrlFormProps) => {
  const [url, setUrl] = useState('');
  const { shortenUrl, isLoading } = useUrlShortener();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let urlToShorten = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      urlToShorten = `https://${url}`;
    }

    if (!validateUrl(urlToShorten)) return;

    try {
      const response = await shortenUrl(urlToShorten);
      if (response.success && response.data) {
        onSuccess(response.data);
        setUrl('');
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const ActionIcon = ({ icon: Icon }: { icon: typeof CodeIcon }) => (
    <IconButton
      sx={{
        bgcolor: 'secondary.main',
        width: 56,
        height: 56,
        '&:hover': {
          bgcolor: 'secondary.light',
        },
      }}
    >
      <Icon />
    </IconButton>
  );

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        gap: 2,
        mb: 2,
      }}
    >
      <ActionIcon icon={CodeIcon} />
      <ActionIcon icon={LinkIcon} />

      <TextField
        fullWidth
        placeholder="Type or paste a link (URL)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        sx={{
          flex: 1,
          '& .MuiOutlinedInput-root': {
            height: 56,
          },
        }}
      />

      <Button
        type="submit"
        variant="contained"
        disabled={isLoading}
        sx={{
          minWidth: 180,
          height: 56,
          whiteSpace: 'nowrap',
        }}
      >
        {isLoading ? 'SHORTENING...' : 'SHORTEN FOR FREE'}
      </Button>

      <ActionIcon icon={QrCodeIcon} />
      <ActionIcon icon={LanguageIcon} />
    </Box>
  );
};
