"use client";

import { useQuery } from "@tanstack/react-query";

export function useSaasAdminQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
) {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 30_000,
    retry: 1,
  });
}
