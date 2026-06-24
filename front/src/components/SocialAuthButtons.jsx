import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export function SocialAuthButtons() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');
  const telegramContainerRef = useRef(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.auth.getConfig();
        const data = typeof response === 'string' ? JSON.parse(response) : response;
        setConfig(data);
      } catch (err) {
        console.error('Failed to load auth config:', err);
      }
    };
    fetchConfig();
  }, []);

  const handleAuthSuccess = (responseStr) => {
    try {
      const data = typeof responseStr === 'string' ? JSON.parse(responseStr) : responseStr;
      if (data.requires_email) {
        navigate('/auth/telegram-email', { state: { telegramPayload: data.telegramPayload } });
      } else if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(t('invalid_link_selected'));
    }
  };

  useEffect(() => {
    if (!config) return;

    // 1. Load Google Script
    if (config.googleClientId) {
      window.handleGoogleCredentialResponse = async (response) => {
        try {
          const res = await api.auth.loginWithGoogle(response.credential);
          handleAuthSuccess(res);
        } catch (err) {
          setError(err.message || 'Google login failed');
        }
      };

      const googleScriptId = 'google-gsi-script';
      if (!document.getElementById(googleScriptId)) {
        const script = document.createElement('script');
        script.id = googleScriptId;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    // 2. Load Telegram Script
    if (config.telegramBotUsername && telegramContainerRef.current) {
      window.onTelegramAuth = async (user) => {
        try {
          const res = await api.auth.loginWithTelegram(user);
          try {
            const parsedRes = typeof res === 'string' ? JSON.parse(res) : res;
            if (parsedRes.requires_email) {
              // Redirect to email prompt, pass the telegram payload
              navigate('/auth/telegram-email', { state: { telegramPayload: user } });
            } else {
              handleAuthSuccess(res);
            }
          } catch (e) {
            handleAuthSuccess(res);
          }
        } catch (err) {
          setError(err.message || 'Telegram login failed');
        }
      };

      // Clear any previous script to prevent duplicates on remount
      telegramContainerRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', config.telegramBotUsername);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '8');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;
      
      telegramContainerRef.current.appendChild(script);
    }
  }, [config]);

  const simulateGoogle = async () => {
    try {
      const res = await api.auth.loginWithGoogle('mock_token', true, { 
        mockEmail: 'dev@google.com', 
        mockFirstName: 'Dev', 
        mockLastName: 'Google' 
      });
      handleAuthSuccess(res);
    } catch (err) {
      setError(err.message);
    }
  };

  const simulateTelegram = async () => {
    try {
      const mockPayload = {
        id: '123456789',
        first_name: 'Dev',
        last_name: 'Telegram',
        username: 'dev_tg',
        photo_url: '',
        auth_date: Math.floor(Date.now() / 1000).toString(),
        hash: 'mock_hash',
        isMock: true
      };
      const res = await api.auth.loginWithTelegram(mockPayload);
      try {
        const parsedRes = typeof res === 'string' ? JSON.parse(res) : res;
        if (parsedRes.requires_email) {
          navigate('/auth/telegram-email', { state: { telegramPayload: mockPayload } });
        } else {
          handleAuthSuccess(res);
        }
      } catch (e) {
        handleAuthSuccess(res);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
      {error && <div style={{ color: 'red', fontSize: '0.85rem' }}>{error}</div>}
      
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '0.5rem 0' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        <span style={{ padding: '0 1rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{t('or_continue_with')}</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
      </div>

      {config?.googleClientId && (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div id="g_id_onload"
             data-client_id={config.googleClientId}
             data-context="use"
             data-ux_mode="popup"
             data-callback="handleGoogleCredentialResponse"
             data-auto_prompt="false">
          </div>
          <div className="g_id_signin"
             data-type="standard"
             data-shape="rectangular"
             data-theme="outline"
             data-text="signin_with"
             data-size="large"
             data-logo_alignment="left">
          </div>
        </div>
      )}

      {config?.telegramBotUsername && (
        <div ref={telegramContainerRef} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}></div>
      )}

      {/* Simulator buttons for Development */}
      {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" onClick={simulateGoogle} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            {t('simulate_google')}
          </button>
          <button type="button" onClick={simulateTelegram} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            {t('simulate_telegram')}
          </button>
        </div>
      )}
    </div>
  );
}
