import { z } from "zod";

// Basic policy schema for form validation
export const insertPolicySchema = z.object({
  policyNumber: z.string().min(1, "Policy number is required"),
  clientName: z.string().min(1, "Client name is required"),
  policyType: z.string().min(1, "Policy type is required"),
  premium: z.number().min(0, "Premium must be positive"),
  frequency: z.enum(["monthly", "quarterly", "annually"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  coverageAmount: z.number().min(0, "Coverage amount must be positive"),
  status: z.enum(["active", "inactive", "pending", "cancelled"]).default("pending"),
});

// Client schema
export const insertClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  idNumber: z.string().min(1, "ID number is required"),
  address: z.string().min(1, "Address is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"]),
  occupation: z.string().min(1, "Occupation is required"),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]),
});

// Claim schema
export const insertClaimSchema = z.object({
  claimNumber: z.string().min(1, "Claim number is required"),
  policyId: z.number(),
  type: z.string().min(1, "Claim type is required"),
  amount: z.number().min(0, "Claim amount must be positive"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["pending", "approved", "rejected", "processing"]).default("pending"),
});

// Agent schema
export const insertAgentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  commissionRate: z.number().min(0).max(100, "Commission rate must be between 0 and 100"),
});

export type InsertPolicy = z.infer<typeof insertPolicySchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type InsertAgent = z.infer<typeof insertAgentSchema>;