import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, ArrowLeft, CheckCircle, X, Check } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

interface PasswordRequirement {
  label: string;
  met: boolean;
}

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showRequirements, setShowRequirements] = useState(false);

  const getPasswordRequirements = (pwd: string): PasswordRequirement[] => {
    return [
      { label: t('auth.reqMinLength'), met: pwd.length >= 6 },
      { label: t('auth.reqUppercase'), met: /[A-Z]/.test(pwd) },
      { label: t('auth.reqSpecialChar'), met: /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
    ];
  };

  const passwordRequirements = getPasswordRequirements(password);
  const isPasswordValid = passwordRequirements.every(req => req.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError(t('auth.passwordRequirementsNotMet'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (!token) {
      setError(t('auth.invalidResetToken'));
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || t('auth.resetPasswordError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <X size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-black mb-4">{t('auth.invalidResetLink')}</h2>
          <p className="text-primary-500 mb-6">{t('auth.invalidResetLinkDesc')}</p>
          <Link 
            to="/forgot-password" 
            className="inline-block px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-primary-800"
          >
            {t('auth.requestNewLink')}
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-text" />
          </div>
          <h2 className="text-xl font-semibold text-black mb-4">{t('auth.passwordResetSuccess')}</h2>
          <p className="text-primary-500 mb-6">{t('auth.redirectingToLogin')}</p>
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

        <h2 className="text-xl font-semibold text-black mb-2 text-center">{t('auth.resetPassword')}</h2>
        <p className="text-sm text-primary-500 mb-6 text-center">{t('auth.resetPasswordDesc')}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">{t('auth.newPassword')}</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder={t('auth.newPasswordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowRequirements(true)}
                onBlur={() => setShowRequirements(false)}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            
            {showRequirements && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-900 mb-2">{t('auth.passwordRequirements')}</p>
                <ul className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs">
                      {req.met ? (
                        <Check size={14} className="text-green-600" />
                      ) : (
                        <X size={14} className="text-gray-400" />
                      )}
                      <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
                        {req.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">{t('auth.confirmPassword')}</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isLoading ? t('auth.resetting') : t('auth.resetPasswordButton')}
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

export default ResetPassword;
