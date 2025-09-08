import Navbar from './Navbar';
import Footer from './Footer';
import { useEffect, useState } from 'react';
import MobileBottomNav from './MobileBottomNav';

export default function Layout({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode') === 'enabled';
    setDarkMode(storedDarkMode);
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.body.classList.toggle('dark-theme', next);
    localStorage.setItem('darkMode', next ? 'enabled' : 'disabled');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="sticky-top shadow-sm bg-light">
        <Navbar />
      </header>

      <main className="flex-grow-1 overflow-auto pb-5 pb-lg-0">
        {children}
      </main>

      {/* Hide footer on mobile to avoid overlap with bottom nav */}
      <div className="d-none d-lg-block">
        <Footer />
      </div>

      {/* Mobile quick actions */}
      <MobileBottomNav isLoggedIn={isLoggedIn} onToggleDark={toggleDark} darkMode={darkMode} />
    </div>
  );
}
