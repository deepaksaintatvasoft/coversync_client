// Local storage service for CoverSync data
export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  idNumber: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  createdAt: string;
}

export interface Policy {
  id: number;
  policyNumber: string;
  clientId: number;
  policyTypeId: number;
  status: string;
  premium: number;
  frequency: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface PolicyType {
  id: number;
  name: string;
  description: string;
  baseRate: number;
  category: string;
}

export interface Claim {
  id: number;
  claimNumber: string;
  policyId: number;
  clientId: number;
  type: string;
  amount: number;
  status: string;
  description: string;
  dateOfIncident: string;
  dateSubmitted: string;
}

export interface Agent {
  id: number;
  firstName: string;
  surname: string;
  email: string;
  phone: string;
  licenseNumber: string;
  commissionRate: number;
  status: string;
  createdAt: string;
}

class LocalStorageService {
  private getFromStorage<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Initialize with sample data if empty
  initialize(): void {
    if (!localStorage.getItem('clients')) {
      this.initializeSampleData();
    }
  }

  private initializeSampleData(): void {
    // Sample clients
    const sampleClients: Client[] = [
      {
        id: 1,
        name: "Robert Chen",
        email: "robert.chen@example.com",
        phone: "+27 82 555 0123",
        idNumber: "8501015009087",
        address: "123 Main St, Cape Town, 8001",
        dateOfBirth: "1985-01-01",
        gender: "Male",
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        name: "Sarah Johnson",
        email: "sarah.johnson@example.com",
        phone: "+27 83 555 0124",
        idNumber: "9203125009088",
        address: "456 Oak Ave, Johannesburg, 2000",
        dateOfBirth: "1992-03-12",
        gender: "Female",
        createdAt: new Date().toISOString()
      }
    ];

    // Sample policy types
    const samplePolicyTypes: PolicyType[] = [
      {
        id: 1,
        name: "Family Plan",
        description: "Comprehensive family coverage",
        baseRate: 170,
        category: "Health"
      },
      {
        id: 2,
        name: "Individual Plan",
        description: "Individual health coverage",
        baseRate: 120,
        category: "Health"
      }
    ];

    // Sample policies
    const samplePolicies: Policy[] = [
      {
        id: 1,
        policyNumber: "POL-001",
        clientId: 1,
        policyTypeId: 1,
        status: "Active",
        premium: 170,
        frequency: "Monthly",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        policyNumber: "POL-002",
        clientId: 2,
        policyTypeId: 2,
        status: "Active",
        premium: 120,
        frequency: "Monthly",
        startDate: "2024-02-01",
        endDate: "2025-01-31",
        createdAt: new Date().toISOString()
      }
    ];

    // Sample claims
    const sampleClaims: Claim[] = [
      {
        id: 1,
        claimNumber: "CLM-001",
        policyId: 1,
        clientId: 1,
        type: "Medical",
        amount: 2500,
        status: "Pending",
        description: "Routine medical checkup",
        dateOfIncident: "2024-06-01",
        dateSubmitted: "2024-06-05"
      }
    ];

    // Sample agents
    const sampleAgents: Agent[] = [
      {
        id: 1,
        firstName: "John",
        surname: "Doe",
        email: "john.doe@coversync.co.za",
        phone: "+27 82 555 0100",
        licenseNumber: "AGT001",
        commissionRate: 0.15,
        status: "Active",
        createdAt: new Date().toISOString()
      }
    ];

    this.saveToStorage('clients', sampleClients);
    this.saveToStorage('policyTypes', samplePolicyTypes);
    this.saveToStorage('policies', samplePolicies);
    this.saveToStorage('claims', sampleClaims);
    this.saveToStorage('agents', sampleAgents);
  }

  // Clients
  getClients(): Client[] {
    return this.getFromStorage<Client>('clients');
  }

  getClient(id: number): Client | undefined {
    return this.getClients().find(client => client.id === id);
  }

  createClient(client: Omit<Client, 'id' | 'createdAt'>): Client {
    const clients = this.getClients();
    const newClient: Client = {
      ...client,
      id: Math.max(...clients.map(c => c.id), 0) + 1,
      createdAt: new Date().toISOString()
    };
    clients.push(newClient);
    this.saveToStorage('clients', clients);
    return newClient;
  }

