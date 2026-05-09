import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Lock, User, ShieldCheck, ShieldAlert, Key, Copy, Check, BookOpen, Zap, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CrossfadeLogo from './CrossfadeLogo';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, finalizeMfaLogin, setupMfa, verifyMfaSetup, user } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  // Navigate only AFTER AuthContext has committed the new user into state.
  // Navigating inside onSubmit (right after login()) can race with React's
  // batched setState, causing RequireAuth to see user=null and redirect back.
  useEffect(() => {
    if (user && pendingRedirect) {
      onClose();
      reset();
      navigate(pendingRedirect);
      setPendingRedirect(null);
    }
  }, [user, pendingRedirect]);

  // MFA State
  const [mfaStep, setMfaStep] = useState<'login' | 'verify' | 'setup'>('login');
  const [mfaCode, setMfaCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    setIsLoading(true);
    try {
      await login(data.username, data.password);
      // Do NOT navigate here — React may not have flushed the setUser() call yet.
      // The useEffect above watches `user` and navigates once AuthContext confirms login.
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = decodeURIComponent(searchParams.get('redirect') || '/acetel-dashboard');
      setPendingRedirect(redirect);
    } catch (err: any) {
      setServerError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setIsLoading(true);
    try {
      await finalizeMfaLogin(mfaCode, tempToken);
      const searchParams = new URLSearchParams(window.location.search);
      setPendingRedirect(searchParams.get('redirect') || '/acetel-dashboard');
    } catch (err: any) {
      setServerError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setIsLoading(true);
    try {
      const data = await verifyMfaSetup(mfaCode);
      setRecoveryCodes(data.recoveryCodes);
    } catch (err: any) {
      setServerError(err.message || 'Setup verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const features = [
    { icon: <GraduationCap size={18} />, label: 'Student Lifecycle Management' },
    { icon: <ShieldCheck size={18} />, label: 'Secure Institutional Access' },
    { icon: <Zap size={18} />, label: 'Real-Time Synchronization' },
  ];

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: 'rgba(13,31,16,0.55)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <AnimatePresence>
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          style={{
            width: '100%',
            maxWidth: 860,
            background: 'var(--bg-page)',
            borderRadius: 28,
            boxShadow: '0 32px 80px rgba(13,31,16,0.4)',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            minHeight: 520,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── LEFT PANEL ── */}
          <div style={{
            background: 'var(--green-light)',
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative bg circle */}
            <div style={{
              position: 'absolute', bottom: -80, right: -80,
              width: 280, height: 280,
              borderRadius: '50%',
              background: 'rgba(45,138,62,0.15)',
              pointerEvents: 'none',
            }} />

            <div>
              {/* Platform Description */}
              <p style={{ fontSize: 16, color: '#000000', fontWeight: 800, lineHeight: 1.6, marginBottom: 32 }}>
                The professional platform for tracking academic milestones and orchestrating institutional collaboration.
              </p>

              {/* Feature list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(11,61,46,0.1)', border: '1px solid rgba(11,61,46,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-primary)', flexShrink: 0 }}>
                      {f.icon}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#000000' }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              © 2026 ACETEL Trademark Resource
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{ 
            background: '#f0fdf4', // Light Green as requested
            padding: '48px 40px', 
            display: 'flex', 
            flexDirection: 'column', 
            position: 'relative',
            borderLeft: '1px solid var(--green-border)'
          }}>
            {/* Close button */}
            <button
              onClick={onClose}
              style={{ position: 'absolute', top: 20, right: 20, width: 32, height: 32, border: '1px solid var(--green-border)', borderRadius: 8, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>

            {mfaStep === 'login' && (
              <>
                {/* Logo moved here */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                  <div style={{ 
                    width: 44, height: 44, borderRadius: 12, 
                    background: 'var(--green-primary)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.1)'
                  }}>
                    <CrossfadeLogo size={30} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#000000', lineHeight: 1 }}>ACETEL</div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--primary-emerald)', marginTop: 4, maxWidth: 200, lineHeight: 1.2 }}>
                      Africa Centre of Excellence on Technology Enhanced Learning
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>Sign In</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>Enter your credentials to access your dashboard.</p>
                </div>

                {/* Error */}
                {serverError && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    ⚠️ {serverError}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                      Username or Email
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="you@acetel.edu.ng"
                        {...register('username')}
                        className="input-field"
                        autoFocus
                      />
                    </div>
                    {errors.username && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 5, fontWeight: 600 }}>{errors.username.message}</p>}
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Password
                      </label>
                      <a href="mailto:acetel@noun.edu.ng" style={{ fontSize: 12, color: 'var(--green-primary)', fontWeight: 700, textDecoration: 'none' }}>
                        Forgot password?
                      </a>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="password"
                        placeholder="············"
                        {...register('password')}
                        className="input-field"
                      />
                    </div>
                    {errors.password && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 5, fontWeight: 600 }}>{errors.password.message}</p>}
                  </div>

                  <button type="submit" disabled={isLoading} className="btn-green" style={{ marginTop: 8 }}>
                    {isLoading ? (
                      <>
                        <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        Authenticating...
                      </>
                    ) : (
                      <>Sign In <ArrowRight size={16} /></>
                    )}
                  </button>

                </form>
              </>
            )}

            {mfaStep === 'verify' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center', flex: 1, justifyContent: 'center' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#eff6ff', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#1e3a8a' }}>
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text-heading)' }}>Two-Factor Authentication</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Enter the 6-digit code from your authenticator app.</p>
                </div>
                {serverError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626', fontWeight: 600 }}>⚠️ {serverError}</div>}
                <form onSubmit={handleVerifyMfa} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    style={{ width: '100%', padding: '16px', fontSize: 28, textAlign: 'center', letterSpacing: '0.5em', fontWeight: 800, background: 'var(--green-light)', border: '2px solid var(--green-border)', borderRadius: 'var(--radius-md)', outline: 'none', fontFamily: 'monospace' }}
                  />
                  <button type="submit" disabled={isLoading || mfaCode.length < 6} className="btn-green">
                    {isLoading ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                  <button type="button" onClick={() => setMfaStep('login')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back to Login</button>
                </form>
              </div>
            )}

            {mfaStep === 'setup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, overflowY: 'auto' }}>
                {recoveryCodes.length === 0 ? (
                  <>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', margin: '0 auto' }}><ShieldAlert size={26} /></div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text-heading)', textAlign: 'center' }}>Secure Your Account</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>MFA is mandatory for Admin roles. Scan with Google Authenticator.</p>
                    {serverError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626', fontWeight: 600 }}>⚠️ {serverError}</div>}
                    {qrCode && <img src={qrCode} alt="MFA QR Code" style={{ width: 160, height: 160, margin: '0 auto', border: '4px solid var(--green-light)', borderRadius: 12 }} />}
                    <form onSubmit={handleCompleteSetup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <input
                        type="text"
                        value={mfaCode}
                        onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Verify Code"
                        style={{ width: '100%', padding: '12px', fontSize: 18, textAlign: 'center', background: 'var(--green-light)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
                      />
                      <button type="submit" disabled={isLoading || mfaCode.length < 6} className="btn-green">
                        {isLoading ? 'Activating...' : 'Enable MFA'}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534', margin: '0 auto' }}><Key size={26} /></div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, textAlign: 'center', color: 'var(--text-heading)' }}>Setup Complete</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>Save these recovery codes — shown only once.</p>
                    <div style={{ background: 'var(--green-light)', border: '1px solid var(--green-border)', borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {recoveryCodes.map((code, idx) => (
                        <code key={idx} style={{ fontSize: 12, fontWeight: 700, background: '#fff', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--green-border)' }}>{code}</code>
                      ))}
                    </div>
                    <button onClick={copyRecoveryCodes} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: 'var(--green-light)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'var(--green-primary)' }}>
                      {copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied!' : 'Copy Recovery Codes'}
                    </button>
                    <button onClick={() => { navigate('/acetel-dashboard'); onClose(); }} className="btn-green">
                      Go to Dashboard <ArrowRight size={16} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  );
};

export default LoginModal;
