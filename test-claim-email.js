/**
 * Simple script to test sending a claim via email to an underwriter
 * Usage: node test-claim-email.js <recipient-email>
 */
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to get the command line arguments
function getArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node test-claim-email.js <recipient-email>');
    console.log('Example: node test-claim-email.js underwriter@example.com');
    process.exit(1);
  }
  return args[0];
}

// Main function to send the test email
async function sendClaimEmail() {
  const recipientEmail = getArgs();

  try {
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

    // Create simple HTML email content
    const emailSubject = `CoverSync Test Claim Email`;
    const emailBody = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
            .logo { font-weight: bold; font-size: 24px; }
            .content { padding: 20px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CoverSync</div>
            </div>
            
            <div class="content">
              <h1>Test Claim Email</h1>
              <p>This is a test email from the CoverSync system to verify that email functionality is working correctly.</p>
              
              <p>In a real scenario, this email would contain full claim details and attached documents for review by the underwriter.</p>
              
              <p>If you've received this email, it means the email sending functionality is configured correctly!</p>
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
    console.log(`Sending test email to ${recipientEmail}...`);
    const info = await transporter.sendMail({
      from: `"CoverSync System" <${emailConfig.auth.user}>`,
      to: recipientEmail,
      subject: emailSubject,
      html: emailBody,
    });
    
    console.log(`Email sent successfully! Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check that your EMAIL_PASSWORD environment variable is set correctly');
    console.log('2. Verify that the SMTP server details are correct (host, port)');
    console.log('3. Make sure the recipient email address is valid');
    return false;
  }
}

// Run the main function
sendClaimEmail()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });