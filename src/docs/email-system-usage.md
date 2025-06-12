# CoverSync Email System

## Overview

The CoverSync email system provides robust functionality for sending emails from the policy management system. It includes a suite of tools and components for managing email templates, signatures, and communication with clients, underwriters, and team members.

## Features

- **Email Templates**: Create and manage reusable email templates for various purposes like policy notifications, claim updates, and customer communications.
- **Email Signatures**: A professional, branded signature system with customizable name and contact information.
- **Email Logs**: Track and monitor all outgoing emails with detailed status information.
- **Email Settings**: Configure SMTP server details, notification preferences, and recipient groups.
- **Test Email Tool**: Easily verify email configuration with test emails.

## Email Configuration

The system uses environment variables to securely store email configuration:

- `EMAIL_HOST`: SMTP server hostname (e.g., smtpout.secureserver.net)
- `EMAIL_PORT`: SMTP server port (typically 465 for SSL)
- `EMAIL_USER`: Email account username/address
- `EMAIL_PASSWORD`: Email account password

## Command Line Tools

### send-custom-email.js

Send test emails with customizable parameters:

```bash
node send-custom-email.js [recipient-email] [sender-name] [sender-email]
```

**Parameters:**
- `recipient-email`: Email address to send the test message to (default: armandfourie911@gmail.com)
- `sender-name`: Name to display in the signature (default: "CoverSync Team")
- `sender-email`: Email address to display in the signature (default: "info@coversync.co.za")

**Example:**
```bash
node send-custom-email.js client@example.com "John Smith" "john.smith@coversync.co.za"
```

### setup-smtp-env.js

Set up or update email configuration environment variables:

```bash
node setup-smtp-env.js
```

## Email Signature System

The email signature system includes:

1. A professionally designed HTML template with the CoverSync logo embedded as base64 (no external image loading required)
2. Gradient styling for the CoverSync logo text
3. Customizable name, title, and contact information
4. Responsive design that works across email clients

## Web Interface

Access email functionality through the web interface:

- **Email Settings**: Configure recipient groups, notification preferences, and email signatures
- **Email Templates**: Manage reusable email templates
- **Email Logs**: View history of sent emails, with filtering and search capabilities

## Development

When extending the email system:

1. Use the `EmailSignatureTemplate` component for consistency in all emails
2. For template-based emails, use the template system in `server/services/email.service.ts`
3. Always include error handling and logging for email operations
4. Use the `test-email-connection.ts` utility to verify configuration changes