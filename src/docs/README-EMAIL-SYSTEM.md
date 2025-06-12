# CoverSync Email System Guide

This guide explains how to use the CoverSync email system, particularly for sending claim information to underwriters.

## Email System Configuration

The CoverSync application uses the following environment variables for email configuration:

- `EMAIL_HOST`: SMTP server hostname (default: smtpout.secureserver.net)
- `EMAIL_PORT`: SMTP server port (default: 465)
- `EMAIL_USER`: Email username/address (default: info@coversync.co.za)
- `EMAIL_PASSWORD`: Email password (must be set in the environment)

## Utility Scripts

Several utility scripts are provided to help manage and test the email system:

### Setting Up Email Environment

To update the email configuration to use the correct SMTP settings:

```bash
node setup-smtp-env.js
```

This will:
- Update the .env file with the correct SMTP server settings
- Keep any existing password in the configuration
- Display the current email configuration

### Creating Test Claims

To create a basic test claim with sample documents:

```bash
node create-test-claim.js
```

To create a more realistic test claim with actual documents from the assets folder:

```bash
node create-realistic-claim.js
```

These scripts will:
- Create a new test claim in the system
- Add sample test documents to the claim
- Save the data to the application database

### Testing Email Sending

To send a simple test email (without claim details):

```bash
node test-claim-email.js recipient@example.com
```

To send a test claim to an underwriter (basic):

```bash
node send-test-underwriter-email.js recipient@example.com
```

To send a comprehensive claim email with all documents attached:

```bash
node send-simple-claim-email.js recipient@example.com
```

These emails include:
- Complete claim information and details
- Policy information
- Client details
- All attached documents as file attachments
- Professional HTML email formatting

## Troubleshooting Email Issues

If emails are not being sent correctly:

1. **Check Email Configuration**: Make sure the SMTP settings are correct
   ```bash
   node setup-smtp-env.js
   ```

2. **Verify Email Credentials**: Ensure the EMAIL_PASSWORD environment variable is set correctly

3. **Test Simple Email**: Try sending a basic test email
   ```bash
   node test-claim-email.js your-email@example.com
   ```

4. **IMAP vs. SMTP**: If you encounter "Invalid greeting" errors, you might be using an IMAP server instead of SMTP. Run the setup-smtp-env.js script to fix this.

## Email Templates

The application uses HTML email templates for sending underwriter emails. These templates include:

- Claim information (claim number, status, type, dates, amount)
- Policy details (policy number, coverage)
- Client information 
- Document listings

## In-App Email Functionality

The CoverSync application also includes a dedicated interface for email management:

1. **Email Settings**: Configure email server settings through the admin panel
2. **Email Templates**: Create and manage email templates
3. **Email Logs**: View sent email history
4. **Send to Underwriter**: Send claim information with attached documents to underwriters

## Note for Developers

When updating the email system code, always ensure:

1. The correct SMTP server is used (not IMAP)
2. Email templates are responsive and display correctly in various email clients
3. Sensitive information like passwords is stored securely
4. Proper error handling is implemented