import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { 
  toJalaali, 
  toGregorian, 
  jalaaliMonthLength, 
  gregorianMonthLength, 
  isJalaaliLeap, 
  isGregorianLeap,
  toPersianDigits
} from '../utils/dateUtils';

const JALALI_MONTH_NAMES_FA = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const JALALI_MONTH_NAMES_EN = [
  'Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar',
  'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'
];

const GREGORIAN_MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const GREGORIAN_MONTH_NAMES_FA = [
  'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
  'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'
];

const JALALI_WEEKDAYS_FA = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const JALALI_WEEKDAYS_EN = ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'];

const GREGORIAN_WEEKDAYS_FA = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'];
const GREGORIAN_WEEKDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePicker({ value, onChange, placeholder, className = '', label, disabled, inline }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'fa';
  
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  // 'jalali' or 'gregorian'
  const [calendarMode, setCalendarMode] = useState(isRtl ? 'jalali' : 'gregorian');
  
  // Current view state
  const [viewYear, setViewYear] = useState(1405);
  const [viewMonth, setViewMonth] = useState(3); // 1-indexed

  // Today's date calculations
  const today = new Date();
  const todayGy = today.getFullYear();
  const todayGm = today.getMonth() + 1;
  const todayGd = today.getDate();
  const todayJ = toJalaali(todayGy, todayGm, todayGd);

  // Initialize view state based on selected value
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const gy = parseInt(parts[0], 10);
        const gm = parseInt(parts[1], 10);
        const gd = parseInt(parts[2], 10);
        
        if (!isNaN(gy) && !isNaN(gm) && !isNaN(gd)) {
          if (calendarMode === 'jalali') {
            const jRes = toJalaali(gy, gm, gd);
            setViewYear(jRes.jy);
            setViewMonth(jRes.jm);
          } else {
            setViewYear(gy);
            setViewMonth(gm);
          }
          return;
        }
      }
    }

    // Default to today
    if (calendarMode === 'jalali') {
      setViewYear(todayJ.jy);
      setViewMonth(todayJ.jm);
    } else {
      setViewYear(todayGy);
      setViewMonth(todayGm);
    }
  }, [value, calendarMode]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen && !inline) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, inline]);

  // Parse current value
  let selectedGy = null, selectedGm = null, selectedGd = null;
  let selectedJy = null, selectedJm = null, selectedJd = null;
  
  if (value) {
    const parts = value.split('-');
    if (parts.length === 3) {
      selectedGy = parseInt(parts[0], 10);
      selectedGm = parseInt(parts[1], 10);
      selectedGd = parseInt(parts[2], 10);
      
      if (!isNaN(selectedGy) && !isNaN(selectedGm) && !isNaN(selectedGd)) {
        const jRes = toJalaali(selectedGy, selectedGm, selectedGd);
        selectedJy = jRes.jy;
        selectedJm = jRes.jm;
        selectedJd = jRes.jd;
      }
    }
  }

  // Display value text
  const getDisplayValue = () => {
    if (!value || !selectedGy) return '';
    if (isRtl) {
      // Show Farsi Jalali
      const jRes = toJalaali(selectedGy, selectedGm, selectedGd);
      return toPersianDigits(`${jRes.jy}/${String(jRes.jm).padStart(2, '0')}/${String(jRes.jd).padStart(2, '0')}`);
    } else {
      // Show English Gregorian
      return `${selectedGy}-${String(selectedGm).padStart(2, '0')}-${String(selectedGd).padStart(2, '0')}`;
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (day) => {
    let gy, gm, gd;
    if (calendarMode === 'jalali') {
      const gRes = toGregorian(viewYear, viewMonth, day);
      gy = gRes.gy;
      gm = gRes.gm;
      gd = gRes.gd;
    } else {
      gy = viewYear;
      gm = viewMonth;
      gd = day;
    }
    
    const formatted = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const formatted = `${todayGy}-${String(todayGm).padStart(2, '0')}-${String(todayGd).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  // Build grid data
  const days = [];
  let weekdayHeaders = [];
  
  if (calendarMode === 'jalali') {
    weekdayHeaders = isRtl ? JALALI_WEEKDAYS_FA : JALALI_WEEKDAYS_EN;
    
    // Find week day index of 1st day of Jalali month
    const gFirst = toGregorian(viewYear, viewMonth, 1);
    const dateFirst = new Date(gFirst.gy, gFirst.gm - 1, gFirst.gd);
    const dayOfWeek = dateFirst.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    const padding = (dayOfWeek + 1) % 7; // Jalali week starts on Saturday (idx 0)
    
    const monthLen = jalaaliMonthLength(viewYear, viewMonth);
    
    // Previous month length for padding values
    const prevMonth = viewMonth === 1 ? 12 : viewMonth - 1;
    const prevYear = viewMonth === 1 ? viewYear - 1 : viewYear;
    const prevMonthLen = jalaaliMonthLength(prevYear, prevMonth);

    // Padding from previous month
    for (let i = padding - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLen - i,
        isCurrentMonth: false,
        year: prevYear,
        month: prevMonth
      });
    }
    
    // Current month days
    for (let d = 1; d <= monthLen; d++) {
      days.push({
        day: d,
        isCurrentMonth: true,
        year: viewYear,
        month: viewMonth
      });
    }
    
    // Padding for next month
    const remaining = 42 - days.length; // standard 6-week grid
    const nextMonth = viewMonth === 12 ? 1 : viewMonth + 1;
    const nextYear = viewMonth === 12 ? viewYear + 1 : viewYear;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        day: d,
        isCurrentMonth: false,
        year: nextYear,
        month: nextMonth
      });
    }
  } else {
    // Gregorian calendar
    weekdayHeaders = isRtl ? GREGORIAN_WEEKDAYS_FA : GREGORIAN_WEEKDAYS_EN;
    
    const dateFirst = new Date(viewYear, viewMonth - 1, 1);
    const padding = dateFirst.getDay(); // 0 = Sunday, 1 = Monday, ...
    
    const monthLen = gregorianMonthLength(viewYear, viewMonth);
    
    // Previous month length
    const prevMonth = viewMonth === 1 ? 12 : viewMonth - 1;
    const prevYear = viewMonth === 1 ? viewYear - 1 : viewYear;
    const prevMonthLen = gregorianMonthLength(prevYear, prevMonth);

    // Padding from previous month
    for (let i = padding - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLen - i,
        isCurrentMonth: false,
        year: prevYear,
        month: prevMonth
      });
    }
    
    // Current month days
    for (let d = 1; d <= monthLen; d++) {
      days.push({
        day: d,
        isCurrentMonth: true,
        year: viewYear,
        month: viewMonth
      });
    }
    
    // Padding for next month
    const remaining = 42 - days.length;
    const nextMonth = viewMonth === 12 ? 1 : viewMonth + 1;
    const nextYear = viewMonth === 12 ? viewYear + 1 : viewYear;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        day: d,
        isCurrentMonth: false,
        year: nextYear,
        month: nextMonth
      });
    }
  }

  // Generate lists for Year and Month selectors
  const yearsList = [];
  if (calendarMode === 'jalali') {
    const currentJYear = todayJ.jy;
    for (let y = currentJYear + 5; y >= 1300; y--) {
      yearsList.push(y);
    }
  } else {
    const currentGYear = todayGy;
    for (let y = currentGYear + 5; y >= 1900; y--) {
      yearsList.push(y);
    }
  }

  const monthsList = calendarMode === 'jalali'
    ? (isRtl ? JALALI_MONTH_NAMES_FA : JALALI_MONTH_NAMES_EN)
    : (isRtl ? GREGORIAN_MONTH_NAMES_FA : GREGORIAN_MONTH_NAMES_EN);

  // Check if a day is today
  const isToday = (dayObj) => {
    if (calendarMode === 'jalali') {
      return dayObj.isCurrentMonth && 
             dayObj.year === todayJ.jy && 
             dayObj.month === todayJ.jm && 
             dayObj.day === todayJ.jd;
    } else {
      return dayObj.isCurrentMonth && 
             dayObj.year === todayGy && 
             dayObj.month === todayGm && 
             dayObj.day === todayGd;
    }
  };

  // Check if a day is selected
  const isSelected = (dayObj) => {
    if (!value) return false;
    if (calendarMode === 'jalali') {
      return dayObj.isCurrentMonth && 
             dayObj.year === selectedJy && 
             dayObj.month === selectedJm && 
             dayObj.day === selectedJd;
    } else {
      return dayObj.isCurrentMonth && 
             dayObj.year === selectedGy && 
             dayObj.month === selectedGm && 
             dayObj.day === selectedGd;
    }
  };

  // High fidelity styles
  const mainStyle = {
    position: 'relative',
    width: '100%',
    direction: isRtl ? 'rtl' : 'ltr',
    fontFamily: 'Vazirmatn, sans-serif'
  };

  const triggerInputStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: isOpen ? '1.5px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
    background: isOpen ? 'rgba(30, 41, 59, 0.6)' : 'rgba(15, 23, 42, 0.4)',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    boxShadow: isOpen ? '0 0 12px rgba(99, 102, 241, 0.2)' : 'none',
    transition: 'all 0.2s ease',
    outline: 'none',
    userSelect: 'none'
  };

  const popoverStyle = {
    position: inline ? 'relative' : 'absolute',
    top: inline ? 'auto' : '100%',
    marginTop: inline ? '0' : '0.4rem',
    [isRtl ? 'right' : 'left']: inline ? 'auto' : '0',
    zIndex: inline ? 'auto' : 9999,
    width: inline ? '100%' : '310px',
    borderRadius: inline ? '0' : 'var(--radius-md)',
    border: inline ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
    background: inline ? 'transparent' : 'rgba(8, 12, 24, 0.97)',
    backdropFilter: inline ? 'none' : 'blur(16px)',
    boxShadow: inline ? 'none' : '0 20px 40px rgba(0, 0, 0, 0.6)',
    padding: inline ? '0' : '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  };

  // Render pure calendar content if inline is active
  if (inline) {
    return (
      <div style={{ direction: isRtl ? 'rtl' : 'ltr', fontFamily: 'Vazirmatn, sans-serif', width: '100%' }}>
        <div style={popoverStyle} className="datepicker-popover">
          {/* Calendar Mode Toggles */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            padding: '0.2rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.75rem'
          }}>
            <button
              type="button"
              onClick={() => setCalendarMode('jalali')}
              style={{
                padding: '0.35rem 0',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                background: calendarMode === 'jalali' ? '#6366f1' : 'transparent',
                color: calendarMode === 'jalali' ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
            >
              {isRtl ? 'خورشیدی (شمسی)' : 'Solar (Jalali)'}
            </button>
            <button
              type="button"
              onClick={() => setCalendarMode('gregorian')}
              style={{
                padding: '0.35rem 0',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                background: calendarMode === 'gregorian' ? '#6366f1' : 'transparent',
                color: calendarMode === 'gregorian' ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
            >
              {isRtl ? 'میلادی (Gregorian)' : 'Gregorian'}
            </button>
          </div>

          {/* Selectors header for fast navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                padding: '0.35rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {isRtl ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexGrow: 1, justifyContent: 'center' }}>
              {/* Month Dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                style={{
                  background: '#090d16',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  padding: '0.2rem 0.4rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {monthsList.map((mName, idx) => (
                  <option key={idx} value={idx + 1}>{mName}</option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                style={{
                  background: '#090d16',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  padding: '0.2rem 0.4rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {yearsList.map((yr) => (
                  <option key={yr} value={yr}>
                    {isRtl ? toPersianDigits(yr) : yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                padding: '0.35rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Weekdays indicator */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            fontSize: '0.65rem',
            fontWeight: '700',
            color: 'var(--text-tertiary)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            paddingBottom: '0.25rem'
          }}>
            {weekdayHeaders.map((day, idx) => (
              <div key={idx} style={{ padding: '0.2rem 0' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
            textAlign: 'center',
            fontSize: '0.75rem'
          }}>
            {days.map((dayObj, idx) => {
              const active = isSelected(dayObj);
              const isTdy = isToday(dayObj);
              const currentMonth = dayObj.isCurrentMonth;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(dayObj.day)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '500',
                    border: isTdy ? '1px solid #6366f1' : 'none',
                    background: active 
                      ? '#6366f1' 
                      : (isTdy ? 'rgba(99,102,241,0.05)' : 'transparent'),
                    color: active 
                      ? 'white' 
                      : (!currentMonth 
                          ? 'rgba(255,255,255,0.15)' 
                          : (isTdy ? '#818cf8' : 'var(--text-primary)')),
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  className="day-btn"
                >
                  {isRtl ? toPersianDigits(dayObj.day) : dayObj.day}
                </button>
              );
            })}
          </div>

          {/* Calendar actions footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: '0.5rem',
            fontSize: '0.7rem',
            marginTop: '0.2rem'
          }}>
            <button
              type="button"
              onClick={handleSelectToday}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '3px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              <Clock className="w-3.5 h-3.5" />
              {isRtl ? 'امروز' : 'Today'}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '3px',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    background: 'rgba(239, 68, 68, 0.05)',
                    color: '#f87171',
                    cursor: 'pointer'
                  }}
                >
                  {isRtl ? 'حذف' : 'Clear'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={mainStyle} className={className} ref={containerRef}>
      {label && (
        <label className="form-label" style={{ marginBottom: '0.4rem', display: 'block' }}>
          {label}
        </label>
      )}
      
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={triggerInputStyle}
        className="datepicker-trigger"
      >
        <span style={{ color: getDisplayValue() ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
          {getDisplayValue() || placeholder || (isRtl ? 'انتخاب تاریخ...' : 'Select date...')}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {value && !disabled && (
            <span 
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.2rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'var(--text-secondary)'
              }}
              className="hover-bg-danger"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <Calendar className="w-4 h-4" style={{ color: '#6366f1' }} />
        </div>
      </div>

      {isOpen && (
        <>
          {/* Calendar Picker Panel */}
          <div style={popoverStyle} className="datepicker-popover">
            
            {/* Calendar Mode Toggles */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              padding: '0.2rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '0.75rem'
            }}>
              <button
                type="button"
                onClick={() => setCalendarMode('jalali')}
                style={{
                  padding: '0.35rem 0',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  background: calendarMode === 'jalali' ? '#6366f1' : 'transparent',
                  color: calendarMode === 'jalali' ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isRtl ? 'خورشیدی (شمسی)' : 'Solar (Jalali)'}
              </button>
              <button
                type="button"
                onClick={() => setCalendarMode('gregorian')}
                style={{
                  padding: '0.35rem 0',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  background: calendarMode === 'gregorian' ? '#6366f1' : 'transparent',
                  color: calendarMode === 'gregorian' ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isRtl ? 'میلادی (Gregorian)' : 'Gregorian'}
              </button>
            </div>

            {/* Selectors header for fast navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handlePrevMonth}
                style={{
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(255,255,255,0.02)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {isRtl ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexGrow: 1, justifyContent: 'center' }}>
                {/* Month Dropdown */}
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                  style={{
                    background: '#090d16',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '4px',
                    padding: '0.2rem 0.4rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {monthsList.map((mName, idx) => (
                    <option key={idx} value={idx + 1}>{mName}</option>
                  ))}
                </select>

                {/* Year Dropdown */}
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                  style={{
                    background: '#090d16',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '4px',
                    padding: '0.2rem 0.4rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {yearsList.map((yr) => (
                    <option key={yr} value={yr}>
                      {isRtl ? toPersianDigits(yr) : yr}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                style={{
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(255,255,255,0.02)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Weekdays indicator */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              fontSize: '0.65rem',
              fontWeight: '700',
              color: 'var(--text-tertiary)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              paddingBottom: '0.25rem'
            }}>
              {weekdayHeaders.map((day, idx) => (
                <div key={idx} style={{ padding: '0.2rem 0' }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px',
              textAlign: 'center',
              fontSize: '0.75rem'
            }}>
              {days.map((dayObj, idx) => {
                const active = isSelected(dayObj);
                const isTdy = isToday(dayObj);
                const currentMonth = dayObj.isCurrentMonth;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(dayObj.day)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '500',
                      border: isTdy ? '1px solid #6366f1' : 'none',
                      background: active 
                        ? '#6366f1' 
                        : (isTdy ? 'rgba(99,102,241,0.05)' : 'transparent'),
                      color: active 
                        ? 'white' 
                        : (!currentMonth 
                            ? 'rgba(255,255,255,0.15)' 
                            : (isTdy ? '#818cf8' : 'var(--text-primary)')),
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    className="day-btn"
                  >
                    {isRtl ? toPersianDigits(dayObj.day) : dayObj.day}
                  </button>
                );
              })}
            </div>

            {/* Calendar actions footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: '0.5rem',
              fontSize: '0.7rem',
              marginTop: '0.2rem'
            }}>
              <button
                type="button"
                onClick={handleSelectToday}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '3px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  color: '#818cf8',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                <Clock className="w-3.5 h-3.5" />
                {isRtl ? 'امروز' : 'Today'}
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {value && (
                  <button
                    type="button"
                    onClick={handleClear}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '3px',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      background: 'rgba(239, 68, 68, 0.05)',
                      color: '#f87171',
                      cursor: 'pointer'
                    }}
                  >
                    {isRtl ? 'حذف' : 'Clear'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '3px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {isRtl ? 'بستن' : 'Close'}
                </button>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
