import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, ShieldAlert, ShieldCheck, Key, Copy, Check } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'student' | 'facilitator' | 'admin'>('student');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // MFA & Policy State
    const [mfaStep, setMfaStep] = useState<'login' | 'verify' | 'setup' | 'change_password'>('login');
    const [mfaCode, setMfaCode] = useState('');
    const [tempToken, setTempToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);

    const { login, user, finalizeMfaLogin, setupMfa, verifyMfaSetup, changeRequiredPassword } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    React.useEffect(() => {
        if (user && mfaStep === 'login') {
            navigate('/dashboard');
        }
    }, [user, navigate, mfaStep]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const data = await login(identifier, password, role);
            
            if (data.mfa_required) {
                setTempToken(data.temp_token);
                setMfaStep('verify');
            } else if (data.must_change_password) {
                setTempToken(data.temp_token);
                setMfaStep('change_password');
            } else if (data.mfa_setup_required) {
                setTempToken(data.temp_token);
                // We need to be "logged in" with the temp token to call setupMfa
                // So we temporarily set it in context or just use it directly
                localStorage.setItem('token', data.temp_token);
                const setupData = await setupMfa();
                setQrCode(setupData.qrCode);
                setMfaStep('setup');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyMfa = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await finalizeMfaLogin(mfaCode, tempToken);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompleteSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const data = await verifyMfaSetup(mfaCode);
            setRecoveryCodes(data.recoveryCodes);
            // Don't navigate yet, show recovery codes
        } catch (err: any) {
            setError(err.message || 'Setup verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await changeRequiredPassword(tempToken, newPassword);
            setMfaStep('login');
            setPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError('Password updated successfully. Please login with your new password.');
        } catch (err: any) {
            setError(err.message || 'Password update failed');
        } finally {
            setIsLoading(false);
        }
    };

    const copyRecoveryCodes = () => {
        navigator.clipboard.writeText(recoveryCodes.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderLoginForm = () => (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
                <label htmlFor="identifier" style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
                    Email or Username
                </label>
                <input
                    id="identifier" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required
                    style={{ width: "100%", padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "15px", outline: "none" }}
                    placeholder="name@acetel.edu.ng"
                />
            </div>
            <div>
                <label htmlFor="password" style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
                    Password
                </label>
                <input
                    id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    style={{ width: "100%", padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "15px", outline: "none" }}
                    placeholder="••••••••"
                />
            </div>
            <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "12px" }}>
                    Access Level
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    {(['student', 'facilitator', 'admin'] as const).map((r) => (
                        <button key={r} type="button" onClick={() => setRole(r)}
                            style={{ padding: "8px 4px", borderRadius: "100px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", cursor: "pointer", border: role === r ? "2px solid #1e3a8a" : "1px solid #e2e8f0", background: role === r ? "#1e3a8a" : "transparent", color: role === r ? "#ffffff" : "#64748b" }}>
                            {r}
                        </button>
                    ))}
                </div>
            </div>
            <button type="submit" disabled={isLoading}
                style={{ width: "100%", padding: "14px", background: "#1e3a8a", color: "#ffffff", border: "none", borderRadius: "100px", fontSize: "16px", fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {isLoading ? "Authenticating..." : "Sign In"}
            </button>
        </form>
    );

    const renderVerifyMfa = () => (
        <form onSubmit={handleVerifyMfa} style={{ display: "flex", flexDirection: "column", gap: "24px", textAlign: "center" }}>
            <div style={{ background: "#eff6ff", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", color: "#1e3a8a" }}>
                <ShieldCheck size={32} />
            </div>
            <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e3a8a", marginBottom: 8 }}>Two-Factor Authentication</h2>
                <p style={{ fontSize: 13, color: "#64748b" }}>Enter the 6-digit code from your authenticator app.</p>
            </div>
            <input
                type="text" value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" required
                style={{ width: "100%", padding: "16px", fontSize: 24, textAlign: "center", letterSpacing: 8, fontWeight: 800, background: "#f8fafc", border: "2px solid #e2e8f0", borderRadius: 16, outline: "none", fontFamily: "monospace" }}
            />
            <button type="submit" disabled={isLoading || mfaCode.length < 6}
                style={{ width: "100%", padding: "14px", background: "#15803d", color: "#ffffff", border: "none", borderRadius: "100px", fontSize: 16, fontWeight: 700, cursor: (isLoading || mfaCode.length < 6) ? "not-allowed" : "pointer" }}>
                {isLoading ? "Verifying..." : "Verify & Continue"}
            </button>
            <button type="button" onClick={() => setMfaStep('login')} style={{ background: "none", border: "none", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Back to Login</button>
        </form>
    );

    const renderMfaSetup = () => (
        <div style={{ textAlign: "center" }}>
            {recoveryCodes.length === 0 ? (
                <form onSubmit={handleCompleteSetup} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ background: "#fff7ed", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", color: "#ea580c" }}>
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e3a8a", marginBottom: 8 }}>Secure Your Account</h2>
                        <p style={{ fontSize: 13, color: "#64748b" }}>Institutional policy requires MFA for Admin/Staff roles. Scan the code below to start.</p>
                    </div>
                    {qrCode && <img src={qrCode} alt="MFA QR Code" style={{ width: 180, height: 180, margin: "0 auto", border: "4px solid #f8fafc", borderRadius: 12 }} />}
                    <input
                        type="text" value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Verify Code" required
                        style={{ width: "100%", padding: "12px", fontSize: 18, textAlign: "center", background: "#f8fafc", border: "2px solid #e2e8f0", borderRadius: 12, outline: "none" }}
                    />
                    <button type="submit" disabled={isLoading || mfaCode.length < 6}
                        style={{ width: "100%", padding: "14px", background: "#1e3a8a", color: "#ffffff", border: "none", borderRadius: "100px", fontSize: 16, fontWeight: 700 }}>
                        {isLoading ? "Activating..." : "Enable MFA"}
                    </button>
                </form>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ background: "#dcfce7", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", color: "#166534" }}>
                        <Key size={32} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e3a8a", marginBottom: 8 }}>Setup Complete</h2>
                        <p style={{ fontSize: 13, color: "#64748b" }}>Save these recovery codes in a safe place. They are shown only once.</p>
                    </div>
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {recoveryCodes.map((code, idx) => (
                            <code key={idx} style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", background: "#fff", padding: "4px 8px", borderRadius: 4, border: "1px solid #f1f5f9" }}>{code}</code>
                        ))}
                    </div>
                    <button onClick={copyRecoveryCodes} style={{ width: "100%", padding: "12px", background: "#f1f5f9", color: "#1e3a8a", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? "Copied!" : "Copy Recovery Codes"}
                    </button>
                    <button onClick={() => navigate('/dashboard')} style={{ width: "100%", padding: "14px", background: "#1e3a8a", color: "#ffffff", border: "none", borderRadius: "100px", fontSize: 16, fontWeight: 700 }}>
                        Go to Dashboard
                    </button>
                </div>
            )}
        </div>
    );

    const renderChangePassword = () => (
        <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ background: "#fef9c3", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", color: "#854d0e" }}>
                <Key size={32} />
            </div>
            <div style={{ textAlign: "center" }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e3a8a", marginBottom: 8 }}>Password Update Required</h2>
                <p style={{ fontSize: 13, color: "#64748b" }}>For security, you must update your temporary password before proceeding.</p>
            </div>
            <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                    style={{ width: "100%", padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none" }}
                    placeholder="New Secure Password" />
            </div>
            <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                    style={{ width: "100%", padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none" }}
                    placeholder="Confirm New Password" />
            </div>
            <button type="submit" disabled={isLoading}
                style={{ width: "100%", padding: "14px", background: "#1e3a8a", color: "#ffffff", border: "none", borderRadius: "100px", fontSize: 16, fontWeight: 700 }}>
                {isLoading ? "Updating..." : "Update Password & Login"}
            </button>
        </form>
    );

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at center, #fcfcfc 0%, #eef2ff 100%)", padding: "20px", fontFamily: "'Inter', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');`}</style>
            <div style={{ width: "100%", maxWidth: "440px" }}>
                <div style={{ background: "#ffffff", borderRadius: "24px", boxShadow: "0 20px 40px rgba(0, 35, 102, 0.08)", padding: "40px", border: "1px solid rgba(0, 35, 102, 0.05)" }}>
                    <div style={{ textAlign: "center", marginBottom: "32px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", marginBottom: "32px" }}>
                            <img src="https://nou.edu.ng/wp-content/uploads/2021/12/Logo-1.png" alt="NOUN" style={{ height: "42px" }} />
                            <div style={{ width: "1px", height: "28px", background: "#e2e8f0" }} />
                            <img src="https://acetel.nou.edu.ng/wp-content/uploads/2022/12/logo.png" alt="ACETEL" style={{ height: "42px" }} />
                        </div>
                    </div>
                    {error && <div style={{ marginBottom: 24, padding: 12, background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 12, color: "#ef4444", fontSize: 14 }}>{error}</div>}
                    {mfaStep === 'login' && renderLoginForm()}
                    {mfaStep === 'verify' && renderVerifyMfa()}
                    {mfaStep === 'setup' && renderMfaSetup()}
                    {mfaStep === 'change_password' && renderChangePassword()}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
