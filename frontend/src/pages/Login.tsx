import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/ui/Logo';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showExtended, setShowExtended] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.from === 'register') {
      setShowWelcome(true);
      window.history.replaceState({}, document.title);
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('extend') === 'success') {
      setShowExtended(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      if (useAuthStore.getState().trialExpired) {
        navigate('/pricing', { state: { trialExpired: true } });
        return;
      }
      // After successful login, check if there's a timeline ID in the location state
      const state = location.state as { from?: { pathname: string } };
      const redirectTo = state?.from?.pathname || '/';
      navigate(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Logo size="lg" variant="paper" />
        </div>

        {/* Card */}
        <div className="border-[1.5px] border-ink bg-fog">
          {/* Card header */}
          <div className="border-b-[1.5px] border-ink px-8 py-5">
            <h2 className="font-display font-bold text-[22px] tracking-[-0.02em] leading-none text-ink">
              {showWelcome ? t('auth.welcome').toUpperCase() : t('auth.login').toUpperCase()}
            </h2>
            {!showWelcome && (
              <p className="alto-label text-stone mt-2">
                {t('auth.noAccount')}{' '}
                <Link to="/register" className="text-lavender hover:text-lavender-deep transition-colors duration-snap">
                  {t('auth.register')}
                </Link>
              </p>
            )}
          </div>

          <div className="px-8 py-6 flex flex-col gap-4">
            {/* Welcome success message */}
            {showWelcome && (
              <div className="border-[1px] border-moss bg-moss/5 p-4">
                <p className="font-mono text-[12px] text-moss leading-relaxed">{t('auth.registrationSuccess')}</p>
              </div>
            )}

            {/* Plan extended success message */}
            {showExtended && (
              <div className="border-[1px] border-moss bg-moss/5 p-4">
                <p className="font-mono text-[12px] text-moss leading-relaxed">
                  ¡Tu acceso ha sido activado por 30 días más! Inicia sesión para continuar.
                </p>
              </div>
            )}

            {/* Error */}
            {error && !showWelcome && (
              <div className="border-[1px] border-brick bg-brick/5 p-4">
                <p className="font-mono text-[12px] text-brick leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="email"
                label={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                label={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="text-right">
                <Link to="/forgot-password" className="alto-label text-stone hover:text-ink transition-colors duration-snap">
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              <Button type="submit" variant="accent" className="w-full" disabled={isLoading} arrow>
                {isLoading ? t('auth.signingIn') : t('auth.loginButton')}
              </Button>
            </form>

            <p className="text-center alto-label text-stone pt-2">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-lavender hover:text-lavender-deep transition-colors duration-snap">
                {t('auth.register')}
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="border-t-[1px] border-ink/20 px-8 py-4 flex justify-center gap-6">
            <Link to="/privacy" className="alto-label text-stone hover:text-ink transition-colors duration-snap">
              Privacy Policy
            </Link>
            <span className="alto-label text-stone">·</span>
            <Link to="/terms" className="alto-label text-stone hover:text-ink transition-colors duration-snap">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
