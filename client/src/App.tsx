import React, { useState, useEffect, Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminManagement from './pages/AdminManagement';
import AcetelDashboard from './pages/AcetelDashboard';
import ResetPassword from './pages/ResetPassword';
import ApplicationForm from './pages/ApplicationForm';
import CrossfadeLogo from './components/CrossfadeLogo';
import DebugPage from './pages/DebugPage';


/**
 * Class-based Error Boundary — catches any render crash and shows a readable error
 * instead of a blank/black page. Required because hooks cannot catch render errors.
 */
class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ACETEL IAMS — React Render Error:', error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, background: '#fef2f2', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 16, padding: 32, maxWidth: 680, width: '100%' }}>
            <h1 style={{ color: '#dc2626', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>⚠️ Application Error</h1>
            <p style={{ color: '#64748b', marginBottom: 16 }}>A component crashed. Check browser console for full stack trace.</p>
            <pre style={{ background: '#0f172a', color: '#f8fafc', padding: 16, borderRadius: 8, fontSize: 12, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack?.split('\n').slice(0, 10).join('\n')}
            </pre>
            <button
              onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}
              style={{ marginTop: 16, padding: '10px 24px', background: '#1F7A63', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


/**
 * Full-screen spinner shown while the auth state is being resolved
 */
function BrandedSpinner() {
  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', gap: 24, position: 'fixed', inset: 0, zIndex: 9999 }}>
      <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, border: '4px solid #f1f5f9', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', inset: 0, border: '4px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <CrossfadeLogo size={40} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: 14, color: '#0d2b0f', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>ACETEL IAMS</div>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Authenticating...</div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/**
 * Guards routes that require login.
 * Shows spinner only while the initial auth check is running.
 * Once isLoading is done, if no user → redirect to login.
 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <BrandedSpinner />;
  }

  if (!user) {
    return <Navigate to={`/?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
}

/**
 * Guards routes that require a specific role.
 */
function RoleProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <BrandedSpinner />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
        <div style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: 16, padding: 40, textAlign: 'center', maxWidth: 400 }}>
          <h1 style={{ color: '#dc2626', fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Access Denied</h1>
          <p style={{ color: '#475569', marginBottom: 20 }}>You don't have permission to access this area.</p>
          <button
            onClick={() => window.location.href = '/acetel-dashboard'}
            style={{ padding: '10px 24px', background: '#1F7A63', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isLoading } = useAuth();

  // While auth state is resolving, show spinner globally
  if (isLoading) {
    return <BrandedSpinner />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/debug" element={<DebugPage />} />
      <Route path="/apply" element={<ApplicationForm />} />

      <Route
        path="/admin/management"
        element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <AdminManagement />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/acetel-dashboard/*"
        element={
          <RequireAuth>
            <AcetelDashboard />
          </RequireAuth>
        }
      />

      <Route path="/dashboard/*" element={<Navigate to="/acetel-dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
