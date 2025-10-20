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
      await register(formData.name, formData.email, formData.password, formData.role);
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

        <h2 className="text-xl font-semibold text-black mb-6 text-center">Create Account</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Full name</label>
            <input
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => updateFormData('password', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="bg-primary-50 p-5 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-primary-700 mb-4">Choose your account type:</label>

            <label className={
              `flex items-center p-4 rounded-lg cursor-pointer mb-2 transition border ${formData.role === 'photographer' ? 'border-black bg-white' : 'border-gray-300 bg-white'}`
            }>
              <input
                type="radio"
                name="role"
                value="photographer"
                checked={formData.role === 'photographer'}
                onChange={(e) => updateFormData('role', e.target.value as 'photographer' | 'guest')}
                className="mr-3 w-4 h-4"
              />
              <span className="mr-2">📷</span>
              <div>
                <div className="font-medium text-black">Photographer</div>
                <div className="text-xs text-primary-500">Create and manage wedding timelines</div>
              </div>
            </label>

            <label className={
              `flex items-center p-4 rounded-lg cursor-pointer transition border ${formData.role === 'guest' ? 'border-black bg-white' : 'border-gray-300 bg-white'}`
            }>
              <input
                type="radio"
                name="role"
                value="guest"
                checked={formData.role === 'guest'}
                onChange={(e) => updateFormData('role', e.target.value as 'photographer' | 'guest')}
                className="mr-3 w-4 h-4"
              />
              <span className="mr-2">👥</span>
              <div>
                <div className="font-medium text-black">Guest</div>
                <div className="text-xs text-primary-500">Access shared wedding timelines</div>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full px-4 py-2 rounded-lg font-medium text-white ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-primary-800'}`}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-primary-600">
          Already have an account?{' '}
          <Link to="/login" className="text-black font-medium hover:underline">Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;