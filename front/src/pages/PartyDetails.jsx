import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Shield, Users, HeartHandshake, 
  Upload, Trash2, Edit3, Lock, CheckCircle, Image as ImageIcon, X
} from 'lucide-react';
import { api, API_ORIGIN } from '../services/api';

function PartyDetails() {
  const { treeId, partyId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isFa = i18n.language === 'fa';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [party, setParty] = useState(null);
  const [treeInfo, setTreeInfo] = useState(null);
  const [userRole, setUserRole] = useState('visitor');

  // Input states
  const [sponsorAmount, setSponsorAmount] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Lightbox state for photo album
  const [activePhoto, setActivePhoto] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.id || currentUser.Id || '';

  useEffect(() => {
    fetchPartyAndTreeDetails();
  }, [treeId, partyId]);

  const fetchPartyAndTreeDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const treeRes = await api.tree.get(treeId);
      setTreeInfo(treeRes);
      setUserRole(treeRes.userRole || treeRes.UserRole || 'visitor');

      const partyRes = await api.party.get(treeId, partyId);
      setParty(partyRes);
    } catch (err) {
      setError(err.message || 'Failed to load party details.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      setError('');
      const updatedParty = await api.party.join(treeId, partyId);
      setParty(updatedParty);
    } catch (err) {
      setError(err.message || 'Failed to join party.');
    }
  };

  const handleSponsor = async (e) => {
    e.preventDefault();
    if (!sponsorAmount || Number(sponsorAmount) <= 0) return;

    try {
      setError('');
      const updatedParty = await api.party.sponsor(treeId, partyId, Number(sponsorAmount));
      setParty(updatedParty);
      setSponsorAmount('');
    } catch (err) {
      setError(err.message || 'Failed to contribute sponsorship.');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    try {
      const updatedParty = await api.party.uploadPhoto(treeId, partyId, file);
      setParty(updatedParty);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    const confirmMsg = t('delete_party_confirm');
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.party.delete(treeId, partyId);
      navigate(`/tree/${treeId}/calendar`);
    } catch (err) {
      setError(err.message || 'Failed to delete party.');
    }
  };

  if (loading) {
    return (
      <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>
          {isFa ? 'در حال بارگذاری جزئیات مهمانی...' : 'Loading party details...'}
        </p>
      </div>
    );
  }

  if (error && !party) {
    return (
      <div className="layout-container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto' }}>
          <span style={{ fontSize: '3rem' }}>🔒</span>
          <h2 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>{t('private_tree_title')}</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem 0' }}>{error}</p>
          <Link to={`/tree/${treeId}/calendar`} className="btn btn-primary">
            {t('back_to_tree')}
          </Link>
        </div>
      </div>
    );
  }

  // Permissions checks
  const isManager = userRole === 'owner' || userRole === 'editor';
  const isCreator = party && (party.creatorId === currentUserId);
  const canEditOrDelete = isManager || isCreator;

  const isUserJoined = party && (party.isUserJoined || party.participants?.some(p => p.userId === currentUserId));
  const isUserSponsor = party && (party.isUserSponsor || party.sponsorships?.some(s => s.userId === currentUserId));
  const canUploadPhoto = isUserJoined || isUserSponsor || isManager || isCreator;

  // Sponsorship calculation for SVG radial chart
  const collected = party?.totalSponsorships || 0;
  const target = party?.targetAmount || 0;
  const pct = target > 0 ? Math.min(1, collected / target) : 0;
  const percentage = Math.round(pct * 100);

  // SVG Circle parameters
  const radius = 55;
  const circ = 2 * Math.PI * radius;
  const strokeOffset = circ * (1 - pct);

  return (
    <div className="mesh-bg" style={{ minHeight: 'calc(100vh - 73px)', position: 'relative', overflow: 'hidden', paddingBottom: '6rem' }}>
      <div className="dark-grid"></div>

      <div className="layout-container" style={{ position: 'relative', zIndex: 2, paddingTop: '3rem' }}>
        
        {/* Header Block & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
          <div>
            <Link to={`/tree/${treeId}/calendar`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem', textDecoration: 'none' }}>
              <ArrowLeft size={16} style={{ transform: isFa ? 'rotate(180deg)' : 'none' }} />
              <span>{t('back_to_tree')}</span>
            </Link>
            
            <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              {party.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <span>{isFa ? 'نوع رویداد:' : 'Type:'}</span>
              <span className="text-indigo-400 font-semibold">🎉 {t('party')}</span>
              {party.recurrence !== 'one-time' && (
                <span style={{ 
                  background: 'rgba(99, 102, 241, 0.1)', 
                  color: '#818cf8', 
                  padding: '0.15rem 0.5rem', 
                  borderRadius: '99px',
                  fontSize: '0.75rem',
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  {t(party.recurrence)}
                </span>
              )}
            </div>
          </div>

          {canEditOrDelete && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to={`/tree/${treeId}/party/${partyId}/edit`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                <Edit3 size={16} />
                <span>{t('edit')}</span>
              </Link>
              <button onClick={handleDelete} className="btn btn-secondary" style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trash2 size={16} />
                <span>{t('delete')}</span>
              </button>
            </div>
          )}
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

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-8 items-start">
          
          {/* Left Block: Description & Photo Album */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Description & Metadata Card */}
            <div className="glass-card" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                {isFa ? 'درباره مهمانی' : 'About the Party'}
              </h3>
              
              <p style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '1rem', 
                lineHeight: 1.7, 
                whiteSpace: 'pre-wrap',
                marginBottom: '2rem'
              }}>
                {party.description || (isFa ? 'توضیحاتی برای این مهمانی ثبت نشده است.' : 'No description provided for this party.')}
              </p>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', padding: '0.50rem', borderRadius: 'var(--radius-sm)' }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h5 style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      {t('party_date')}
                    </h5>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.1rem' }}>
                      {party.date}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', padding: '0.50rem', borderRadius: 'var(--radius-sm)' }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <h5 style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      {t('party_time')}
                    </h5>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.1rem' }}>
                      {party.time}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', padding: '0.50rem', borderRadius: 'var(--radius-sm)' }}>
                    <MapPin size={20} />
                  </div>
                  <div style={{ minWidth: 0, flexGrow: 1 }}>
                    <h5 style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      {t('party_location')}
                    </h5>
                    {party.location === 'Only visible to participants' ? (
                      <p style={{ color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.1rem' }}>
                        <Lock size={14} style={{ color: 'var(--warning)' }} />
                        <span>{t('party_location_hidden')}</span>
                      </p>
                    ) : (
                      <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={party.location}>
                        {party.location || (isFa ? 'نامشخص' : 'Not Specified')}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', padding: '0.50rem', borderRadius: 'var(--radius-sm)' }}>
                    <Shield size={20} />
                  </div>
                  <div>
                    <h5 style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      {t('visibility')}
                    </h5>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.1rem' }}>
                      {party.isPublic ? t('public') : t('private')}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Shared Photo Album Grid */}
            <div className="glass-card" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                  <ImageIcon size={20} style={{ color: 'var(--accent)' }} />
                  <span>{t('party_photos')}</span>
                </h3>

                {canUploadPhoto ? (
                  <label className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                    <Upload size={15} />
                    <span>{uploading ? '...' : t('upload_photo')}</span>
                    <input type="file" onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} disabled={uploading} />
                  </label>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Lock size={12} />
                    {t('only_participants_share')}
                  </span>
                )}
              </div>

              {uploadError && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{uploadError}</div>
              )}

              {party.photoAlbum && party.photoAlbum.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {party.photoAlbum.map((photo, idx) => (
                    <motion.div
                      key={idx}
                      className="photo-card"
                      style={{ 
                        aspectRatio: '1', 
                        overflow: 'hidden', 
                        borderRadius: 'var(--radius-sm)', 
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      whileHover={{ scale: 1.03 }}
                      onClick={() => setActivePhoto(photo)}
                    >
                      <img 
                        src={`${API_ORIGIN}${photo.url}`} 
                        alt={photo.caption || 'Event media'} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {photo.caption && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                          padding: '0.5rem',
                          color: 'white',
                          fontSize: '0.7rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          direction: 'ltr',
                          textAlign: 'start'
                        }}>
                          {photo.caption}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <ImageIcon size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.9rem' }}>{t('no_photos_yet')}</p>
                </div>
              )}
            </div>

          </div>

          {/* Right Block: Sponsorship Circular Chart & RSVPs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Join / RSVP Action Card */}
            <div className="glass-card" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              {isUserJoined ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={36} style={{ color: 'var(--success)' }} />
                  <h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {isFa ? 'شما در این مهمانی حضور دارید' : 'You are RSVP\'d'}
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {isFa ? 'امیدواریم از این دورهمی لذت ببرید!' : 'Hope you enjoy the family get-together!'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Users size={32} style={{ margin: '0 auto', color: 'var(--accent)' }} />
                  <div>
                    <h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {isFa ? 'شرکت در مهمانی خاندان' : 'Join Family Party'}
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                      {isFa ? 'همین حالا حضور خود را در این میهمانی اعلام کنید.' : 'Let the family know you are coming.'}
                    </p>
                  </div>
                  <button onClick={handleJoin} className="btn btn-primary" style={{ width: '100%', padding: '0.6rem' }}>
                    {t('join_party')}
                  </button>
                </div>
              )}
            </div>

            {/* Sponsorship Circular Chart Card */}
            {party.needsSponsor && (
              <div className="glass-card" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HeartHandshake size={18} style={{ color: 'var(--accent)' }} />
                  <span>{t('sponsorship_progress')}</span>
                </h4>

                {/* SVG Radial Chart */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '140px', marginBottom: '1.5rem' }}>
                  <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Track */}
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="transparent"
                      stroke="var(--border-color)"
                      strokeWidth="8"
                    />
                    {/* Progress Fill */}
                    <motion.circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="transparent"
                      stroke="url(#gradient-sponsorship)"
                      strokeWidth="9"
                      strokeDasharray={circ}
                      initial={{ strokeDashoffset: circ }}
                      animate={{ strokeDashoffset: strokeOffset }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                    
                    {/* Gradients definitions */}
                    <defs>
                      <linearGradient id="gradient-sponsorship" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Percentage content positioned absolutely in middle */}
                  <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {percentage}%
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {t('collected')}
                    </span>
                  </div>
                </div>

                {/* Amount details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{t('collected')}:</span>
                    <span style={{ fontWeight: 700 }}>{collected.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{t('target')}:</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{target.toLocaleString()}</span>
                  </div>
                </div>

                {/* Sponsorship Form */}
                <form onSubmit={handleSponsor} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    type="number"
                    className="form-input"
                    placeholder={t('sponsor_amount')}
                    value={sponsorAmount}
                    onChange={(e) => setSponsorAmount(e.target.value)}
                    min="1"
                    required
                  />
                  <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '0.55rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <HeartHandshake size={15} />
                    <span>{t('become_sponsor')}</span>
                  </button>
                </form>
              </div>
            )}

            {/* List of Attendees */}
            <div className="glass-card" style={{ padding: '1.5rem 2rem', borderRadius: 'var(--radius-lg)' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} style={{ color: 'var(--accent)' }} />
                <span>{t('attendees')} ({party.participants?.length || 0})</span>
              </h4>

              {party.participants && party.participants.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {party.participants.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-light)',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}>
                        {p.name ? p.name.charAt(0).toUpperCase() : p.email.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name || p.email}
                        </span>
                        {p.name && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{p.email}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '1rem 0' }}>
                  {isFa ? 'هیچ کس هنوز اعلام حضور نکرده است.' : 'No one has RSVP\'d yet.'}
                </p>
              )}
            </div>

            {/* List of Sponsors */}
            {party.needsSponsor && (
              <div className="glass-card" style={{ padding: '1.5rem 2rem', borderRadius: 'var(--radius-lg)' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HeartHandshake size={16} style={{ color: 'var(--accent)' }} />
                  <span>{isFa ? 'حامیان مالی' : 'Sponsors'} ({party.sponsorships?.length || 0})</span>
                </h4>

                {party.sponsorships && party.sponsorships.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {party.sponsorships.map((s, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.sponsorName || s.email}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--success)' }}>
                          +{s.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '1rem 0' }}>
                    {isFa ? 'هنوز هیچ حامی مالی ثبت نشده است.' : 'No sponsors yet.'}
                  </p>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Lightbox Modal for Photo Album */}
      <AnimatePresence>
        {activePhoto && (
          <motion.div
            className="flex-center"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.9)',
              zIndex: 1000,
              padding: '2rem',
              flexDirection: 'column'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Close button */}
            <button 
              onClick={() => setActivePhoto(null)}
              style={{
                position: 'absolute',
                top: '2rem',
                right: '2rem',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              title="Close"
            >
              <X size={20} />
            </button>

            {/* Image display */}
            <motion.img
              src={`${API_ORIGIN}${activePhoto.url}`}
              alt={activePhoto.caption || 'Event media'}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            />

            {/* Caption details */}
            {activePhoto.caption && (
              <p style={{
                color: 'rgba(255,255,255,0.8)',
                marginTop: '1.5rem',
                fontSize: '0.95rem',
                textAlign: 'center',
                maxWidth: '600px',
                lineHeight: 1.5,
                direction: 'ltr'
              }}>
                {activePhoto.caption}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default PartyDetails;
