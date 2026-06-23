import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Filter, Heart, Gift, Briefcase, Award, Clock, Info, User 
} from 'lucide-react';
import { api, API_ORIGIN } from '../services/api';
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import gregorian from 'react-date-object/calendars/gregorian';
import persian_fa from 'react-date-object/locales/persian_fa';
import gregorian_en from 'react-date-object/locales/gregorian_en';

// Helper to determine event icons
const getEventIcon = (type) => {
  switch (type) {
    case 'birthday':
      return <Gift className="w-5 h-5 text-amber-400" />;
    case 'marriage':
      return <Heart className="w-5 h-5 text-pink-500" />;
    case 'death':
      return <span className="text-xl">🕊️</span>;
    case 'education':
      return <Award className="w-5 h-5 text-emerald-400" />;
    case 'career':
      return <Briefcase className="w-5 h-5 text-sky-400" />;
    default:
      return <Calendar className="w-5 h-5 text-indigo-400" />;
  }
};

function TreeCalendar() {
  const { treeId } = useParams();
  const { t, i18n } = useTranslation();
  const isFa = i18n.language === 'fa';

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [treeInfo, setTreeInfo] = useState(null);
  const [error, setError] = useState('');
  
  // Navigation tabs: 'upcoming' or 'chronological'
  const [activeTab, setActiveTab] = useState('upcoming');

  // Filters state
  const [filters, setFilters] = useState({
    birthday: true,
    marriage: true,
    death: true,
    others: true
  });

  useEffect(() => {
    fetchCalendarEvents();
  }, [treeId]);

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const treeRes = await api.tree.get(treeId);
      setTreeInfo(treeRes);

      const eventsData = await api.profile.getCalendar(treeId);
      setEvents(eventsData);
    } catch (err) {
      setError(err.message || 'Failed to load family calendar.');
    } finally {
      setLoading(false);
    }
  };

  // Anniversary calculation function utilizing react-date-object
  const getEventAnniversaryDetails = (gregDateStr) => {
    if (!gregDateStr) return null;

    const targetCalendar = isFa ? persian : gregorian;
    const targetLocale = isFa ? persian_fa : gregorian_en;

    try {
      // 1. Parse original Gregorian date and convert to target calendar
      const origDate = new DateObject({ date: gregDateStr, calendar: gregorian, locale: gregorian_en }).convert(targetCalendar, targetLocale);

      // 2. Get today's date in target calendar
      const today = new DateObject({ calendar: targetCalendar, locale: targetLocale });

      // 3. Construct anniversary in the current calendar year
      let anniversaryYear = today.year;
      const anniversaryDate = new DateObject({
        year: anniversaryYear,
        month: origDate.month,
        day: origDate.day,
        calendar: targetCalendar,
        locale: targetLocale
      });

      // 4. If the anniversary has already passed this calendar year, shift to next year
      anniversaryDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      const todayStart = new DateObject({ calendar: targetCalendar, locale: targetLocale }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

      if (anniversaryDate.valueOf() < todayStart.valueOf()) {
        anniversaryYear += 1;
        anniversaryDate.year = anniversaryYear;
      }

      // 5. Calculate days remaining
      const oneDayMs = 24 * 60 * 60 * 1000;
      const diffMs = anniversaryDate.valueOf() - todayStart.valueOf();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / oneDayMs));

      // 6. Years elapsed at the next anniversary
      const yearsElapsed = anniversaryYear - origDate.year;

      return {
        originalDateFormatted: origDate.format(isFa ? "YYYY/MM/DD" : "YYYY-MM-DD"),
        nextDateFormatted: anniversaryDate.format(isFa ? "YYYY/MM/DD" : "YYYY-MM-DD"),
        daysRemaining,
        yearsElapsed,
        origYear: origDate.year
      };
    } catch (e) {
      console.error("Anniversary calculation failed for date:", gregDateStr, e);
      return null;
    }
  };

  const getLocalizedEventName = (ev) => {
    const name = ev.personName || t('unnamed_person');
    switch (ev.type) {
      case 'birthday':
        return t('anniversary_birthday', { name });
      case 'marriage':
        return t('anniversary_marriage', { name });
      case 'death':
        return t('anniversary_death', { name });
      case 'education':
        return t('anniversary_education', { name });
      case 'career':
        return t('anniversary_career', { name });
      default:
        return t('anniversary_custom', { name });
    }
  };

  const toggleFilter = (type) => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Process and filter events
  const processedEvents = events
    .map(ev => {
      const details = getEventAnniversaryDetails(ev.date);
      return {
        ...ev,
        anniversary: details
      };
    })
    .filter(ev => {
      if (!ev.anniversary) return false;
      const isOther = !['birthday', 'marriage', 'death'].includes(ev.type);
      
      if (ev.type === 'birthday' && !filters.birthday) return false;
      if (ev.type === 'marriage' && !filters.marriage) return false;
      if (ev.type === 'death' && !filters.death) return false;
      if (isOther && !filters.others) return false;
      
      return true;
    });

  // Sort events based on the active tab
  const sortedEvents = [...processedEvents].sort((a, b) => {
    if (activeTab === 'upcoming') {
      // Sort upcoming by days remaining (ascending)
      return a.anniversary.daysRemaining - b.anniversary.daysRemaining;
    } else {
      // Sort all events chronologically by original year/month/day
      // Convert dates to valueOf of original DateObject
      const dateA = new DateObject({ date: a.date, calendar: gregorian }).valueOf();
      const dateB = new DateObject({ date: b.date, calendar: gregorian }).valueOf();
      return dateA - dateB;
    }
  });

  if (loading) {
    return (
      <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>
          {isFa ? 'در حال بارگذاری تقویم خاندان...' : 'Loading family calendar...'}
        </p>
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
    <div className="mesh-bg" style={{ minHeight: 'calc(100vh - 73px)', position: 'relative', overflow: 'hidden', paddingBottom: '6rem' }}>
      <div className="dark-grid"></div>

      <div className="layout-container" style={{ position: 'relative', zIndex: 2, paddingTop: '3rem' }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <motion.div
            initial={{ opacity: 0, x: isFa ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link to={`/tree/${treeId}`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem', textDecoration: 'none' }}>
              <ArrowLeft size={16} style={{ transform: isFa ? 'rotate(180deg)' : 'none' }} />
              <span>{t('back_to_tree')}</span>
            </Link>
            
            <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {t('calendar_title')}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '600px' }}>
              {t('calendar_subtitle')}
            </p>
          </motion.div>
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.8fr] gap-12 items-start">
          {/* Left Panel: Sidebar Filters */}
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <Filter size={18} style={{ color: 'var(--accent)' }} />
              <span>{isFa ? 'فیلتر رویدادها' : 'Event Filters'}</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <input 
                  type="checkbox" 
                  checked={filters.birthday} 
                  onChange={() => toggleFilter('birthday')} 
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                />
                <span>{t('filter_birthdays')}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <input 
                  type="checkbox" 
                  checked={filters.marriage} 
                  onChange={() => toggleFilter('marriage')} 
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                />
                <span>{t('filter_marriages')}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <input 
                  type="checkbox" 
                  checked={filters.death} 
                  onChange={() => toggleFilter('death')} 
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                />
                <span>{t('filter_deaths')}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <input 
                  type="checkbox" 
                  checked={filters.others} 
                  onChange={() => toggleFilter('others')} 
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                />
                <span>{t('filter_others')}</span>
              </label>
            </div>

            {/* Calendar mode descriptor */}
            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <Info size={16} className="text-indigo-400 shrink-0" />
              <span>
                {isFa 
                  ? 'بر اساس زبان فارسی سیستم، تقویم و محاسبات سالگردها به صورت شمسی نمایش داده می‌شوند.' 
                  : 'Based on your system language, calendar values and anniversary mappings are shown in Gregorian.'}
              </span>
            </div>
          </div>

          {/* Right Panel: Scrollable Timeline */}
          <div>
            {/* View Tabs */}
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              background: 'rgba(0, 0, 0, 0.2)', 
              padding: '0.25rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)',
              marginBottom: '2rem',
              width: 'fit-content'
            }}>
              <button
                onClick={() => setActiveTab('upcoming')}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  background: activeTab === 'upcoming' ? 'var(--accent)' : 'transparent',
                  color: activeTab === 'upcoming' ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                📅 {t('upcoming_anniversaries')}
              </button>
              <button
                onClick={() => setActiveTab('chronological')}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  background: activeTab === 'chronological' ? 'var(--accent)' : 'transparent',
                  color: activeTab === 'chronological' ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                ⏳ {t('all_timeline_events')}
              </button>
            </div>

            {/* Scrollable Timeline Stream */}
            <div className="timeline-wrapper" style={{ minHeight: '400px' }}>
              {sortedEvents.length > 0 ? (
                <div className="timeline-track">
                  {/* Vertical line indicator */}
                  <div className="timeline-line" style={{ insetInlineStart: '24px' }}></div>

                  <AnimatePresence mode="popLayout">
                    {sortedEvents.map((ev, idx) => {
                      const daysLeft = ev.anniversary.daysRemaining;
                      const hasPassed = daysLeft > 300; // Anniversary for this year has passed
                      const years = ev.anniversary.yearsElapsed;
                      
                      // Formatting countdown badge text
                      let countdownText = '';
                      if (daysLeft === 0) countdownText = t('days_remaining_today');
                      else if (daysLeft === 1) countdownText = t('days_remaining_tomorrow');
                      else countdownText = t('days_remaining_in_days', { count: daysLeft });

                      return (
                        <motion.div
                          key={ev.id}
                          layout
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.4) }}
                          className="timeline-item"
                          style={{ paddingInlineStart: '3.5rem', marginBottom: '2.5rem' }}
                        >
                          {/* Indicator Node Dot with Event Icon */}
                          <div 
                            className="timeline-node flex-center"
                            style={{ 
                              insetInlineStart: '14px', 
                              top: '12px', 
                              width: '24px', 
                              height: '24px', 
                              borderWidth: '2px',
                              background: 'var(--bg-primary)'
                            }}
                          >
                            <span style={{ transform: 'scale(0.85)', display: 'block' }}>
                              {ev.type === 'birthday' ? '🎂' : ev.type === 'marriage' ? '💍' : ev.type === 'death' ? '🕊️' : '✏️'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            {/* Date Badge Side panel */}
                            <div className="timeline-date-badge hidden md:block" style={{ top: '8px', minWidth: '110px', textAlign: 'center' }}>
                              {activeTab === 'upcoming' ? ev.anniversary.nextDateFormatted : ev.anniversary.originalDateFormatted}
                            </div>

                            {/* Content Detail Card */}
                            <Link 
                              to={`/tree/${treeId}/profile/${ev.personId}`}
                              className="timeline-content-card glass-card"
                              style={{ 
                                flexGrow: 1, 
                                minWidth: '250px', 
                                textDecoration: 'none', 
                                color: 'inherit',
                                display: 'flex',
                                gap: '1.25rem',
                                padding: '1.25rem 1.5rem',
                                alignItems: 'center'
                              }}
                            >
                              {/* Avatar Thumbnail */}
                              <div style={{ flexShrink: 0 }}>
                                {ev.personAvatar ? (
                                  <img 
                                    src={`${API_ORIGIN}${ev.personAvatar}`} 
                                    alt={ev.personName} 
                                    style={{
                                      width: '46px',
                                      height: '46px',
                                      borderRadius: '50%',
                                      objectFit: 'cover',
                                      border: `2px solid ${ev.personGender === 'M' ? '#38bdf8' : '#f472b6'}`
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '50%',
                                    backgroundColor: ev.personGender === 'M' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(244, 114, 182, 0.1)',
                                    color: ev.personGender === 'M' ? '#38bdf8' : '#f472b6',
                                    border: `2px solid ${ev.personGender === 'M' ? '#38bdf8' : '#f472b6'}44`,
                                    fontSize: '1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    {ev.personGender === 'M' ? '👨' : '👩'}
                                  </div>
                                )}
                              </div>

                              {/* Text Details */}
                              <div style={{ flexGrow: 1, minWidth: 0, textAlign: 'start' }}>
                                {/* Mobile Date Display */}
                                <div className="inline-block md:hidden text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full mb-1.5">
                                  {activeTab === 'upcoming' ? ev.anniversary.nextDateFormatted : ev.anniversary.originalDateFormatted}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <h4 style={{ color: 'var(--text-primary)', fontSize: '1.02rem', fontWeight: 700 }}>
                                    {getLocalizedEventName(ev)}
                                  </h4>

                                  {/* Milestone Anniversary Indicator Badge */}
                                  {years > 0 && (
                                    <span style={{ 
                                      fontSize: '0.75rem', 
                                      fontWeight: 700, 
                                      background: 'rgba(99, 102, 241, 0.15)', 
                                      color: '#818cf8', 
                                      padding: '0.15rem 0.5rem', 
                                      borderRadius: '99px',
                                      border: '1px solid rgba(99, 102, 241, 0.3)'
                                    }}>
                                      {t('anniversary_years', { count: years })}
                                    </span>
                                  )}
                                </div>

                                <h5 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  {getEventIcon(ev.type)}
                                  <span>{ev.title}</span>
                                </h5>

                                {ev.description && (
                                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.4rem', lineHeight: 1.5 }}>
                                    {ev.description}
                                  </p>
                                )}
                              </div>

                              {/* Countdown indicator badge for Upcoming anniversaries */}
                              {activeTab === 'upcoming' && (
                                <div style={{ flexShrink: 0, textAlign: 'end' }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '99px',
                                    backgroundColor: daysLeft === 0 ? 'rgba(16, 185, 129, 0.15)' : daysLeft === 1 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                    color: daysLeft === 0 ? 'var(--success)' : daysLeft === 1 ? 'var(--warning)' : 'var(--text-secondary)',
                                    border: daysLeft === 0 ? '1px solid rgba(16, 185, 129, 0.3)' : daysLeft === 1 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-color)'
                                  }}>
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{countdownText}</span>
                                  </span>
                                </div>
                              )}
                            </Link>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                /* No Events placeholder */
                <div style={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  border: '1px dashed var(--border-color)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '5rem 2rem', 
                  textAlign: 'center',
                  color: 'var(--text-tertiary)' 
                }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📅</span>
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    {t('no_events_found')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TreeCalendar;
