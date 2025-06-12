/**
 * Script to send a test claim to underwriter via email
 */
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Email configuration - explicitly use SMTP server
const emailConfig = {
  host: 'smtpout.secureserver.net', // Always use SMTP server, not IMAP
  port: 465, // SMTP port
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || 'info@coversync.co.za',
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
};

// Load data from app-data.json
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
      claimDocuments: []
    };
  }
}

// Send test email
async function sendUnderwriterEmail(recipientEmail) {
  try {
    // Load data
    const data = loadData();
    
    // Find the most recent claim with documents
    let testClaim = null;
    const claims = data.claims;
    
    if (claims && claims.length > 0) {
      // Find our test claim by ID 109 (created by the script)
      testClaim = claims.find(claim => claim.id === 109);
      
      // If not found, just use the most recent claim
      if (!testClaim) {
        console.log("Test claim not found by ID, using the most recent claim");
        testClaim = claims.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      }
    }
    
    if (!testClaim) {
      console.error('No claims found in the database');
      return;
    }
    
    console.log(`Using claim: ${testClaim.claimNumber}`);
    
    // Find related items
    const policy = data.policies.find(p => p.id === testClaim.policyId);
    const client = data.clients.find(c => c.id === testClaim.clientId);
    const documents = data.claimDocuments.filter(doc => doc.claimId === testClaim.id);
    
    console.log(`Found: Policy ${policy?.policyNumber}, Client ${client?.name}, Documents: ${documents.length}`);
    
    // Create email content
    const emailSubject = `Claim Submission: ${testClaim.claimNumber} - ${client?.name || 'Unknown Client'}`;
    
    // Simple HTML email with table for claim information
    const emailBody = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
            .logo { font-weight: bold; font-size: 24px; }
            .content { padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f7ff; }
            .documents { margin-top: 20px; }
            .document { margin-bottom: 10px; padding: 10px; background-color: #f9f9f9; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CoverSync</div>
            </div>
            
            <div class="content">
              <h1>Claim Details for Underwriter Review</h1>
              <p>Please review the following claim information:</p>
              
              <h2>Claim Information</h2>
              <table>
                <tr>
                  <th>Claim Number</th>
                  <td>${testClaim.claimNumber}</td>
                </tr>
                <tr>
                  <th>Status</th>
                  <td>${testClaim.status}</td>
                </tr>
                <tr>
                  <th>Claim Type</th>
                  <td>${testClaim.claimType}</td>
                </tr>
                <tr>
                  <th>Date of Incident</th>
                  <td>${testClaim.dateOfIncident}</td>
                </tr>
                <tr>
                  <th>Date of Claim</th>
                  <td>${testClaim.dateOfClaim}</td>
                </tr>
                <tr>
                  <th>Claim Amount</th>
                  <td>R${testClaim.claimAmount ? testClaim.claimAmount.toFixed(2) : '0.00'}</td>
                </tr>
              </table>
              
              <h2>Policy Information</h2>
              <table>
                <tr>
                  <th>Policy Number</th>
                  <td>${policy?.policyNumber || 'Unknown'}</td>
                </tr>
                <tr>
                  <th>Status</th>
                  <td>${policy?.status || 'Unknown'}</td>
                </tr>
                <tr>
                  <th>Premium</th>
                  <td>${policy && policy.premium ? `R${policy.premium.toFixed(2)}` : 'Unknown'}</td>
                </tr>
                <tr>
                  <th>Coverage Amount</th>
                  <td>${policy && policy.coverageAmount ? `R${policy.coverageAmount.toFixed(2)}` : 'Unknown'}</td>
                </tr>
              </table>
              
              <h2>Client Information</h2>
              <table>
                <tr>
                  <th>Name</th>
                  <td>${client?.name || 'Unknown'}</td>
                </tr>
                <tr>
                  <th>Contact</th>
                  <td>${client?.phone || 'Unknown'}</td>
                </tr>
                <tr>
                  <th>Email</th>
                  <td>${client?.email || 'Unknown'}</td>
                </tr>
                <tr>
                  <th>ID Number</th>
                  <td>${client?.idNumber || 'Unknown'}</td>
                </tr>
              </table>
              
              <h2>Documents</h2>
              <div class="documents">
                ${documents.length > 0 ? 
                  documents.map(doc => `
                    <div class="document">
                      <strong>${doc.documentType ? doc.documentType.replace(/[_-]/g, ' ') : 'Document'}</strong><br>
                      File: ${doc.fileName}<br>
                      Size: ${Math.round(doc.fileSize / 1024)} KB<br>
                      Verified: ${doc.verified ? 'Yes' : 'No'}
                    </div>
                  `).join('') 
                  : 'No documents attached to this claim.'}
              </div>
            </div>
            
            <div class="footer">
              <p>This email was sent from CoverSync Funeral Policy Management System.</p>
              <p>© ${new Date().getFullYear()} CoverSync. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Create email transporter
    const transporter = nodemailer.createTransport(emailConfig);
    
    // Send email
    console.log(`Sending email to ${recipientEmail}...`);
    const info = await transporter.sendMail({
      from: `"CoverSync" <${emailConfig.auth.user}>`,
      to: recipientEmail,
      subject: emailSubject,
      html: emailBody,
      // In a real implementation, we would attach the actual documents here
    });
    
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending underwriter email:', error);
    return false;
  }
}

// Execute the function
const recipientEmail = process.argv[2] || 'armandfourie911@gmail.com';
sendUnderwriterEmail(recipientEmail)
  .then(success => {
    if (success) {
      console.log(`Email successfully sent to ${recipientEmail}`);
    } else {
      console.error(`Failed to send email to ${recipientEmail}`);
    }
  })
  .catch(err => {
    console.error('Error in main process:', err);
  });