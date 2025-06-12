import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { storageService } from "./storage";

// Mock API responses using localStorage data
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const path = url.replace('/api', '');
  
  // Handle different endpoints
  switch (method.toUpperCase()) {
    case 'GET':
      return handleGetRequest(path);
    case 'POST':
      return handlePostRequest(path, data);
    case 'PUT':
      return handlePutRequest(path, data);
    case 'DELETE':
      return handleDeleteRequest(path);
    default:
      throw new Error(`Method ${method} not supported`);
  }
}

function handleGetRequest(path: string): any {
  if (path === '/dashboard/stats') {
    return { json: () => storageService.getDashboardStats() };
  }
  if (path === '/clients') {
    return { json: () => storageService.getClients() };
  }
  if (path === '/policies') {
    return { json: () => storageService.getPolicies() };
  }
  if (path === '/policies/recent') {
    const policies = storageService.getRecentPolicies();
    const policiesWithDetails = policies.map(policy => {
      const client = storageService.getClient(policy.clientId);
      const policyType = storageService.getPolicyTypes().find(pt => pt.id === policy.policyTypeId);
      return {
        ...policy,
        client,
        policyType
      };
    });
    return { json: () => policiesWithDetails };
  }
  if (path === '/policies/renewals') {
    const renewals = storageService.getUpcomingRenewals();
    const renewalsWithDetails = renewals.map(policy => {
      const client = storageService.getClient(policy.clientId);
      const policyType = storageService.getPolicyTypes().find(pt => pt.id === policy.policyTypeId);
      return {
        ...policy,
        client,
        policyType
      };
    });
    return { json: () => renewalsWithDetails };
  }
  if (path === '/policy-types') {
    return { json: () => storageService.getPolicyTypes() };
  }
  if (path === '/claims') {
    return { json: () => storageService.getClaims() };
  }
  if (path === '/agents') {
    return { json: () => storageService.getAgents() };
  }
  if (path.match(/\/clients\/\d+$/)) {
    const id = parseInt(path.split('/').pop()!);
    return { json: () => storageService.getClient(id) };
  }
  if (path.match(/\/policies\/\d+$/)) {
    const id = parseInt(path.split('/').pop()!);
    return { json: () => storageService.getPolicy(id) };
  }
  if (path.match(/\/claims\/\d+$/)) {
    const id = parseInt(path.split('/').pop()!);
    return { json: () => storageService.getClaim(id) };
  }
  
  throw new Error(`GET ${path} not found`);
}

function handlePostRequest(path: string, data: any): any {
  if (path === '/clients') {
    const client = storageService.createClient(data);
    return { json: () => client };
  }
  if (path === '/policies') {
    const policy = storageService.createPolicy(data);
    return { json: () => policy };
  }
  if (path === '/claims') {
    const claim = storageService.createClaim(data);
    return { json: () => claim };
  }
  
  throw new Error(`POST ${path} not supported`);
}

function handlePutRequest(path: string, data: any): any {
  if (path.match(/\/clients\/\d+$/)) {
    const id = parseInt(path.split('/').pop()!);
    const client = storageService.updateClient(id, data);
    return { json: () => client };
  }
  if (path.match(/\/policies\/\d+$/)) {
    const id = parseInt(path.split('/').pop()!);
    const policy = storageService.updatePolicy(id, data);
    return { json: () => policy };
  }
  if (path.match(/\/claims\/\d+$/)) {
    const id = parseInt(path.split('/').pop()!);
    const claim = storageService.updateClaim(id, data);
    return { json: () => claim };
  }
  
  throw new Error(`PUT ${path} not supported`);
}

function handleDeleteRequest(path: string): any {
  if (path.match(/\/clients\/\d+$/)) {
    const id = parseInt(path.split('/').pop()!);
    const success = storageService.deleteClient(id);
    return { json: () => ({ success }) };
  }
  if (path.match(/\/policies\/\d+$/)) {
    const id = parseInt(path.split('/').pop()!);
    const success = storageService.deletePolicy(id);
    return { json: () => ({ success }) };
  }
  
  throw new Error(`DELETE ${path} not supported`);
}

export const getQueryFn: <T>() => QueryFunction<T> = () =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const response = await handleGetRequest(url.replace('/api', ''));
    return response.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
