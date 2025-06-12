/**
 * This script sets up the correct SMTP environment variables for the CoverSync application
 */
import fs from 'fs';

// Set the correct SMTP environment variables
function setupSmtpEnvironment() {
  // Define the correct SMTP settings
  const smtpSettings = {
    host: 'smtpout.secureserver.net',
    port: 465,
    user: 'info@coversync.co.za',
    // We don't set the password here as it should be stored securely
  };

  // Read the existing .env file
  let envContent = '';
  try {
    envContent = fs.readFileSync('.env', 'utf8');
  } catch (error) {
    console.log('No existing .env file found, creating a new one.');
  }

  // Parse existing environment variables
  const envVars = {};
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    }
  });

  // Update with correct SMTP settings
  envVars['EMAIL_HOST'] = smtpSettings.host;
  envVars['EMAIL_PORT'] = smtpSettings.port;
  envVars['EMAIL_USER'] = smtpSettings.user;
  
  // Keep the existing password if it exists
  if (!envVars['EMAIL_PASSWORD']) {
    console.log('WARNING: EMAIL_PASSWORD is not set. Please set it manually in your .env file.');
  }

  // Convert back to .env format
  let newEnvContent = '';
  Object.entries(envVars).forEach(([key, value]) => {
    newEnvContent += `${key}=${value}\n`;
  });

  // Write back to .env file
  fs.writeFileSync('.env', newEnvContent);
  
  console.log('SMTP environment variables have been updated:');
  console.log(`EMAIL_HOST= ${envVars['EMAIL_HOST']}`);
  console.log(`EMAIL_PORT= ${envVars['EMAIL_PORT']}`);
  console.log(`EMAIL_USER= ${envVars['EMAIL_USER']}`);
  console.log(`EMAIL_PASSWORD= ${envVars['EMAIL_PASSWORD'] ? '********' : 'Not set'}`);
}

// Run the setup
setupSmtpEnvironment();