// Local storage utility for frontend-only data management
export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  idNumber: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  occupation: string;
  createdAt: string;
  updatedAt: string;
}

export interface Policy {
  id: number;
  policyNumber: string;
  clientId: number;
  clientName: string;
  policyType: string;
  premium: number;
  status: string;
  startDate: string;
  endDate: string;
  paymentFrequency: string;
  coverageAmount: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  policyTypeId?: number;
  agentId?: number;
  frequency?: string;
  captureDate?: string;
  inceptionDate?: string;
  nextPaymentDate?: string;
  lastPaymentDate?: string;
  smsNotificationSent?: boolean;
}

export interface Claim {
  id: number;
  claimNumber: string;
  policyId: number;
  clientId: number;
  description: string;
  amount: number;
  status: string;
  submittedAt: string;
  processedAt?: string;
  notes?: string;
}

export interface PolicyType {
  id: number;
  name: string;
  description: string;
  basePremium: number;
  coverageAmount: number;
  maxAge: number;
  minAge: number;
}

export interface DashboardStats {
  totalPolicies: number;
  activePolicies: number;
  totalRevenue: number;
  pendingClaims: number;
  totalClaims: number;
  pendingRenewals: number;
}

// Initialize default data
const defaultData = {
  clients: [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      phone: "+27 82 123 4567",
      idNumber: "8901015800089",
      address: "123 Oak Street",
      city: "Cape Town",
      province: "Western Cape",
      postalCode: "8001",
      dateOfBirth: "1989-01-01",
      gender: "Female",
      maritalStatus: "Single",
      occupation: "Software Developer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "+27 83 987 6543",
      idNumber: "7512104500087",
      address: "456 Pine Avenue",
      city: "Johannesburg",
      province: "Gauteng",
      postalCode: "2000",
      dateOfBirth: "1975-12-10",
      gender: "Male",
      maritalStatus: "Married",
      occupation: "Business Manager",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  policies: [
    {
      id: 1,
      policyNumber: "POL-001",
      clientId: 1,
      clientName: "Sarah Johnson",
      policyType: "Life Insurance",
      premium: 170,
      status: "Active",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      paymentFrequency: "Monthly",
      coverageAmount: 500000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      policyNumber: "POL-002",
      clientId: 2,
      clientName: "John Smith",
      policyType: "Family Plan",
      premium: 170,
      status: "Active",
      startDate: "2024-02-01",
      endDate: "2025-01-31",
      paymentFrequency: "Monthly",
      coverageAmount: 750000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  claims: [
    {
      id: 1,
      claimNumber: "CLM-001",
      policyId: 1,
      clientId: 1,
      description: "Medical expenses for surgery",
      amount: 25000,
      status: "Pending",
      submittedAt: new Date().toISOString(),
      notes: "Waiting for medical reports"
    }
  ],
  policyTypes: [
    {
      id: 1,
      name: "Life Insurance",
      description: "Basic life insurance coverage",
      basePremium: 170,
      coverageAmount: 500000,
      maxAge: 65,
      minAge: 18
    },
    {
      id: 2,
      name: "Family Plan",
      description: "Comprehensive family coverage",
      basePremium: 170,
      coverageAmount: 750000,
      maxAge: 65,
      minAge: 18
    }
  ]
};

class LocalStorageService {
  private getStorageKey(entity: string): string {
    return `coversync_${entity}`;
  }

  private getData<T>(entity: string): T[] {
    const stored = localStorage.getItem(this.getStorageKey(entity));
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Initialize with default data
    const defaultKey = entity as keyof typeof defaultData;
    if (defaultData[defaultKey]) {
      const defaultEntityData = defaultData[defaultKey] as any[];
      this.setData(entity, defaultEntityData);
      return defaultEntityData as T[];
    }
    
    return [];
  }

  private setData(entity: string, data: any[]): void {
    localStorage.setItem(this.getStorageKey(entity), JSON.stringify(data));
  }

  private getNextId(entity: string): number {
    const data = this.getData(entity);
    return data.length > 0 ? Math.max(...data.map((item: any) => item.id)) + 1 : 1;
  }

  // Clients
  getClients(): Client[] {
    return this.getData<Client>('clients');
  }

  getClient(id: number): Client | undefined {
    return this.getClients().find(client => client.id === id);
  }

  createClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Client {
    const clients = this.getClients();
    const newClient: Client = {
      ...client,
      id: this.getNextId('clients'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    clients.push(newClient);
    this.setData('clients', clients);
    return newClient;
  }

  updateClient(id: number, updates: Partial<Client>): Client | null {
    const clients = this.getClients();
    const index = clients.findIndex(client => client.id === id);
    if (index === -1) return null;
    
    clients[index] = { ...clients[index], ...updates, updatedAt: new Date().toISOString() };
    this.setData('clients', clients);
    return clients[index];
  }

  deleteClient(id: number): boolean {
    const clients = this.getClients();
    const filtered = clients.filter(client => client.id !== id);
    if (filtered.length === clients.length) return false;
    
    this.setData('clients', filtered);
    return true;
  }

  // Policies
  getPolicies(): Policy[] {
    return this.getData<Policy>('policies');
  }

  getPolicy(id: number): Policy | undefined {
    return this.getPolicies().find(policy => policy.id === id);
  }

  createPolicy(policy: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>): Policy {
    const policies = this.getPolicies();
    const newPolicy: Policy = {
      ...policy,
      id: this.getNextId('policies'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    policies.push(newPolicy);
    this.setData('policies', policies);
    return newPolicy;
  }

  updatePolicy(id: number, updates: Partial<Policy>): Policy | null {
    const policies = this.getPolicies();
    const index = policies.findIndex(policy => policy.id === id);
    if (index === -1) return null;
    
    policies[index] = { ...policies[index], ...updates, updatedAt: new Date().toISOString() };
    this.setData('policies', policies);
    return policies[index];
  }

  deletePolicy(id: number): boolean {
    const policies = this.getPolicies();
    const filtered = policies.filter(policy => policy.id !== id);
    if (filtered.length === policies.length) return false;
    
    this.setData('policies', filtered);
    return true;
  }

  // Claims
  getClaims(): Claim[] {
    return this.getData<Claim>('claims');
  }

  getClaim(id: number): Claim | undefined {
    return this.getClaims().find(claim => claim.id === id);
  }

  createClaim(claim: Omit<Claim, 'id'>): Claim {
    const claims = this.getClaims();
    const newClaim: Claim = {
      ...claim,
      id: this.getNextId('claims')
    };
    claims.push(newClaim);
    this.setData('claims', claims);
    return newClaim;
  }

  updateClaim(id: number, updates: Partial<Claim>): Claim | null {
    const claims = this.getClaims();
    const index = claims.findIndex(claim => claim.id === id);
    if (index === -1) return null;
    
    claims[index] = { ...claims[index], ...updates };
    this.setData('claims', claims);
    return claims[index];
  }

  deleteClaim(id: number): boolean {
    const claims = this.getClaims();
    const filtered = claims.filter(claim => claim.id !== id);
    if (filtered.length === claims.length) return false;
    
    this.setData('claims', filtered);
    return true;
  }

  // Policy Types
  getPolicyTypes(): PolicyType[] {
    return this.getData<PolicyType>('policyTypes');
  }

  // Dashboard Stats
  getDashboardStats(): DashboardStats {
    const policies = this.getPolicies();
    const claims = this.getClaims();
    
    const activePolicies = policies.filter(p => p.status === 'Active');
    const totalRevenue = activePolicies.reduce((sum, p) => sum + p.premium * 12, 0);
    const pendingClaims = claims.filter(c => c.status === 'Pending').length;
    
    // Calculate pending renewals (policies ending in next 30 days)
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const pendingRenewals = policies.filter(p => {
      const endDate = new Date(p.endDate);
      return endDate >= now && endDate <= in30Days;
    }).length;

    return {
      totalPolicies: policies.length,
      activePolicies: activePolicies.length,
      totalRevenue,
      pendingClaims,
      totalClaims: claims.length,
      pendingRenewals
    };
  }

  // Get recent policies (last 10)
  getRecentPolicies(): Policy[] {
    return this.getPolicies()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }

  // Get renewal policies
  getRenewalPolicies(): Policy[] {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return this.getPolicies().filter(p => {
      const endDate = new Date(p.endDate);
      return endDate >= now && endDate <= in30Days;
    });
  }
}

export const localStorageService = new LocalStorageService();