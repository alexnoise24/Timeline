import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send reset email');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || t('auth.forgotPasswordError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-text" />
          </div>
          <h2 className="text-xl font-semibold text-black mb-4">{t('auth.checkYourEmail')}</h2>
          <p className="text-primary-500 mb-6">{t('auth.resetEmailSent')}</p>
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-black font-medium hover:underline"
          >
            <ArrowLeft size={16} />
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black mb-1">{t('app.name')}</h1>
          <p className="text-sm text-primary-500">{t('app.tagline')}</p>
        </div>

        <h2 className="text-xl font-semibold text-black mb-2 text-center">{t('auth.forgotPassword')}</h2>
        <p className="text-sm text-primary-500 mb-6 text-center">{t('auth.forgotPasswordDesc')}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">{t('auth.email')}</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full px-4 py-2 rounded-lg font-medium text-white ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-primary-800'}`}
          >
            {isLoading ? t('auth.sending') : t('auth.sendResetLink')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-primary-600">
          <Link to="/login" className="inline-flex items-center gap-1 text-black font-medium hover:underline">
            <ArrowLeft size={14} />
            {t('auth.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
