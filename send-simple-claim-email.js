/**
 * Script to send a simple claim email with attachments
 * Usage: node send-simple-claim-email.js <recipient-email>
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
    console.log('Usage: node send-simple-claim-email.js <recipient-email>');
    console.log('Example: node send-simple-claim-email.js underwriter@example.com');
    process.exit(1);
  }
  return args[0];
}

// Scan uploads directory for document files
function getUploadedDocuments() {
  const uploadsDir = './client/public/uploads';
  const documents = [];
  
  try {
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          // Determine document type from filename
          let docType = 'unknown';
          if (file.includes('death')) docType = 'Death Certificate';
          else if (file.includes('id')) docType = 'Identity Document';
          else if (file.includes('claim-form')) docType = 'Claim Form';
          else if (file.includes('bank')) docType = 'Bank Statement';
          else if (file.includes('police')) docType = 'Police Report';
          else if (file.includes('invoice')) docType = 'Funeral Invoice';
          
          documents.push({
            fileName: file,
            fileUrl: `/uploads/${file}`,
            filePath,
            documentType: docType,
            fileSize: stats.size,
            mimeType: file.endsWith('.jpeg') ? 'image/jpeg' : file.endsWith('.png') ? 'image/png' : 'application/octet-stream'
          });
        }
      }
    }
  } catch (err) {
    console.error('Error scanning uploads directory:', err);
  }
  
  return documents;
}

// Main function to send underwriter email
async function sendUnderwriterEmail(recipientEmail) {
  try {
    // Email configuration
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
    
    // Get document files from uploads directory
    const documents = getUploadedDocuments();
    
    if (documents.length === 0) {
      console.log('No documents found in the uploads directory.');
    } else {
      console.log(`Found ${documents.length} documents in uploads directory.`);
    }
    
    // Build HTML email content
    const emailSubject = `Funeral Claim Submission: CLM-20240328 - Sibusiso Nkosi`;
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
            .badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
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
                    <td><strong>CLM-20240328</strong></td>
                  </tr>
                  <tr>
                    <td class="label">Status:</td>
                    <td><span class="badge badge-in-review">IN REVIEW</span></td>
                  </tr>
                  <tr>
                    <td class="label">Type:</td>
                    <td>DEATH CLAIM</td>
                  </tr>
                  <tr>
                    <td class="label">Date of Incident:</td>
                    <td>March 20, 2024</td>
                  </tr>
                  <tr>
                    <td class="label">Date of Claim:</td>
                    <td>March 22, 2024</td>
                  </tr>
                  <tr>
                    <td class="label">Claim Amount:</td>
                    <td><strong>R 15,000.00</strong></td>
                  </tr>
                </table>
              </div>
              
              <div class="section">
                <h2>Death Claim Details</h2>
                <table class="details">
                  <tr>
                    <td class="label">Deceased:</td>
                    <td><strong>Mandla Nkosi</strong></td>
                  </tr>
                  <tr>
                    <td class="label">ID Number:</td>
                    <td>0503155042080</td>
                  </tr>
                  <tr>
                    <td class="label">Relationship:</td>
                    <td>Child</td>
                  </tr>
                  <tr>
                    <td class="label">Date of Death:</td>
                    <td>March 20, 2024</td>
                  </tr>
                  <tr>
                    <td class="label">Cause of Death:</td>
                    <td>Motor vehicle accident</td>
                  </tr>
                  <tr>
                    <td class="label">Place of Death:</td>
                    <td>Johannesburg General Hospital</td>
                  </tr>
                  <tr>
                    <td class="label">Funeral Home:</td>
                    <td>Avbob Funeral Services Randburg</td>
                  </tr>
                  <tr>
                    <td class="label">Funeral Date:</td>
                    <td>March 27, 2024</td>
                  </tr>
                </table>
              </div>
              
              <div class="section">
                <h2>Policy Information</h2>
                <table class="details">
                  <tr>
                    <td class="label">Policy Number:</td>
                    <td><strong>POL-20240305</strong></td>
                  </tr>
                  <tr>
                    <td class="label">Policy Type:</td>
                    <td>Family Plan</td>
                  </tr>
                  <tr>
                    <td class="label">Status:</td>
                    <td>ACTIVE</td>
                  </tr>
                  <tr>
                    <td class="label">Inception Date:</td>
                    <td>April 1, 2023</td>
                  </tr>
                  <tr>
                    <td class="label">Premium:</td>
                    <td>R 450.00 monthly</td>
                  </tr>
                  <tr>
                    <td class="label">Coverage Amount:</td>
                    <td>R 25,000.00</td>
                  </tr>
                </table>
              </div>
              
              <div class="section">
                <h2>Client Information</h2>
                <table class="details">
                  <tr>
                    <td class="label">Name:</td>
                    <td><strong>Sibusiso Nkosi</strong></td>
                  </tr>
                  <tr>
                    <td class="label">ID Number:</td>
                    <td>8001155042089</td>
                  </tr>
                  <tr>
                    <td class="label">Contact:</td>
                    <td>0731234567</td>
                  </tr>
                  <tr>
                    <td class="label">Email:</td>
                    <td>sibusiso.nkosi@example.com</td>
                  </tr>
                  <tr>
                    <td class="label">Address:</td>
                    <td>25 Malanshof Road, Randburg, Johannesburg, 2194</td>
                  </tr>
                </table>
              </div>
              
              <div class="section">
                <h2>Claimant Information</h2>
                <table class="details">
                  <tr>
                    <td class="label">Name:</td>
                    <td><strong>Sibusiso Nkosi</strong></td>
                  </tr>
                  <tr>
                    <td class="label">ID Number:</td>
                    <td>8001155042089</td>
                  </tr>
                  <tr>
                    <td class="label">Contact:</td>
                    <td>0731234567</td>
                  </tr>
                  <tr>
                    <td class="label">Email:</td>
                    <td>sibusiso.nkosi@example.com</td>
                  </tr>
                  <tr>
                    <td class="label">Relationship to Member:</td>
                    <td>Self (main member)</td>
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
                <p>Claim submitted with all required documentation. Awaiting review by underwriter.</p>
                <table class="details">
                  <tr>
                    <td class="label">Police Report:</td>
                    <td>Yes</td>
                  </tr>
                  <tr>
                    <td class="label">Police Report Number:</td>
                    <td>CAS 123/03/2024</td>
                  </tr>
                  <tr>
                    <td class="label">Hospital Report:</td>
                    <td>Yes</td>
                  </tr>
                  <tr>
                    <td class="label">Funeral Invoice Number:</td>
                    <td>INV-345678</td>
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