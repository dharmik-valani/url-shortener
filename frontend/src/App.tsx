import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster, toast } from 'react-hot-toast'
import {
  Box,
  Button,
  Container,
  CssBaseline,
  IconButton,
  Link,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material'
import {
  Code as CodeIcon,
  Link as LinkIcon,
  QrCode2 as QrCodeIcon,
  Language as LanguageIcon,
  ContentCopy as ContentCopyIcon,
  Share as ShareIcon,
  List as ListIcon,
  Lock as LockIcon,
  Analytics as AnalyticsIcon,
  Star as StarIcon,
} from '@mui/icons-material'

const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'uppercase',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.875rem',
          padding: '12px 24px',
          backgroundColor: '#111827',
          '&:hover': {
            backgroundColor: '#374151',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#fff',
            borderRadius: 8,
            fontSize: '1rem',
            '& fieldset': {
              borderColor: '#e5e7eb',
            },
            '&:hover fieldset': {
              borderColor: '#d1d5db',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2563eb',
            },
          },
        },
      },
    },
  },
})

const queryClient = new QueryClient()

interface UrlData {
  shortUrl: string;
  originalUrl: string;
  qrCode: string;
}

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [urlData, setUrlData] = useState<UrlData | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) {
      toast.error('Please enter a URL')
      return
    }

    let urlToShorten = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      urlToShorten = `https://${url}`
    }

    try {
      new URL(urlToShorten)
    } catch (error) {
      toast.error('Please enter a valid URL')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ originalUrl: urlToShorten }),
      })

      const data = await response.json()
      
      if (data.success) {
        setUrlData(data.data)
        toast.success('URL shortened successfully!')
      } else {
        throw new Error(data.error || 'Failed to shorten URL')
      }
    } catch (error) {
      console.error('Error:', error)
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          toast.error('Unable to connect to the server. Please make sure the backend is running.')
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        
        <Box sx={{ 
          minHeight: '100vh',
          bgcolor: '#f0f9ff',
          py: { xs: 4, md: 8 },
          px: 2,
        }}>
          <Container maxWidth="lg">
            <Box sx={{ 
              maxWidth: '800px',
              mx: 'auto',
              textAlign: 'center',
            }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 500,
                  color: '#111827',
                  mb: 2,
                  lineHeight: 1.2,
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
                      color: '#6b7280',
                      fontSize: '1.125rem',
                      mb: 6,
                    }}
                  >
                    Create short, memorable links perfect for sharing on WhatsApp, SMS, QR codes, and social media.
                  </Typography>

                  <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <IconButton
                      sx={{
                        bgcolor: '#fef9c3',
                        width: 56,
                        height: 56,
                        '&:hover': {
                          bgcolor: '#fef08a',
                        },
                      }}
                    >
                      <CodeIcon />
                    </IconButton>

                    <IconButton
                      sx={{
                        bgcolor: '#fef9c3',
                        width: 56,
                        height: 56,
                        '&:hover': {
                          bgcolor: '#fef08a',
                        },
                      }}
                    >
                      <LinkIcon />
                    </IconButton>

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
                      disabled={loading}
                      sx={{
                        minWidth: 180,
                        height: 56,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {loading ? 'SHORTENING...' : 'SHORTEN FOR FREE'}
                    </Button>

                    <IconButton
                      sx={{
                        bgcolor: '#fef9c3',
                        width: 56,
                        height: 56,
                        '&:hover': {
                          bgcolor: '#fef08a',
                        },
                      }}
                    >
                      <QrCodeIcon />
                    </IconButton>

                    <IconButton
                      sx={{
                        bgcolor: '#fef9c3',
                        width: 56,
                        height: 56,
                        '&:hover': {
                          bgcolor: '#fef08a',
                        },
                      }}
                    >
                      <LanguageIcon />
                    </IconButton>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      color: '#6b7280',
                      fontSize: '0.875rem',
                    }}
                  >
                    By clicking "Shorten for free", you agree to our{' '}
                    <Link href="#" sx={{ color: '#2563eb' }}>
                      Terms of Use
                    </Link>
                    ,{' '}
                    <Link href="#" sx={{ color: '#2563eb' }}>
                      Privacy Policy
                    </Link>
                    {' '}and{' '}
                    <Link href="#" sx={{ color: '#2563eb' }}>
                      Cookie Policy
                    </Link>
                    .
                  </Typography>
                </>
              ) : (
                <>
                  <Typography
                    sx={{
                      color: '#6b7280',
                      fontSize: '1.125rem',
                      mb: 6,
                    }}
                  >
                    Well done! You created your first branded link and QR code
                  </Typography>

                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: 'white',
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
                          bgcolor: '#fef9c3',
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
                          sx={{ color: 'grey.600', mb: 1 }}
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

                        <Typography variant="body2" sx={{ color: 'grey.600', mb: 1 }}>
                          Destination URL
                        </Typography>
                        <Typography sx={{ color: 'grey.900' }}>
                          {urlData.originalUrl}
                        </Typography>
                      </Box>

                      <Box sx={{ ml: 3 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<QrCodeIcon />}
                          onClick={() => window.open(urlData.qrCode, '_blank')}
                          sx={{
                            bgcolor: '#111827',
                            '&:hover': {
                              bgcolor: '#374151',
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
                      bgcolor: 'white',
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
                      <Typography variant="body2" sx={{ color: 'grey.600' }}>
                        Get started for free and unlock your link management journey!
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => {
                        setUrlData(null)
                        setUrl('')
                      }}
                      sx={{
                        bgcolor: '#111827',
                        '&:hover': {
                          bgcolor: '#374151',
                        },
                      }}
                    >
                      Get started
                    </Button>
                  </Paper>
                </>
              )}

              {/* Security Badges */}
              <Stack
                direction="row"
                spacing={2}
                justifyContent="center"
                sx={{ mt: 4 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: '#fff',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#22c55e',
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      color: '#111827',
                      fontWeight: 500,
                    }}
                  >
                    Secure & Fast
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: '#fff',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#3b82f6',
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      color: '#111827',
                      fontWeight: 500,
                    }}
                  >
                    HTTPS Protected
                  </Typography>
                </Box>
              </Stack>
            </Box>
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
    </QueryClientProvider>
  )
}

export default App