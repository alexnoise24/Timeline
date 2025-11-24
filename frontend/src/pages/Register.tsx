import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useInvitationsStore } from '@/store/invitationsStore';

interface PasswordRequirement {
  label: string;
  met: boolean;
}

const Register: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'guest' as 'photographer' | 'guest'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const { register } = useAuthStore();
  const { acceptInviteToken } = useInvitationsStore();
  const navigate = useNavigate();

  // Set role to guest if coming from invite link
  useEffect(() => {
    if (inviteToken) {
      setFormData(prev => ({ ...prev, role: 'guest' }));
    }
  }, [inviteToken]);

  // Password validation requirements
  const getPasswordRequirements = (password: string): PasswordRequirement[] => {
    return [
      { label: 'At least 6 characters', met: password.length >= 6 },
      { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
      { label: 'One special character (!@#$%^&*)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];
  };

  const passwordRequirements = getPasswordRequirements(formData.password);
  const isPasswordValid = passwordRequirements.every(req => req.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password requirements
    if (!isPasswordValid) {
      setError('Please meet all password requirements');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      await register(formData.name, formData.email, formData.password, formData.role);
      
      // If user registered via invite link, try to accept the invitation
      if (inviteToken) {
        try {
          // Small delay to ensure auth state is fully set
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const result = await acceptInviteToken(inviteToken);
          localStorage.removeItem('inviteToken');
          
          if (result?.timelineId) {
            // Navigate directly to the shared timeline
            navigate(`/timeline/${result.timelineId}`, { replace: true });
            return;
          }
        } catch (inviteError: any) {
          console.error('Failed to accept invitation:', inviteError);
          localStorage.removeItem('inviteToken');
          
          // Show error message but continue to dashboard
          setError('Account created! However, the invitation link may have expired. Please ask for a new invite.');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 3000);
          return;
        }
      }
      
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
          <h1 className="text-2xl font-bold text-black mb-1">{t('app.name')}</h1>
          <p className="text-sm text-primary-500">{t('app.tagline')}</p>
        </div>

        <h2 className="text-xl font-semibold text-black mb-6 text-center">{t('auth.registerButton')}</h2>

        {inviteToken && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-sm">
            <p className="font-semibold mb-1">📨 {t('auth.inviteReceived')}</p>
            <p className="text-xs">{t('auth.inviteMessage')}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">{t('auth.name')}</label>
            <input
              type="text"
              placeholder={t('auth.namePlaceholder')}
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">{t('auth.email')}</label>
            <input
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">{t('auth.password')}</label>
            <input
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={formData.password}
              onChange={(e) => updateFormData('password', e.target.value)}
              onFocus={() => setShowPasswordRequirements(true)}
              onBlur={() => setShowPasswordRequirements(false)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            
            {/* Password requirements box */}
            {showPasswordRequirements && (
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

          <div className="bg-primary-50 p-5 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-primary-700 mb-4">{t('auth.chooseAccountType')}</label>

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
                <div className="font-medium text-black">{t('auth.photographer')}</div>
                <div className="text-xs text-primary-500">{t('auth.photographerDesc')}</div>
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
                <div className="font-medium text-black">{t('auth.guest')}</div>
                <div className="text-xs text-primary-500">{t('auth.guestDesc')}</div>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full px-4 py-2 rounded-lg font-medium text-white ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-primary-800'}`}
          >
            {isLoading ? t('auth.creatingAccount') : t('auth.registerButton')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-primary-600">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-black font-medium hover:underline">{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;