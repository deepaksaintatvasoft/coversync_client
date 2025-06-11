import React from 'react';
// Logo placeholder - can be added later when needed

interface EmailSignatureProps {
  name?: string;
  title?: string;
  phone?: string;
  email?: string;
}

export const EmailSignatureTemplate: React.FC<EmailSignatureProps> = ({
  name = "CoverSync Team",
  title = "Funeral Policy Specialists",
  phone = "+27 (0) 21 555 1234",
  email = "info@coversync.co.za"
}) => {
  // This function generates the HTML for the email signature
  // It can be rendered in the UI for preview or stored as HTML in the settings
  return (
    <div className="p-4 border rounded-md bg-white">
      <div className="preview-container font-sans text-sm">
        <table cellPadding="0" cellSpacing="0" style={{ maxWidth: '500px', fontFamily: 'Arial, sans-serif' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top', paddingRight: '15px' }}>
                {/* Logo and divider */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    fontFamily: 'Montserrat, Arial, sans-serif',
                    fontWeight: 900,
                    letterSpacing: '1px',
                    fontSize: '18px'
                  }}>
                    <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        marginRight: '8px',
                        backgroundColor: '#2563eb',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}>
                      CS
                    </div>
                    <span style={{
                      background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      COVERSYNC
                    </span>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <div style={{ height: '1px', background: 'linear-gradient(90deg, #2563eb, #3b82f6, transparent)', marginBottom: '15px' }}></div>
              </td>
            </tr>
            <tr>
              <td style={{ verticalAlign: 'top' }}>
                {/* Contact Information */}
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '5px' }}>
                    {name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '5px' }}>
                    {title}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 'bold', color: '#475569' }}>P:</span> {phone}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#475569' }}>E:</span> <a href={`mailto:${email}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{email}</a>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '3px' }}>
                    <a href="https://coversync.co.za" style={{ color: '#2563eb', textDecoration: 'none' }}>coversync.co.za</a>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <div style={{ 
                  fontSize: '11px', 
                  color: '#94a3b8', 
                  marginTop: '15px', 
                  paddingTop: '10px', 
                  borderTop: '1px solid #e2e8f0' 
                }}>
                  CONFIDENTIALITY NOTICE: This email may contain confidential information intended solely for the recipient. 
                  If you are not the intended recipient, please notify the sender and delete this message. 
                  CoverSync (Pty) Ltd is an authorized Financial Services Provider (FSP 45234).
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// This function generates the HTML string representation of the signature
// to be stored in the database and used in actual emails
export const generateSignatureHtml = (props: EmailSignatureProps): string => {
  const {
    name = "CoverSync Team",
    title = "Funeral Policy Specialists",
    phone = "+27 (0) 21 555 1234",
    email = "info@coversync.co.za"
  } = props;
  
  // For email clients, use a simple blue box with "CS" text as the logo
  // This is more likely to display correctly in email clients than images
  return `
    <table cellpadding="0" cellspacing="0" style="max-width: 500px; font-family: Arial, sans-serif; text-align: left;">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom: 10px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align: middle;">
                      <!-- Simple shield icon with blue background -->
                      <div style="width: 36px; height: 36px; background-color: #0039a6; border-radius: 5px; color: white; text-align: center; font-weight: bold; line-height: 36px; font-size: 14px; font-family: Arial, sans-serif;">CS</div>
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
                      ${name}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 14px; color: #64748b; padding-bottom: 5px;">
                      ${title}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; color: #64748b; padding-bottom: 3px;">
                      <span style="font-weight: bold; color: #475569;">P:</span> ${phone}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; color: #64748b; padding-bottom: 10px;">
                      <span style="font-weight: bold; color: #475569;">E:</span> <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a>
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
};

export default EmailSignatureTemplate;