  updateClient(id: number, updates: Partial<Client>): Client | undefined {
    const clients = this.getClients();
    const index = clients.findIndex(client => client.id === id);
    if (index === -1) return undefined;
    
    clients[index] = { ...clients[index], ...updates };
    this.saveToStorage('clients', clients);
    return clients[index];
  }

  deleteClient(id: number): boolean {
    const clients = this.getClients();
    const filteredClients = clients.filter(client => client.id !== id);
    if (filteredClients.length === clients.length) return false;
    
    this.saveToStorage('clients', filteredClients);
    return true;
  }

  // Policies
  getPolicies(): Policy[] {
    return this.getFromStorage<Policy>('policies');
  }

  getPolicy(id: number): Policy | undefined {
    return this.getPolicies().find(policy => policy.id === id);
  }

  createPolicy(policy: Omit<Policy, 'id' | 'createdAt'>): Policy {
    const policies = this.getPolicies();
    const newPolicy: Policy = {
      ...policy,
      id: Math.max(...policies.map(p => p.id), 0) + 1,
      createdAt: new Date().toISOString()
    };
    policies.push(newPolicy);
    this.saveToStorage('policies', policies);
    return newPolicy;
  }

  updatePolicy(id: number, updates: Partial<Policy>): Policy | undefined {
    const policies = this.getPolicies();
    const index = policies.findIndex(policy => policy.id === id);
    if (index === -1) return undefined;
    
    policies[index] = { ...policies[index], ...updates };
    this.saveToStorage('policies', policies);
    return policies[index];
  }

  deletePolicy(id: number): boolean {
    const policies = this.getPolicies();
    const filteredPolicies = policies.filter(policy => policy.id !== id);
    if (filteredPolicies.length === policies.length) return false;
    
    this.saveToStorage('policies', filteredPolicies);
    return true;
  }

  // Policy Types
  getPolicyTypes(): PolicyType[] {
    return this.getFromStorage<PolicyType>('policyTypes');
  }

  // Claims
  getClaims(): Claim[] {
    return this.getFromStorage<Claim>('claims');
  }

  getClaim(id: number): Claim | undefined {
    return this.getClaims().find(claim => claim.id === id);
  }

  createClaim(claim: Omit<Claim, 'id'>): Claim {
    const claims = this.getClaims();
    const newClaim: Claim = {
      ...claim,
      id: Math.max(...claims.map(c => c.id), 0) + 1
    };
    claims.push(newClaim);
    this.saveToStorage('claims', claims);
    return newClaim;
  }

  updateClaim(id: number, updates: Partial<Claim>): Claim | undefined {
    const claims = this.getClaims();
    const index = claims.findIndex(claim => claim.id === id);
    if (index === -1) return undefined;
    
    claims[index] = { ...claims[index], ...updates };
    this.saveToStorage('claims', claims);
    return claims[index];
  }

  // Agents
  getAgents(): Agent[] {
    return this.getFromStorage<Agent>('agents');
  }

  getAgent(id: number): Agent | undefined {
    return this.getAgents().find(agent => agent.id === id);
  }

  // Dashboard stats
  getDashboardStats() {
    const policies = this.getPolicies();
    const claims = this.getClaims();
    const activePolicies = policies.filter(p => p.status === 'Active');
    const pendingClaims = claims.filter(c => c.status === 'Pending');
    
    return {
      totalPolicies: policies.length,
      activePolicies: activePolicies.length,
      totalRevenue: activePolicies.reduce((sum, p) => sum + p.premium, 0),
      pendingRenewals: Math.floor(activePolicies.length * 0.2), // 20% estimate
      totalClaims: claims.length,
      pendingClaims: pendingClaims.length
    };
  }

  // Recent policies
  getRecentPolicies(limit: number = 10): Policy[] {
    return this.getPolicies()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Upcoming renewals
  getUpcomingRenewals(): Policy[] {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    return this.getPolicies().filter(policy => {
      const endDate = new Date(policy.endDate);
      return endDate <= thirtyDaysFromNow && policy.status === 'Active';
    });
  }
}

export const storageService = new LocalStorageService();