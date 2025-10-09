import React from 'react';
import { createRoot } from 'react-dom/client';
import RegistrationForm from './components/RegistrationForm';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<RegistrationForm />);
} else {
  // Fallback for when there's no root element
  document.body.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #dbeafe 0%, #f3f4f6 100%);
      font-family: system-ui, -apple-system, sans-serif;
      padding: 16px;
    ">
      <div style="
        max-width: 400px;
        width: 100%;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        padding: 32px;
        text-align: center;
      ">
        <h1 style="color: #dc2626; margin-bottom: 16px;">⚠️ Error</h1>
        <p style="color: #6b7280; margin-bottom: 16px;">
          React root element not found. This is a fallback HTML version.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          The React component should be visible above. If you see this message, there's a React configuration issue.
        </p>
        <div style="margin-top: 20px; padding: 12px; background: #fef2f2; border-radius: 6px; color: #dc2626; font-size: 12px;">
          Fallback loaded - React component not mounted properly
        </div>
      </div>
    </div>
  `;
}
