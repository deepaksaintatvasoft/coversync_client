import nodemailer from 'nodemailer';

// Hardcoded email signature HTML for reliability - using simple table layout for email compatibility
// Using inline SVG shield logo for maximum compatibility
const emailSignatureHtml = `
<table cellpadding="0" cellspacing="0" style="max-width: 500px; font-family: Arial, sans-serif;">
  <tr>
    <td>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 10px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align: middle;">
                  <!-- Simple shield icon with blue background -->
                  <div style="width: 36px; height: 36px; background-color: #2563eb; border-radius: 5px; color: white; text-align: center; font-weight: bold; line-height: 36px; font-size: 14px; font-family: Arial, sans-serif;">CS</div>
                </td>
                <td style="vertical-align: middle; padding-left: 8px;">
                  <span style="font-family: Arial, sans-serif; font-weight: 900; font-size: 18px; color: #2563eb;">COVERSYNC</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td height="1" style="background-color: #2563eb;"></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 15px;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="font-size: 16px; font-weight: bold; color: #1e3a8a; padding-bottom: 5px;">
                  CoverSync Team
                </td>
              </tr>
              <tr>
                <td style="font-size: 14px; color: #64748b; padding-bottom: 5px;">
                  Funeral Policy Specialists
                </td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #64748b; padding-bottom: 3px;">
                  <span style="font-weight: bold; color: #475569;">P:</span> +27 (0) 21 555 1234
                </td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #64748b; padding-bottom: 10px;">
                  <span style="font-weight: bold; color: #475569;">E:</span> <a href="mailto:info@coversync.co.za" style="color: #2563eb; text-decoration: none;">info@coversync.co.za</a>
                </td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #64748b; padding-bottom: 3px;">
                  <a href="https://coversync.co.za" style="color: #2563eb; text-decoration: none;">coversync.co.za</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 15px; border-top: 1px solid #e2e8f0; margin-top: 15px;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="font-size: 11px; color: #94a3b8;">
                  CONFIDENTIALITY NOTICE: This email may contain confidential information intended solely for the recipient. 
                  If you are not the intended recipient, please notify the sender and delete this message. 
                  CoverSync (Pty) Ltd is an authorized Financial Services Provider (FSP 45234).
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

async function testEmail(customRecipient = null) {
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
    
    // Use custom recipient if provided, otherwise default
    const recipient = customRecipient || process.env.EMAIL_USER || 'info@coversync.co.za';
    console.log(`\nSending test email to ${recipient}...`);
    
    const info = await transporter.sendMail({
      from: `"CoverSync Test" <${emailConfig.auth.user}>`,
      to: recipient,
      subject: 'CoverSync Email Service Test',
      text: 'This is a test email from CoverSync Policy System.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>This is a test email from <strong>CoverSync Policy System</strong>.</p>
          <p>If you received this, the email service is working correctly.</p>
          ${emailSignatureHtml}
        </div>
      `,
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log(`\nA test email has been sent to: ${recipient}`);
    
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

// Check if a recipient was provided as a command line argument
const customRecipient = process.argv[2];

testEmail(customRecipient).then(result => {
  console.log('\nTest Result:', result);
}).catch(err => {
  console.error('Error running test:', err);
});