// Data feature types
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
  renewalDate: string;
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