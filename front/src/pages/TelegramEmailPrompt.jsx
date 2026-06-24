import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { CuteFamilyTreeLogo } from '../components/CuteFamilyTreeLogo';

export default function TelegramEmailPrompt() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const telegramPayload = location.state?.telegramPayload;

  // Redirect to login if accessed directly without payload
  if (!telegramPayload) {
    navigate('/auth/login', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError(t('email_required_desc'));
      return;
    }

    try {
      setLoading(true);
      // Resubmit payload with email
      const payloadWithEmail = { ...telegramPayload, email };
      const response = await api.auth.loginWithTelegram(payloadWithEmail);
      
      const data = typeof response === 'string' ? JSON.parse(response) : response;
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        throw new Error('Registration failed');
      }
    } catch (err) {
      console.error('Email registration error:', err);
      try {
        const errorData = JSON.parse(err.message);
        setError(errorData.message || 'Registration failed.');
      } catch {
        setError(err.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '450px' }}>
        <div className="auth-header">
          <div className="auth-logo">
            <CuteFamilyTreeLogo onlyIcon={true} style={{ width: '48px', height: '48px' }} />
          </div>
          <h2 className="auth-title">{t('email_required_title')}</h2>
          <p className="auth-subtitle" style={{ marginTop: '0.5rem' }}>{t('email_required_desc')}</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-with-icon">
              <Mail size={20} className="input-icon" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                dir="ltr"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem', width: '100%' }}>
            {loading ? '...' : t('submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
