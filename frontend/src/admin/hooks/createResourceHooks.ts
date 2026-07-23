import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { ListParams, PagedResult } from '../api/types';

// One factory backing all 8 admin resources (Category, Product, PortfolioItem,
// HeroStat, SiteContent, SocialLink, ContactInfo, SeoMeta) instead of hand-writing
// the same list/detail/create/update/delete boilerplate 8 times — mirrors the
// backend's AdminEndpointHelpers approach to shared CRUD plumbing. Each
// hooks/use<Entity>.ts file just calls this once with its own path/types.
export function createResourceHooks<TResponse, TRequest>(resourcePath: string, queryKeyRoot: string) {
  const basePath = `/api/admin/${resourcePath}`;

  const keys = {
    all: [queryKeyRoot] as const,
    list: (params?: ListParams) => [queryKeyRoot, 'list', params] as const,
    detail: (id: number) => [queryKeyRoot, 'detail', id] as const,
  };

  function useList(params: ListParams = {}) {
    return useQuery({
      queryKey: keys.list(params),
      queryFn: async () => {
        const { data } = await apiClient.get<PagedResult<TResponse>>(basePath, { params });
        return data;
      },
    });
  }

  function useDetail(id: number | undefined) {
    return useQuery({
      queryKey: id !== undefined ? keys.detail(id) : keys.all,
      queryFn: async () => {
        const { data } = await apiClient.get<TResponse>(`${basePath}/${id}`);
        return data;
      },
      enabled: id !== undefined,
    });
  }

  function useCreate() {
    const client = useQueryClient();
    return useMutation({
      mutationFn: async (payload: TRequest) => {
        const { data } = await apiClient.post<TResponse>(basePath, payload);
        return data;
      },
      onSuccess: () => {
        void client.invalidateQueries({ queryKey: keys.all });
      },
    });
  }

  function useUpdate() {
    const client = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, payload }: { id: number; payload: TRequest }) => {
        const { data } = await apiClient.put<TResponse>(`${basePath}/${id}`, payload);
        return data;
      },
      onSuccess: () => {
        void client.invalidateQueries({ queryKey: keys.all });
      },
    });
  }

  function useDelete() {
    const client = useQueryClient();
    return useMutation({
      mutationFn: async (id: number) => {
        await apiClient.delete(`${basePath}/${id}`);
      },
      onSuccess: () => {
        void client.invalidateQueries({ queryKey: keys.all });
      },
    });
  }

  return { keys, useList, useDetail, useCreate, useUpdate, useDelete };
}
