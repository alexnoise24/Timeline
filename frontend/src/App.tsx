import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import InviteLanding from './pages/InviteLanding';
import Dashboard from './pages/Dashboard';
import TimelineView from './pages/TimelineView';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verifying session...</p>
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
          <p className="mt-2 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/invite/:token" element={<InviteLanding />} />
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
          path="/timeline/:id"
          element={
            <PrivateRoute>
              <TimelineView />
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
  );
}

export default App;
