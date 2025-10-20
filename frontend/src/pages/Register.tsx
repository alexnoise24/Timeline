import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'guest' as 'photographer' | 'guest'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic client-side validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      
      // Register and automatically log in the user
      await register(formData.name, formData.email, formData.password, formData.role);
      
      // After successful registration, redirect to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black mb-1">Wedding Timeline</h1>
          <p className="text-sm text-primary-500">Plan your perfect wedding</p>
        </div>
        {/* Rest of your JSX */}
      </div>
    </div>
  );
};

export default Register;