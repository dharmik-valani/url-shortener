/**
 * Custom hook for URL shortening operations
 * 
 * Why a Custom Hook?
 * 1. Separation of Concerns: Isolates URL shortening logic from UI
 * 2. Reusability: Can be used across different components
 * 3. Testing: Easier to test business logic in isolation
 * 4. State Management: Centralizes related state and operations
 * 
 * Why TanStack Query?
 * 1. Automatic caching: Prevents unnecessary API calls
 * 2. Loading/Error states: Built-in state management
 * 3. Retry logic: Handles network issues gracefully
 * 4. Cache invalidation: Keeps data fresh
 * 5. TypeScript support: Type-safe operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { shortenUrl } from '../../../services/api';

export const useUrlShortener = () => {
  const queryClient = useQueryClient();

  /**
   * Why Mutation?
   * 1. Handles POST/PUT/DELETE operations
   * 2. Manages loading/error states
   * 3. Provides retry capabilities
   * 4. Supports optimistic updates
   */
  const shortenMutation = useMutation({
    mutationFn: (url: string) => shortenUrl(url),
    onSuccess: (data) => {
      // Why invalidate queries?
      // 1. Ensures fresh data
      // 2. Triggers automatic refetch
      // 3. Updates all related components
      queryClient.invalidateQueries(['recentUrls']);
      
      // Why toast?
      // 1. User feedback
      // 2. Non-blocking notification
      // 3. Consistent UI pattern
      toast.success('URL shortened successfully!');
    },
    onError: (error: Error) => {
      // Why centralized error handling?
      // 1. Consistent error messages
      // 2. Single point of modification
      // 3. Better error tracking
      toast.error(error.message || 'Failed to shorten URL');
    }
  });

  return {
    shortenUrl: shortenMutation.mutate,
    isLoading: shortenMutation.isLoading,
    error: shortenMutation.error
  };
};