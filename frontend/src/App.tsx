import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import Ticket from './components/ui/Ticket';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';
import { useTimelineStore } from './store/timelineStore';
import { MobileMenuProvider } from './context/MobileMenuContext';
import { BrandingProvider } from './context/BrandingContext';
import { OfflineProvider } from './context/OfflineContext';
import NotificationHandler from './components/NotificationHandler';
import OfflineIndicator from './components/OfflineIndicator';
import { watchService } from './services/watchService';
import { hasFullAccess, FREE_FOR_ALL } from './lib/utils';
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
import Landing from './pages/Landing';
import AdminPanel from './pages/AdminPanel';

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
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}


function HomeRoute() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return Capacitor.isNativePlatform() ? <Navigate to="/login" replace /> : <Landing />;
}

function App() {
  const { checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const { timelines, fetchTimelines } = useTimelineStore();
  useTranslation();
  const [isInitialized, setIsInitialized] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const [splashVisible, setSplashVisible] = useState(isNative);
  const [splashFading, setSplashFading] = useState(false);
  const splashDone = useRef(false);

  useEffect(() => {
    if (!isNative || splashDone.current) return;
    splashDone.current = true;
    const fadeTimer = setTimeout(() => setSplashFading(true), 1800);
    const hideTimer = setTimeout(() => setSplashVisible(false), 2200);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, [isNative]);

  // Block document-level touchmove on iOS to prevent elastic bounce shifting fixed elements.
  // Allows touchmove only when the event originates inside an actual scroll container.
  useEffect(() => {
    if (!isNative) return;
    const blockBounce = (e: TouchEvent) => {
      let el = e.target as HTMLElement | null;
      while (el && el !== document.documentElement) {
        const { overflowY } = getComputedStyle(el);
        if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
          return;
        }
        el = el.parentElement;
      }
      e.preventDefault();
    };
    document.addEventListener('touchmove', blockBounce, { passive: false });
    return () => document.removeEventListener('touchmove', blockBounce);
  }, [isNative]);

  // Web-only: with the global overflow:hidden the document never scrolls, so a
  // wheel event that lands outside a scroll container does nothing. That happens
  // over the sidebar/navbar, and on first load when Chrome keeps the scroll
  // gesture latched to the auth loading screen after React replaces it (Magic
  // Mouse / trackpad scroll without moving the cursor). Forward those events to
  // the page's main scroll container.
  useEffect(() => {
    if (isNative) return;
    const hasScrollableAncestor = (start: EventTarget | null) => {
      let el = start as HTMLElement | null;
      while (el && el !== document.documentElement) {
        const { overflowY } = getComputedStyle(el);
        if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
          return true;
        }
        el = el.parentElement;
      }
      return false;
    };
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0 || hasScrollableAncestor(e.target)) return;
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>('.overflow-y-auto, .overflow-auto')
      ).filter((c) => c.clientHeight > 0 && c.scrollHeight > c.clientHeight);
      if (candidates.length === 0) return;
      const main = candidates.reduce((a, b) =>
        a.clientWidth * a.clientHeight >= b.clientWidth * b.clientHeight ? a : b
      );
      main.scrollTop += e.deltaY;
    };
    document.addEventListener('wheel', onWheel, { passive: true });
    return () => document.removeEventListener('wheel', onWheel);
  }, [isNative]);

  // Toast offset: env(safe-area-inset-top) resolved by CSS keeps toasts below
  // the Dynamic Island / notch. (getComputedStyle on a --var returns the raw
  // "env(...)" string, never pixels — that's why the old JS calc gave 0.)
  const toastOffset = { top: 'calc(env(safe-area-inset-top) + 12px)' };

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

  // Initialize Apple Watch sync
  useEffect(() => {
    watchService.init();

    const handleWatchSync = () => {
      if (timelines && timelines.length > 0) {
        watchService.syncTimelines(timelines);
      } else {
        fetchTimelines();
      }
    };

    const handleStartWedding = (e: Event) => {
      const { projectId } = (e as CustomEvent).detail;
      // Wedding mode is a Pro feature — reject activations coming from the
      // Watch for free/guest users and reset the Watch's state.
      if (!hasFullAccess(useAuthStore.getState().user)) {
        watchService.syncWeddingMode(projectId, false);
        return;
      }
      localStorage.setItem(
        `lenzu-wedding-mode-${projectId}`,
        'true'
      );
      window.dispatchEvent(new CustomEvent('weddingModeChanged',
        { detail: { projectId, active: true } }));
    };

    const handleFinishWedding = (e: Event) => {
      const { projectId } = (e as CustomEvent).detail;
      localStorage.removeItem(`lenzu-wedding-mode-${projectId}`);
      window.dispatchEvent(new CustomEvent('weddingModeChanged',
        { detail: { projectId, active: false } }));
      // Tell the Watch to exit Wedding Mode
      watchService.syncWeddingMode(projectId, false);
      watchService.cancelAllNotifications();
    };

    window.addEventListener('watchRequestsSync', handleWatchSync);
    window.addEventListener('startWeddingDayFromWatch', handleStartWedding);
    window.addEventListener('finishWeddingDayFromWatch', handleFinishWedding);

    return () => {
      window.removeEventListener('watchRequestsSync', handleWatchSync);
      window.removeEventListener('startWeddingDayFromWatch', handleStartWedding);
      window.removeEventListener('finishWeddingDayFromWatch', handleFinishWedding);
    };
  }, [timelines, fetchTimelines]);

  // Show loading state while initializing
  if (!isInitialized || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F1EFEA' }}>
        {isNative
          ? null
          : <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-lavender" />}
      </div>
    );
  }

  return (
    <>
    {splashVisible && (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#F1EFEA',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem',
          transition: 'opacity 0.4s ease',
          opacity: splashFading ? 0 : 1,
          pointerEvents: splashFading ? 'none' : 'all',
        }}
      >
        <Ticket size={80} content="L" rotate={-6} shadow />
        <span style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 700, fontSize: '11px',
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: '#6B6B6B',
        }}>
          LENZU
        </span>
      </div>
    )}
    <MobileMenuProvider>
    <BrandingProvider>
    <OfflineProvider>
      <BrowserRouter>
        <Toaster position="top-center" offset={toastOffset} mobileOffset={toastOffset} />
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
{/* FREE_FOR_ALL: no plan/pricing pages anywhere (web or native) while the
              product is fully free. When monetization returns: /pricing = Stripe
              (web only, blocked in native per Apple 3.1.1), /my-plan = IAP paywall. */}
          <Route
            path="/pricing"
            element={
              FREE_FOR_ALL
                ? <Navigate to="/" replace />
                : Capacitor.isNativePlatform() ? <Navigate to="/my-plan" replace /> : <Pricing />
            }
          />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/support" element={<Support />} />
          <Route
            path="/my-plan"
            element={
              FREE_FOR_ALL
                ? <Navigate to="/dashboard" replace />
                : <PrivateRoute><MyPlan /></PrivateRoute>
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
            path="/admin"
            element={
              <PrivateRoute>
                <AdminPanel />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<HomeRoute />} />
          {/* Catch-all route for 404s */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </OfflineProvider>
    </BrandingProvider>
    </MobileMenuProvider>
    </>
  );
}

export default App;
