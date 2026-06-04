import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!firstName || !lastName || !email || !password) {
        throw new Error('Please fill in all fields.');
      }
      
      const response = await api.auth.register(email, password, firstName, lastName);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Navigate to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            padding: '1rem', 
            borderRadius: '50%', 
            backgroundColor: 'var(--accent-light)', 
            color: 'var(--accent)',
            marginBottom: '1rem'
          }}>
            <UserPlus size={28} />
          </div>
          <h2 className="auth-title">{t('register')}</h2>
          <p className="auth-subtitle">{t('slogan')}</p>
        </div>

        {error && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            backgroundColor: '#fee2e2', 
            color: '#dc2626', 
            padding: '0.75rem 1rem', 
            borderRadius: 'var(--radius-sm)', 
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            border: '1px solid #fca5a5'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="responsive-form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="first-name-input">
                {t('first_name')}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ 
                  position: 'absolute', 
                  insetBlockStart: '50%', 
                  insetInlineStart: '1rem', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-tertiary)',
                  pointerEvents: 'none'
                }}>
                  <User size={16} />
                </span>
                <input
                  id="first-name-input"
                  type="text"
                  className="form-input"
                  style={{ paddingInlineStart: '2.5rem' }}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('first_name')}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="last-name-input">
                {t('last_name')}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ 
                  position: 'absolute', 
                  insetBlockStart: '50%', 
                  insetInlineStart: '1rem', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-tertiary)',
                  pointerEvents: 'none'
                }}>
                  <User size={16} />
                </span>
                <input
                  id="last-name-input"
                  type="text"
                  className="form-input"
                  style={{ paddingInlineStart: '2.5rem' }}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('last_name')}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              {t('email')}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ 
                position: 'absolute', 
                insetBlockStart: '50%', 
                insetInlineStart: '1rem', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-tertiary)',
                pointerEvents: 'none'
              }}>
                <Mail size={18} />
              </span>
              <input
                id="email-input"
                type="email"
                className="form-input"
                style={{ paddingInlineStart: '2.5rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@example.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">
              {t('password')}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ 
                position: 'absolute', 
                insetBlockStart: '50%', 
                insetInlineStart: '1rem', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-tertiary)',
                pointerEvents: 'none'
              }}>
                <Lock size={18} />
              </span>
              <input
                id="password-input"
                type="password"
                className="form-input"
                style={{ paddingInlineStart: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1.5rem' }}
            disabled={loading}
          >
            {loading ? '...' : t('register')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
          <Link to="/auth/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>
            {t('already_registered')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default Register;
