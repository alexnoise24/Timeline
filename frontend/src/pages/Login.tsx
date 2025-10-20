import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're coming from registration
  useEffect(() => {
    if (location.state?.from === 'register') {
      setShowWelcome(true);
      // Clear the state to prevent showing the message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const acceptedTimelineId = await login(email, password);
      if (acceptedTimelineId) {
        navigate(`/timeline/${acceptedTimelineId}`);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-gray-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Calendar className="text-primary-600" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Wedding Timeline</h1>
          <p className="text-gray-600 mt-2">Plan your perfect wedding</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            {showWelcome ? 'Welcome!' : 'Sign in'}
          </h2>
          {showWelcome ? (
            <p className="mt-2 text-lg text-gray-600">
              Please log in to start creating awesome wedding timelines
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign up here
              </Link>
            </p>
          )}

          {showWelcome && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Calendar className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">Registration successful! Please log in to continue.</p>
                </div>
              </div>
            </div>
          )}

          {error && !showWelcome && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Calendar className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
