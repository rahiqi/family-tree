import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, X, Clock } from 'lucide-react';
import { Calendar } from 'react-multi-date-picker';
import DateObject from 'react-date-object';

import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";
import gregorian_fa from "react-date-object/locales/gregorian_fa";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import persian_en from "react-date-object/locales/persian_en";

export default function DatePicker({ value, onChange, placeholder, className = '', label, disabled, inline }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'fa';
  
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  // 'jalali' or 'gregorian'
  const [calendarMode, setCalendarMode] = useState(isRtl ? 'jalali' : 'gregorian');

  // Sync calendar mode with system locale when it changes
  useEffect(() => {
    setCalendarMode(isRtl ? 'jalali' : 'gregorian');
  }, [isRtl]);

  const calendar = calendarMode === 'jalali' ? persian : gregorian;
  const locale = calendarMode === 'jalali'
    ? (i18n.language === 'fa' ? persian_fa : persian_en)
    : (i18n.language === 'fa' ? gregorian_fa : gregorian_en);

  // Helper to parse Gregorian YYYY-MM-DD string to DateObject
  const parseGregorianDate = (valStr) => {
    if (!valStr) return null;
    const parts = valStr.split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return new DateObject({
      year: y,
      month: m,
      day: d,
      calendar: gregorian,
      locale: gregorian_en
    });
  };

  // Convert the current value to the target calendar/locale for the DatePicker
  const calendarValue = value ? parseGregorianDate(value)?.convert(calendar, locale) : null;

  // Format the selected date for display
  const getDisplayValue = () => {
    if (!value) return '';
    const parsed = parseGregorianDate(value);
    if (!parsed) return '';
    const displayObj = parsed.convert(calendar, locale);
    return displayObj.format(calendarMode === 'jalali' ? "YYYY/MM/DD" : "YYYY-MM-DD");
  };

  const handleDateChange = (dateObj) => {
    if (!dateObj) {
      onChange('');
      return;
    }
    // Convert selected dateObject back to Gregorian for backend storage
    const gregDate = dateObj.convert(gregorian, gregorian_en);
    const formatted = gregDate.format("YYYY-MM-DD");
    onChange(formatted);
    if (!inline) {
      setIsOpen(false);
    }
  };

  const handleSelectToday = () => {
    const today = new DateObject({ calendar: gregorian, locale: gregorian_en });
    const formatted = today.format("YYYY-MM-DD");
    onChange(formatted);
    if (!inline) {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange('');
    if (!inline) {
      setIsOpen(false);
    }
  };

  // Click outside handler for popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (event.target.closest('.rmdp-calendar') || event.target.closest('.rmdp-wrapper') || event.target.closest('.rmdp-calendar-container')) {
          return;
        }
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

  // Styles matching the premium glassmorphic UI
  const mainStyle = {
    position: 'relative',
    width: '100%',
    direction: isRtl ? 'rtl' : 'ltr',
    fontFamily: isRtl ? 'var(--font-fa)' : 'var(--font-en)'
  };

  const triggerInputStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: isOpen ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    boxShadow: isOpen ? 'var(--accent-glow) 0px 0px 12px' : 'none',
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
    width: inline ? '100%' : 'auto',
    borderRadius: inline ? '0' : 'var(--radius-md)',
    background: inline ? 'transparent' : 'var(--bg-secondary)',
    border: inline ? 'none' : '1px solid var(--border-color)',
    boxShadow: inline ? 'none' : 'var(--shadow-lg)',
    padding: inline ? '0' : '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  };

  const renderCalendarContent = () => (
    <div style={popoverStyle} className="datepicker-popover">
      {/* Calendar Mode Toggles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        padding: '0.2rem',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-color)',
        fontSize: '0.75rem',
        marginBottom: '0.25rem'
      }} className="calendar-mode-toggles">
        <button
          type="button"
          onClick={() => setCalendarMode('jalali')}
          style={{
            padding: '0.35rem 0',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500',
            background: calendarMode === 'jalali' ? 'var(--accent)' : 'transparent',
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
            background: calendarMode === 'gregorian' ? 'var(--accent)' : 'transparent',
            color: calendarMode === 'gregorian' ? 'white' : 'var(--text-secondary)',
            transition: 'all 0.2s ease'
          }}
        >
          {isRtl ? 'میلادی (Gregorian)' : 'Gregorian'}
        </button>
      </div>

      {/* Robust Calendar from react-multi-date-picker */}
      <Calendar
        value={calendarValue}
        onChange={handleDateChange}
        calendar={calendar}
        locale={locale}
        className="custom-treely-calendar"
      />

      {/* Calendar Actions Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '0.5rem',
        fontSize: '0.75rem',
        marginTop: '0.25rem'
      }}>
        <button
          type="button"
          onClick={handleSelectToday}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.3rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-light)',
            border: '1px solid var(--border-color)',
            color: 'var(--accent)',
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
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                background: 'rgba(239, 68, 68, 0.05)',
                color: 'var(--danger)',
                cursor: 'pointer'
              }}
            >
              {isRtl ? 'حذف' : 'Clear'}
            </button>
          )}
          {!inline && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {isRtl ? 'بستن' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (inline) {
    return (
      <div style={{ direction: isRtl ? 'rtl' : 'ltr', fontFamily: isRtl ? 'var(--font-fa)' : 'var(--font-en)', width: '100%' }}>
        {renderCalendarContent()}
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
          <CalendarIcon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        </div>
      </div>

      {isOpen && renderCalendarContent()}
    </div>
  );
}
