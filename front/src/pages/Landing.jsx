import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Share2, Users, Eye, Globe, ChevronRight, ArrowRight, GitMerge, Shield, Compass, Calendar, Check } from 'lucide-react';
import { api } from '../services/api';

function Landing() {
  const { t, i18n } = useTranslation();
  const [publicTrees, setPublicTrees] = useState([]);
  const [publicTreesLoading, setPublicTreesLoading] = useState(true);

  const isRtl = i18n.language === 'fa';

  // 3D Parallax Mouse Tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-12, 12]);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth) - 0.5;
    const y = (clientY / innerHeight) - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    fetchPublicTrees();
  }, []);

  const fetchPublicTrees = async () => {
    try {
      setPublicTreesLoading(true);
      const data = await api.tree.getPublic();
      setPublicTrees(data);
    } catch (err) {
      console.error("Failed to load public trees:", err);
    } finally {
      setPublicTreesLoading(false);
    }
  };

          {/* 3D Abstract Floating Network */}
          <motion.div
            className="perspective-container"
            style={{ 
              width: '100%', 
              maxWidth: '900px',
              height: '420px', 
              marginTop: '4rem',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
          >
            <motion.div 
              className="preserve-3d"
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                rotateX,
                rotateY
              }}
            >
              {/* SVG Glowing Lines Connecting them */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', transform: 'translateZ(0px)' }}>
                <defs>
                  <linearGradient id="glow-line-1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="glow-line-2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f472b6" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="glow-line-3" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <path d="M 50 50 L 30 20" stroke="url(#glow-line-1)" strokeWidth="0.4" strokeDasharray="1,1" className="float-slow" />
                <path d="M 50 50 L 75 25" stroke="url(#glow-line-2)" strokeWidth="0.6" className="float-medium" />
                <path d="M 50 50 L 25 80" stroke="url(#glow-line-3)" strokeWidth="0.4" className="float-fast" />
                <path d="M 50 50 L 65 85" stroke="rgba(250, 204, 21, 0.4)" strokeWidth="0.3" strokeDasharray="2,1" className="float-delayed" />
              </svg>

              {/* Central Node */}
              <div className="ultra-glass float-slow flex-center" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) translateZ(50px)', width: '140px', height: '140px', borderRadius: '50%', padding: '1rem', textAlign: 'center', border: '2px solid rgba(99, 102, 241, 0.4)' }}>
                <div>
                  <Globe size={32} color="#818cf8" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Heritage</div>
                </div>
              </div>

              {/* Connected Node 1 (Top Left) */}
              <div className="ultra-glass float-medium flex-center" style={{ position: 'absolute', top: '20%', left: '30%', transform: 'translate(-50%, -50%) translateZ(-30px)', width: '100px', height: '100px', borderRadius: '24px', padding: '1rem', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <Users size={28} color="#34d399" />
              </div>

              {/* Connected Node 2 (Top Right) */}
              <div className="ultra-glass float-fast flex-center" style={{ position: 'absolute', top: '25%', left: '75%', transform: 'translate(-50%, -50%) translateZ(70px)', width: '110px', height: '110px', borderRadius: '50%', padding: '1rem', textAlign: 'center', border: '1px solid rgba(244, 114, 182, 0.3)' }}>
                <Eye size={28} color="#f472b6" />
              </div>

              {/* Connected Node 3 (Bottom Left) */}
              <div className="ultra-glass float-delayed flex-center" style={{ position: 'absolute', top: '80%', left: '25%', transform: 'translate(-50%, -50%) translateZ(90px)', width: '130px', height: '80px', borderRadius: '16px', padding: '1rem', textAlign: 'center', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                <GitMerge size={28} color="#38bdf8" />
              </div>

              {/* Connected Node 4 (Bottom Right) */}
              <div className="ultra-glass float-medium flex-center" style={{ position: 'absolute', top: '85%', left: '65%', transform: 'translate(-50%, -50%) translateZ(-50px)', width: '90px', height: '90px', borderRadius: '50%', padding: '1rem', textAlign: 'center', border: '1px solid rgba(250, 204, 21, 0.3)' }}>
                <Shield size={24} color="#facc15" />
              </div>
            </motion.div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-16">
            <motion.div 
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -10, rotateX: 5, rotateY: -5, boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.25)" }}
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
                justifyContent: 'center', 
                marginBottom: '1.5rem',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.15)'
              }} className="flex-center">
                <GitMerge size={24} />
              </div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
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
              whileHover={{ y: -10, rotateX: 5, rotateY: -5, boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.25)" }}
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
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                {isRtl ? 'همکاری تیمی و اشتراک‌گذاری' : 'Collaborative Workspace'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.92rem' }}>
                {isRtl 
                  ? 'اعضای فامیل را به عنوان مالک، ویرایشگر یا بیننده دعوت کنید تا با هم شجره‌نامه را کامل کنید.' 
                  : 'Invite members to collaborate under strict roles (owner, editor, visitor) keeping data unified and synced.'}
              </p>
            </motion.div>

            <motion.div 
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -10, rotateX: 5, rotateY: -5, boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.25)" }}
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
                <Share2 size={24} />
              </div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                {isRtl ? 'خروجی یکپارچه و به اشتراک‌گذاری' : 'Export and Share'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.92rem' }}>
                {isRtl 
                  ? 'نمودار درختی شجرنامه را به صورت زنده و با یک دکمه منتشر کنید تا همه به راحتی به آن دسترسی داشته باشند.' 
                  : 'Publish trees with public read access, generating beautiful viewable visual archives for families.'}
              </p>
            </motion.div>

            <motion.div 
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -10, rotateX: 5, rotateY: -5, boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.25)" }}
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
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
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
                    <h5 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>{isRtl ? 'تایم‌لاین رویدادهای کرونولوژیکال' : 'Chronological Stepper'}</h5>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{isRtl ? 'ثبت و مرتب‌سازی خودکار رویدادها بر اساس زمان وقوع.' : 'Events are sorted automatically by date and linked with a scrolling line indicator.'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)', padding: '0.5rem', borderRadius: '8px', flexShrink: 0 }}>
                    <Compass size={18} />
                  </div>
                  <div>
                    <h5 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>{isRtl ? 'عکس‌های پروفایل اختصاصی' : 'Dedicated Profile Avatars'}</h5>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{isRtl ? 'امکان بارگذاری مستقیم عکس پروفایل یا انتخاب از آلبوم تصاویر بدون وابستگی.' : 'Upload profile-specific avatars or set profile photos directly from any album asset.'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Scrolling Timeline Graphic */}
            <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="timeline-track">
                <div className="timeline-line" style={{ insetInlineStart: '12px' }}></div>
                
                <div style={{ position: 'relative', paddingInlineStart: '2.5rem', marginBottom: '2rem' }}>
                  <div style={{ position: 'absolute', insetInlineStart: '4px', top: '4px', width: '13px', height: '13px', borderRadius: '50%', background: '#10b981', border: '2px solid var(--bg-secondary)' }}></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '0.15rem 0.5rem', borderRadius: '99px' }}>
                    {isRtl ? '۱۳۲۰/۰۲/۱۵' : '1941/05/05'}
                  </span>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, marginTop: '0.25rem' }}>{isRtl ? 'تولد بزرگ خاندان آرش' : 'Birth of Founder Arash'}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{isRtl ? 'تولد در شهر تاریخی شیراز و آغاز سلسله خانوادگی.' : 'Born in the historic city of Shiraz, starting the family saga.'}</p>
                </div>

                <div style={{ position: 'relative', paddingInlineStart: '2.5rem', marginBottom: '2rem' }}>
                  <div style={{ position: 'absolute', insetInlineStart: '4px', top: '4px', width: '13px', height: '13px', borderRadius: '50%', background: '#6366f1', border: '2px solid var(--bg-secondary)' }}></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', padding: '0.15rem 0.5rem', borderRadius: '99px' }}>
                    {isRtl ? '۱۳۴۵/۰۶/۱۰' : '1966/09/01'}
                  </span>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, marginTop: '0.25rem' }}>{isRtl ? 'ازدواج با سیمین' : 'Marriage with Simin'}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{isRtl ? 'آغاز پیوند خانوادگی با ثبت پیمان عقد در تهران.' : 'Wedding contract sealed, moving the family center to Tehran.'}</p>
                </div>

                <div style={{ position: 'relative', paddingInlineStart: '2.5rem' }}>
                  <div style={{ position: 'absolute', insetInlineStart: '4px', top: '4px', width: '13px', height: '13px', borderRadius: '50%', background: '#ef4444', border: '2px solid var(--bg-secondary)' }}></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.15rem 0.5rem', borderRadius: '99px' }}>
                    {isRtl ? '۱۳۷۷/۱۰/۱۲' : '1998/12/30'}
                  </span>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, marginTop: '0.25rem' }}>{isRtl ? 'وفات بزرگ خاندان' : 'Death of Founder'}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{isRtl ? 'درگذشت پس از نیم قرن تلاش برای حفظ میراث فامیل.' : 'Passed away leaving behind a robust heritage legacy.'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Plans Section */}
        <section style={{ borderTop: '1px solid var(--border-color)', marginTop: '4rem', paddingTop: '4rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '3rem' }}>
            <h2 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800 }}>
              {t('pricing_title')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', fontSize: '1rem' }}>
              {t('pricing_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto" style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Free Plan */}
            <motion.div 
              className="glass-card pricing-card"
              style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border-color)', position: 'relative' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -15, rotateX: 2, rotateY: -2, scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
              viewport={{ once: true }}
            >
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{t('plan_free')}</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2rem' }}>$0 <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/ forever</span></div>
              
              <ul style={{ textAlign: 'start', display: 'flex', flexDirection: 'column', gap: '1rem', margin: 0, padding: 0, listStyle: 'none' }}>
                {['feature_interactive_canvas', 'feature_timeline', 'feature_unlimited_photos', 'feature_rbac', 'feature_public_sharing'].map((feature) => (
                  <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: '0.95rem' }}>{t(feature)}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Wealthy Plan */}
            <motion.div 
              className="glass-card pricing-card"
              style={{ padding: '2.5rem', borderRadius: '24px', border: '2px solid rgba(99, 102, 241, 0.5)', background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%)', position: 'relative' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -15, rotateX: 2, rotateY: -2, scale: 1.02, boxShadow: "0 30px 60px rgba(99,102,241,0.25)" }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', padding: '0.25rem 1rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}>
                RECOMMENDED
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{t('plan_wealthy')}</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                $0 <span style={{ fontSize: '1rem', fontWeight: 800, color: '#818cf8' }}>{t('pricing_for_now')}</span>
              </div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '2rem' }}>All premium features included</p>
              
              <ul style={{ textAlign: 'start', display: 'flex', flexDirection: 'column', gap: '1rem', margin: 0, padding: 0, listStyle: 'none' }}>
                {['feature_interactive_canvas', 'feature_timeline', 'feature_unlimited_photos', 'feature_rbac', 'feature_public_sharing'].map((feature) => (
                  <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 10px rgba(99,102,241,0.4)' }}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: '0.95rem' }}>{t(feature)}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* Public Trees Showcase Section */}
        <section style={{ borderTop: '1px solid var(--border-color)', marginTop: '4rem', paddingTop: '4rem', textAlign: 'start' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>
              {t('public_trees_title')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', fontSize: '1rem' }}>
              {t('public_trees_subtitle')}
            </p>
          </div>

          {publicTreesLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
              <div className="loading-spinner"></div>
              <p style={{ marginTop: '1rem' }}>{t('loading_public_trees')}</p>
            </div>
          ) : publicTrees.length === 0 ? (
            <div style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              border: '1px dashed var(--border-color)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '3rem 2rem', 
              textAlign: 'center' 
            }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>🌐</span>
              <p style={{ color: 'var(--text-secondary)' }}>
                {t('no_public_trees')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {publicTrees.map((tree, idx) => (
                <motion.div
                  key={tree.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link to={`/tree/${tree.id}`} className="tree-card" style={{ textDecoration: 'none', display: 'block' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div className="tree-card-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{tree.name}</div>
                        <span className="badge badge-visitor" style={{ fontSize: '0.7rem' }}>🌐 {t('public')}</span>
                      </div>
                      
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        👤 {t('owner')}: {tree.ownerName}
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} />
                        <span>
                          {t('updated_label')}{' '}
                          {new Date(tree.updatedAt).toLocaleDateString(isRtl ? 'fa-IR' : 'en-US')}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {t('view_tree')}
                        <ChevronRight size={14} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default Landing;
