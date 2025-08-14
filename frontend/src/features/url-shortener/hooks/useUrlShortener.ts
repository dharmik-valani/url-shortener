/**
 * URL Shortening Hook
 * 
 * Why TanStack Query vs Alternatives?
 * 
 * 1. Zustand Comparison:
 *    Zustand would require:
 *    - Manual cache implementation
 *    - Custom error handling
 *    - Manual loading states
 *    - No automatic background updates
 *    Example:
 *    ```
 *    const useStore = create((set) => ({
 *      urls: [],
 *      loading: false,
 *      error: null,
 *      fetch: async () => {
 *        set({ loading: true });
 *        try {
 *          const data = await api.get();
 *          set({ data, loading: false });
 *        } catch (error) {
 *          set({ error, loading: false });
 *        }
 *      }
 *    }));
 *    ```
 * 
 * 2. Redux Comparison:
 *    Redux would require:
 *    - Actions for each state (request, success, failure)
 *    - Reducers for state updates
 *    - Middleware for async operations
 *    - More boilerplate code
 * 
 * 3. Context + useReducer Comparison:
 *    Would need:
 *    - Manual cache implementation
 *    - No automatic background updates
 *    - More complex error handling
 *    - Manual retry logic
 * 
 * Why Custom Hook vs Component Logic?
 * 1. Separation of Concerns
 *    - Business logic isolated from UI
 *    - Easier to test
 *    - Reusable across components
 * 
 * 2. Performance
 *    - Memoization of callbacks
 *    - Prevents unnecessary re-renders
 *    - Centralized state management
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { shortenUrl } from '../../../services/api';
import { ApiResponse, UrlData } from '../../../types/api';

export const useUrlShortener = () => {
  /**
   * Why QueryClient?
   * - Centralized cache management
   * - Shared across components
   * - Automatic cache updates
   * - Background refetching
   * 
   * Alternative Approach:
   * Could use local state + useEffect, but would lose:
   * - Automatic cache invalidation
   * - Background updates
   * - Optimistic updates
   * - Retry logic
   */
  const queryClient = useQueryClient();

  /**
   * Why Mutation vs Direct API Call?
   * 
   * 1. State Management:
   *    Mutation provides:
   *    - Loading state
   *    - Error state
   *    - Success state
   *    Alternative would be:
   *    ```
   *    const [loading, setLoading] = useState(false);
   *    const [error, setError] = useState(null);
   *    ```
   * 
   * 2. Cache Management:
   *    - Automatic cache updates
   *    - Optimistic updates
   *    - Rollback on error
   * 
   * 3. Error Handling:
   *    - Automatic retries
   *    - Error boundary integration
   *    - Toast notifications
   */
  const shortenMutation = useMutation({
    mutationFn: (url: string) => shortenUrl(url),
    onSuccess: (response: ApiResponse<UrlData>) => {
      if (response.success && response.data) {
        queryClient.invalidateQueries(['recentUrls']);
        toast.success('URL shortened successfully!');
        return response;
      } else {
        throw new Error(response.error || 'Failed to shorten URL');
      }
    },
    onError: (error: Error) => {
      /**
       * Why Centralized Error Handling?
       * 
       * 1. Consistency:
       *    - Same error format
       *    - Same error display
       *    - Same error tracking
       * 
       * 2. Maintenance:
       *    - Single point of modification
       *    - Easier debugging
       *    - Better error tracking
       */
      toast.error(error.message || 'Failed to shorten URL');
    }
  });

  return {
    /**
     * Why This Return Structure?
     * 
     * 1. Clean API:
     *    - Only exposed what's needed
     *    - Clear function names
     *    - TypeScript support
     * 
     * 2. Alternative:
     *    Could return mutation object:
     *    ```
     *    return shortenMutation;
     *    ```
     *    Problems:
     *    - Exposes internal implementation
     *    - More complex API
     *    - Breaking changes risk
     */
    shortenUrl: shortenMutation.mutate,
    isLoading: shortenMutation.isLoading,
    error: shortenMutation.error
  };
};