/**
 * Script to create a test claim with documents for testing the "Send to Underwriter" functionality
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to load the data
function loadData() {
  try {
    const data = fs.readFileSync('./data/app-data.json', 'utf8');
    const parsedData = JSON.parse(data);
    
    // Process the data for our script - convert Map entries back to arrays
    const result = { };
    
    // Process clients
    if (parsedData.clients && Array.isArray(parsedData.clients)) {
      result.clients = parsedData.clients.map(entry => {
        if (Array.isArray(entry) && entry.length > 1) {
          return entry[1]; // Map format [id, clientObject]
        } else if (entry && typeof entry === 'object') {
          return entry; // Already an object
        }
        return null;
      }).filter(client => client !== null);
    } else {
      result.clients = [];
    }
    
    // Process policies
    if (parsedData.policies && Array.isArray(parsedData.policies)) {
      result.policies = parsedData.policies.map(entry => {
        if (Array.isArray(entry) && entry.length > 1) {
          return entry[1]; // Map format [id, policyObject]
        } else if (entry && typeof entry === 'object') {
          return entry; // Already an object
        }
        return null;
      }).filter(policy => policy !== null);
    } else {
      result.policies = [];
    }
    
    // Process policy types
    if (parsedData.policyTypes && Array.isArray(parsedData.policyTypes)) {
      result.policyTypes = parsedData.policyTypes.map(entry => {
        if (Array.isArray(entry) && entry.length > 1) {
          return entry[1]; // Map format [id, policyTypeObject]
        } else if (entry && typeof entry === 'object') {
          return entry; // Already an object
        }
        return null;
      }).filter(policyType => policyType !== null);
    } else {
      result.policyTypes = [];
    }
    
    // Process users
    if (parsedData.users && Array.isArray(parsedData.users)) {
      result.users = parsedData.users.map(entry => {
        if (Array.isArray(entry) && entry.length > 1) {
          return entry[1]; // Map format [id, userObject]
        } else if (entry && typeof entry === 'object') {
          return entry; // Already an object
        }
        return null;
      }).filter(user => user !== null);
    } else {
      result.users = [];
    }
    
    // Process claims
    if (parsedData.claims && Array.isArray(parsedData.claims)) {
      result.claims = parsedData.claims.map(entry => {
        if (Array.isArray(entry) && entry.length > 1) {
          return entry[1]; // Map format [id, claimObject]
        } else if (entry && typeof entry === 'object') {
          return entry; // Already an object
        }
        return null;
      }).filter(claim => claim !== null);
    } else {
      result.claims = [];
    }
    
    // Process claim documents
    if (parsedData.claimDocuments && Array.isArray(parsedData.claimDocuments)) {
      result.claimDocuments = parsedData.claimDocuments.map(entry => {
        if (Array.isArray(entry) && entry.length > 1) {
          return entry[1]; // Map format [id, documentObject]
        } else if (entry && typeof entry === 'object') {
          return entry; // Already an object
        }
        return null;
      }).filter(doc => doc !== null);
    } else {
      result.claimDocuments = [];
    }
    
    return result;
  } catch (error) {
    console.error('Error loading data:', error);
    return {
      clients: [],
      policies: [],
      claims: [],
      policyTypes: [],
      users: [],
      claimDocuments: []
    };
  }
}

// Function to save data
function saveData(data) {
  try {
    // Read the existing app-data.json file to get the current structure
    let existingData = {};
    try {
      existingData = JSON.parse(fs.readFileSync('./data/app-data.json', 'utf8'));
    } catch (err) {
      console.log('No existing data file found, creating new one');
    }

    // Update the existing data with our new entries
    const updatedData = {
      ...existingData,
      currentClaimId: data.claims.length ? Math.max(...data.claims.map(c => c.id)) + 1 : 1,
      currentClientId: data.clients.length ? Math.max(...data.clients.map(c => c.id)) + 1 : 1,
      currentPolicyId: data.policies.length ? Math.max(...data.policies.map(p => p.id)) + 1 : 1,
      currentPolicyTypeId: data.policyTypes.length ? Math.max(...data.policyTypes.map(pt => pt.id)) + 1 : 1,
    };
    
    // Convert users to Map format (array of [id, user] pairs)
    if (data.users && data.users.length > 0) {
      updatedData.users = data.users.map(user => [user.id, user]);
    }
    
    // Convert clients to Map format
    if (data.clients && data.clients.length > 0) {
      updatedData.clients = data.clients.map(client => [client.id, client]);
    }
    
    // Convert policies to Map format
    if (data.policies && data.policies.length > 0) {
      updatedData.policies = data.policies.map(policy => [policy.id, policy]);
    }
    
    // Convert policy types to Map format
    if (data.policyTypes && data.policyTypes.length > 0) {
      updatedData.policyTypes = data.policyTypes.map(type => [type.id, type]);
    }
    
    // Convert claims to Map format
    if (data.claims && data.claims.length > 0) {
      updatedData.claims = data.claims.map(claim => [claim.id, claim]);
    }
    
    // Convert claim documents to Map format
    if (data.claimDocuments && data.claimDocuments.length > 0) {
      updatedData.claimDocuments = data.claimDocuments.map(doc => [doc.id, doc]);
    }
    
    // Write the updated data back to the file
    fs.writeFileSync('./data/app-data.json', JSON.stringify(updatedData, null, 2));
    console.log('Data saved successfully');
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Load existing data
const data = loadData();

// Get existing users, clients, policies for reference
const users = data.users || [];
const clients = data.clients || [];
const policies = data.policies || [];
const claims = data.claims || [];
const policyTypes = data.policyTypes || [];
const claimDocuments = data.claimDocuments || [];

// Select first admin user, or create one if none exists
let adminUser = users.find(user => user.role === 'super_admin');
if (!adminUser) {
  adminUser = {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    email: 'admin@coversync.co.za',
    role: 'super_admin',
    permissions: { 
      manageUsers: true, 
      managePolicies: true, 
      manageClients: true, 
      manageClaims: true, 
      viewReports: true 
    },
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  users.push(adminUser);
}

// Select an existing client or create one
let testClient = clients.find(client => client.name === 'John Smith');
if (!testClient) {
  testClient = {
    id: clients.length ? Math.max(...clients.map(c => c.id)) + 1 : 1,
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '0821234567',
    address: '123 Main St, Johannesburg, Gauteng',
    dateOfBirth: '1980-01-15',
    gender: 'male',
    idNumber: '8001155042089',
    occupation: 'Software Developer',
    employerName: 'Tech Solutions',
    createdAt: new Date().toISOString()
  };
  clients.push(testClient);
}

// Select policy type or create one
let familyPolicyType = policyTypes.find(pt => pt.name === 'Family Plan');
if (!familyPolicyType) {
  familyPolicyType = {
    id: policyTypes.length ? Math.max(...policyTypes.map(pt => pt.id)) + 1 : 1,
    name: 'Family Plan',
    description: 'Comprehensive funeral cover for the whole family',
    color: '#3b82f6',
    coverageAmount: 25000,
    coverageDetails: { maxFamilyMembers: 10, waitingPeriod: 6 },
    eligibilityRules: { minAge: 18, maxAge: 65 }
  };
  policyTypes.push(familyPolicyType);
}

// Select a policy or create one
let testPolicy = policies.find(policy => policy.clientId === testClient.id);
if (!testPolicy) {
  testPolicy = {
    id: policies.length ? Math.max(...policies.map(p => p.id)) + 1 : 1,
    policyNumber: `POL-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    clientId: testClient.id,
    policyTypeId: familyPolicyType.id,
    status: 'active',
    premium: 450,
    frequency: 'monthly',
    captureDate: new Date().toISOString(),
    inceptionDate: new Date().toISOString(),
    renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    coverageAmount: 25000,
    deductible: 0,
    beneficiaries: [],
    additionalCoverage: {},
    notes: 'Created for testing send to underwriter functionality',
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  policies.push(testPolicy);
}

// Create a test claim
const newClaimId = claims.length ? Math.max(...claims.map(c => c.id)) + 1 : 1;
const testClaim = {
  id: newClaimId,
  claimNumber: `CLM-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
  policyId: testPolicy.id,
  clientId: testClient.id,
  status: 'in_review',  // Make it ready for underwriter
  claimType: 'death',
  assignedTo: adminUser.id,  // Assign to admin user
  assignedUserId: adminUser.id,  // Adding this to match server schema
  dateOfIncident: '2023-12-15',
  dateOfClaim: '2023-12-20',
  // Death claim specific fields
  dateOfDeath: '2023-12-15',
  causeOfDeath: 'Natural causes',
  placeOfDeath: 'Home',
  claimantName: 'Jane Smith',
  claimantContact: '0821234568',
  claimantIdNumber: '8502156042082',
  claimantEmail: 'jane.smith@example.com',
  relationshipToMember: 'Spouse',
  funeralHome: 'Peaceful Rest Funeral Home',
  funeralDate: '2023-12-22',
  // Standard claim fields
  claimAmount: 25000,
  approvedAmount: null,
  rejectionReason: null,
  paymentDate: null,
  paymentMethod: null,
  bankDetailId: null,
  documents: [],
  notes: 'Test claim for underwriter email testing',
  additionalInfo: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Check if claim already exists
const existingClaim = claims.find(c => c.claimNumber === testClaim.claimNumber);
if (!existingClaim) {
  claims.push(testClaim);
  console.log(`Added new test claim with ID: ${testClaim.id}`);
} else {
  console.log(`Test claim already exists with ID: ${existingClaim.id}`);
}

// Create some test documents for the claim
const docTypes = ['death_certificate', 'id_document', 'claim_form', 'bank_statement'];
const existingDocs = claimDocuments.filter(doc => doc.claimId === testClaim.id);

if (existingDocs.length === 0) {
  // Add documents for each type
  docTypes.forEach((docType, index) => {
    const newDocId = claimDocuments.length ? Math.max(...claimDocuments.map(d => d.id)) + 1 + index : 1 + index;
    const testDoc = {
      id: newDocId,
      claimId: testClaim.id,
      documentType: docType,
      fileName: `${docType.replace('_', '-')}.pdf`,
      fileUrl: `/uploads/${docType.replace('_', '-')}.pdf`,
      fileSize: 150000 + Math.floor(Math.random() * 500000),
      mimeType: 'application/pdf',
      uploadedBy: adminUser.id,
      uploadDate: new Date().toISOString(),
      verified: true,
      verifiedBy: adminUser.id,
      verificationDate: new Date().toISOString(),
      notes: `Test ${docType.replace('_', ' ')} document`
    };
    claimDocuments.push(testDoc);
    console.log(`Added test document: ${testDoc.fileName}`);
  });
} else {
  console.log(`Claim already has ${existingDocs.length} documents`);
}

// Save all data
data.users = users;
data.clients = clients;
data.policies = policies;
data.claims = claims;
data.policyTypes = policyTypes;
data.claimDocuments = claimDocuments;

saveData(data);
console.log('Test claim setup complete!');