import { QueryClient } from "@tanstack/react-query";
import { localStorageService } from "./localStorage";

// Frontend-only data service using localStorage
export class DataService {
  // Dashboard stats
  async getDashboardStats() {
    return localStorageService.getDashboardStats();
  }

  // Clients
  async getClients() {
    return localStorageService.getClients();
  }

  async getClient(id: number) {
    return localStorageService.getClient(id);
  }

  async createClient(data: any) {
    return localStorageService.createClient(data);
  }

  async updateClient(id: number, data: any) {
    return localStorageService.updateClient(id, data);
  }

  async deleteClient(id: number) {
    return localStorageService.deleteClient(id);
  }

  // Policies
  async getPolicies() {
    return localStorageService.getPolicies();
  }

  async getPolicy(id: number) {
    return localStorageService.getPolicy(id);
  }

  async getRecentPolicies() {
    return localStorageService.getRecentPolicies();
  }

  async getRenewalPolicies() {
    return localStorageService.getRenewalPolicies();
  }

  async createPolicy(data: any) {
    return localStorageService.createPolicy(data);
  }

  async updatePolicy(id: number, data: any) {
    return localStorageService.updatePolicy(id, data);
  }

  async deletePolicy(id: number) {
    return localStorageService.deletePolicy(id);
  }

  // Claims
  async getClaims() {
    return localStorageService.getClaims();
  }

  async getClaim(id: number) {
    return localStorageService.getClaim(id);
  }

  async createClaim(data: any) {
    return localStorageService.createClaim(data);
  }

  async updateClaim(id: number, data: any) {
    return localStorageService.updateClaim(id, data);
  }

  async deleteClaim(id: number) {
    return localStorageService.deleteClaim(id);
  }

  // Policy Types
  async getPolicyTypes() {
    return localStorageService.getPolicyTypes();
  }
}

export const dataService = new DataService();

// Mock function for query client compatibility
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<{ json: () => Promise<any> }> {
  // This is a mock implementation for compatibility
  // All actual data operations go through the dataService
  return {
    json: async () => ({})
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
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
