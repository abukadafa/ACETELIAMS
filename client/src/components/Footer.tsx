import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer style={{
      borderTop: '1px solid var(--green-border)',
      padding: '20px 32px',
      background: 'var(--bg-page)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
    }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
        © 2026 ACETEL Trademark Resource
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textAlign: 'center', flex: 1 }}>
        From Admission to Alumni — Managing the full academic lifecycle
      </p>
      <p style={{ fontSize: 12, color: 'var(--green-primary)', fontWeight: 700 }}>
        ACETEL IAMS
      </p>
    </footer>
  );
};

export default Footer;
