// Mock data service that simulates API responses
export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  idNumber: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  occupation: string;
  maritalStatus: string;
  createdAt: string;
}

export interface Policy {
  id: number;
  policyNumber: string;
  clientId: number;
  clientName: string;
  policyType: string;
  premium: number;
  frequency: string;
  startDate: string;
  endDate: string;
  status: string;
  coverageAmount: number;
  beneficiaries: string[];
}

export interface Claim {
  id: number;
  claimNumber: string;
  policyId: number;
  policyNumber: string;
  clientName: string;
  type: string;
  amount: number;
  status: string;
  dateSubmitted: string;
  description: string;
}

export interface Agent {
  id: number;
  name: string;
  email: string;
  phone: string;
  commissionRate: number;
  totalSales: number;
}

// Mock API service
class MockApiService {
  private static delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  static async get(url: string) {
    await this.delay(300); // Simulate network delay
    
    if (url.includes('/api/policies')) {
      return { data: [], success: true };
    }
    if (url.includes('/api/claims')) {
      return { data: [], success: true };
    }
    if (url.includes('/api/clients')) {
      return { data: [], success: true };
    }
    if (url.includes('/api/agents')) {
      return { data: [], success: true };
    }
    if (url.includes('/api/dashboard')) {
      return {
        data: {
          totalPolicies: 0,
          activeClaims: 0,
          totalClients: 0,
          monthlyPremiums: 0
        },
        success: true
      };
    }
    
    return { data: null, success: false };
  }

  static async post(url: string, data: any) {
    await this.delay(500);
    return { data: { ...data, id: Math.floor(Math.random() * 1000) }, success: true };
  }

  static async put(url: string, data: any) {
    await this.delay(400);
    return { data, success: true };
  }

  static async delete(url: string) {
    await this.delay(300);
    return { success: true };
  }
}

export { MockApiService };