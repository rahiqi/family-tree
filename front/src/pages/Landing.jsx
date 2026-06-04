import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Users, Eye, Globe, ChevronRight, ArrowRight, GitMerge, Shield, Compass, Calendar } from 'lucide-react';

function Landing() {
  const { t, i18n } = useTranslation();
  const [hoveredNode, setHoveredNode] = useState(null);

  const isRtl = i18n.language === 'fa';

  // Demo interactive tree nodes
  const demoNodes = [
    { 
      id: 'gp', 
      name: isRtl ? 'آرش (پدربزرگ)' : 'Arash (Grandparent)', 
      date: isRtl ? '۱۳۲۰ - ۱۳۷۷' : '1941 - 1998', 
      x: 400, 
      y: 60, 
      gender: 'M',
      info: isRtl ? 'بنیان‌گذار شجره‌نامه، متولد شیراز' : 'Family founder, born in Shiraz'
    },
    { 
      id: 'f', 
      name: isRtl ? 'بابک (پدر)' : 'Babak (Father)', 
      date: isRtl ? '۱۳۳۴ - اکنون' : '1955 - Present', 
      x: 250, 
      y: 160, 
      gender: 'M',
      info: isRtl ? 'مهندس معمار، علاقه‌مند به خطاطی' : 'Architect, passion for calligraphy'
    },
    { 
      id: 'm', 
      name: isRtl ? 'سارا (مادر)' : 'Sarah (Mother)', 
      date: isRtl ? '۱۳۳۹ - اکنون' : '1960 - Present', 
      x: 550, 
      y: 160, 
      gender: 'F',
      info: isRtl ? 'پزشک اطفال، نویسنده کتاب کودک' : 'Pediatrician, children books author'
    },
    { 
      id: 'c1', 
      name: isRtl ? 'دارا (فرزند)' : 'Dara (Child 1)', 
      date: isRtl ? '۱۳۶۷ - اکنون' : '1988 - Present', 
      x: 250, 
      y: 280, 
      gender: 'M',
      info: isRtl ? 'عکاس طبیعت، ساکن تورنتو' : 'Nature photographer, lives in Toronto'
    },
    { 
      id: 'c2', 
      name: isRtl ? 'سیمین (فرزند)' : 'Simin (Child 2)', 
      date: isRtl ? '۱۳۷۱ - اکنون' : '1992 - Present', 
      x: 550, 
      y: 280, 
      gender: 'F',
      info: isRtl ? 'مترجم زبان، علاقه‌مند به نوازندگی' : 'Translator, amateur musician'
    }
  ];

  return (
    <div className="mesh-bg" style={{ minHeight: 'calc(100vh - 73px)', position: 'relative', overflow: 'hidden' }}>
      <div className="dark-grid"></div>

      {/* Decorative ambient light pools */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '15%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, rgba(6, 182, 212, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      <div className="layout-container" style={{ position: 'relative', zIndex: 2, paddingTop: '4rem', paddingBottom: '6rem' }}>
        
        {/* Hero Banner Header */}
        <section className="hero-section" style={{ padding: '2rem 0 4rem', zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '0.5rem 1.25rem',
              borderRadius: '99px',
              color: '#818cf8',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '2rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
            }}>
              <span>✨</span>
              <span>{isRtl ? 'نسخه دوم پلتفرم مدیریت شجره‌نامه تریلی' : 'Treely V2 Family Tree SaaS is live'}</span>
            </div>

            <h1 className="hero-title text-gradient" style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {t('slogan')}
            </h1>
            
            <p className="hero-subtitle" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginTop: '1.5rem', marginBottom: '2.5rem', maxWidth: '640px', lineHeight: 1.6 }}>
              {t('landing_tagline')}
            </p>

            <div className="flex-center gap-1" style={{ flexWrap: 'wrap' }}>
              <Link to="/auth/register" className="btn btn-primary" style={{ padding: '0.9rem 2.25rem', fontSize: '1rem', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 0 20px rgba(99, 102, 241, 0.35)' }}>
                <span>{t('get_started')}</span>
                <ArrowRight size={18} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
              </Link>
              <Link to="/auth/login" className="btn btn-secondary" style={{ padding: '0.9rem 2.25rem', fontSize: '1rem' }}>
                <span>{t('login')}</span>
              </Link>
            </div>
          </motion.div>

          {/* Interactive Floating Preview Tree */}
          <motion.div
            className="hero-tree-preview glass-card"
            style={{ 
              width: '100%', 
              maxWidth: '900px', 
              height: '420px', 
              marginTop: '4rem',
              borderRadius: '24px',
              background: 'rgba(11, 18, 32, 0.4)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg), 0 0 40px rgba(99, 102, 241, 0.05)'
            }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <div style={{ position: 'absolute', top: '1.25rem', insetInlineStart: '1.5rem', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 10 }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981' }}></span>
              <span>{isRtl ? 'پیش‌نمایش تعاملی زنده شجره‌نامه' : 'Live Interactive Demo Canvas'}</span>
            </div>

            {/* Active Hover Node Context Drawer */}
            <AnimatePresence>
              {hoveredNode && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{
                    position: 'absolute',
                    bottom: '1.5rem',
                    insetInlineStart: '1.5rem',
                    background: 'rgba(3, 7, 18, 0.85)',
                    backdropFilter: 'blur(12px)',
                    border: `1.5px solid ${hoveredNode.gender === 'M' ? '#38bdf8' : '#f472b6'}55`,
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    width: '260px',
                    zIndex: 20,
                    boxShadow: 'var(--shadow-md)',
                    textAlign: 'start'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: hoveredNode.gender === 'M' ? '#38bdf8' : '#f472b6', fontWeight: 700, marginBottom: '0.25rem' }}>
                    {hoveredNode.gender === 'M' ? (isRtl ? 'عضو مرد 👨' : 'MALE MEMBER 👨') : (isRtl ? 'عضو زن 👩' : 'FEMALE MEMBER 👩')}
                  </div>
                  <h4 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 700 }}>{hoveredNode.name}</h4>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '0.15rem' }}>📅 {hoveredNode.date}</p>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '0.5rem', paddingTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {hoveredNode.info}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SVG Flow Canvas */}
            <svg width="100%" height="100%" viewBox="0 0 800 420" className="family-chart-svg" style={{ padding: '2rem' }}>
              <defs>
                <linearGradient id="link-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Glowing Dynamic Lines */}
              <path d="M 400,60 L 400,120" stroke="url(#link-grad)" strokeWidth="2.5" strokeDasharray="6,4" />
              <path d="M 250,160 L 550,160" stroke="url(#link-grad)" strokeWidth="2.5" />
              <path d="M 250,160 L 250,220" stroke="url(#link-grad)" strokeWidth="2.5" />
              <path d="M 550,160 L 550,220" stroke="url(#link-grad)" strokeWidth="2.5" />
              <path d="M 400,120 L 400,280" stroke="url(#link-grad)" strokeWidth="2" strokeDasharray="4,4" />
              <path d="M 400,280 L 250,280" stroke="url(#link-grad)" strokeWidth="2" />

              {/* Draw Nodes dynamically */}
              {demoNodes.map((node) => {
                const isMale = node.gender === 'M';
                const accent = isMale ? '#38bdf8' : '#f472b6';
                const bg = isMale ? 'rgba(56, 189, 248, 0.08)' : 'rgba(244, 114, 182, 0.08)';
                const isHovered = hoveredNode?.id === node.id;

                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Shadow node glow on hover */}
                    {isHovered && (
                      <motion.rect
                        x="-85"
                        y="-30"
                        width="170"
                        height="60"
                        rx="12"
                        fill="none"
                        stroke={accent}
                        strokeWidth="5"
                        style={{ filter: `blur(8px)`, opacity: 0.6 }}
                        layoutId="glow-hover"
                      />
                    )}

                    <rect 
                      x="-80" 
                      y="-25" 
                      width="160" 
                      height="50" 
                      rx="10" 
                      fill={isHovered ? 'rgba(15, 23, 42, 0.85)' : bg} 
                      stroke={accent} 
                      strokeWidth={isHovered ? '2.5' : '1.5'} 
                      style={{ transition: 'all 0.3s ease' }}
                    />
                    <text 
                      x="0" 
                      y="-2" 
                      textAnchor="middle" 
                      fill="#f8fafc" 
                      fontSize="12" 
                      fontWeight="600"
                    >
                      {node.name.split(' ')[0]}
                    </text>
                    <text 
                      x="0" 
                      y="14" 
                      textAnchor="middle" 
                      fill="var(--text-secondary)" 
                      fontSize="10" 
                      fontWeight="500"
                    >
                      {node.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          </motion.div>
        </section>

        {/* Feature Cards Grid */}
        <section style={{ borderTop: '1px solid var(--border-color)', marginTop: '4rem', paddingTop: '4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>
              {isRtl ? 'امکانات بی‌نظیر برای کشف و ثبت شجره‌نامه' : 'Powerful Features for Visualizing Lineage'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', fontSize: '1rem' }}>
              {isRtl ? 'تریلی ابزارهای پیشرفته‌ای را برای ارتباط با پیشینه خانوادگی شما فراهم می‌کند.' : 'Discover, preserve, and collaborate on your family story in high definition.'}
            </p>
          </div>

          <div className="features-grid">
            <motion.div 
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                backgroundColor: 'rgba(99, 102, 241, 0.15)', 
                color: '#818cf8', 
                display: 'flex', 
                alignItems: 'center', 
                justifycontent: 'center', 
                marginBottom: '1.5rem',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.15)'
              }} className="flex-center">
                <GitMerge size={24} />
              </div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', color: '#f8fafc', fontWeight: 700 }}>
                {isRtl ? 'رابط کاربری شجره‌نامه تعاملی' : 'Interactive Family Engine'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.92rem' }}>
                {isRtl 
                  ? 'با کشیدن و رها کردن ساده، گره‌های روابط پدر و مادری و همسری را به صورت زنده پیوند دهید و مدیریت کنید.' 
                  : 'Add relatives, link parents, spouses, or children immediately inside a high-performance interactive layout.'}
              </p>
            </motion.div>

            <motion.div 
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                backgroundColor: 'rgba(6, 182, 212, 0.15)', 
                color: '#22d3ee', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1.5rem',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.15)'
              }} className="flex-center">
                <Users size={24} />
              </div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', color: '#f8fafc', fontWeight: 700 }}>
                {isRtl ? 'همکاری تیمی و اشتراک‌گذاری' : 'Collaborative Workspace'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.92rem' }}>
                {isRtl 
                  ? 'اعضای فامیل را به عنوان مالک، ویرایشگر یا بیننده دعوت کنید تا با هم شجره‌نامه را کامل کنید.' 
                  : 'Invite cousins, siblings, or parents to contribute to editing profiles and adding shared visual memory archives.'}
              </p>
            </motion.div>

            <motion.div 
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                backgroundColor: 'rgba(16, 185, 129, 0.15)', 
                color: '#34d399', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1.5rem',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)'
              }} className="flex-center">
                <Globe size={24} />
              </div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', color: '#f8fafc', fontWeight: 700 }}>
                {isRtl ? 'طراحی دوزبانه بومی (فارسی/انگلیسی)' : 'Native Bilingual & RTL'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.92rem' }}>
                {isRtl 
                  ? 'تغییر کامل چیدمان صفحات به صورت راست‌چین (RTL) و چپ‌چین (LTR) برای ثبت اطلاعات بین‌المللی.' 
                  : 'Flawless logical alignments dynamically shifting structures between right-to-left Persian and left-to-right English.'}
              </p>
            </motion.div>

            <motion.div 
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                color: '#f87171', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1.5rem',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.15)'
              }} className="flex-center">
                <Shield size={24} />
              </div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', color: '#f8fafc', fontWeight: 700 }}>
                {isRtl ? 'امنیت و حریم خصوصی پیشرفته' : 'Secure Permissions'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.92rem' }}>
                {isRtl 
                  ? 'سیستم کنترل دسترسی نقش‌محور (RBAC) تضمین می‌کند فقط افراد مجاز درخت شما را ببینند یا ویرایش کنند.' 
                  : 'Role-based authorization checks visitor/editor privileges before releasing profile and tree configurations.'}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Onboarding Timeline teaser */}
        <section style={{ borderTop: '1px solid var(--border-color)', marginTop: '4rem', paddingTop: '4rem', textAlign: 'start' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }} className="dashboard-layout-responsive">
            <div>
              <h2 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.25 }}>
                {isRtl ? 'مجموعه ارزشمندی از تاریخچه فامیل شما' : 'Preserve a Rich Timeline of Your Legacy'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '1.5rem 0', fontSize: '1rem', lineHeight: 1.7 }}>
                {isRtl 
                  ? 'با قابلیت جدید تایم‌لاین زندگی، اتفاقات مهم زندگی هر شخص از بدو تولد تا درگذشت را با قابلیت زمان‌بندی دقیق در یک قالب جذاب ثبت کنید.' 
                  : 'Chronologically track important events from birth to death. Add milestones like marriages, graduations, or historic journeys along a beautiful scrolling track.'}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', padding: '0.5rem', borderRadius: '8px', flexShrink: 0 }}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h5 style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>{isRtl ? 'تایم‌لاین رویدادهای کرونولوژیکال' : 'Chronological Stepper'}</h5>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{isRtl ? 'ثبت و مرتب‌سازی خودکار رویدادها بر اساس زمان وقوع.' : 'Events are sorted automatically by date and linked with a scrolling line indicator.'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)', padding: '0.5rem', borderRadius: '8px', flexShrink: 0 }}>
                    <Compass size={18} />
                  </div>
                  <div>
                    <h5 style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>{isRtl ? 'عکس‌های پروفایل اختصاصی' : 'Dedicated Profile Avatars'}</h5>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{isRtl ? 'امکان بارگذاری مستقیم عکس پروفایل یا انتخاب از آلبوم تصاویر بدون وابستگی.' : 'Upload profile-specific avatars or set profile photos directly from any album asset.'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Scrolling Timeline Graphic */}
            <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '20px', background: 'rgba(11, 18, 32, 0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="timeline-track">
                <div className="timeline-line" style={{ insetInlineStart: '12px' }}></div>
                
                <div style={{ position: 'relative', paddingInlineStart: '2.5rem', marginBottom: '2rem' }}>
                  <div style={{ position: 'absolute', insetInlineStart: '4px', top: '4px', width: '13px', height: '13px', borderRadius: '50%', background: '#10b981', border: '2px solid white' }}></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '0.15rem 0.5rem', borderRadius: '99px' }}>
                    {isRtl ? '۱۳۲۰/۰۲/۱۵' : '1941/05/05'}
                  </span>
                  <h4 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 700, marginTop: '0.25rem' }}>{isRtl ? 'تولد بزرگ خاندان آرش' : 'Birth of Founder Arash'}</h4>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{isRtl ? 'تولد در شهر تاریخی شیراز و آغاز سلسله خانوادگی.' : 'Born in the historic city of Shiraz, starting the family saga.'}</p>
                </div>

                <div style={{ position: 'relative', paddingInlineStart: '2.5rem', marginBottom: '2rem' }}>
                  <div style={{ position: 'absolute', insetInlineStart: '4px', top: '4px', width: '13px', height: '13px', borderRadius: '50%', background: '#6366f1', border: '2px solid white' }}></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', padding: '0.15rem 0.5rem', borderRadius: '99px' }}>
                    {isRtl ? '۱۳۴۵/۰۶/۱۰' : '1966/09/01'}
                  </span>
                  <h4 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 700, marginTop: '0.25rem' }}>{isRtl ? 'ازدواج با سیمین' : 'Marriage with Simin'}</h4>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{isRtl ? 'آغاز پیوند خانوادگی با ثبت پیمان عقد در تهران.' : 'Wedding contract sealed, moving the family center to Tehran.'}</p>
                </div>

                <div style={{ position: 'relative', paddingInlineStart: '2.5rem' }}>
                  <div style={{ position: 'absolute', insetInlineStart: '4px', top: '4px', width: '13px', height: '13px', borderRadius: '50%', background: '#ef4444', border: '2px solid white' }}></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.15rem 0.5rem', borderRadius: '99px' }}>
                    {isRtl ? '۱۳۷۷/۱۰/۱۲' : '1998/12/30'}
                  </span>
                  <h4 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 700, marginTop: '0.25rem' }}>{isRtl ? 'وفات بزرگ خاندان' : 'Death of Founder'}</h4>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{isRtl ? 'درگذشت پس از نیم قرن تلاش برای حفظ میراث فامیل.' : 'Passed away leaving behind a robust heritage legacy.'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default Landing;
