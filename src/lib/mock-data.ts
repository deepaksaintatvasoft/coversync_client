// Mock data service for frontend-only application
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
  activePolicies: number;
  status: string;
}

// Mock data
export const mockClients: Client[] = [
  {
    id: 1,
    name: "Robert Chen",
    email: "robert.chen@example.com", 
    phone: "+27 11 234 5678",
    idNumber: "8501015800082",
    address: "123 Main Street, Johannesburg, 2000",
    dateOfBirth: "1985-01-01",
    gender: "Male",
    occupation: "Software Engineer",
    maritalStatus: "Married",
    createdAt: "2024-01-15T10:30:00Z"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "+27 21 345 6789", 
    idNumber: "9203127890123",
    address: "456 Oak Avenue, Cape Town, 8001",
    dateOfBirth: "1992-03-12",
    gender: "Female",
    occupation: "Marketing Manager",
    maritalStatus: "Single",
    createdAt: "2024-02-20T14:15:00Z"
  },
  {
    id: 3,
    name: "Michael Thompson",
    email: "michael.thompson@example.com",
    phone: "+27 31 456 7890",
    idNumber: "7809234567890",
    address: "789 Pine Road, Durban, 4001",
    dateOfBirth: "1978-09-23",
    gender: "Male", 
    occupation: "Doctor",
    maritalStatus: "Married",
    createdAt: "2024-03-10T09:45:00Z"
  }
];

export const mockPolicies: Policy[] = [
  {
    id: 1001,
    policyNumber: "POL-1001",
    clientId: 1,
    clientName: "Robert Chen",
    policyType: "Family Plan",
    premium: 170,
    frequency: "Monthly",
    startDate: "2024-01-15",
    endDate: "2025-01-15",
    status: "Active",
    coverageAmount: 50000,
    beneficiaries: ["Spouse", "Children"]
  },
  {
    id: 1002,
    policyNumber: "POL-1002", 
    clientId: 2,
    clientName: "Sarah Johnson",
    policyType: "Individual Plan",
    premium: 170,
    frequency: "Monthly",
    startDate: "2024-02-20",
    endDate: "2025-02-20",
    status: "Active",
    coverageAmount: 25000,
    beneficiaries: ["Parents"]
  },
  {
    id: 1003,
    policyNumber: "POL-1003",
    clientId: 3,
    clientName: "Michael Thompson", 
    policyType: "Family Plan",
    premium: 170,
    frequency: "Monthly",
    startDate: "2024-03-10",
    endDate: "2025-03-10",
    status: "Active",
    coverageAmount: 75000,
    beneficiaries: ["Spouse", "Children", "Parents"]
  }
];

export const mockClaims: Claim[] = [
  {
    id: 501,
    claimNumber: "CLM-501",
    policyId: 1001,
    policyNumber: "POL-1001",
    clientName: "Robert Chen",
    type: "Medical",
    amount: 5000,
    status: "Under Review",
    dateSubmitted: "2024-05-15",
    description: "Hospital treatment for emergency surgery"
  },
  {
    id: 502,
    claimNumber: "CLM-502", 
    policyId: 1002,
    policyNumber: "POL-1002",
    clientName: "Sarah Johnson",
    type: "Dental",
    amount: 1500,
    status: "Approved",
    dateSubmitted: "2024-04-20",
    description: "Dental implant procedure"
  },
  {
    id: 503,
    claimNumber: "CLM-503",
    policyId: 1003,
    policyNumber: "POL-1003", 
    clientName: "Michael Thompson",
    type: "Vision",
    amount: 800,
    status: "Pending",
    dateSubmitted: "2024-06-01",
    description: "Corrective eye surgery"
  }
];

export const mockAgents: Agent[] = [
  {
    id: 1,
    name: "Lisa Williams",
    email: "lisa.williams@coversync.co.za",
    phone: "+27 11 987 6543",
    commissionRate: 0.10,
    totalSales: 85000,
    activePolicies: 25,
    status: "Active"
  },
  {
    id: 2,
    name: "David Miller",
    email: "david.miller@coversync.co.za", 
    phone: "+27 21 876 5432",
    commissionRate: 0.12,
    totalSales: 120000,
    activePolicies: 35,
    status: "Active"
  },
  {
    id: 3,
    name: "Jennifer Davis",
    email: "jennifer.davis@coversync.co.za",
    phone: "+27 31 765 4321",
    commissionRate: 0.08,
    totalSales: 65000,
    activePolicies: 18,
    status: "Active"
  }
];

export const mockDashboardStats = {
  totalPolicies: 428,
  activePolicies: 318,
  totalRevenue: 783340,
  pendingRenewals: 204,
  totalClaims: 161,
  pendingClaims: 107,
  approvedClaims: 42,
  rejectedClaims: 12
};

export const mockPolicyTypes = [
  {
    name: "Family Plan",
    description: "Comprehensive coverage for families",
    basePremium: 170,
    maxCoverage: 100000
  },
  {
    name: "Individual Plan", 
    description: "Personal coverage for individuals",
    basePremium: 170,
    maxCoverage: 50000
  },
  {
    name: "Senior Plan",
    description: "Specialized coverage for seniors",
    basePremium: 170,
    maxCoverage: 75000
  }
];

// Mock API functions
export const mockApiService = {
  // Dashboard
  getDashboardStats: () => Promise.resolve(mockDashboardStats),
  
  // Clients
  getClients: () => Promise.resolve(mockClients),
  getClient: (id: number) => Promise.resolve(mockClients.find(c => c.id === id)),
  
  // Policies
  getPolicies: () => Promise.resolve(mockPolicies),
  getRecentPolicies: () => Promise.resolve(mockPolicies.slice(0, 5)),
  getRenewalPolicies: () => Promise.resolve(mockPolicies.filter(p => new Date(p.endDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))),
  getPolicy: (id: number) => Promise.resolve(mockPolicies.find(p => p.id === id)),
  
  // Claims
  getClaims: () => Promise.resolve(mockClaims),
  getClaim: (id: number) => Promise.resolve(mockClaims.find(c => c.id === id)),
  
  // Agents
  getAgents: () => Promise.resolve(mockAgents),
  getAgent: (id: number) => Promise.resolve(mockAgents.find(a => a.id === id)),
  
  // Policy Types
  getPolicyTypes: () => Promise.resolve(mockPolicyTypes)
};