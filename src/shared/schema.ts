import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, varchar, date, json, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// SMS-related schemas
export const smsTemplates = pgTable("sms_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // policy_payment, claim_captured, birthday, etc.
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSmsTemplateSchema = createInsertSchema(smsTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const smsCredits = pgTable("sms_credits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(), // Can be positive (purchase) or negative (usage)
  balance: integer("balance").notNull(),
  transactionType: text("transaction_type").notNull(), // purchase, usage
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSmsCreditsSchema = createInsertSchema(smsCredits).omit({
  id: true,
  createdAt: true,
});

export const smsLogs = pgTable("sms_logs", {
  id: serial("id").primaryKey(),
  recipient: text("recipient").notNull(),
  content: text("content").notNull(),
  templateId: integer("template_id"),
  status: text("status").notNull(), // delivered, failed, pending
  error: text("error"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
  sentBy: integer("sent_by").notNull(), // User ID
  relatedTo: text("related_to"), // policy_id, claim_id, etc.
});

export const insertSmsLogSchema = createInsertSchema(smsLogs).omit({
  id: true,
  sentAt: true,
});

export const smsSettings = pgTable("sms_settings", {
  id: serial("id").primaryKey(),
  senderName: text("sender_name").default("CoverSync"),
  smsFooter: text("sms_footer").default("CoverSync"),
  sendWelcomeMessage: boolean("send_welcome_message").default(true),
  sendBirthdayMessages: boolean("send_birthday_messages").default(true),
  sendPaymentConfirmations: boolean("send_payment_confirmations").default(true),
  sendClaimNotifications: boolean("send_claim_notifications").default(true),
  autoBuyCredits: boolean("auto_buy_credits").default(false),
  minCreditThreshold: integer("min_credit_threshold").default(50),
  autoRechargeAmount: integer("auto_recharge_amount").default(200),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSmsSettingsSchema = createInsertSchema(smsSettings).omit({
  id: true,
  updatedAt: true,
});

// Client schema - enhanced for policy holder details
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"), // male, female, other
  idNumber: text("id_number"), // National ID, SSN, etc.
  occupation: text("occupation"),
  employerName: text("employer_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

// Dependents schema (spouse, children, extended family)
export const dependents = pgTable("dependents", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(), // Links to the main policyholder
  name: text("name").notNull(),
  relationship: text("relationship").notNull(), // spouse, child, parent, other
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),
  idNumber: text("id_number"),
  contactNumber: text("contact_number"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDependentSchema = createInsertSchema(dependents).omit({
  id: true,
  createdAt: true,
});

// Bank Details schema
export const bankDetails = pgTable("bank_details", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  accountHolderName: text("account_holder_name").notNull(),
  accountNumber: text("account_number").notNull(),
  bankName: text("bank_name").notNull(),
  branchCode: text("branch_code"),
  accountType: text("account_type").notNull(), // checking, savings, etc.
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBankDetailSchema = createInsertSchema(bankDetails).omit({
  id: true,
  createdAt: true,
});

// Policy Types schema
export const policyTypes = pgTable("policy_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").default("#3b82f6"),
  coverageAmount: doublePrecision("coverage_amount"), // Maximum coverage amount
  coverageDetails: json("coverage_details"), // Detailed information about coverage
  eligibilityRules: json("eligibility_rules"), // Rules for eligibility
});

export const insertPolicyTypeSchema = createInsertSchema(policyTypes).omit({
  id: true,
});

// Policies schema - enhanced version
export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  policyNumber: text("policy_number").notNull().unique(),
  clientId: integer("client_id").notNull(),
  policyTypeId: integer("policy_type_id").notNull(),
  agentId: integer("agent_id"), // ID of the agent who sold the policy
  status: text("status").notNull().default("pending"), // active, pending, expired, cancelled
  premium: doublePrecision("premium").notNull(),
  frequency: text("frequency").notNull().default("monthly"), // monthly is the default and most common
  captureDate: timestamp("capture_date").defaultNow().notNull(), // Date the policy was captured in the system
  inceptionDate: timestamp("inception_date"), // Will be set when first payment is received
  renewalDate: timestamp("renewal_date"),
  bankDetailId: integer("bank_detail_id"), // For premium payments
  coverageAmount: doublePrecision("coverage_amount"), // Total coverage
  deductible: doublePrecision("deductible"),
  beneficiaries: json("beneficiaries"), // JSON array of beneficiary information
  additionalCoverage: json("additional_coverage"), // Any add-ons
  notes: text("notes"),
  documents: json("documents"), // Links to policy documents
  smsNotificationSent: boolean("sms_notification_sent").default(false), // Tracks if welcome SMS was sent to client
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPolicySchema = createInsertSchema(policies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Policy Dependents junction table (many-to-many)
export const policyDependents = pgTable("policy_dependents", {
  id: serial("id").primaryKey(),
  policyId: integer("policy_id").notNull(),
  dependentId: integer("dependent_id").notNull(),
  coveragePercentage: doublePrecision("coverage_percentage").default(100),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPolicyDependentSchema = createInsertSchema(policyDependents).omit({
  id: true,
  createdAt: true,
});

// User Roles and Permissions
export const userRoles = z.enum([
  "data_capturer",  // Can input/edit data but limited access
  "claim_handler",  // Can process claims
  "super_admin",    // Full access to all features
]);

export type UserRole = z.infer<typeof userRoles>;

// User schema (for authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("data_capturer"), // data_capturer, claim_handler, super_admin
  permissions: jsonb("permissions"), // Specific permissions if needed beyond role-based access
  avatarUrl: text("avatar_url"),
  active: boolean("active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

// Audit Log schema
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Who performed the action
  action: text("action").notNull(), // What action was performed (create, update, delete, view, etc.)
  entityType: text("entity_type").notNull(), // What entity was affected (policy, client, claim, etc.)
  entityId: text("entity_id"), // ID of the entity that was affected
  details: jsonb("details"), // Additional details about the action
  ipAddress: text("ip_address"), // IP address of the user
  userAgent: text("user_agent"), // Browser/client information
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

// Define the types
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertDependent = z.infer<typeof insertDependentSchema>;
export type Dependent = typeof dependents.$inferSelect;

export type InsertBankDetail = z.infer<typeof insertBankDetailSchema>;
export type BankDetail = typeof bankDetails.$inferSelect;

export type InsertPolicyType = z.infer<typeof insertPolicyTypeSchema>;
export type PolicyType = typeof policyTypes.$inferSelect;

export type InsertPolicy = z.infer<typeof insertPolicySchema>;
export type Policy = typeof policies.$inferSelect;

export type InsertPolicyDependent = z.infer<typeof insertPolicyDependentSchema>;
export type PolicyDependent = typeof policyDependents.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Extended types with joins
export type PolicyWithDetails = Policy & {
  client: Client;
  policyType: PolicyType;
  bankDetail?: BankDetail;
  dependents?: Dependent[];
};

// Extended claim type with related details
export type ClaimWithDetails = Claim & {
  policy?: Policy;
  client?: Client;
  assignedUser?: User;
  documents?: ClaimDocument[];
  notes?: ClaimNote[];
};

// Type for Agent with commission information
export type AgentWithCommissions = Agent & {
  commissions?: AgentCommission[];
  performance?: AgentPerformance[];
};

// Extended user type with role information
export type UserWithPermissions = User & {
  permissions: Record<string, boolean>;
};

// Claims status enum
export const claimStatusEnum = z.enum([
  "pending",
  "in_review",
  "approved",
  "paid",
  "rejected"
]);

export type ClaimStatus = z.infer<typeof claimStatusEnum>;

// Claims schema
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  claimNumber: text("claim_number").notNull().unique(),
  policyId: integer("policy_id").notNull(),
  clientId: integer("client_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, in_review, approved, paid, rejected
  claimType: text("claim_type").notNull(), // death, disability, etc.
  assignedTo: integer("assigned_to"), // User ID of the claim handler
  dateOfIncident: date("date_of_incident"),
  dateOfClaim: date("date_of_claim").notNull(),
  // Death claim specific fields
  dateOfDeath: date("date_of_death"),
  causeOfDeath: text("cause_of_death"),
  placeOfDeath: text("place_of_death"),
  deceasedId: integer("deceased_id"), // ID of the dependent who passed away
  claimantName: text("claimant_name"), // Name of person making the claim
  claimantContact: text("claimant_contact"), // Contact of person making the claim
  claimantIdNumber: text("claimant_id_number"), // ID of person making the claim
  claimantEmail: text("claimant_email"), // Email of person making the claim
  relationshipToMember: text("relationship_to_member"), // Relationship to deceased
  funeralHome: text("funeral_home"), // Name of funeral home
  funeralDate: date("funeral_date"), // Date of funeral
  // Standard claim fields
  claimAmount: doublePrecision("claim_amount"),
  approvedAmount: doublePrecision("approved_amount"),
  rejectionReason: text("rejection_reason"),
  paymentDate: date("payment_date"),
  paymentMethod: text("payment_method"), // bank_transfer, check, etc.
  bankDetailId: integer("bank_detail_id"), // For claim payment
  documents: json("documents"), // Array of document references/links
  notes: text("notes"),
  additionalInfo: jsonb("additional_info"), // Any additional information
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Claim Documents schema
export const claimDocuments = pgTable("claim_documents", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").notNull(),
  documentType: text("document_type").notNull(), // death_certificate, medical_report, etc.
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedBy: integer("uploaded_by").notNull(), // User ID
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  verified: boolean("verified").default(false),
  verifiedBy: integer("verified_by"), // User ID of verifier
  verificationDate: timestamp("verification_date"),
  notes: text("notes"),
});

export const insertClaimDocumentSchema = createInsertSchema(claimDocuments).omit({
  id: true,
  uploadDate: true,
});

// Claim Notes/Comments schema
export const claimNotes = pgTable("claim_notes", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").notNull(),
  userId: integer("user_id").notNull(), // Who created the note
  noteText: text("note_text").notNull(),
  isPrivate: boolean("is_private").default(false), // Whether the note is private to claim handlers
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClaimNoteSchema = createInsertSchema(claimNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export claim types
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Claim = typeof claims.$inferSelect;

export type InsertClaimDocument = z.infer<typeof insertClaimDocumentSchema>;
export type ClaimDocument = typeof claimDocuments.$inferSelect;

export type InsertClaimNote = z.infer<typeof insertClaimNoteSchema>;
export type ClaimNote = typeof claimNotes.$inferSelect;

// Export SMS types
export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;
export type SmsTemplate = typeof smsTemplates.$inferSelect;

export type InsertSmsCredit = z.infer<typeof insertSmsCreditsSchema>;
export type SmsCredit = typeof smsCredits.$inferSelect;

export type InsertSmsLog = z.infer<typeof insertSmsLogSchema>;
export type SmsLog = typeof smsLogs.$inferSelect;

export type InsertSmsSettings = z.infer<typeof insertSmsSettingsSchema>;
export type SmsSettings = typeof smsSettings.$inferSelect;

// Extended claim type with related details
// Agents schema
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  surname: text("surname").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  idNumber: text("id_number"),
  address: text("address"),
  status: text("status").notNull().default("active"), // active, inactive, suspended
  commissionRate: doublePrecision("commission_rate").notNull().default(0), // Base commission rate (%)
  hireDate: date("hire_date").notNull(),
  terminationDate: date("termination_date"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountType: text("account_type"),
  branchCode: text("branch_code"),
  taxNumber: text("tax_number"),
  avatarUrl: text("avatar_url"),
  notes: text("notes"),
  branch: text("branch"),
  totalPolicies: integer("total_policies").default(0),
  totalCommission: doublePrecision("total_commission").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Agent Commission schema
export const agentCommissions = pgTable("agent_commissions", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  policyId: integer("policy_id").notNull(),
  policyNumber: text("policy_number").notNull(),
  clientName: text("client_name").notNull(),
  policyType: text("policy_type").notNull(),
  premium: doublePrecision("premium").notNull(),
  commissionRate: doublePrecision("commission_rate").notNull(),
  commissionAmount: doublePrecision("commission_amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, cancelled
  paymentDate: date("payment_date"),
  policyStartDate: date("policy_start_date").notNull(),
  policyEndDate: date("policy_end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgentCommissionSchema = createInsertSchema(agentCommissions).omit({
  id: true,
  createdAt: true,
});

// Agent Performance Metrics schema
export const agentPerformance = pgTable("agent_performance", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  policiesSold: integer("policies_sold").notNull().default(0),
  renewalsRetained: integer("renewals_retained").notNull().default(0),
  totalPremium: doublePrecision("total_premium").notNull().default(0),
  totalCommission: doublePrecision("total_commission").notNull().default(0),
  renewalRate: doublePrecision("renewal_rate").notNull().default(0),
  targets: jsonb("targets"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAgentPerformanceSchema = createInsertSchema(agentPerformance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export type InsertAgentCommission = z.infer<typeof insertAgentCommissionSchema>;
export type AgentCommission = typeof agentCommissions.$inferSelect;

export type InsertAgentPerformance = z.infer<typeof insertAgentPerformanceSchema>;
export type AgentPerformance = typeof agentPerformance.$inferSelect;

// Email Settings schema
export const emailSettings = pgTable("email_settings", {
  id: serial("id").primaryKey(),
  underwriterEmails: text("underwriter_emails").notNull(), // Comma-separated list
  brokerEmails: text("broker_emails"), // Comma-separated list
  managerEmails: text("manager_emails"), // Comma-separated list
  notifyOnNewPolicy: boolean("notify_on_new_policy").default(true),
  notifyOnClaim: boolean("notify_on_claim").default(true),
  emailSignature: text("email_signature"),
  replyToEmail: text("reply_to_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertEmailSettings = typeof emailSettings.$inferInsert;
export const insertEmailSettingsSchema = createInsertSchema(emailSettings);

// Email Log schema for tracking sent emails
export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  recipients: text("recipients").notNull(), // Comma-separated list
  subject: text("subject").notNull(),
  body: text("body"),
  attachments: text("attachments"), // Comma-separated list of file paths
  sentBy: integer("sent_by").notNull(), // User ID
  status: text("status").notNull(), // sent, failed
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  relatedTo: text("related_to"), // e.g., "policy:123", "claim:456"
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;
export const insertEmailLogSchema = createInsertSchema(emailLogs);

// Email template schema
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  category: text("category").notNull(), // policy, claim, general
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates);

// API Gateway related schemas
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  keyName: text("key_name").notNull(),
  keyValue: text("key_value").notNull().unique(), // The actual API key (hashed in storage)
  description: text("description"),
  partnerId: integer("partner_id").notNull(), // Links to the partner who owns this key
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"), // Optional expiration date
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsed: timestamp("last_used"), // When the key was last used
  allowedEndpoints: json("allowed_endpoints"), // List of endpoints this key can access
  ipRestrictions: json("ip_restrictions"), // Optional IP restrictions
  usageCount: integer("usage_count").default(0), // Number of times the key has been used
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
  usageCount: true,
});

export const apiPartners = pgTable("api_partners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  status: text("status").notNull().default("active"), // active, suspended, pending
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  notes: text("notes"),
});

export const insertApiPartnerSchema = createInsertSchema(apiPartners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const apiLogs = pgTable("api_logs", {
  id: serial("id").primaryKey(),
  apiKeyId: integer("api_key_id").notNull(),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(), // GET, POST, PUT, DELETE
  statusCode: integer("status_code").notNull(),
  responseTime: integer("response_time").notNull(), // in milliseconds
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  requestBody: json("request_body"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertApiLogSchema = createInsertSchema(apiLogs).omit({
  id: true,
  timestamp: true,
});

// Export API Gateway types
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export type ApiPartner = typeof apiPartners.$inferSelect;
export type InsertApiPartner = z.infer<typeof insertApiPartnerSchema>;

export type ApiLog = typeof apiLogs.$inferSelect;
export type InsertApiLog = z.infer<typeof insertApiLogSchema>;
