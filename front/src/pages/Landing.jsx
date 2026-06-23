import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GitMerge, Users, Share2, Shield, Calendar, Globe, ChevronRight, ArrowRight, Check } from 'lucide-react';
import { api } from '../services/api';

function Landing() {
  const { t, i18n } = useTranslation();
  const [publicTrees, setPublicTrees] = useState([]);
  const [publicTreesLoading, setPublicTreesLoading] = useState(true);
  const socialTreeRef = useRef(null);

  const isRtl = i18n.language === 'fa';

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

  // Drifting 3D Social Tree Parallax Animation
  useEffect(() => {
    const container = socialTreeRef.current;
    if (!container) return;

    // Clear previous items in case of StrictMode dual-mounting
    container.innerHTML = '';

    const nodes = [];
    const maxNodes = 15;

    // Generate inline SVG placeholders for consistent assets without internet requests
    const generateAvatar = (i) => {
      const colors = ['#DE7B54', '#F0A786', '#2D241E', '#E6C2A5', '#A45D40'];
      const color = colors[i % colors.length];
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="${encodeURIComponent(color)}"/><circle cx="50" cy="40" r="20" fill="white" opacity="0.8"/><circle cx="50" cy="110" r="50" fill="white" opacity="0.8"/></svg>`;
    };
    
    const generatePhoto = (i) => {
      const colors = ['#e0f2fe', '#fce7f3', '#fef08a', '#dcfce7'];
      const color = colors[i % colors.length];
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="${encodeURIComponent(color)}"/><path d="M30 100 L70 50 L110 80 L130 60 L150 90 L150 150 L30 150 Z" fill="rgba(0,0,0,0.1)"/><circle cx="110" cy="40" r="15" fill="rgba(0,0,0,0.1)"/></svg>`;
    };

    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    const handleMouseMoveLocal = (e) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.02;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.02;
    };
    window.addEventListener('mousemove', handleMouseMoveLocal);

    class FloatingNode {
      constructor(id) {
        this.id = id;
        this.type = Math.random() > 0.3 ? 'avatar' : 'polaroid';
        this.size = this.type === 'avatar' ? Math.random() * 40 + 50 : Math.random() * 60 + 80;
        this.rotation = this.type === 'polaroid' ? (Math.random() * 30 - 15) : 0;
        
        // Start below the viewport
        this.x = Math.random() * window.innerWidth;
        this.y = window.innerHeight + this.size + Math.random() * 500;
        
        // Upward speed drift
        this.speedY = -(Math.random() * 0.5 + 0.2);
        this.speedX = (Math.random() - 0.5) * 0.2;
        
        this.element = document.createElement('div');
        
        if (this.type === 'avatar') {
          this.element.className = 'node-avatar';
          this.element.style.width = `${this.size}px`;
          this.element.style.height = `${this.size}px`;
          this.element.style.backgroundImage = `url("${generateAvatar(id)}")`;
        } else {
          this.element.className = 'node-polaroid';
          this.element.style.width = `${this.size}px`;
          this.element.style.height = `${this.size * 1.2}px`;
          
          const img = document.createElement('img');
          img.className = 'polaroid-img';
          img.src = generatePhoto(id);
          this.element.appendChild(img);
        }

        container.appendChild(this.element);
        
        // Connect to a parent node to establish a family hierarchy graph
        this.parentId = null;
        if (nodes.length > 0) {
          let potentialParents = nodes.filter(n => n.y < this.y - 100);
          if (potentialParents.length === 0) potentialParents = nodes;
          this.parentId = potentialParents[Math.floor(Math.random() * Math.min(3, potentialParents.length))].id;
          
          this.line = document.createElement('div');
          this.line.className = 'tree-line';
          container.appendChild(this.line);
        }
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;

        // Apply mouse movement parallax offsets
        let pX = this.x;
        let pY = this.y;
        
        pX += targetX * (this.size * 0.05);
        pY += targetY * (this.size * 0.05);

        this.element.style.transform = `translate(${pX}px, ${pY}px) rotate(${this.rotation}deg)`;

        if (this.parentId !== null) {
          const parent = nodes.find(n => n.id === this.parentId);
          if (parent) {
            this.updateLine(parent, pX, pY);
          }
        }

        // Reset positions when moving off screen top
        if (this.y < -this.size - 200) {
          this.y = window.innerHeight + this.size + 100;
          this.x = Math.random() * window.innerWidth;
          if (nodes.length > 1) {
            let otherNodes = nodes.filter(n => n.id !== this.id);
            this.parentId = otherNodes[Math.floor(Math.random() * otherNodes.length)].id;
            if (!this.line) {
              this.line = document.createElement('div');
              this.line.className = 'tree-line';
              container.appendChild(this.line);
            }
          }
        }
      }

      updateLine(parent, myX, myY) {
        if (!this.line) return;

        const x1 = myX + this.size / 2;
        const y1 = myY + (this.type === 'polaroid' ? this.size * 1.2 : this.size) / 2;
        const x2 = parent.x + parent.size / 2;
        const y2 = parent.y + (parent.type === 'polaroid' ? parent.size * 1.2 : parent.size) / 2;

        const length = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        this.line.style.width = `${length}px`;
        this.line.style.height = `2px`;
        this.line.style.left = `${x1}px`;
        this.line.style.top = `${y1}px`;
        this.line.style.transform = `rotate(${angle}deg)`;
      }
    }

    // Spawn nodes
    for (let i = 0; i < maxNodes; i++) {
      const node = new FloatingNode(i);
      node.y = window.innerHeight - (Math.random() * window.innerHeight * 1.5); 
      nodes.push(node);
    }

    let animId;
    function animate() {
      targetX += (mouseX - targetX) * 0.1;
      targetY += (mouseY - targetY) * 0.1;

      nodes.forEach(node => node.update());
      animId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMoveLocal);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Split slogan for beautiful gradient effect on ending words
  const sloganWords = t('slogan').split(' ');
  const sloganStart = sloganWords.slice(0, -3).join(' ');
  const sloganEnd = sloganWords.slice(-3).join(' ');

  return (
    <div style={{ position: 'relative', overflowX: 'hidden' }}>
      
      {/* Background canvas container for drifting nodes */}
      <div id="canvas-container">
        <div id="social-tree-container" ref={socialTreeRef}></div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-73px)] flex items-center justify-center pt-24 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full flex flex-col items-center text-center">
          
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/10 text-brand-primary text-xs font-semibold tracking-widest uppercase fade-in-up" style={{ animationDelay: '0.1s' }}>
            {isRtl ? 'به خانه خوش آمدید' : 'Welcome Home'}
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-medium leading-tight mb-6 fade-in-up text-brand-dark dark:text-white" style={{ animationDelay: '0.2s' }}>
            {sloganStart} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary-light via-brand-primary to-orange-700">
              {sloganEnd}
            </span>
          </h1>
          
          <p className="mt-4 text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl font-light leading-relaxed fade-in-up" style={{ animationDelay: '0.3s' }}>
            {t('landing_tagline')}
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/auth/register" className="bg-brand-primary text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-brand-primary-light transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(222,123,84,0.4)]">
              {t('get_started')}
              <ArrowRight className="w-5 h-5" style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
            </Link>
            <a href="#features" className="glass-panel px-8 py-4 rounded-full font-medium text-lg text-brand-dark dark:text-white hover:bg-brand-primary/10 transition-all flex items-center justify-center gap-2">
              {isRtl ? 'چگونه کار می‌کند' : 'How It Works'}
            </a>
          </div>
          
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce opacity-50">
            <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-serif mb-6 text-brand-dark dark:text-white">
              {isRtl ? 'خانه‌ای برای میراث شما' : 'A home for your heritage'}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto text-lg font-light">
              {isRtl 
                ? 'ما تریلی را به گونه‌ای طراحی کرده‌ایم که حس یک پایگاه داده خشک را نداشته باشد، بلکه شبیه به یک آلبوم عکس خانوادگی صمیمی، مشارکتی و کاملاً متعلق به شما باشد.' 
                : "We've designed Treely to feel less like a database, and more like a family photo album. Warm, collaborative, and entirely yours."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1: Interactive Family Engine */}
            <div className="glass-panel p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center mb-6 border border-brand-primary/20 text-brand-primary">
                <GitMerge className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-brand-dark dark:text-white">
                {isRtl ? 'رابط کاربری شجره‌نامه تعاملی' : 'Interactive Family Engine'}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 font-light leading-relaxed text-sm">
                {isRtl 
                  ? 'با کشیدن و رها کردن ساده، گره‌های روابط پدر و مادری و همسری را به صورت زنده پیوند دهید و مدیریت کنید.' 
                  : 'Add relatives, link parents, spouses, or children immediately inside a high-performance interactive layout.'}
              </p>
            </div>

            {/* Card 2: Collaborative Workspace */}
            <div className="glass-panel p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center mb-6 border border-brand-primary/20 text-brand-primary">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-brand-dark dark:text-white">
                {isRtl ? 'همکاری تیمی و اشتراک‌گذاری' : 'Collaborative Workspace'}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 font-light leading-relaxed text-sm">
                {isRtl 
                  ? 'اعضای فامیل را به عنوان مالک، ویرایشگر یا بیننده دعوت کنید تا با هم شجره‌نامه را کامل کنید.' 
                  : 'Invite members to collaborate under strict roles (owner, editor, visitor) keeping data unified and synced.'}
              </p>
            </div>

            {/* Card 3: Export and Share */}
            <div className="glass-panel p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center mb-6 border border-brand-primary/20 text-brand-primary">
                <Share2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-brand-dark dark:text-white">
                {isRtl ? 'خروجی یکپارچه و اشتراک‌گذاری' : 'Export and Share'}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 font-light leading-relaxed text-sm">
                {isRtl 
                  ? 'نمودار درختی شجرنامه را به صورت زنده و با یک دکمه منتشر کنید تا همه به راحتی به آن دسترسی داشته باشند.' 
                  : 'Publish trees with public read access, generating beautiful viewable visual archives for families.'}
              </p>
            </div>

            {/* Card 4: Secure Permissions */}
            <div className="glass-panel p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center mb-6 border border-brand-primary/20 text-brand-primary">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-brand-dark dark:text-white">
                {isRtl ? 'امنیت و حریم خصوصی پیشرفته' : 'Secure Permissions'}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 font-light leading-relaxed text-sm">
                {isRtl 
                  ? 'سیستم کنترل دسترسی نقش‌محور (RBAC) تضمین می‌کند فقط افراد مجاز درخت شما را ببینند یا ویرایش کنند.' 
                  : 'Role-based authorization checks visitor/editor privileges before releasing profile and tree configurations.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline teaser section */}
      <section className="relative py-32 z-10 border-t border-brand-dark/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-start">
              <h2 className="text-3xl md:text-5xl font-serif text-brand-dark dark:text-white leading-tight">
                {isRtl ? 'مجموعه ارزشمندی از تاریخچه فامیل شما' : 'Preserve a Rich Timeline of Your Legacy'}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 my-6 text-base sm:text-lg font-light leading-relaxed">
                {isRtl 
                  ? 'با قابلیت جدید تایم‌لاین زندگی، رویدادهای مهم هر عضو خاندان را از بدو تولد تا وفات با جزئیات تاریخی کامل، آلبوم تصاویر اختصاصی و داستان‌های صمیمی ثبت کنید.' 
                  : 'Chronologically track important events from birth to death. Add milestones like marriages, graduations, or historic journeys along a beautiful scrolling track.'}
              </p>
              
              <div className="flex flex-col gap-4 mt-8">
                <div className="flex items-start gap-4">
                  <div className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 p-2 rounded-xl flex-shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-brand-dark dark:text-white font-semibold text-base">
                      {isRtl ? 'تایم‌لاین رویدادهای کرونولوژیکال' : 'Chronological Stepper'}
                    </h5>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      {isRtl ? 'ثبت و مرتب‌سازی خودکار رویدادها بر اساس زمان وقوع.' : 'Events are sorted automatically by date and linked with a scrolling line indicator.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 p-2 rounded-xl flex-shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-brand-dark dark:text-white font-semibold text-base">
                      {isRtl ? 'عکس‌های پروفایل اختصاصی' : 'Dedicated Profile Avatars'}
                    </h5>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      {isRtl ? 'امکان بارگذاری مستقیم عکس پروفایل یا انتخاب از آلبوم تصاویر بدون وابستگی.' : 'Upload profile-specific avatars or set profile photos directly from any album asset.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Scrolling Timeline Graphic */}
            <div className="glass-panel p-8 sm:p-10 rounded-3xl text-start">
              <div className="timeline-track">
                <div className="timeline-line" style={{ insetInlineStart: '12px', background: 'linear-gradient(to bottom, #DE7B54, #F0A786, #DE7B54)' }}></div>
                
                <div className="relative ps-10 mb-8">
                  <div className="absolute start-[6px] top-[4px] w-[15px] h-[15px] rounded-full bg-emerald-500 border-2 border-brand-light dark:border-brand-dark z-10"></div>
                  <span className="inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                    {isRtl ? '۱۳۲۰/۰۲/۱۵' : '1941/05/05'}
                  </span>
                  <h4 className="text-brand-dark dark:text-white font-bold text-base mt-2">{isRtl ? 'تولد بزرگ خاندان آرش' : 'Birth of Founder Arash'}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{isRtl ? 'تولد در شهر تاریخی شیراز و آغاز سلسله خانوادگی.' : 'Born in the historic city of Shiraz, starting the family saga.'}</p>
                </div>

                <div className="relative ps-10 mb-8">
                  <div className="absolute start-[6px] top-[4px] w-[15px] h-[15px] rounded-full bg-brand-primary border-2 border-brand-light dark:border-brand-dark z-10"></div>
                  <span className="inline-block text-xs font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-3 py-1 rounded-full">
                    {isRtl ? '۱۳۴۵/۰۶/۱۰' : '1966/09/01'}
                  </span>
                  <h4 className="text-brand-dark dark:text-white font-bold text-base mt-2">{isRtl ? 'ازدواج با سیمین' : 'Marriage with Simin'}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{isRtl ? 'آغاز پیوند خانوادگی با ثبت پیمان عقد در تهران.' : 'Wedding contract sealed, moving the family center to Tehran.'}</p>
                </div>

                <div className="relative ps-10">
                  <div className="absolute start-[6px] top-[4px] w-[15px] h-[15px] rounded-full bg-rose-500 border-2 border-brand-light dark:border-brand-dark z-10"></div>
                  <span className="inline-block text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
                    {isRtl ? '۱۳۷۷/۱۰/۱۲' : '1998/12/30'}
                  </span>
                  <h4 className="text-brand-dark dark:text-white font-bold text-base mt-2">{isRtl ? 'وفات بزرگ خاندان' : 'Death of Founder'}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{isRtl ? 'درگذشت پس از نیم قرن تلاش برای حفظ میراث فامیل.' : 'Passed away leaving behind a robust heritage legacy.'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-32 z-10 border-t border-brand-dark/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mb-20">
            <h2 className="text-3xl md:text-5xl font-serif mb-6 text-brand-dark dark:text-white">
              {t('pricing_title')}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto text-lg font-light">
              {t('pricing_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="glass-panel p-8 sm:p-10 rounded-3xl flex flex-col text-start relative hover:-translate-y-2 transition-transform duration-300">
              <h3 className="text-xl font-bold text-brand-dark dark:text-white mb-2">{t('plan_free')}</h3>
              <div className="text-4xl font-extrabold text-brand-dark dark:text-white mb-6">
                $0 <span className="text-sm font-medium text-gray-500">/ forever</span>
              </div>
              
              <ul className="flex flex-col gap-4 mb-8 list-none p-0 m-0">
                {['feature_interactive_canvas', 'feature_timeline', 'feature_unlimited_photos', 'feature_rbac', 'feature_public_sharing'].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                    <span className="text-sm">{t(feature)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Wealthy Plan */}
            <div className="glass-panel p-8 sm:p-10 rounded-3xl flex flex-col text-start relative border-2 border-brand-primary/50 bg-brand-primary/[0.02] hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-brand-primary to-orange-600 text-white px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-md">
                {isRtl ? 'پیشنهادی' : 'RECOMMENDED'}
              </div>
              <h3 className="text-xl font-bold text-brand-dark dark:text-white mb-2">{t('plan_wealthy')}</h3>
              <div className="text-4xl font-extrabold text-brand-dark dark:text-white mb-1">
                $0 <span className="text-lg font-bold text-brand-primary font-serif"><b>{t('pricing_for_now')}</b></span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-6">
                {isRtl ? 'همه امکانات پرمیوم شامل می‌شود' : 'All premium features included'}
              </p>
              
              <ul className="flex flex-col gap-4 mb-8 list-none p-0 m-0">
                {['feature_interactive_canvas', 'feature_timeline', 'feature_unlimited_photos', 'feature_rbac', 'feature_public_sharing'].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-brand-dark dark:text-white font-medium">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-brand-primary to-orange-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                    <span className="text-sm">{t(feature)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Public Trees Showcase Section */}
      <section className="relative py-32 z-10 border-t border-brand-dark/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-serif mb-6 text-brand-dark dark:text-white">
              {t('public_trees_title')}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto text-lg font-light">
              {t('public_trees_subtitle')}
            </p>
          </div>

          {publicTreesLoading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>{t('loading_public_trees')}</p>
            </div>
          ) : publicTrees.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl text-center border-dashed">
              <span className="text-4xl block mb-4">🌐</span>
              <p className="text-gray-600 dark:text-gray-400">
                {t('no_public_trees')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicTrees.map((tree) => (
                <Link
                  key={tree.id}
                  to={`/tree/${tree.id}`}
                  className="glass-panel p-6 rounded-2xl flex flex-col justify-between min-h-[160px] hover:-translate-y-1 transition-transform duration-300 text-start"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-bold text-brand-dark dark:text-white">{tree.name}</h4>
                      <span className="text-[10px] font-bold tracking-wider text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-full uppercase">
                        🌐 {t('public')}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      👤 {t('owner')}: {tree.ownerName}
                    </div>

                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {t('updated_label')}:{' '}
                        {new Date(tree.updatedAt).toLocaleDateString(isRtl ? 'fa-IR' : 'en-US')}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-brand-dark/5 dark:border-white/5">
                    <span className="text-sm font-semibold text-brand-primary flex items-center gap-1">
                      {t('view_tree')}
                      <ChevronRight className="w-4 h-4" style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom Newsletter CTA Section */}
      <section className="relative py-32 z-10 border-t border-brand-dark/5 dark:border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-serif mb-6 text-brand-dark dark:text-white">
            {isRtl ? 'برای شروع سفر خود آماده‌اید؟' : 'Ready to begin your journey?'}
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-10 font-light max-w-2xl mx-auto">
            {isRtl 
              ? 'به هزاران خانواده‌ای که هم‌اکنون در حال حفظ میراث خود هستند بپیوندید. شروع کار کمتر از یک دقیقه زمان می‌برد.' 
              : 'Join thousands of families already preserving their legacy. It takes just a minute to start.'}
          </p>
          <div className="glass-panel p-2 rounded-full flex flex-col sm:flex-row w-full max-w-lg mx-auto">
            <input 
              type="email" 
              placeholder={isRtl ? 'آدرس ایمیل خود را وارد کنید' : 'Enter your email address'} 
              className="bg-transparent text-brand-dark dark:text-white px-6 py-4 w-full focus:outline-none placeholder-gray-500 rounded-full"
            />
            <Link 
              to="/auth/register" 
              className="bg-brand-primary text-white font-medium px-8 py-4 rounded-full hover:bg-brand-primary-light transition-colors whitespace-nowrap mt-2 sm:mt-0"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {t('get_started')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-brand-dark/10 dark:border-white/10 bg-white/70 dark:bg-brand-dark/50 backdrop-blur-lg pt-16 pb-8 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 mb-12 text-start">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
                <path d="M12 22v-6"/><path d="M12 16a4 4 0 0 0-4-4H6"/><path d="M12 16a4 4 0 0 1 4-4h2"/><path d="M6 12a4 4 0 0 1-4-4V6"/><path d="M6 12a4 4 0 0 0 4-4V6"/><path d="M18 12a4 4 0 0 0 4-4V6"/><path d="M18 12a4 4 0 0 1-4-4V6"/>
              </svg>
              <span className="font-serif text-xl font-semibold text-brand-dark dark:text-white">Treely</span>
            </div>
            <p className="text-xs text-gray-500">
              {isRtl ? 'اتصال گذشته، حال و آینده.' : 'Connecting past, present, and future.'}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-brand-dark dark:text-white mb-4 text-sm">{isRtl ? 'محصول' : 'Product'}</h4>
            <ul className="space-y-2 text-xs text-gray-500 list-none p-0 m-0">
              <li><a href="#features" className="hover:text-brand-primary transition-colors">{t('features')}</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">{isRtl ? 'قالب‌ها' : 'Templates'}</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">{t('pricing')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-brand-dark dark:text-white mb-4 text-sm">{isRtl ? 'شرکت' : 'Company'}</h4>
            <ul className="space-y-2 text-xs text-gray-500 list-none p-0 m-0">
              <li><a href="#" className="hover:text-brand-primary transition-colors">{t('about')}</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">{isRtl ? 'فرصت‌های شغلی' : 'Careers'}</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">{isRtl ? 'حریم خصوصی' : 'Privacy Policy'}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-brand-dark dark:text-white mb-4 text-sm">{isRtl ? 'شبکه‌های اجتماعی' : 'Connect'}</h4>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-brand-primary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-gray-500 border-t border-brand-dark/5 dark:border-white/5 pt-8">
          &copy; 2026 Treely Collaborative Networks. All rights reserved.
        </div>
      </footer>

    </div>
  );
}

export default Landing;
