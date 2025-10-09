import React, { useState } from 'react';

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'guest'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      alert(`Registration successful!\nRole: ${formData.role}\nName: ${formData.name}\nEmail: ${formData.email}`);
      setIsLoading(false);
    }, 1000);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #dbeafe 0%, #f3f4f6 100%)',
      padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        padding: '32px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            Wedding Timeline
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Plan your perfect wedding
          </p>
        </div>

        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: '#111827', 
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          Create Account
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
              Full name
            </label>
            <input
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* ROLE SELECTION */}
          <div style={{ 
            background: '#f8fafc',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <label style={{ 
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '15px'
            }}>
              Choose your account type:
            </label>

            {/* Photographer Option */}
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              padding: '15px',
              border: formData.role === 'photographer' ? '2px solid #2563eb' : '2px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '10px',
              backgroundColor: formData.role === 'photographer' ? '#eff6ff' : 'white',
              transition: 'all 0.2s ease'
            }}>
              <input
                type="radio"
                name="role"
                value="photographer"
                checked={formData.role === 'photographer'}
                onChange={(e) => updateField('role', e.target.value)}
                style={{ marginRight: '12px', width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '20px', marginRight: '10px', color: '#2563eb' }}>📷</span>
              <div>
                <div style={{ fontWeight: '500', color: '#111827' }}>Photographer</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Create and manage wedding timelines</div>
              </div>
            </label>

            {/* Guest Option */}
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              padding: '15px',
              border: formData.role === 'guest' ? '2px solid #2563eb' : '2px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: formData.role === 'guest' ? '#eff6ff' : 'white',
              transition: 'all 0.2s ease'
            }}>
              <input
                type="radio"
                name="role"
                value="guest"
                checked={formData.role === 'guest'}
                onChange={(e) => updateField('role', e.target.value)}
                style={{ marginRight: '12px', width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '20px', marginRight: '10px', color: '#2563eb' }}>👥</span>
              <div>
                <div style={{ fontWeight: '500', color: '#111827' }}>Guest</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Access shared wedding timelines</div>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isLoading ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '8px'
            }}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        {/* Debug Info */}
        <div style={{ 
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#6b7280',
          textAlign: 'center'
        }}>
          ✅ React component loaded | Form data: {JSON.stringify(formData)} | Role: {formData.role}
        </div>
      </div>
    </div>
  );
}
