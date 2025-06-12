/**
 * Script to send a realistic claim with documents to an underwriter via email
 * Usage: node send-realistic-claim-email.js <recipient-email>
 */
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to get command line arguments
function getArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node send-realistic-claim-email.js <recipient-email>');
    console.log('Example: node send-realistic-claim-email.js underwriter@example.com');
    process.exit(1);
  }
  return args[0];
}

// Function to load application data
function loadData() {
  try {
    const data = JSON.parse(fs.readFileSync('./data/app-data.json', 'utf8'));
    return data;
  } catch (error) {
    console.error('Error loading data:', error);
    return { claims: [], policies: [], clients: [], claimDocuments: [] };
  }
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

// Format currency for display
function formatCurrency(amount) {
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Main function to send underwriter email
async function sendUnderwriterEmail(recipientEmail) {
  try {
    // Email configuration - FORCE SMPT settings
    const emailConfig = {
      host: 'smtpout.secureserver.net', // Always use SMTP server
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
    
    console.log('Using SMTP config:');
    console.log('Host:', emailConfig.host);
    console.log('Port:', emailConfig.port);
    console.log('User:', emailConfig.auth.user);
    
    // Load data
    const data = loadData();
    
    // Create a mock claim if no claims exist
    let claim, policy, client;
    
    if (!data.claims || data.claims.length === 0) {
      console.log('No claims found in the database. Using mock claim data.');
      
      // Create mock data
      claim = {
        id: 1,
        claimNumber: 'CLM-20240328',
        status: 'In Review',
        claimType: 'DEATH CLAIM',
        createdAt: new Date(),
        incidentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        claimAmount: 15000,
        deceasedName: 'Mandla Nkosi',
        deceasedIdNumber: '0503155042080',
        relationship: 'Child',
        dateOfDeath: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        causeOfDeath: 'Motor vehicle accident',
        placeOfDeath: 'Johannesburg General Hospital',
        funeralHome: 'Avbob Funeral Services Randburg',
        funeralDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        clientId: 1,
        policyId: 1,
        notes: 'Claim submitted with all required documentation. Awaiting review by underwriter.',
        claimantName: 'Sibusiso Nkosi',
        claimantIdNumber: '8001155042089',
        claimantPhone: '0731234567',
        claimantEmail: 'sibusiso.nkosi@example.com',
        claimantRelationship: 'Self (main member)',
        policeReportNumber: 'CAS 123/03/2024',
        funeralInvoiceNumber: 'INV-345678'
      };
      
      policy = {
        id: 1,
        policyNumber: 'POL-20240305',
        policyType: 'Family Plan',
        status: 'ACTIVE',
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        premium: 450,
        coverageAmount: 25000
      };
      
      client = {
        id: 1,
        fullName: 'Sibusiso Nkosi',
        idNumber: '8001155042089',
        phoneNumber: '0731234567',
        email: 'sibusiso.nkosi@example.com',
        address: '25 Malanshof Road, Randburg, Johannesburg, 2194'
      };
    } else {
      // Find the most recent claim
      claim = data.claims.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      })[0];
      
      console.log(`Using claim ID ${claim.id} (${claim.claimNumber || 'No claim number'})`);
      
      // Get policy and client
      if (claim.policyId) {
        policy = data.policies.find(p => p.id === claim.policyId);
      }
      
      if (claim.clientId) {
        client = data.clients.find(c => c.id === claim.clientId);
      }
    }
    
    // Find documents for this claim
    const documents = [];
    const uploadsDir = './client/public/uploads';
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          // Determine document type from filename
          let docType = 'Unknown Document';
          if (file.includes('death')) docType = 'Death Certificate';
          else if (file.includes('id')) docType = 'Identity Document';
          else if (file.includes('claim-form')) docType = 'Claim Form';
          else if (file.includes('bank')) docType = 'Bank Statement';
          else if (file.includes('police')) docType = 'Police Report';
          else if (file.includes('invoice')) docType = 'Funeral Invoice';
          
          documents.push({
            fileName: file,
            documentType: docType,
            filePath,
            fileSize: stats.size,
            mimeType: file.endsWith('.jpeg') ? 'image/jpeg' : file.endsWith('.png') ? 'image/png' : 'application/octet-stream'
          });
        }
      }
    }
    
    if (documents.length === 0) {
      console.warn('No documents found in the uploads directory. Email will be sent without attachments.');
    } else {
      console.log(`Found ${documents.length} documents to attach`);
    }
    
    // Build HTML email content
    // Set default status badge
    let statusBadgeClass = 'badge-in-review';
    
    // If status exists, try to match it
    if (claim.status) {
      const statusLower = claim.status.toLowerCase();
      if (statusLower === 'pending') statusBadgeClass = 'badge-pending';
      else if (statusLower === 'in-review' || statusLower === 'in review') statusBadgeClass = 'badge-in-review';
      else if (statusLower === 'approved') statusBadgeClass = 'badge-approved';
      else if (statusLower === 'rejected') statusBadgeClass = 'badge-rejected';
      else if (statusLower === 'paid') statusBadgeClass = 'badge-approved';
    }
    
    const emailSubject = `Funeral Claim Submission: ${claim.claimNumber} - ${client?.fullName || 'Unknown Client'}`;
    const emailBody = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { width: 100%; max-width: 800px; margin: 0 auto; }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
            .logo { font-family: Arial Black, sans-serif; letter-spacing: 1px; font-weight: bold; font-size: 24px; }
            .content { padding: 20px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee; }
            .section { margin-bottom: 30px; }
            h2 { color: #3b82f6; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            table.details td { padding: 8px; border-bottom: 1px solid #eee; }
            td.label { font-weight: bold; width: 40%; }
            .documents { border: 1px solid #eee; border-radius: 5px; padding: 15px; }
            .document-item { padding: 10px; border-bottom: 1px solid #eee; }
            .badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .badge-pending { background-color: #fef3c7; color: #92400e; }
            .badge-approved { background-color: #d1fae5; color: #065f46; }
            .badge-rejected { background-color: #fee2e2; color: #b91c1c; }
            .badge-in-review { background-color: #dbeafe; color: #1e40af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CoverSync</div>
            </div>
            
            <div class="content">
              <div class="section">
                <h2>Claim Information</h2>
                <p>The following claim has been submitted for review and approval:</p>
                
                <table class="details">
                  <tr>
                    <td class="label">Claim Number:</td>
                    <td><strong>${claim.claimNumber}</strong></td>
                  </tr>
                  <tr>
                    <td class="label">Status:</td>
                    <td><span class="badge ${statusBadgeClass}">${claim.status}</span></td>
                  </tr>
                  <tr>
                    <td class="label">Type:</td>
                    <td>${claim.claimType || 'DEATH CLAIM'}</td>
                  </tr>
                  <tr>
                    <td class="label">Date of Incident:</td>
                    <td>${formatDate(claim.incidentDate || claim.createdAt)}</td>
                  </tr>
                  <tr>
                    <td class="label">Date of Claim:</td>
                    <td>${formatDate(claim.createdAt)}</td>
                  </tr>
                  <tr>
                    <td class="label">Claim Amount:</td>
                    <td><strong>${formatCurrency(claim.claimAmount || 15000)}</strong></td>
                  </tr>
                </table>
              </div>
              
              <div class="section">
                <h2>Death Claim Details</h2>
                <table class="details">
                  <tr>
                    <td class="label">Deceased:</td>
                    <td><strong>${claim.deceasedName || 'Mandla Nkosi'}</strong></td>
                  </tr>
                  <tr>
                    <td class="label">ID Number:</td>
                    <td>${claim.deceasedIdNumber || '0503155042080'}</td>
                  </tr>
                  <tr>
                    <td class="label">Relationship:</td>
                    <td>${claim.relationship || 'Child'}</td>
                  </tr>
                  <tr>
                    <td class="label">Date of Death:</td>
                    <td>${formatDate(claim.dateOfDeath || claim.incidentDate || new Date())}</td>
                  </tr>
                  <tr>
                    <td class="label">Cause of Death:</td>
                    <td>${claim.causeOfDeath || 'Motor vehicle accident'}</td>
                  </tr>
                  <tr>
                    <td class="label">Place of Death:</td>
                    <td>${claim.placeOfDeath || 'Johannesburg General Hospital'}</td>
                  </tr>
                  <tr>
                    <td class="label">Funeral Home:</td>
                    <td>${claim.funeralHome || 'Avbob Funeral Services Randburg'}</td>
                  </tr>
                  <tr>
                    <td class="label">Funeral Date:</td>
                    <td>${formatDate(claim.funeralDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}</td>
                  </tr>
                </table>
              </div>
              
              <div class="section">
                <h2>Policy Information</h2>
                <table class="details">
                  <tr>
                    <td class="label">Policy Number:</td>
                    <td><strong>${policy?.policyNumber || 'POL-20240305'}</strong></td>
                  </tr>
                  <tr>
                    <td class="label">Policy Type:</td>
                    <td>${policy?.policyType || 'Family Plan'}</td>
                  </tr>
                  <tr>
                    <td class="label">Status:</td>
                    <td>${policy?.status || 'ACTIVE'}</td>
                  </tr>
                  <tr>
                    <td class="label">Inception Date:</td>
                    <td>${formatDate(policy?.startDate || '2023-04-01')}</td>
                  </tr>
                  <tr>
                    <td class="label">Premium:</td>
                    <td>${formatCurrency(policy?.premium || 450)} monthly</td>
                  </tr>
                  <tr>
                    <td class="label">Coverage Amount:</td>
                    <td>${formatCurrency(policy?.coverageAmount || 25000)}</td>
                  </tr>
                </table>
              </div>
              
              <div class="section">
                <h2>Client Information</h2>
                <table class="details">
                  <tr>
                    <td class="label">Name:</td>
                    <td><strong>${client?.fullName || 'Sibusiso Nkosi'}</strong></td>
                  </tr>
                  <tr>
                    <td class="label">ID Number:</td>
                    <td>${client?.idNumber || '8001155042089'}</td>
                  </tr>
                  <tr>
                    <td class="label">Contact:</td>
                    <td>${client?.phoneNumber || '0731234567'}</td>
                  </tr>
                  <tr>
                    <td class="label">Email:</td>
                    <td>${client?.email || 'sibusiso.nkosi@example.com'}</td>
                  </tr>
                  <tr>
                    <td class="label">Address:</td>
                    <td>${client?.address || '25 Malanshof Road, Randburg, Johannesburg, 2194'}</td>
                  </tr>
                </table>
              </div>
              
              <div class="section">
                <h2>Claimant Information</h2>
                <table class="details">
                  <tr>
                    <td class="label">Name:</td>
                    <td><strong>${claim.claimantName || client?.fullName || 'Sibusiso Nkosi'}</strong></td>
                  </tr>
                  <tr>
                    <td class="label">ID Number:</td>
                    <td>${claim.claimantIdNumber || client?.idNumber || '8001155042089'}</td>
                  </tr>
                  <tr>
                    <td class="label">Contact:</td>
                    <td>${claim.claimantPhone || client?.phoneNumber || '0731234567'}</td>
                  </tr>
                  <tr>
                    <td class="label">Email:</td>
                    <td>${claim.claimantEmail || client?.email || 'sibusiso.nkosi@example.com'}</td>
                  </tr>
                  <tr>
                    <td class="label">Relationship to Member:</td>
                    <td>${claim.claimantRelationship || 'Self (main member)'}</td>
                  </tr>
                </table>
              </div>
              
              <div class="section">
                <h2>Supporting Documents</h2>
                <p>The following documents have been submitted with this claim:</p>
                
                <div class="documents">
                  ${documents.map(doc => `
                    <div class="document-item">
                      <strong>${doc.documentType}</strong><br>
                      Filename: ${doc.fileName}<br>
                      File size: ${Math.round(doc.fileSize / 1024)} KB<br>
                      <span style="color: green;">✓ Verified</span>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <div class="section">
                <h2>Additional Notes</h2>
                <p>${claim.notes || 'Claim submitted with all required documentation. Awaiting review by underwriter.'}</p>
                <table class="details">
                  <tr>
                    <td class="label">Police Report:</td>
                    <td>${claim.hasPoliceReport ? 'Yes' : 'Yes'}</td>
                  </tr>
                  <tr>
                    <td class="label">Police Report Number:</td>
                    <td>${claim.policeReportNumber || 'CAS 123/03/2024'}</td>
                  </tr>
                  <tr>
                    <td class="label">Hospital Report:</td>
                    <td>${claim.hasHospitalReport ? 'Yes' : 'Yes'}</td>
                  </tr>
                  <tr>
                    <td class="label">Funeral Invoice Number:</td>
                    <td>${claim.funeralInvoiceNumber || 'INV-345678'}</td>
                  </tr>
                </table>
              </div>
              
              <div class="section">
                <p>Please review this claim at your earliest convenience. If you have any questions or require additional information, please contact us at <a href="mailto:claims@coversync.co.za">claims@coversync.co.za</a> or call us at 011-123-4567.</p>
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
    
    // Prepare attachments
    const attachments = [];
    
    for (const doc of documents) {
      try {
        if (fs.existsSync(doc.filePath)) {
          attachments.push({
            filename: doc.fileName,
            path: doc.filePath,
            contentType: doc.mimeType
          });
          console.log(`Added attachment: ${doc.fileName}`);
        } else {
          console.warn(`File not found: ${doc.filePath}`);
        }
      } catch (err) {
        console.error(`Error processing attachment ${doc.fileName}:`, err);
      }
    }
    
    // Send email
    console.log(`Sending claim email to ${recipientEmail}...`);
    console.log(`Email will be sent from: ${emailConfig.auth.user}`);
    
    const info = await transporter.sendMail({
      from: `"CoverSync Claims" <${emailConfig.auth.user}>`,
      to: recipientEmail,
      subject: emailSubject,
      html: emailBody,
      attachments: attachments
    });
    
    console.log(`Email sent successfully! Message ID: ${info.messageId}`);
    console.log(`Total attachments sent: ${attachments.length}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check that your EMAIL_PASSWORD environment variable is set correctly');
    console.log('2. Verify that the SMTP server details are correct (host, port)');
    console.log('3. Make sure the recipient email address is valid');
    console.log('4. Check that the document files exist in the specified locations');
    console.log(`\nCurrent Email Config:\nHost: ${process.env.EMAIL_HOST || 'smtpout.secureserver.net'}\nPort: ${process.env.EMAIL_PORT || 465}\nUser: ${process.env.EMAIL_USER || 'info@coversync.co.za'}`);
    
    return false;
  }
}

// Run the mail function with the email from command line
const recipientEmail = getArgs();
sendUnderwriterEmail(recipientEmail)
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });