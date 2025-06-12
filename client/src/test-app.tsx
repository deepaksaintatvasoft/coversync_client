import React from 'react';

export default function TestApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>CoverSync Test Application</h1>
      <div style={{ backgroundColor: '#f0f0f0', padding: '20px', marginTop: '20px' }}>
        <h2>Application Status: Working</h2>
        <p>This is a test to verify the application is loading correctly.</p>
        <ul>
          <li>✓ React is working</li>
          <li>✓ Vite is serving the application</li>
          <li>✓ JavaScript is executing</li>
        </ul>
      </div>
    </div>
  );
}