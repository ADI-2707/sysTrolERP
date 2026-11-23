import { QueryClient } from "@tanstack/react-query";
import { ApiClientError } from "../api";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiClientError) {
            if ([401, 403, 404].includes(error.status)) {
              return false;
            }
          }
          return failureCount < 2;
        },
      },
    },
  });
}

export const queryClient = createQueryClient();
