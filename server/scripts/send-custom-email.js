import nodemailer from 'nodemailer';

async function sendCustomEmail(recipientEmail, name = 'CoverSync Team', email = 'info@coversync.co.za') {
  // Explicitly use SMTP server for sending emails
  const emailConfig = {
    host: 'smtpout.secureserver.net', // GoDaddy's SMTP server
    port: 465,
    secure: true, // true for port 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'info@coversync.co.za',
      pass: process.env.EMAIL_PASSWORD || 'Coversync@2025',
    },
    tls: {
      // Do not fail on invalid certificates
      rejectUnauthorized: false
    }
  };

  console.log('Email Configuration:');
  console.log('  Host:', emailConfig.host);
  console.log('  Port:', emailConfig.port);
  console.log('  User:', emailConfig.auth.user);
  
  try {
    // Create a transporter
    const transporter = nodemailer.createTransport(emailConfig);
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP server connection successful!');
    
    // Enhanced email signature with CoverSync logo
    const emailSignature = `
    <table cellpadding="0" cellspacing="0" style="max-width: 500px; font-family: Arial, sans-serif;">
      <tbody>
        <tr>
          <td style="vertical-align: top; padding-right: 15px;">
            <div style="margin-bottom: 10px;">
              <div style="
                display: flex; 
                align-items: center; 
                font-family: Montserrat, Arial, sans-serif;
                font-weight: 900;
                letter-spacing: 1px;
                font-size: 18px;"
              >
                <!-- Using base64 encoded image to ensure it displays in email clients -->
                <img 
                  src="data:image/png;base64,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" 
                  alt="CoverSync Logo" 
                  style="width: 36px; height: 36px; margin-right: 8px;" 
                />
                <span style="
                  background: linear-gradient(135deg, #2563eb, #3b82f6);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;"
                >
                  COVERSYNC
                </span>
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <div style="height: 1px; background: linear-gradient(90deg, #2563eb, #3b82f6, transparent); margin-bottom: 15px;"></div>
          </td>
        </tr>
        <tr>
          <td style="vertical-align: top;">
            <div>
              <div style="font-size: 16px; font-weight: bold; color: #1e3a8a; margin-bottom: 5px;">
                ${name}
              </div>
              <div style="font-size: 14px; color: #64748b; margin-bottom: 5px;">
                Funeral Policy Specialists
              </div>
              <div style="font-size: 13px; color: #64748b; margin-bottom: 3px;">
                <span style="font-weight: bold; color: #475569;">P:</span> +27 (0) 21 555 1234
              </div>
              <div style="font-size: 13px; color: #64748b; margin-bottom: 10px;">
                <span style="font-weight: bold; color: #475569;">E:</span> <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a>
              </div>
              <div style="font-size: 13px; color: #64748b; margin-bottom: 3px;">
                <a href="https://coversync.co.za" style="color: #2563eb; text-decoration: none;">coversync.co.za</a>
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <div style="
              font-size: 11px; 
              color: #94a3b8; 
              margin-top: 15px; 
              padding-top: 10px; 
              border-top: 1px solid #e2e8f0;"
            >
              CONFIDENTIALITY NOTICE: This email may contain confidential information intended solely for the recipient. 
              If you are not the intended recipient, please notify the sender and delete this message. 
              CoverSync (Pty) Ltd is an authorized Financial Services Provider (FSP 45234).
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    `;
    
    const testHtml = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2563eb;">CoverSync Email Test</h2>
        <p>This is a test email from the CoverSync Policy Management System.</p>
        <p>If you are receiving this email, it means the email service is configured correctly and working as expected.</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #2563eb;">
          <p style="margin: 0; font-size: 14px;">This is an automated message. Please do not reply to this email.</p>
        </div>
        <div style="margin-top: 30px;">
          ${emailSignature}
        </div>
      </div>
    `;
    
    // Send test email
    console.log(`\nSending test email to ${recipientEmail}...`);
    
    const info = await transporter.sendMail({
      from: `"CoverSync Test" <${emailConfig.auth.user}>`,
      to: recipientEmail,
      subject: 'CoverSync Email Service Test',
      text: 'This is a test email from CoverSync Policy System.',
      html: testHtml,
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log(`\nA test email has been sent to: ${recipientEmail}`);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('\n❌ Email test failed:');
    console.error(error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Get the recipient email from command line arguments or use default
const recipientEmail = process.argv[2] || 'armandfourie911@gmail.com';
const customName = process.argv[3] || 'CoverSync Team';
const customEmail = process.argv[4] || 'info@coversync.co.za';
console.log(`Will send test email to: ${recipientEmail}`);
if (process.argv[3] || process.argv[4]) {
  console.log(`Using custom signature: Name: ${customName}, Email: ${customEmail}`);
}

sendCustomEmail(recipientEmail, customName, customEmail).then(result => {
  console.log('\nTest Result:', result);
}).catch(err => {
  console.error('Error running test:', err);
});