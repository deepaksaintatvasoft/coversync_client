import { z } from "zod";

// Shared schema definitions for the frontend-only application
export interface PolicyWithDetails {
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
  // Additional fields for compatibility
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

// Zod schemas for form validation
export const insertPolicySchema = z.object({
  clientId: z.number(),
  clientName: z.string().min(1, "Client name is required"),
  policyType: z.string().min(1, "Policy type is required"),
  premium: z.number().min(0, "Premium must be positive"),
  status: z.string().default("Active"),
  startDate: z.string(),
  endDate: z.string(),
  paymentFrequency: z.string().default("Monthly"),
  coverageAmount: z.number().min(0, "Coverage amount must be positive"),
});

export const insertClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  idNumber: z.string().min(1, "ID number is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  dateOfBirth: z.string(),
  gender: z.string().min(1, "Gender is required"),
  maritalStatus: z.string().min(1, "Marital status is required"),
  occupation: z.string().min(1, "Occupation is required"),
});

export const insertClaimSchema = z.object({
  policyId: z.number(),
  clientId: z.number(),
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0, "Amount must be positive"),
  status: z.string().default("Pending"),
});

export type InsertPolicy = z.infer<typeof insertPolicySchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertClaim = z.infer<typeof insertClaimSchema>;

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