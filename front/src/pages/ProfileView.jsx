import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Edit, Save, Plus, Trash2, Camera, 
  BookOpen, Image as ImageIcon, Calendar, Heart, User, Check, X, CalendarDays, History, Clock 
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { api, API_ORIGIN } from '../services/api';
import DatePicker from '../components/DatePicker';


// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

function ProfileView() {
  const { treeId, id } = useParams(); // id is the personId from family-chart
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.id || currentUser.Id;

  const [profile, setProfile] = useState(null);
  const [personNode, setPersonNode] = useState(null);
  const [treeInfo, setTreeInfo] = useState(null);
  const [userRole, setUserRole] = useState('visitor');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editedBiography, setEditedBiography] = useState('');
  const [editedPhotoAlbum, setEditedPhotoAlbum] = useState([]);
  const [editedAvatarUrl, setEditedAvatarUrl] = useState('');
  const [editedTimelineEvents, setEditedTimelineEvents] = useState([]);
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [avatarUploadLoading, setAvatarUploadLoading] = useState(false);

  // New photo caption state
  const [newPhotoCaption, setNewPhotoCaption] = useState('');

  // Timeline Event creator states
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventType, setEventType] = useState('custom');
  const [editingEventId, setEditingEventId] = useState(null);

  useEffect(() => {
    fetchProfileAndTree();
  }, [treeId, id]);

  const fetchProfileAndTree = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Fetch Tree metadata to extract node details
      const treeRes = await api.tree.get(treeId);
      setTreeInfo(treeRes);
      setUserRole(treeRes.userRole || treeRes.UserRole || 'visitor');
      
      const treeNodes = JSON.parse(treeRes.treeGraphJsonData || '[]');
      const matchedNode = treeNodes.find(n => n.id === id);
      setPersonNode(matchedNode);

      // 2. Fetch Detailed biography / profile album
      const profileRes = await api.profile.get(treeId, id);
      setProfile(profileRes);
      setEditedBiography(profileRes.biography || '');
      setEditedPhotoAlbum(profileRes.photoAlbum || []);
      setEditedAvatarUrl(profileRes.avatarUrl || '');
      setEditedTimelineEvents(profileRes.timelineEvents || []);
    } catch (err) {
      setError(err.message || 'Failed to load biography.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadLoading(true);
      setError('');
      
      const uploadRes = await api.profile.uploadPhoto(treeId, id, file);
      
      const newPhoto = {
        url: uploadRes.url,
        caption: newPhotoCaption.trim() || file.name
      };

      setEditedPhotoAlbum([...editedPhotoAlbum, newPhoto]);
      setNewPhotoCaption('');
    } catch (err) {
      setError(err.message || 'Image upload failed. Allowed formats: JPG, PNG, GIF, WEBP.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setAvatarUploadLoading(true);
      setError('');
      
      const uploadRes = await api.profile.uploadPhoto(treeId, id, file);
      setEditedAvatarUrl(uploadRes.url);
    } catch (err) {
      setError(err.message || 'Avatar upload failed.');
    } finally {
      setAvatarUploadLoading(false);
    }
  };

  const handleRemovePhoto = (index) => {
    const updated = editedPhotoAlbum.filter((_, idx) => idx !== index);
    setEditedPhotoAlbum(updated);
  };

  const handleSaveProfile = async () => {
    try {
      setSaveLoading(true);
      setError('');
      
      const updatedProfile = await api.profile.update(treeId, id, {
        biography: editedBiography,
        avatarUrl: editedAvatarUrl,
        photoAlbum: editedPhotoAlbum,
        timelineEvents: editedTimelineEvents
      });

      setProfile(updatedProfile);

      // Sync avatar to treeGraphJsonData inside treeInfo
      if (treeInfo) {
        try {
          const treeNodes = JSON.parse(treeInfo.treeGraphJsonData || '[]');
          const matchedNode = treeNodes.find(n => n.id === id);
          if (matchedNode) {
            if (!matchedNode.data) matchedNode.data = {};
            matchedNode.data.avatar = editedAvatarUrl || '';
            
            // Save the updated tree graph back to the backend
            await api.tree.updateGraph(treeId, treeNodes);
            
            // Update local state to reflect the change
            setPersonNode(matchedNode);
            setTreeInfo({
              ...treeInfo,
              treeGraphJsonData: JSON.stringify(treeNodes)
            });
          }
        } catch (syncErr) {
          console.error("Failed to sync avatar to tree graph data:", syncErr);
        }
      }

      setIsEditing(false);
      
      // Trigger visual checkmark success
      const successBar = document.createElement('div');
      successBar.innerHTML = t('save_success');
      successBar.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: var(--success);
        color: white;
        padding: 0.75rem 2rem;
        border-radius: 99px;
        z-index: 9999;
        font-weight: 600;
        box-shadow: var(--shadow-lg);
      `;
      document.body.appendChild(successBar);
      setTimeout(() => successBar.remove(), 2000);
      
    } catch (err) {
      setError(err.message || 'Failed to update profile details.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Helper to save timeline events separately
  const saveTimelineEvents = async (updatedEvents) => {
    try {
      setSaveLoading(true);
      setError('');
      const updatedProfile = await api.profile.update(treeId, id, {
        biography: editedBiography,
        avatarUrl: editedAvatarUrl,
        photoAlbum: editedPhotoAlbum,
        timelineEvents: updatedEvents
      });
      setProfile(updatedProfile);
      setEditedTimelineEvents(updatedProfile.timelineEvents || []);

      const successBar = document.createElement('div');
      successBar.innerHTML = t('save_success');
      successBar.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: var(--success);
        color: white;
        padding: 0.75rem 2rem;
        border-radius: 99px;
        z-index: 9999;
        font-weight: 600;
        box-shadow: var(--shadow-lg);
      `;
      document.body.appendChild(successBar);
      setTimeout(() => successBar.remove(), 2000);
    } catch (err) {
      setError(err.message || 'Failed to update timeline events.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Timeline Event CRUD operations
  const handleAddEventSubmit = async (e) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate.trim()) return;

    let updatedList;
    if (editingEventId) {
      updatedList = editedTimelineEvents.map(ev => 
        ev.id === editingEventId 
          ? { ...ev, date: eventDate, title: eventTitle, description: eventDesc, type: eventType }
          : ev
      );
      setEditingEventId(null);
    } else {
      const newEv = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        date: eventDate,
        title: eventTitle,
        description: eventDesc,
        type: eventType
      };
      updatedList = [...editedTimelineEvents, newEv];
    }

    setEditedTimelineEvents(updatedList);
    setEventDate('');
    setEventTitle('');
    setEventDesc('');
    setEventType('custom');
    setShowAddEvent(false);

    await saveTimelineEvents(updatedList);
  };

  const handleEditEventClick = (ev) => {
    setEditingEventId(ev.id);
    setEventDate(ev.date);
    setEventTitle(ev.title);
    setEventDesc(ev.description || '');
    setEventType(ev.type || 'custom');
    setShowAddEvent(true);
  };

  const handleRemoveEvent = async (eventId) => {
    const updatedList = editedTimelineEvents.filter(ev => ev.id !== eventId);
    setEditedTimelineEvents(updatedList);
    await saveTimelineEvents(updatedList);
  };

  const canEdit = userRole === 'owner' || (userRole === 'editor' && personNode?.addedBy && currentUserId && personNode.addedBy.toLowerCase() === currentUserId.toLowerCase());
  const isRtl = i18n.language === 'fa';

  // Identity Details
  const firstName = personNode?.data?.['first name'] || personNode?.data?.['firstName'] || '';
  const lastName = personNode?.data?.['last name'] || personNode?.data?.['lastName'] || '';
  const fullName = firstName || lastName ? `${firstName} ${lastName}` : (isRtl ? 'شخص بدون نام' : 'Unnamed Person');
  const gender = personNode?.data?.gender || 'M';
  const birthday = personNode?.data?.birthday || '';

  // Specific Avatar loader
  const getAvatarImage = () => {
    if (editedAvatarUrl) {
      return `${API_ORIGIN}${editedAvatarUrl}`;
    }
    return null;
  };

  // Sort events chronologically based on numbers extracted from the date string
  const sortedEvents = [...editedTimelineEvents].sort((a, b) => {
    const numA = parseInt(a.date.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.date.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });

  if (loading) {
    return (
      <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>{isRtl ? 'در حال بارگذاری شناسنامه...' : 'Loading biography...'}</p>
      </div>
    );
  }

  const isPermissionError = error && (
    error.toLowerCase().includes('forbidden') || 
    error.toLowerCase().includes('unauthorized') || 
    error.toLowerCase().includes('permission') || 
    error.toLowerCase().includes('access')
  );

  if (isPermissionError) {
    return (
      <div className="flex-center" style={{ height: '80vh', flexDirection: 'column', padding: '2rem', textAlign: 'center', fontFamily: 'Vazirmatn, sans-serif' }}>
        <motion.div
          className="auth-card"
          style={{ maxWidth: '440px', padding: '3rem', borderRadius: 'var(--radius-lg)' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1.5rem' }}>🔒</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            {t('private_tree_title')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            {t('private_tree_message')}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/auth/login" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
              {t('login')}
            </Link>
            <Link to="/" className="btn btn-secondary" style={{ padding: '0.6rem 1.5rem' }}>
              {t('go_home')}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (

    <div className="layout-container" style={{ paddingBottom: '6rem' }}>
      
      {/* Top back actions */}
      <div style={{ margin: '2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={`/tree/${treeId}`} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <ArrowLeft size={16} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
          <span>{isRtl ? 'بازگشت به درخت شجره‌نامه' : 'Back to Family Tree'}</span>
        </Link>

        {canEdit && !isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
            <Edit size={16} />
            <span>{t('edit')}</span>
          </button>
        )}
      </div>

      {error && (
        <div style={{ 
          backgroundColor: '#fee2e2', 
          color: '#dc2626', 
          padding: '1rem', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid #fca5a5',
          marginBottom: '1.5rem',
          fontSize: '0.95rem'
        }}>
          {error}
        </div>
      )}

      {/* Main Content Layout Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-12 items-start">
        
        {/* Left Column: Identity Summary + Biography */}
        <div className="timeline-sticky-bar">
          <div className="profile-container" style={{ marginTop: '0', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Identity Summary Box */}
            <div className="profile-header-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                {getAvatarImage() ? (
                  <img 
                    src={getAvatarImage()} 
                    alt={fullName}
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                      border: `3px solid ${gender === 'M' ? '#38bdf8' : '#f472b6'}`
                    }}
                  />
                ) : (
                  <div className="profile-avatar-placeholder" style={{
                    width: '100px',
                    height: '100px',
                    backgroundColor: gender === 'M' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(244, 114, 182, 0.1)',
                    color: gender === 'M' ? '#38bdf8' : '#f472b6',
                    border: `3px solid ${gender === 'M' ? '#38bdf8' : '#f472b6'}55`,
                    fontSize: '2.5rem'
                  }}>
                    {gender === 'M' ? '👨' : '👩'}
                  </div>
                )}

                {/* Avatar Specific Direct Uploader in Edit Mode */}
                {isEditing && (
                  <div style={{ position: 'absolute', bottom: '-0.3rem', right: '-0.3rem' }}>
                    <input
                      type="file"
                      id="upload-avatar-input"
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handleUploadAvatar}
                      disabled={avatarUploadLoading}
                    />
                    <label 
                      htmlFor="upload-avatar-input" 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: '#6366f1', 
                        color: 'white', 
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        border: '1.5px solid #090d16'
                      }}
                    >
                      <Camera size={14} />
                    </label>
                  </div>
                )}
              </div>

              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{fullName}</h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  <span className={`badge ${gender === 'M' ? 'badge-owner' : 'badge-editor'}`} style={{ textTransform: 'none' }}>
                    {gender === 'M' ? (isRtl ? 'مرد' : 'Male') : (isRtl ? 'زن' : 'Female')}
                  </span>
                  {birthday && (
                    <span className="badge badge-visitor" style={{ textTransform: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Calendar size={10} />
                      <span>{birthday}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Biography Section */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <BookOpen size={18} style={{ color: 'var(--accent)' }} />
                <span>{t('biography')}</span>
              </h3>
              
              {!isEditing ? (
                profile?.biography ? (
                  <p className="biography-text" style={{ fontSize: '0.98rem', color: 'var(--text-secondary)' }}>{profile.biography}</p>
                ) : (
                  <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    {isRtl ? 'هنوز زندگینامه‌ای برای این شخص ثبت نشده است.' : 'No biography recorded yet.'}
                  </p>
                )
              ) : (
                <textarea
                  className="form-input"
                  style={{ minHeight: '140px', fontFamily: 'inherit', resize: 'vertical', fontSize: '0.9rem', padding: '0.75rem' }}
                  value={editedBiography}
                  onChange={(e) => setEditedBiography(e.target.value)}
                  placeholder={isRtl ? 'خلاصه‌ای از زندگینامه بزرگ خاندان را بنویسید...' : 'Summary of their life history...'}
                />
              )}
            </div>

            {/* In Edit Mode: Direct Instructions panel for Avatar */}
            {isEditing && (
              <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: 'var(--radius-md)', padding: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
                <Check size={16} style={{ color: '#818cf8', flexShrink: 0 }} />
                <span>
                  {isRtl 
                    ? 'برای تغییر عکس اصلی عضو، بر روی آیکون دوربین کلیک کنید یا دکمه ستاره آلبوم پایین صفحه را بزنید.' 
                    : 'Click the camera badge on the bubble to upload a specific avatar, or use the star buttons in the album folder.'}
                </span>
              </div>
            )}


          </div>
        </div>

        {/* Right Column: Scrolling Milestone Timeline */}
        <div style={{ minHeight: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <History size={22} style={{ color: 'var(--accent)' }} />
              <span>{isRtl ? 'تایم‌لاین کرونولوژیکال رویدادها' : 'Life Event Chronological Timeline'}</span>
            </h2>

            {canEdit && (
              <button 
                onClick={() => {
                  setEditingEventId(null);
                  setEventDate('');
                  setEventTitle('');
                  setEventDesc('');
                  setEventType('custom');
                  setShowAddEvent(!showAddEvent);
                }} 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
              >
                <Plus size={16} />
                <span>{isRtl ? 'رویداد جدید' : 'Add Event'}</span>
              </button>
            )}
          </div>

          {/* Inline Edit Event Form */}
          <AnimatePresence>
            {canEdit && showAddEvent && (
              <motion.form 
                onSubmit={handleAddEventSubmit}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card"
                style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}
              >
                <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem' }}>
                  {editingEventId ? (isRtl ? 'ویرایش رویداد' : 'Edit Timeline Event') : (isRtl ? 'افزودن رویداد تاریخی جدید' : 'Add New Historical Event')}
                </h4>

                <div className="responsive-form-grid">
                  <div className="form-group">
                    <DatePicker
                      value={eventDate}
                      onChange={(val) => setEventDate(val)}
                      label={isRtl ? 'تاریخ رویداد' : 'Event Date'}
                      placeholder={isRtl ? 'انتخاب تاریخ...' : 'Select date...'}
                    />
                  </div>


                  <div className="form-group">
                    <label className="form-label">{isRtl ? 'نوع رویداد' : 'Event Type'}</label>
                    <select 
                      className="form-input" 
                      value={eventType} 
                      onChange={(e) => setEventType(e.target.value)}
                    >
                      <option value="birthday">{isRtl ? 'تولد 👶' : 'Birth 👶'}</option>
                      <option value="education">{isRtl ? 'تحصیلات 🎓' : 'Education 🎓'}</option>
                      <option value="marriage">{isRtl ? 'ازدواج 💍' : 'Marriage 💍'}</option>
                      <option value="career">{isRtl ? 'شغل و حرفه 💼' : 'Career 💼'}</option>
                      <option value="death">{isRtl ? 'وفات 🕊️' : 'Death 🕊️'}</option>
                      <option value="custom">{isRtl ? 'سایر رویدادها ✏️' : 'Other Event ✏️'}</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{isRtl ? 'عنوان رویداد' : 'Event Title'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder={isRtl ? 'مثال: سفر تاریخی بزرگ خاندان به پایتخت' : 'e.g. Relocated to Capital'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{isRtl ? 'توضیحات کوتاه' : 'Short Description'}</label>
                  <textarea
                    className="form-input"
                    style={{ minHeight: '80px', fontFamily: 'inherit' }}
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder={isRtl ? 'جزئیات این رویداد خانوادگی...' : 'Describe what happened...'}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowAddEvent(false)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                    {t('cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: '#6366f1' }}>
                    {editingEventId ? (isRtl ? 'بروزرسانی' : 'Update') : (isRtl ? 'ثبت رویداد' : 'Add Event')}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Scrolling Timeline Track */}
          <div className="timeline-track">
            {sortedEvents.length > 0 ? (
              <>
                <div className="timeline-line"></div>

                {sortedEvents.map((ev) => (
                  <div key={ev.id} className="timeline-item">
                    <div className="timeline-node"></div>
                    
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {/* Scrolling Stick Date Line Indicator */}
                      <div className="timeline-date-badge hidden md:block">
                        {ev.date}
                      </div>

                      {/* Content details Card */}
                      <div className="timeline-content-card" style={{ flexGrow: 1, minWidth: '220px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                          <div>
                            <span className="inline-block md:hidden text-xs font-bold text-[#818cf8] bg-[#6366f1]/15 border border-[#6366f1]/30 px-2 py-0.5 rounded-full mb-2">
                              {ev.date}
                            </span>
                            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700 }}>
                              {ev.title}
                            </h3>
                          </div>
                          
                          {canEdit && (
                            <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                              <button 
                                onClick={() => handleEditEventClick(ev)} 
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}
                                title="Edit"
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                onClick={() => handleRemoveEvent(ev.id)} 
                                style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.2rem' }}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        {ev.description && (
                          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.88rem', lineHeight: 1.6 }}>
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.3)', 
                border: '1px dashed rgba(255, 255, 255, 0.08)', 
                borderRadius: 'var(--radius-lg)', 
                padding: '4rem 2rem', 
                textAlign: 'center',
                color: 'var(--text-tertiary)' 
              }}>
                <Clock size={36} style={{ display: 'block', margin: '0 auto 1rem', opacity: 0.5 }} />
                <span>
                  {isRtl 
                    ? 'هیچ رویداد تایم‌لاینی ثبت نشده است. دکمه ویرایش بالا را زده و اولین رویداد را بسازید!' 
                    : 'No historical events listed yet. Enter edit mode to build their timeline!'}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Editing State Photo Uploader Grid */}
      {isEditing && (
        <div className="profile-container" style={{ marginTop: '3.5rem', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <ImageIcon size={20} style={{ color: 'var(--success)' }} />
            <span>{isRtl ? 'آلبوم عکس و تصاویر' : 'Photo Album Uploads'}</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            <div className="responsive-form-grid">
              <div className="form-group">
                <label className="form-label">{isRtl ? 'توضیحات عکس (کپشن)' : 'Image Caption'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  placeholder={isRtl ? 'مثال: بزرگ خاندان در سفر شیراز' : 'e.g. Arash in Shiraz journey'}
                />
              </div>

              <div style={{ alignSelf: 'end', marginBottom: '1.25rem' }}>
                <input
                  type="file"
                  id="upload-photo-grid-input"
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleUploadPhoto}
                  disabled={uploadLoading}
                />
                <label 
                  htmlFor="upload-photo-grid-input" 
                  className="btn btn-secondary"
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}
                >
                  <Camera size={18} />
                  <span>{uploadLoading ? '...' : t('upload_photo')}</span>
                </label>
              </div>
            </div>

            {/* Photo list with Set Avatar selection trigger */}
            {editedPhotoAlbum.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {editedPhotoAlbum.map((photo, idx) => {
                  const isCurrentAvatar = editedAvatarUrl === photo.url;
                  
                  return (
                    <div key={idx} style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '120px', border: '1.5px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                      <img 
                        src={`${API_ORIGIN}${photo.url}`} 
                        alt={photo.caption} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      
                      {/* Set specific profile photo trigger */}
                      <button
                        type="button"
                        onClick={() => setEditedAvatarUrl(photo.url)}
                        title={isRtl ? 'تنظیم به عنوان عکس پروفایل اصلی' : 'Set as main profile avatar'}
                        style={{
                          position: 'absolute',
                          top: '0.35rem',
                          left: '0.35rem',
                          background: isCurrentAvatar ? 'var(--success)' : 'rgba(99, 102, 241, 0.85)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '26px',
                          height: '26px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'var(--shadow-sm)',
                          zIndex: 10,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isCurrentAvatar ? <Check size={14} /> : <User size={12} />}
                      </button>

                      {/* Remove photo */}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        style={{
                          position: 'absolute',
                          top: '0.35rem',
                          right: '0.35rem',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '26px',
                          height: '26px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <X size={14} />
                      </button>
                      
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.65rem', padding: '0.2rem 0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {photo.caption}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                {isRtl ? 'تصویری در آلبوم وجود ندارد.' : 'No images uploaded yet.'}
              </p>
            )}
          </div>

          {/* Action Buttons inside Edit Mode at bottom */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <button 
              onClick={handleSaveProfile} 
              className="btn btn-primary"
              disabled={saveLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#6366f1' }}
            >
              <Check size={18} />
              <span>{saveLoading ? '...' : t('save')}</span>
            </button>
            <button 
              onClick={() => {
                setIsEditing(false);
                setEditedBiography(profile?.biography || '');
                setEditedPhotoAlbum(profile?.photoAlbum || []);
                setEditedAvatarUrl(profile?.avatarUrl || '');
                setEditedTimelineEvents(profile?.timelineEvents || []);
              }} 
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <X size={18} />
              <span>{t('cancel')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Viewing State Album Swiper Carousel */}
      {!isEditing && (
        <div className="photo-album-section" style={{ marginTop: '4rem' }}>
          <h2 className="album-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <ImageIcon size={22} style={{ color: 'var(--success)' }} />
              {t('photo_album')}
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>
              {profile?.photoAlbum?.length || 0} {isRtl ? 'تصویر' : 'photos'}
            </span>
          </h2>

          {profile?.photoAlbum && profile.photoAlbum.length > 0 ? (
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={20}
              slidesPerView="auto"
              navigation
              pagination={{ clickable: true }}
              className="swiper-container-custom"
            >
              {profile.photoAlbum.map((photo, idx) => (
                <SwiperSlide key={idx} style={{ width: 'auto' }}>
                  <div className="swiper-slide-custom">
                    <img 
                      src={`${API_ORIGIN}${photo.url}`} 
                      alt={photo.caption} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {photo.caption && (
                      <div className="slide-caption-bar">
                        {photo.caption}
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div style={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.3)', 
              border: '1px dashed rgba(255, 255, 255, 0.08)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '3rem 2rem', 
              textAlign: 'center',
              color: 'var(--text-tertiary)' 
            }}>
              <ImageIcon size={40} style={{ display: 'block', margin: '0 auto 1rem', opacity: 0.5 }} />
              <span>{t('no_photos')}</span>
            </div>
          )}
        </div>
      )}
      
    </div>
  );
}

export default ProfileView;
