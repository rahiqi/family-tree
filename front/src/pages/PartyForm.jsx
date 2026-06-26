import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Sparkles, HelpCircle } from 'lucide-react';
import { api } from '../services/api';

function PartyForm() {
  const { treeId, partyId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isFa = i18n.language === 'fa';
  const isEditMode = !!partyId;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  
  // Collaborators for private visibility selection
  const [collaborators, setCollaborators] = useState([]);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [recurrence, setRecurrence] = useState('one-time');
  const [needsSponsor, setNeedsSponsor] = useState(false);
  const [targetAmount, setTargetAmount] = useState(0);
  const [openRegistration, setOpenRegistration] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [allowedMemberIds, setAllowedMemberIds] = useState([]);

  useEffect(() => {
    fetchTreeCollaborators();
    if (isEditMode) {
      fetchPartyDetails();
    }
  }, [treeId, partyId]);

  const fetchTreeCollaborators = async () => {
    try {
      const res = await api.tree.get(treeId);
      // Filter out 'owner' or self if desired, but listing all is safer.
      // Filter out owner as they always see it, but it's simpler to list all editors/visitors.
      setCollaborators(res.collaborators || []);
    } catch (err) {
      console.error('Failed to fetch collaborators:', err);
    }
  };

  const fetchPartyDetails = async () => {
    try {
      setInitialLoading(true);
      const res = await api.party.get(treeId, partyId);
      setTitle(res.title || '');
      setDescription(res.description || '');
      // If location is returned masked because the user isn't creator/participant,
      // it might say "Only visible to participants", but usually the editor/owner can edit.
      setLocation(res.location || '');
      setDate(res.date || '');
      setTime(res.time || '');
      setRecurrence(res.recurrence || 'one-time');
      setNeedsSponsor(res.needsSponsor || false);
      setTargetAmount(res.targetAmount || 0);
      setOpenRegistration(res.openRegistration || false);
      setIsPublic(res.isPublic !== false); // default to true
      setAllowedMemberIds(res.allowedMemberIds || []);
    } catch (err) {
      setError(err.message || 'Failed to load party details for edit.');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCheckboxChange = (userId) => {
    setAllowedMemberIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllCollaborators = () => {
    if (allowedMemberIds.length === collaborators.length) {
      setAllowedMemberIds([]);
    } else {
      setAllowedMemberIds(collaborators.map(c => c.userId));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!title || !date || !time) {
      setError(isFa ? 'لطفاً تمام فیلدهای اجباری را پر کنید.' : 'Please fill in all required fields.');
      setLoading(false);
      return;
    }

    const payload = {
      title,
      description,
      location,
      date,
      time,
      isPublic,
      allowedMemberIds: isPublic ? [] : allowedMemberIds,
      recurrence,
      needsSponsor,
      targetAmount: needsSponsor ? Number(targetAmount) : 0,
      openRegistration: needsSponsor ? openRegistration : false
    };

    try {
      if (isEditMode) {
        await api.party.update(treeId, partyId, payload);
      } else {
        await api.party.create(treeId, payload);
      }
      navigate(`/tree/${treeId}/calendar`);
    } catch (err) {
      setError(err.message || 'Failed to save family party.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>
          {isFa ? 'در حال بارگذاری اطلاعات مهمانی...' : 'Loading party details...'}
        </p>
      </div>
    );
  }

  return (
    <div className="mesh-bg" style={{ minHeight: 'calc(100vh - 73px)', position: 'relative', overflow: 'hidden', paddingBottom: '6rem' }}>
      <div className="dark-grid"></div>

      <div className="layout-container" style={{ position: 'relative', zIndex: 2, paddingTop: '3rem', maxWidth: '800px' }}>
        
        {/* Back navigation */}
        <Link 
          to={isEditMode ? `/tree/${treeId}/party/${partyId}` : `/tree/${treeId}/calendar`} 
          className="btn btn-secondary" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '2rem', textDecoration: 'none' }}
        >
          <ArrowLeft size={16} style={{ transform: isFa ? 'rotate(180deg)' : 'none' }} />
          <span>{isEditMode ? t('cancel') : t('back_to_tree')}</span>
        </Link>

        <motion.div
          className="glass-card"
          style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <span style={{ fontSize: '2.25rem' }}>🎉</span>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {isEditMode ? t('edit_party') : t('add_party')}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                {isFa ? 'برگزاری یک میهمانی مجلل و ثبت خاطرات ماندگار در تاریخچه فامیل' : 'Host a beautiful family party and save lasting memories.'}
              </p>
            </div>
          </div>

          {error && (
            <div style={{ 
              backgroundColor: '#fee2e2', 
              color: '#dc2626', 
              padding: '1rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid #fca5a5',
              marginBottom: '2rem',
              fontSize: '0.95rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Title */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                {t('party_title')} <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={t('party_title_placeholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                {t('party_desc')}
              </label>
              <textarea
                className="form-input"
                style={{ minHeight: '100px', resize: 'vertical' }}
                placeholder={t('party_desc_placeholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Grid for Date, Time, Recurrence */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  {t('party_date')} <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  {t('party_time')} <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('party_time_placeholder')}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  {t('recurrence')}
                </label>
                <select
                  className="form-input"
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="one-time">{t('one_time')}</option>
                  <option value="monthly">{t('monthly')}</option>
                  <option value="yearly">{t('yearly')}</option>
                </select>
              </div>
            </div>

            {/* Location (Private) */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                {t('party_location')}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={t('party_location_placeholder')}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem', display: 'block' }}>
                🔒 {t('party_location_hidden')}
              </span>
            </div>

            {/* Sponsorship Controls */}
            <div style={{ 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1.5rem', 
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={needsSponsor}
                  onChange={(e) => setNeedsSponsor(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                />
                <span>{t('needs_sponsor')}</span>
              </label>

              {needsSponsor && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}
                >
                  <div className="form-group">
                    <label className="form-label">
                      {t('target_amount')} (Toman / Currency Unit)
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      min="0"
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={openRegistration}
                      onChange={(e) => setOpenRegistration(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                    />
                    <span>{t('open_reg')}</span>
                  </label>
                </motion.div>
              )}
            </div>

            {/* Visibility Options */}
            <div style={{ 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1.5rem', 
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                {t('visibility')}
              </label>
              
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                  <input
                    type="radio"
                    name="visibility"
                    checked={isPublic === true}
                    onChange={() => setIsPublic(true)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                  />
                  <span>🌐 {t('public_party')}</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                  <input
                    type="radio"
                    name="visibility"
                    checked={isPublic === false}
                    onChange={() => setIsPublic(false)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                  />
                  <span>🔒 {t('private_party')}</span>
                </label>
              </div>

              {/* Private visibility allowed members list */}
              {!isPublic && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {t('allowed_members')}
                    </span>
                    {collaborators.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAllCollaborators}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {allowedMemberIds.length === collaborators.length 
                          ? (isFa ? 'لغو انتخاب همه' : 'Deselect All') 
                          : (isFa ? 'انتخاب همه' : 'Select All')}
                      </button>
                    )}
                  </div>

                  {collaborators.length > 0 ? (
                    <div style={{ 
                      maxHeight: '180px', 
                      overflowY: 'auto', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.5rem', 
                      padding: '0.5rem', 
                      background: 'rgba(0,0,0,0.1)', 
                      borderRadius: 'var(--radius-sm)' 
                    }}>
                      {collaborators.map(c => (
                        <label 
                          key={c.userId} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem', 
                            cursor: 'pointer', 
                            fontSize: '0.85rem', 
                            color: 'var(--text-primary)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            transition: 'background 0.2s',
                            ':hover': { background: 'rgba(255,255,255,0.05)' }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={allowedMemberIds.includes(c.userId)}
                            onChange={() => handleCheckboxChange(c.userId)}
                            style={{ width: '15px', height: '15px', accentColor: 'var(--accent)' }}
                          />
                          <span>{c.email}</span>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            padding: '0.05rem 0.3rem', 
                            borderRadius: '3px', 
                            background: c.role === 'owner' ? '#fef3c7' : c.role === 'editor' ? '#d1fae5' : '#e0f2fe', 
                            color: c.role === 'owner' ? '#d97706' : c.role === 'editor' ? '#059669' : '#0284c7',
                            marginInlineStart: 'auto'
                          }}>
                            {c.role}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '1rem' }}>
                      {isFa ? 'هیچ همکار دیگری یافت نشد.' : 'No other collaborators found.'}
                    </p>
                  )}
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <Link to={isEditMode ? `/tree/${treeId}/party/${partyId}` : `/tree/${treeId}/calendar`} className="btn btn-secondary" style={{ padding: '0.6rem 2rem', textDecoration: 'none' }}>
                {t('cancel')}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '0.6rem 2.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Save size={18} />
                <span>{loading ? '...' : t('save')}</span>
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default PartyForm;
