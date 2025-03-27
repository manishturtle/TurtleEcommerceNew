/**
 * Attributes API hooks
 * 
 * This file provides custom React hooks for interacting with the attributes API endpoints
 * using TanStack Query for data fetching and caching.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { apiEndpoints } from '@/lib/api';
import {
  AttributeGroup, Attribute, AttributeOption, AttributeDataType,
  AttributesFilter, AttributesListResponse
} from '@/app/types/attributes';

// Helper function to build query params from filters
const buildQueryParams = (filters?: AttributesFilter): string => {
  if (!filters) return '';
  
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
  if (filters.data_type) params.append('data_type', filters.data_type);
  if (filters.is_variant_attribute !== undefined) {
    params.append('is_variant_attribute', String(filters.is_variant_attribute));
  }
  if (filters.group) params.append('group', String(filters.group));
  
  return params.toString() ? `?${params.toString()}` : '';
};

// =============================================================================
// Attribute Group Hooks
// =============================================================================

export const useFetchAttributeGroups = (filters?: AttributesFilter) => {
  return useQuery({
    queryKey: ['attributeGroups', filters],
    queryFn: async () => {
      const response = await api.get<AttributesListResponse<AttributeGroup>>(
        `${apiEndpoints.attributes.attributeGroups.list}${buildQueryParams(filters)}`
      );
      return response.data;
    }
  });
};

export const useFetchAttributeGroup = (id: number) => {
  return useQuery({
    queryKey: ['attributeGroup', id],
    queryFn: async () => {
      const response = await api.get<AttributeGroup>(apiEndpoints.attributes.attributeGroups.detail(id));
      return response.data;
    },
    enabled: !!id // Only run the query if id is provided
  });
};

export const useCreateAttributeGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attributeGroup: Omit<AttributeGroup, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await api.post<AttributeGroup>(apiEndpoints.attributes.attributeGroups.list, attributeGroup);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate attributeGroups list query to refetch data
      queryClient.invalidateQueries({ queryKey: ['attributeGroups'] });
    }
  });
};

export const useUpdateAttributeGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: AttributeGroup) => {
      const response = await api.put<AttributeGroup>(
        apiEndpoints.attributes.attributeGroups.detail(id),
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate specific attributeGroup query and attributeGroups list
      queryClient.invalidateQueries({ queryKey: ['attributeGroup', data.id] });
      queryClient.invalidateQueries({ queryKey: ['attributeGroups'] });
    }
  });
};

export const useDeleteAttributeGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(apiEndpoints.attributes.attributeGroups.detail(id));
      return id;
    },
    onSuccess: () => {
      // Invalidate attributeGroups list query
      queryClient.invalidateQueries({ queryKey: ['attributeGroups'] });
    }
  });
};

// =============================================================================
// Attribute Hooks
// =============================================================================

export const useFetchAttributes = (filters?: AttributesFilter) => {
  return useQuery({
    queryKey: ['attributes', filters],
    queryFn: async () => {
      const response = await api.get<AttributesListResponse<Attribute>>(
        `${apiEndpoints.attributes.attributes.list}${buildQueryParams(filters)}`
      );
      return response.data;
    }
  });
};

export const useFetchAttribute = (id: number) => {
  return useQuery({
    queryKey: ['attribute', id],
    queryFn: async () => {
      const response = await api.get<Attribute>(apiEndpoints.attributes.attributes.detail(id));
      return response.data;
    },
    enabled: !!id
  });
};

export const useCreateAttribute = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attribute: Omit<Attribute, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await api.post<Attribute>(apiEndpoints.attributes.attributes.list, attribute);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
    }
  });
};

export const useUpdateAttribute = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Attribute) => {
      const response = await api.put<Attribute>(
        apiEndpoints.attributes.attributes.detail(id),
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attribute', data.id] });
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
    }
  });
};

export const useDeleteAttribute = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(apiEndpoints.attributes.attributes.detail(id));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
    }
  });
};

// =============================================================================
// Attribute Option Hooks
// =============================================================================

export const useFetchAttributeOptions = (attributeId?: number) => {
  return useQuery({
    queryKey: ['attributeOptions', attributeId],
    queryFn: async () => {
      const url = attributeId 
        ? apiEndpoints.attributes.attributeOptions.byAttribute(attributeId)
        : apiEndpoints.attributes.attributeOptions.list;
      
      const response = await api.get<AttributesListResponse<AttributeOption>>(url);
      return response.data;
    },
    enabled: attributeId !== undefined // Only run if attributeId is provided or explicitly looking for all options
  });
};

export const useFetchAttributeOption = (id: number) => {
  return useQuery({
    queryKey: ['attributeOption', id],
    queryFn: async () => {
      const response = await api.get<AttributeOption>(apiEndpoints.attributes.attributeOptions.detail(id));
      return response.data;
    },
    enabled: !!id
  });
};

export const useCreateAttributeOption = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attributeOption: Omit<AttributeOption, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await api.post<AttributeOption>(apiEndpoints.attributes.attributeOptions.list, attributeOption);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attributeOptions'] });
      // Also invalidate options for this specific attribute
      queryClient.invalidateQueries({ queryKey: ['attributeOptions', data.attribute] });
    }
  });
};

export const useUpdateAttributeOption = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: AttributeOption) => {
      const response = await api.put<AttributeOption>(
        apiEndpoints.attributes.attributeOptions.detail(id),
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attributeOption', data.id] });
      queryClient.invalidateQueries({ queryKey: ['attributeOptions'] });
      queryClient.invalidateQueries({ queryKey: ['attributeOptions', data.attribute] });
    }
  });
};

export const useDeleteAttributeOption = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number, attributeId?: number) => {
      await api.delete(apiEndpoints.attributes.attributeOptions.detail(id));
      return { id, attributeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attributeOptions'] });
      if (data.attributeId) {
        queryClient.invalidateQueries({ queryKey: ['attributeOptions', data.attributeId] });
      }
    }
  });
};
