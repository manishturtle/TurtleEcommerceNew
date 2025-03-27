import { AdjustmentReason, PaginatedResponse } from '../types/inventory';
import { fetchAdjustmentReasons } from '../services/api';
import useSWR from 'swr';

interface UseAdjustmentReasonsReturn {
  reasons: AdjustmentReason[];
  isLoading: boolean;
  error: any;
}

/**
 * Hook to fetch and cache adjustment reasons
 * @returns {UseAdjustmentReasonsReturn} Object containing reasons, loading state, and error
 */
export const useAdjustmentReasons = (): UseAdjustmentReasonsReturn => {
  // Use a stable key for SWR caching
  const cacheKey = 'adjustment-reasons';
  
  const { data, error, isLoading } = useSWR<PaginatedResponse<AdjustmentReason>>(
    cacheKey,
    () => fetchAdjustmentReasons({ is_active: true, page_size: 500 }),
    {
      revalidateOnFocus: false, // Don't refetch on window focus if list is static
      revalidateOnReconnect: false,
      dedupingInterval: 3600000, // Cache for 1 hour (in milliseconds)
    }
  );

  return {
    reasons: data?.results || [], // Return empty array if data is undefined
    isLoading,
    error,
  };
}

/**
 * Alternative implementation using React's useEffect
 * This can be used if SWR is not available
 */
/*
import { useState, useEffect } from 'react';

export function useAdjustmentReasons(): UseAdjustmentReasonsReturn {
  const [reasons, setReasons] = useState<AdjustmentReason[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchReasons = async () => {
      try {
        setIsLoading(true);
        const response = await fetchAdjustmentReasons({ is_active: true, page_size: 500 });
        setReasons(response.results);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReasons();
  }, []);

  return { reasons, isLoading, error };
}
*/
