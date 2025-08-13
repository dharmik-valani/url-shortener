import { toast } from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UrlData {
  shortUrl: string;
  originalUrl: string;
  qrCode: string;
}

const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'An error occurred');
  }
  return response.json();
};

export const shortenUrl = async (originalUrl: string): Promise<ApiResponse<UrlData>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/urls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ originalUrl }),
    });

    return handleResponse<UrlData>(response);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        toast.error('Unable to connect to the server. Please check your internet connection.');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};
