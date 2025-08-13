import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { shortenUrl as shortenUrlApi } from '../../../services/api';

export const useUrlShortener = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutation = useMutation({
    mutationFn: shortenUrlApi,
    onSuccess: (data) => {
      toast.success('URL shortened successfully!');
      return data;
    },
    onError: (error: Error) => {
      if (error.message.includes('Failed to fetch')) {
        toast.error('Unable to connect to the server. Please check your internet connection.');
      } else {
        toast.error(error.message || 'An unexpected error occurred');
      }
      throw error;
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const shortenUrl = async (url: string) => {
    setIsLoading(true);
    try {
      return await mutation.mutateAsync(url);
    } catch (error) {
      throw error;
    }
  };

  return {
    shortenUrl,
    isLoading,
  };
};
