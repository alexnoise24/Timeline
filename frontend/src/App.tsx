import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';
import { MobileMenuProvider } from './context/MobileMenuContext';
import { BrandingProvider } from './context/BrandingContext';
import { OfflineProvider } from './context/OfflineContext';
import NotificationHandler from './components/NotificationHandler';
import OfflineIndicator from './components/OfflineIndicator';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import InviteAccept from './pages/InviteAccept';
import Dashboard from './pages/Dashboard';
import TimelineView from './pages/TimelineView';
import Messages from './pages/Messages';
import Pricing from './pages/Pricing';
import BrandingSettings from './pages/BrandingSettings';
import MyPlan from './pages/MyPlan';
import Community from './pages/Community';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AccountSettings from './pages/AccountSettings';
import Support from './pages/Support';

function PrivateRoute({ children }: { children: React.ReactNode}) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { t } = useTranslation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('auth.verifyingSession')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Store the intended URL before redirecting to login
    const from = window.location.pathname + window.location.search;
    return <Navigate to="/login" state={{ from }} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    // If user is already authenticated, redirect to home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const { t } = useTranslation();
  const [isInitialized, setIsInitialized] = useState(false);

  // Check auth status on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        await checkAuth();
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [checkAuth]);

  // Show loading state while initializing
  if (!isInitialized || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('auth.loadingApp')}</p>
        </div>
      </div>
    );
  }

  return (
    <MobileMenuProvider>
    <BrandingProvider>
    <OfflineProvider>
      <BrowserRouter>
        <Toaster position="top-center" />
        <NotificationHandler />
        <OfflineIndicator />
        <Routes>
          <Route path="/invite/:token" element={<InviteAccept />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/timeline/:id"
            element={
              <PrivateRoute>
                <TimelineView />
              </PrivateRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <PrivateRoute>
                <Messages />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/support" element={<Support />} />
          <Route
            path="/my-plan"
            element={
              <PrivateRoute>
                <MyPlan />
              </PrivateRoute>
            }
          />
          <Route
            path="/community"
            element={
              <PrivateRoute>
                <Community />
              </PrivateRoute>
            }
          />
          <Route
            path="/branding"
            element={
              <PrivateRoute>
                <BrandingSettings />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <AccountSettings />
              </PrivateRoute>
            }
          />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          {/* Catch-all route for 404s */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </OfflineProvider>
    </BrandingProvider>
    </MobileMenuProvider>
  );
}

export default App;
