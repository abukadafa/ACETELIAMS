import React, { useState } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';

const LandingPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Header onLoginClick={() => setIsModalOpen(true)} />

      <main style={{ flex: 1 }}>
        <HeroSection onLoginClick={() => setIsModalOpen(true)} />
      </main>

      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <Footer />
    </div>
  );
};

export default LandingPage;
