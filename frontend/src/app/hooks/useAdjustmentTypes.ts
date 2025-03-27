import useSWR from 'swr';
import { useState, useEffect } from 'react';
import { fetchAdjustmentTypes, AdjustmentType } from '../services/api';

/**
 * Custom hook for fetching and caching adjustment types
 * Uses SWR for efficient data fetching with caching and revalidation
 */
export const useAdjustmentTypes = () => {
  const { data, error, isLoading, mutate } = useSWR<AdjustmentType[]>(
    'adjustment-types',
    () => fetchAdjustmentTypes(),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 600000, // 10 minutes
    }
  );

  return {
    adjustmentTypes: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
};

/**
 * Alternative implementation using useEffect
 * This is provided as a reference but SWR is preferred for production use
 */
export const useAdjustmentTypesWithEffect = () => {
  const [adjustmentTypes, setAdjustmentTypes] = useState<AdjustmentType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchAdjustmentTypes();
        setAdjustmentTypes(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { adjustmentTypes, isLoading, error };
};

export default useAdjustmentTypes;
