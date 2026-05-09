import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Users, Globe, ShieldCheck, Zap, GraduationCap } from 'lucide-react';
import CrossfadeLogo from './CrossfadeLogo';
import { getApiBase } from '../lib/apiBase';

interface HeroSectionProps {
  onLoginClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onLoginClick }) => {
  const [stats, setStats] = useState({ totalStudents: 0, nationalities: [] as any[] });

  useEffect(() => {
    fetch(`${getApiBase()}/users/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, []);



  return (
    <section style={{
      minHeight: 'calc(100vh - 68px)',
      display: 'flex',
      alignItems: 'center',
      background: 'var(--bg-page)',
      padding: '60px 32px',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

        {/* ── Left Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Headline */}
          <div className="animate-fade-in-up delay-100">
            <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Integrated Academic
              <br />
              <span style={{ color: 'var(--green-mid)' }}>Management</span> System
            </h1>
          </div>

          {/* Subtext */}
          <p className="animate-fade-in-up delay-200" style={{ fontSize: 16, color: 'var(--text-body)', maxWidth: 460, lineHeight: 1.75, fontWeight: 600 }}>
            ACETEL's next-generation Integrated Academic Management System — powering the full student lifecycle from admission through alumni, for all postgraduate programmes.
          </p>



          {/* CTA Row */}
          <div className="animate-fade-in-up delay-400" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <a
              href="https://acetel.nou.edu.ng/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <BookOpen size={16} /> Learn More
            </a>
          </div>

          {/* Stats row */}
          <div className="animate-fade-in-up delay-500" style={{ display: 'flex', gap: 40, paddingTop: 8, borderTop: '1px solid var(--green-border)' }}>
            <div>
              <div className="stat-num">{stats.totalStudents > 0 ? stats.totalStudents.toLocaleString() : '0'}</div>
              <div className="stat-label">Registered Students</div>
            </div>
            <div>
              <div className="stat-num accent">{stats.nationalities.length > 0 ? stats.nationalities.length : '0'}</div>
              <div className="stat-label">Nationalities</div>
            </div>
            <div>
              <div className="stat-num">6</div>
              <div className="stat-label">Active Programs</div>
            </div>
          </div>
        </div>

        {/* ── Right Column — Institutional Feed Card ── */}
        <div className="animate-slide-right delay-200" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Top accent card - empty or for future use */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--green-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxShadow: 'var(--shadow-card)',
            minHeight: '60px'
          }}>
          </div>

          {/* Main dark card */}
          <div className="card-dark" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 20px 60px rgba(13,31,16,0.3)' }}>
            {/* Card header */}
            <div style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#fff' }}>Institutional Hub</div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>ACETEL IAMS</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(45,138,62,0.2)', border: '1px solid rgba(45,138,62,0.4)', borderRadius: 999, padding: '5px 12px' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', animation: 'pulse-dot 2s infinite' }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: '#4ade80' }}>LIVE</span>
              </div>
            </div>

            {/* Management hubs grid */}
            <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { icon: '🎓', label: 'Registered Students', color: '#1e3a8a' },
                { icon: '📜', label: 'Admitted', color: '#7c3aed' },
                { icon: '📘', label: 'Academic Courses', color: '#0891b2' },
                { icon: '🧑‍🏫', label: 'Facilitators', color: '#d97706' },
                { icon: '🏆', label: 'Alumni Tracking', color: '#059669' },
                { icon: '🛡️', label: 'Institutional Governance', color: '#dc2626' },
              ].map((hub, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'default',
                  transition: 'background 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                >
                  <span style={{ fontSize: 20 }}>{hub.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1.3 }}>{hub.label}</span>
                </div>
              ))}
            </div>

            {/* Card footer CTA */}
            <div style={{ padding: '0 28px 28px' }}>
              <button
                onClick={onLoginClick}
                style={{
                  width: '100%',
                  background: 'var(--green-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '14px',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.03em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#256132'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--green-primary)'; }}
              >
                Sign In to Access Portal <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Bottom accent */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--green-border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-card)' }}>
              <Users size={18} style={{ color: 'var(--primary-emerald)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', color: '#000000' }}>{stats.totalStudents || 0}</div>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-body)' }}>Total Students</div>
              </div>
            </div>
            <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--green-border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-card)' }}>
              <Globe size={18} style={{ color: 'var(--green-mid)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', color: '#000000' }}>{stats.nationalities.length || 0}</div>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-body)' }}>Global Nationalities</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
