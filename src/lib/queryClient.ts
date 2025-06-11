import { QueryClient } from "@tanstack/react-query";
import { MockApiService } from "./mock-data";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        return MockApiService.get(url);
      },
    },
    mutations: {
      retry: false,
    },
  },
});

// API request helper function for mutations
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const method = options.method || 'GET';
  const data = options.body ? JSON.parse(options.body as string) : undefined;
  
  switch (method.toUpperCase()) {
    case 'POST':
      return MockApiService.post(url, data);
    case 'PUT':
    case 'PATCH':
      return MockApiService.put(url, data);
    case 'DELETE':
      return MockApiService.delete(url);
    default:
      return MockApiService.get(url);
  }
};
