/**
 * Pricing API hooks
 * 
 * This file provides custom React hooks for interacting with the pricing API endpoints
 * using TanStack Query for data fetching and caching.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { apiEndpoints } from '@/lib/api';
import {
  CustomerGroup, SellingChannel, TaxRegion, TaxRate, TaxRateProfile,
  Country, PricingFilter, PricingListResponse
} from '@/app/types/pricing';

// Helper function to build query params from filters
const buildQueryParams = (filters?: PricingFilter): string => {
  if (!filters) return '';
  
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
  
  return params.toString() ? `?${params.toString()}` : '';
};

// =============================================================================
// Customer Group Hooks
// =============================================================================

export const useFetchCustomerGroups = (filters?: PricingFilter) => {
  return useQuery({
    queryKey: ['customerGroups', filters],
    queryFn: async () => {
      const response = await api.get<PricingListResponse<CustomerGroup>>(
        `${apiEndpoints.pricing.customerGroups.list}${buildQueryParams(filters)}`
      );
      return response.data;
    }
  });
};

export const useFetchCustomerGroup = (id: number) => {
  return useQuery({
    queryKey: ['customerGroup', id],
    queryFn: async () => {
      const response = await api.get<CustomerGroup>(apiEndpoints.pricing.customerGroups.detail(id));
      return response.data;
    },
    enabled: !!id // Only run the query if id is provided
  });
};

export const useCreateCustomerGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customerGroup: Omit<CustomerGroup, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await api.post<CustomerGroup>(apiEndpoints.pricing.customerGroups.list, customerGroup);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate customerGroups list query to refetch data
      queryClient.invalidateQueries({ queryKey: ['customerGroups'] });
    }
  });
};

export const useUpdateCustomerGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: CustomerGroup) => {
      const response = await api.put<CustomerGroup>(
        apiEndpoints.pricing.customerGroups.detail(id),
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate specific customerGroup query and customerGroups list
      queryClient.invalidateQueries({ queryKey: ['customerGroup', data.id] });
      queryClient.invalidateQueries({ queryKey: ['customerGroups'] });
    }
  });
};

export const useDeleteCustomerGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(apiEndpoints.pricing.customerGroups.detail(id));
      return id;
    },
    onSuccess: () => {
      // Invalidate customerGroups list query
      queryClient.invalidateQueries({ queryKey: ['customerGroups'] });
    }
  });
};

// =============================================================================
// Selling Channel Hooks
// =============================================================================

export const useFetchSellingChannels = (filters?: PricingFilter) => {
  return useQuery({
    queryKey: ['sellingChannels', filters],
    queryFn: async () => {
      const response = await api.get<PricingListResponse<SellingChannel>>(
        `${apiEndpoints.pricing.sellingChannels.list}${buildQueryParams(filters)}`
      );
      return response.data;
    }
  });
};

export const useFetchSellingChannel = (id: number) => {
  return useQuery({
    queryKey: ['sellingChannel', id],
    queryFn: async () => {
      const response = await api.get<SellingChannel>(apiEndpoints.pricing.sellingChannels.detail(id));
      return response.data;
    },
    enabled: !!id
  });
};

export const useCreateSellingChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sellingChannel: Omit<SellingChannel, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await api.post<SellingChannel>(apiEndpoints.pricing.sellingChannels.list, sellingChannel);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellingChannels'] });
    }
  });
};

export const useUpdateSellingChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: SellingChannel) => {
      const response = await api.put<SellingChannel>(
        apiEndpoints.pricing.sellingChannels.detail(id),
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sellingChannel', data.id] });
      queryClient.invalidateQueries({ queryKey: ['sellingChannels'] });
    }
  });
};

export const useDeleteSellingChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(apiEndpoints.pricing.sellingChannels.detail(id));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellingChannels'] });
    }
  });
};

// =============================================================================
// Country Hooks
// =============================================================================

export const useFetchCountries = () => {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const response = await api.get<Country[]>(apiEndpoints.pricing.countries.list);
      return response.data;
    }
  });
};

// =============================================================================
// Tax Region Hooks
// =============================================================================

export const useFetchTaxRegions = (filters?: PricingFilter) => {
  return useQuery({
    queryKey: ['taxRegions', filters],
    queryFn: async () => {
      const response = await api.get<PricingListResponse<TaxRegion>>(
        `${apiEndpoints.pricing.taxRegions.list}${buildQueryParams(filters)}`
      );
      return response.data;
    }
  });
};

export const useFetchTaxRegion = (id: number) => {
  return useQuery({
    queryKey: ['taxRegion', id],
    queryFn: async () => {
      const response = await api.get<TaxRegion>(apiEndpoints.pricing.taxRegions.detail(id));
      return response.data;
    },
    enabled: !!id
  });
};

export const useCreateTaxRegion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taxRegion: Omit<TaxRegion, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await api.post<TaxRegion>(apiEndpoints.pricing.taxRegions.list, taxRegion);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxRegions'] });
    }
  });
};

export const useUpdateTaxRegion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: TaxRegion) => {
      const response = await api.put<TaxRegion>(
        apiEndpoints.pricing.taxRegions.detail(id),
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['taxRegion', data.id] });
      queryClient.invalidateQueries({ queryKey: ['taxRegions'] });
    }
  });
};

export const useDeleteTaxRegion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(apiEndpoints.pricing.taxRegions.detail(id));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxRegions'] });
    }
  });
};

// =============================================================================
// Tax Rate Hooks
// =============================================================================

export const useFetchTaxRates = (filters?: PricingFilter) => {
  return useQuery({
    queryKey: ['taxRates', filters],
    queryFn: async () => {
      const response = await api.get<PricingListResponse<TaxRate>>(
        `${apiEndpoints.pricing.taxRates.list}${buildQueryParams(filters)}`
      );
      return response.data;
    }
  });
};

export const useFetchTaxRate = (id: number) => {
  return useQuery({
    queryKey: ['taxRate', id],
    queryFn: async () => {
      const response = await api.get<TaxRate>(apiEndpoints.pricing.taxRates.detail(id));
      return response.data;
    },
    enabled: !!id
  });
};

export const useCreateTaxRate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taxRate: Omit<TaxRate, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await api.post<TaxRate>(apiEndpoints.pricing.taxRates.list, taxRate);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxRates'] });
    }
  });
};

export const useUpdateTaxRate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: TaxRate) => {
      const response = await api.put<TaxRate>(
        apiEndpoints.pricing.taxRates.detail(id),
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['taxRate', data.id] });
      queryClient.invalidateQueries({ queryKey: ['taxRates'] });
    }
  });
};

export const useDeleteTaxRate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(apiEndpoints.pricing.taxRates.detail(id));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxRates'] });
    }
  });
};

// =============================================================================
// Tax Rate Profile Hooks
// =============================================================================

export const useFetchTaxRateProfiles = (filters?: PricingFilter) => {
  return useQuery({
    queryKey: ['taxRateProfiles', filters],
    queryFn: async () => {
      const response = await api.get<PricingListResponse<TaxRateProfile>>(
        `${apiEndpoints.pricing.taxRateProfiles.list}${buildQueryParams(filters)}`
      );
      return response.data;
    }
  });
};

export const useFetchTaxRateProfile = (id: number) => {
  return useQuery({
    queryKey: ['taxRateProfile', id],
    queryFn: async () => {
      const response = await api.get<TaxRateProfile>(apiEndpoints.pricing.taxRateProfiles.detail(id));
      return response.data;
    },
    enabled: !!id
  });
};

export const useCreateTaxRateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taxRateProfile: Omit<TaxRateProfile, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await api.post<TaxRateProfile>(apiEndpoints.pricing.taxRateProfiles.list, taxRateProfile);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxRateProfiles'] });
    }
  });
};

export const useUpdateTaxRateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: TaxRateProfile) => {
      const response = await api.put<TaxRateProfile>(
        apiEndpoints.pricing.taxRateProfiles.detail(id),
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['taxRateProfile', data.id] });
      queryClient.invalidateQueries({ queryKey: ['taxRateProfiles'] });
    }
  });
};

export const useDeleteTaxRateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(apiEndpoints.pricing.taxRateProfiles.detail(id));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxRateProfiles'] });
    }
  });
};
