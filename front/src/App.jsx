import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sun, Moon } from 'lucide-react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TreeCanvas from './pages/TreeCanvas';
import ProfileView from './pages/ProfileView';
import TreeCalendar from './pages/TreeCalendar';
import TelegramEmailPrompt from './pages/TelegramEmailPrompt';
import { CuteFamilyTreeLogo } from './components/CuteFamilyTreeLogo';

function App() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Set document direction when language changes
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Handle document theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    // Broadcast change event for component canvases
    window.dispatchEvent(new Event('theme-change'));
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const isLoggedIn = !!localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <Router>
      <div className="app-root">
        <nav className="navbar">
          <Link to={isLoggedIn ? "/dashboard" : "/"} className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CuteFamilyTreeLogo style={{ width: '42px', height: '42px' }} onlyIcon={true} />
            <span>{t('app_name')}</span>
          </Link>
          
          <div className="navbar-actions">
            <button 
              className="lang-switch"
              onClick={() => i18n.changeLanguage(i18n.language === 'fa' ? 'en' : 'fa')}
            >
              {i18n.language === 'fa' ? 'English' : 'فارسی'}
            </button>

            <button 
              className="lang-switch"
              onClick={toggleTheme}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.45rem' }}
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link to="/dashboard" className="nav-link">{t('dashboard')}</Link>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {user.firstName} {user.lastName}
                </span>
                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                  {t('logout')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link to="/auth/login" className="nav-link">{t('login')}</Link>
                <Link to="/auth/register" className="btn btn-primary" style={{ padding: '0.35rem 1rem', fontSize: '0.8rem' }}>
                  {t('register')}
                </Link>
              </div>
            )}
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth/login" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/auth/register" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Register />} />
          <Route path="/auth/telegram-email" element={isLoggedIn ? <Navigate to="/dashboard" /> : <TelegramEmailPrompt />} />
          <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/auth/login" />} />
          <Route path="/tree/:treeId" element={<TreeCanvas />} />
          <Route path="/tree/:treeId/profile/:id" element={<ProfileView />} />
          <Route path="/tree/:treeId/calendar" element={<TreeCalendar />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
