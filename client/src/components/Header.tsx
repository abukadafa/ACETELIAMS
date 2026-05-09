import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, LogOut, LayoutDashboard } from 'lucide-react';
import CrossfadeLogo from './CrossfadeLogo';

interface HeaderProps {
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAuthenticated = !!user;

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #e2e8f0',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 32px',
        height: 68,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}>
        {/* Logo + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{
            width: 42, height: 42,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1.5px solid var(--green-border)',
            background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CrossfadeLogo size={36} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--green-dark)', lineHeight: 1 }}>
              ACETEL
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--primary-emerald)', marginTop: 2, maxWidth: 300, lineHeight: 1.2 }}>
              Africa Centre of Excellence on Technology Enhanced Learning
            </div>
          </div>
        </div>

        {/* Empty Spacer since nav links are removed */}
        <div style={{ flex: 1 }} />

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/acetel-dashboard')}
                className="btn-secondary"
                style={{ padding: '9px 20px', fontSize: 13 }}
              >
                <LayoutDashboard size={15} />
                Dashboard
              </button>
              <button
                onClick={() => { logout(); navigate('/'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#fff0f0', color: '#c0392b',
                  border: '1.5px solid #fccaca',
                  borderRadius: 'var(--radius-pill)',
                  padding: '9px 16px', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                }}
                title="Sign Out"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </>
          ) : (
            <button onClick={onLoginClick} className="btn-primary" style={{ padding: '10px 24px', fontSize: 13 }}>
              Enter Portal <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
