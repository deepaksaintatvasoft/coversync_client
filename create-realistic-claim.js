/**
 * Script to create a realistic test claim with actual documents from the assets folder
 * This creates a more comprehensive example for testing the "Send to Underwriter" functionality
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

// Function to ensure required folders exist
function ensureFolderExists(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`Created folder: ${folderPath}`);
  }
}

// Function to copy a file from source to destination
function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    console.log(`Copied file from ${source} to ${destination}`);
    return true;
  } catch (err) {
    console.error(`Error copying file from ${source} to ${destination}:`, err);
    return false;
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

// Create a more realistic client
let testClient = clients.find(client => client.idNumber === '8001155042089');
if (!testClient) {
  testClient = {
    id: clients.length ? Math.max(...clients.map(c => c.id)) + 1 : 1,
    name: 'Sibusiso Nkosi',
    email: 'sibusiso.nkosi@example.com',
    phone: '0731234567',
    address: '25 Malanshof Road, Randburg, Johannesburg, 2194',
    dateOfBirth: '1980-01-15',
    gender: 'male',
    idNumber: '8001155042089',
    occupation: 'Teacher',
    employerName: 'Randburg High School',
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

// Create a detailed policy
let testPolicy = policies.find(policy => policy.clientId === testClient.id);
if (!testPolicy) {
  testPolicy = {
    id: policies.length ? Math.max(...policies.map(p => p.id)) + 1 : 1,
    policyNumber: 'POL-20240305',
    clientId: testClient.id,
    policyTypeId: familyPolicyType.id,
    status: 'active',
    premium: 450,
    frequency: 'monthly',
    captureDate: '2023-03-15T00:00:00.000Z',
    inceptionDate: '2023-04-01T00:00:00.000Z',
    renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    coverageAmount: 25000,
    deductible: 0,
    paymentMethod: 'bank_debit',
    bankDetails: {
      bankName: 'Standard Bank',
      accountNumber: '12345678',
      accountType: 'cheque',
      branchCode: '051001'
    },
    beneficiaries: [
      {
        name: 'Thandi Nkosi',
        relationship: 'spouse',
        idNumber: '8501155042084',
        contact: '0731234568',
        percentAllocation: 100
      }
    ],
    familyMembers: [
      {
        name: 'Thandi Nkosi',
        relationship: 'spouse',
        idNumber: '8501155042084',
        dateOfBirth: '1985-01-15'
      },
      {
        name: 'Mandla Nkosi',
        relationship: 'child',
        idNumber: '0503155042080',
        dateOfBirth: '2005-03-15'
      }
    ],
    additionalCoverage: {
      extendedBenefits: true,
      repatriationCover: true
    },
    notes: 'Policy is in good standing with all premiums paid to date',
    documents: [],
    createdAt: '2023-03-15T12:30:45.000Z',
    updatedAt: new Date().toISOString()
  };
  policies.push(testPolicy);
}

// Create a realistic claim
const newClaimId = claims.length ? Math.max(...claims.map(c => c.id)) + 1 : 1;
const testClaim = {
  id: newClaimId,
  claimNumber: 'CLM-20240328',
  policyId: testPolicy.id,
  clientId: testClient.id,
  status: 'in_review',  // Make it ready for underwriter
  claimType: 'death',
  assignedTo: adminUser.id,
  assignedUserId: adminUser.id,
  dateOfIncident: '2024-03-20',
  dateOfClaim: '2024-03-22',
  // Death claim specific fields
  beneficiary: 'Thandi Nkosi',
  deceased: 'Mandla Nkosi',
  deceasedIdNumber: '0503155042080',
  relationship: 'child',
  dateOfDeath: '2024-03-20',
  causeOfDeath: 'Motor vehicle accident',
  placeOfDeath: 'Johannesburg General Hospital',
  claimantName: 'Sibusiso Nkosi',
  claimantContact: '0731234567',
  claimantIdNumber: '8001155042089',
  claimantEmail: 'sibusiso.nkosi@example.com',
  relationshipToMember: 'Self (main member)',
  funeralHome: 'Avbob Funeral Services Randburg',
  funeralDate: '2024-03-27',
  funeralAddress: '123 Funeral St, Randburg',
  // Standard claim fields
  claimAmount: 15000,
  approvedAmount: null,
  rejectionReason: null,
  paymentDate: null,
  paymentMethod: null,
  bankDetailId: null,
  documents: [],
  notes: 'Claim submitted with all required documentation. Awaiting review by underwriter.',
  additionalInfo: {
    policeReport: true,
    policeReportNumber: 'CAS 123/03/2024',
    hospitalReport: true,
    funeralInvoiceNumber: 'INV-345678'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Check if claim already exists
const existingClaim = claims.find(c => c.claimNumber === testClaim.claimNumber);
if (!existingClaim) {
  claims.push(testClaim);
  console.log(`Added new realistic test claim with ID: ${testClaim.id}`);
} else {
  console.log(`Test claim already exists with ID: ${existingClaim.id}`);
}

// Ensure uploads folder exists
const uploadsDir = './client/public/uploads';
ensureFolderExists(uploadsDir);

// Document source and target mappings (from attached assets to uploads folder)
const documentMappings = [
  {
    sourceFile: './attached_assets/IMG_4724.jpeg',
    targetFile: `${uploadsDir}/death-certificate.jpeg`,
    docType: 'death_certificate',
    fileName: 'death-certificate.jpeg',
    description: 'Death certificate for Mandla Nkosi'
  },
  {
    sourceFile: './attached_assets/IMG_4725.jpeg',
    targetFile: `${uploadsDir}/identity-document.jpeg`,
    docType: 'id_document',
    fileName: 'identity-document.jpeg',
    description: 'Identity document of the deceased'
  },
  {
    sourceFile: './attached_assets/image_1743177160431.png',
    targetFile: `${uploadsDir}/claim-form.png`,
    docType: 'claim_form',
    fileName: 'claim-form.png',
    description: 'Completed funeral claim form'
  },
  {
    sourceFile: './attached_assets/image_1743176868256.png',
    targetFile: `${uploadsDir}/bank-statement.png`,
    docType: 'bank_statement',
    fileName: 'bank-statement.png',
    description: 'Bank statement for payment'
  },
  {
    sourceFile: './attached_assets/image_1743176371983.png',
    targetFile: `${uploadsDir}/police-report.png`,
    docType: 'police_report',
    fileName: 'police-report.png',
    description: 'Police report for the accident'
  },
  {
    sourceFile: './attached_assets/image_1743164123530.png',
    targetFile: `${uploadsDir}/funeral-invoice.png`,
    docType: 'invoice',
    fileName: 'funeral-invoice.png',
    description: 'Invoice from Avbob Funeral Services'
  }
];

// Copy files and create document records
let docIndex = 0;
const existingDocs = claimDocuments.filter(doc => doc.claimId === testClaim.id);

if (existingDocs.length === 0) {
  // Process each document mapping
  for (const docMapping of documentMappings) {
    // Copy the file
    const copySuccess = copyFile(docMapping.sourceFile, docMapping.targetFile);
    
    if (copySuccess) {
      // Create document record
      const newDocId = claimDocuments.length ? Math.max(...claimDocuments.map(d => d.id)) + 1 + docIndex : 1 + docIndex;
      
      const testDoc = {
        id: newDocId,
        claimId: testClaim.id,
        documentType: docMapping.docType,
        fileName: docMapping.fileName,
        fileUrl: `/uploads/${docMapping.fileName}`,
        fileSize: fs.statSync(docMapping.sourceFile).size,
        mimeType: docMapping.fileName.endsWith('.jpeg') ? 'image/jpeg' : 'image/png',
        uploadedBy: adminUser.id,
        uploadDate: new Date().toISOString(),
        verified: true,
        verifiedBy: adminUser.id,
        verificationDate: new Date().toISOString(),
        notes: docMapping.description
      };
      
      claimDocuments.push(testDoc);
      console.log(`Added document: ${testDoc.fileName}`);
      docIndex++;
    }
  }
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
console.log('Realistic test claim setup complete!');
console.log(`Claim ID: ${testClaim.id}, Claim Number: ${testClaim.claimNumber}`);
console.log(`Total documents attached: ${claimDocuments.filter(doc => doc.claimId === testClaim.id).length}`);