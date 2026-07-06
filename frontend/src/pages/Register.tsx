import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { Check, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useInvitationsStore } from '@/store/invitationsStore';
import i18n from '@/i18n/config';
import Logo from '@/components/ui/Logo';

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
    role: 'photographer' as 'photographer' | 'guest'
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

  // Auto-detect browser language on mount (Spanish → es, everything else → en)
  useEffect(() => {
    const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
    const detected = browserLang.toLowerCase().startsWith('es') ? 'es' : 'en';
    i18n.changeLanguage(detected);
  }, []);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es');
  };


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
      
      // Redirect photographers to pricing (web only), everyone else to dashboard.
      // Native never sees pricing (Apple 3.1.1).
      if (formData.role === 'photographer' && !Capacitor.isNativePlatform()) {
        navigate('/pricing', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const apiMessage: string = err.response?.data?.message || err.response?.data?.error || err.message || '';
      if (apiMessage.toLowerCase().includes('already registered') || apiMessage.toLowerCase().includes('already exists') || apiMessage.toLowerCase().includes('duplicate')) {
        setError('duplicate_email');
      } else {
        setError('generic');
      }
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Logo size="lg" variant="paper" />
        </div>

        <div className="border-[1.5px] border-ink bg-fog overflow-hidden">
          {/* Card header */}
          <div className="border-b-[1.5px] border-ink px-8 py-5">
            <h2 className="font-display font-bold text-[22px] tracking-[-0.02em] leading-none text-ink">
              {t('auth.registerButton').toUpperCase()}
            </h2>
            <p className="alto-label text-stone mt-2">
              {t('auth.hasAccount')}{' '}
              <Link to={inviteToken ? `/login?invite=${inviteToken}` : '/login'} className="text-lavender hover:text-lavender-deep transition-colors duration-snap">
                {t('auth.login')}
              </Link>
            </p>
          </div>

          <div className="px-8 py-6">

        {inviteToken && (
          <div className="mb-4 border-[1px] border-lavender bg-lavender/5 p-4">
            <p className="alto-label text-ink mb-1">{t('auth.inviteReceived')}</p>
            <p className="font-mono text-[11px] text-stone">{t('auth.inviteMessage')}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-[6px]">
            <span className="alto-label text-ink">{t('auth.name')}</span>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              required
              className="w-full border-[1.5px] border-ink bg-paper px-[14px] py-[12px] font-mono font-bold text-[14px] text-ink focus:outline-none focus:outline-[2px] focus:outline-lavender placeholder:text-stone placeholder:font-normal"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-[6px]">
            <span className="alto-label text-ink">{t('auth.email')}</span>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              required
              className="w-full border-[1.5px] border-ink bg-paper px-[14px] py-[12px] font-mono font-bold text-[14px] text-ink focus:outline-none focus:outline-[2px] focus:outline-lavender placeholder:text-stone placeholder:font-normal"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-[6px]">
            <span className="alto-label text-ink">{t('auth.password')}</span>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateFormData('password', e.target.value)}
              onFocus={() => setShowPasswordRequirements(true)}
              onBlur={() => setShowPasswordRequirements(false)}
              required
              className="w-full border-[1.5px] border-ink bg-paper px-[14px] py-[12px] font-mono font-bold text-[14px] text-ink focus:outline-none focus:outline-[2px] focus:outline-lavender placeholder:text-stone placeholder:font-normal"
            />
            {showPasswordRequirements && (
              <div className="border-[1px] border-ink/30 bg-paper p-3">
                <p className="alto-label text-ink mb-2">{t('auth.passwordRequirements')}</p>
                <ul className="flex flex-col gap-1">
                  {passwordRequirements.map((req, i) => (
                    <li key={i} className="flex items-center gap-2">
                      {req.met
                        ? <Check size={12} strokeWidth={2} className="text-moss flex-shrink-0" />
                        : <X size={12} strokeWidth={2} className="text-stone flex-shrink-0" />
                      }
                      <span className={`font-mono text-[11px] ${req.met ? 'text-moss' : 'text-stone'}`}>
                        {req.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Account type */}
          <div className="border-[1px] border-ink/20 bg-paper p-4 overflow-hidden">
            <span className="alto-label text-ink block mb-3">{t('auth.chooseAccountType')}</span>

            {!inviteToken && (
              <div
                onClick={() => updateFormData('role', 'photographer')}
                className={`w-full flex gap-3 p-3 cursor-pointer border-[1.5px] mb-2 transition-colors duration-snap ${
                  formData.role === 'photographer' ? 'border-ink bg-fog' : 'border-ink/20 hover:border-ink/40'
                }`}
              >
                <div className="flex-shrink-0 w-4 h-4 mt-0.5 border-[1.5px] border-ink flex items-center justify-center bg-paper">
                  {formData.role === 'photographer' && <div className="w-2 h-2 bg-ink" />}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-[12px] uppercase text-ink">{t('auth.photographer')}</span>
                  </div>
                  <p className="font-mono text-[11px] text-stone mt-1 leading-relaxed">{t('auth.photographerDesc')}</p>
                </div>
              </div>
            )}

            <div
              onClick={() => updateFormData('role', 'guest')}
              className={`w-full flex gap-3 p-3 cursor-pointer border-[1.5px] transition-colors duration-snap ${
                formData.role === 'guest' ? 'border-ink bg-fog' : 'border-ink/20 hover:border-ink/40'
              }`}
            >
              <div className="flex-shrink-0 w-4 h-4 mt-0.5 border-[1.5px] border-ink flex items-center justify-center bg-paper">
                {formData.role === 'guest' && <div className="w-2 h-2 bg-ink" />}
              </div>
              <div className="overflow-hidden">
                <span className="font-mono font-bold text-[12px] uppercase text-ink block">{t('auth.guest')}</span>
                <p className="font-mono text-[11px] text-stone mt-1 leading-relaxed">{t('auth.guestDesc')}</p>
              </div>
            </div>

            {/* Hidden real radio inputs for form submission */}
            <input type="radio" name="role" value="photographer" checked={formData.role === 'photographer'} onChange={() => {}} className="sr-only" />
            <input type="radio" name="role" value="guest" checked={formData.role === 'guest'} onChange={() => {}} className="sr-only" />
          </div>

          {/* Error */}
          {error && (
            <div className="border-[1px] border-brick bg-brick/5 p-4">
              <p className="font-mono text-[12px] text-brick leading-relaxed">
                {error === 'duplicate_email' ? (
                  <>
                    Este correo ya tiene una cuenta.{' '}
                    <Link to="/login" className="underline font-bold">Iniciar sesión</Link>
                  </>
                ) : (
                  'Ocurrió un error. Intenta de nuevo.'
                )}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-lavender text-ink border-[1.5px] border-ink font-mono font-bold text-[12px] uppercase tracking-[0.08em] px-[22px] py-[14px] hover:bg-lavender-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-snap"
          >
            {isLoading ? t('auth.creatingAccount') : <>{t('auth.registerButton')} →</>}
          </button>
        </form>

          </div>{/* end px-8 py-6 */}

          {/* Footer */}
          <div className="border-t-[1px] border-ink/20 px-8 py-4 flex items-center justify-between">
            <div className="flex gap-4">
              <Link to="/privacy" className="alto-label text-stone hover:text-ink transition-colors duration-snap">
                Privacy Policy
              </Link>
              <span className="alto-label text-stone">·</span>
              <Link to="/terms" className="alto-label text-stone hover:text-ink transition-colors duration-snap">
                Terms of Service
              </Link>
            </div>
            <button
              type="button"
              onClick={toggleLang}
              className="alto-label text-stone hover:text-ink transition-colors duration-snap"
            >
              {i18n.language === 'es' ? 'EN' : 'ES'}
            </button>
          </div>
        </div>{/* end border card */}
      </div>
    </div>
  );
};

export default Register;