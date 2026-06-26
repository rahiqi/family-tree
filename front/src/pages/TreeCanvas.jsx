import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, Users, Plus, X, Trash2, Shield, 
  Settings, UserPlus, Info, Check, AlertCircle, Edit, Calendar, History
} from 'lucide-react';
import * as f3 from 'family-chart';
import 'family-chart/styles/family-chart.css';
import { api, API_ORIGIN } from '../services/api';
import DatePicker from '../components/DatePicker';


function TreeCanvas() {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isFa = i18n.language === 'fa';
  
  const containerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');

  // Listen to global theme change events
  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'light');
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => {
      window.removeEventListener('theme-change', handleThemeChange);
    };
  }, []);
  
  const [treeInfo, setTreeInfo] = useState(null);
  const [treeData, setTreeData] = useState([]);
  const [userRole, setUserRole] = useState('visitor');
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Local changes state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [tempGraphData, setTempGraphData] = useState([]);
  
  // Collaborators modal
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [collabEmail, setCollabEmail] = useState('');
  const [collabRole, setCollabRole] = useState('visitor');
  const [collabError, setCollabError] = useState('');
  const [collabLoading, setCollabLoading] = useState(false);
  
  // First Person onboarding
  const [firstPerson, setFirstPerson] = useState({
    firstName: '',
    lastName: '',
    gender: 'M',
    birthday: ''
  });

  // Modal Datepicker for canvas editor
  const [modalDatePickerOpen, setModalDatePickerOpen] = useState(false);
  const [modalDatePickerValue, setModalDatePickerValue] = useState('');
  const [targetInputEl, setTargetInputEl] = useState(null);

  // Tree change history sidebar states
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');


  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // 1. Fetch Tree details
  useEffect(() => {
    fetchTreeDetails();
  }, [treeId]);

  const fetchTreeDetails = async () => {
    try {
      setLoading(true);
      const res = await api.tree.get(treeId);
      setTreeInfo(res);
      setUserRole(res.userRole || res.UserRole || 'visitor');
      setCollaborators(res.collaborators || []);
      
      const parsedData = JSON.parse(res.treeGraphJsonData || '[]');
      setTreeData(parsedData);
      setTempGraphData(parsedData);
    } catch (err) {
      setError(err.message || 'Failed to load family tree.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryLogs = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError('');
      const res = await api.tree.getHistory(treeId);
      setHistoryLogs(res || []);
    } catch (err) {
      setHistoryError(err.message || t('failed_load_history'));
    } finally {
      setHistoryLoading(false);
    }
  };

  // 1b. Intercept click/focus on family-chart birthday input to open custom datepicker
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const input = e.target.closest('#FamilyChart .f3-form input[name="birthday"]') || 
                    e.target.closest('#FamilyChart .f3-form-cont input[name="birthday"]') ||
                    e.target.closest('.f3-form input[name="birthday"]');
      if (input) {
        e.preventDefault();
        e.stopPropagation();
        setTargetInputEl(input);
        setModalDatePickerValue(input.value || '');
        setModalDatePickerOpen(true);
        input.blur();
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);

  // 2. Instantiate family-chart v2 inside useEffect

  useEffect(() => {
    if (loading || !containerRef.current || treeData.length === 0) return;

    // StrictMode guardrail: Clear the container first to prevent double SVG containers
    containerRef.current.innerHTML = '';

    try {
      // Create chart instance
      const f3Chart = f3.createChart(containerRef.current, treeData)
        .setTransitionTime(600)
        .setCardXSpacing(240)
        .setCardYSpacing(120);

      chartInstanceRef.current = f3Chart;

      // Define dimensions and styling for Card
      const f3Card = f3Chart.setCardHtml()
        .setCardDim({ w: 220, h: 80 })
        .setMiniTree(true)

        .setCardInnerHtmlCreator((d) => {
          const isDark = theme !== 'light';
          
          if (d.data.to_add) {
            return `
              <div class="card-inner" style="
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100%; 
                border: 2px dashed rgba(99, 102, 241, 0.5); 
                border-radius: var(--radius-md); 
                background: ${isDark ? '#090d16' : '#eff6ff'}; 
                color: #818cf8; 
                font-weight: 600; 
                font-size: 0.85rem;
                padding: 0.5rem;
                text-align: center;
                backdrop-filter: blur(8px);
                transition: all 0.2s ease;
              ">
                ➕ ${t('add_node')}
              </div>
            `;
          }

          const fName = d.data.data['first name'] || d.data.data['firstName'] || '';
          const lName = d.data.data['last name'] || d.data.data['lastName'] || '';
          const bDay = d.data.data['birthday'] || '';
          const gender = d.data.data.gender || 'M';
          
          const isMale = gender === 'M';
          
          const genderAccent = isMale 
            ? (isDark ? '#38bdf8' : '#2563eb') 
            : (isDark ? '#f472b6' : '#db2777');
            
          const genderBg = isMale 
            ? (isDark ? '#0e1628' : '#eff6ff') 
            : (isDark ? '#180e1b' : '#fdf2f8');
            
          const avatarIcon = isMale ? '👨' : '👩';
          const avatarUrl = d.data.data.avatar || '';

          return `
            <div class="card-inner" style="
              position: relative; 
              width: 100%; 
              height: 100%; 
              padding: 0.75rem; 
              border: 1.5px solid ${genderAccent}; 
              border-radius: var(--radius-md); 
              background: ${genderBg}; 
              box-shadow: var(--shadow-sm); 
              display: flex; 
              flex-direction: column; 
              justify-content: space-between; 
              overflow: hidden;
              backdrop-filter: blur(8px);
              transition: all 0.2s ease;
            ">
              <div style="display: flex; align-items: center; gap: 0.6rem;">
                ${avatarUrl ? `
                  <img src="${API_ORIGIN}${avatarUrl}" style="
                    width: 38px; 
                    height: 38px; 
                    border-radius: 50%; 
                    object-fit: cover; 
                    border: 2px solid ${genderAccent};
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    flex-shrink: 0;
                  " />
                ` : `
                  <div style="
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1.5px solid ${genderAccent}44;
                    font-size: 1.25rem;
                    flex-shrink: 0;
                  ">${avatarIcon}</div>
                `}
                <div style="display: flex; flex-direction: column; min-width: 0; flex-grow: 1;">
                  <span style="
                    font-weight: 600; 
                    font-size: 0.9rem; 
                    color: var(--text-primary); 
                    white-space: nowrap; 
                    overflow: hidden; 
                    text-overflow: ellipsis;
                    text-align: start;
                  ">
                    ${fName} ${lName}
                  </span>
                  ${bDay ? `
                    <span style="font-size: 0.7rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.2rem; text-align: start; margin-top: 0.1rem;">
                      📅 ${bDay}
                    </span>
                  ` : ''}
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: 0.25rem;">
                <button class="view-profile-btn" style="
                  background: var(--bg-secondary); 
                  border: 1px solid ${genderAccent}88; 
                  border-radius: var(--radius-sm); 
                  padding: 0.2rem 0.5rem; 
                  font-size: 0.7rem; 
                  color: var(--text-primary); 
                  cursor: pointer;
                  font-weight: 500;
                  transition: all 0.2s ease;
                ">
                  ${t('edit')} / ${t('biography')} ↗
                </button>
              </div>
            </div>
          `;
        });
      // Bind card click overrides
      f3Card.setOnCardClick((e, d) => {
        // If clicked on view profile link/btn
        if (e.target.closest('.view-profile-btn')) {
          e.stopPropagation();
          e.preventDefault();
          navigate(`/tree/${treeId}/profile/${d.data.id}`);
          return;
        }

        // Standard behavior: focus layout on the clicked node
        f3Chart.updateMainId(d.data.id);
        f3Chart.updateTree({ initial: false });

        // Open edit box if authorized
        if (f3Chart.editTreeInstance && !f3Chart.editTreeInstance.no_edit) {
          f3Chart.editTreeInstance.open(d.data);
        }
      });

      // Check RBAC to initialize editor panel
      if (userRole === 'owner' || userRole === 'editor') {
        const f3EditTree = f3Chart.editTree()
          .setFields([
            { id: 'first name', label: t('first_name'), type: 'text' },
            { id: 'last name', label: t('last_name'), type: 'text' },
            { id: 'gender', label: t('gender'), type: 'select', options: [{ value: 'M', label: isFa ? 'مرد' : 'Male' }, { value: 'F', label: isFa ? 'زن' : 'Female' }] },
            { id: 'birthday', label: t('birthday'), type: 'text' }
          ])
          .setEditFirst(true)
          .setLinkExistingRelConfig({
            title: t('profile_exists'),
            select_placeholder: t('select_person'),
            linkRelLabel: (d) => {
              const fName = d.data['first name'] || d.data['firstName'] || '';
              const lName = d.data['last name'] || d.data['lastName'] || '';
              return `${fName} ${lName}`.trim() || 'Unnamed';
            }
          })
          .setOnChange(async () => {
            const updated = f3EditTree.exportData();
            const currentId = currentUser.id || currentUser.Id;
            const updatedWithAddedBy = updated.map(node => {
              if (!node.addedBy) {
                node.addedBy = currentId;
              }
              return node;
            });
            setTempGraphData(updatedWithAddedBy);
            setHasUnsavedChanges(true);

            // Auto-save changes directly to the database in real-time
            try {
              setSaveLoading(true);
              setError('');
              await api.tree.updateGraph(treeId, updatedWithAddedBy);
              setTreeData(updatedWithAddedBy);
              setHasUnsavedChanges(false);

              // Quick success indicator
              const successToast = document.createElement('div');
              successToast.innerHTML = t('changes_saved');
              successToast.style.cssText = `
                position: fixed;
                bottom: 2rem;
                left: 50%;
                transform: translateX(-50%);
                background: var(--success);
                color: white;
                padding: 0.5rem 1.5rem;
                border-radius: 99px;
                z-index: 9999;
                font-weight: 600;
                box-shadow: var(--shadow-md);
                font-size: 0.85rem;
              `;
              document.body.appendChild(successToast);
              setTimeout(() => successToast.remove(), 1200);
            } catch (err) {
              console.error("Auto-save failed:", err);
              setError(err.message || 'Auto-save failed.');
            } finally {
              setSaveLoading(false);
            }
          });
      }

      // Initial Tree Render
      f3Chart.updateTree({ initial: true });

    } catch (err) {
      console.error("D3 Family Chart render error:", err);
    }

    // Cleanup DOM side effects on unmount
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      if (chartInstanceRef.current && chartInstanceRef.current.editTreeInstance) {
        chartInstanceRef.current.editTreeInstance.destroy();
      }
    };
  }, [loading, treeData, userRole, i18n.language, theme]);

  // 3. Save graph back to backend
  const handleSaveTree = async () => {
    try {
      setSaveLoading(true);
      setError('');
      await api.tree.updateGraph(treeId, tempGraphData);
      setTreeData(tempGraphData);
      setHasUnsavedChanges(false);
      
      // Visual indicator toast logic can be placed here
      const checkMark = document.createElement('div');
      checkMark.innerHTML = t('save_success');
      checkMark.style.cssText = `
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
      document.body.appendChild(checkMark);
      setTimeout(() => checkMark.remove(), 2500);

    } catch (err) {
      setError(err.message || 'Failed to save tree changes.');
    } finally {
      setSaveLoading(false);
    }
  };

  // 4. Create first person in empty tree
  const handleAddFirstPerson = async (e) => {
    e.preventDefault();
    if (!firstPerson.firstName.trim() || !firstPerson.lastName.trim()) return;

    const initialId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const initialNode = [{
      id: initialId,
      addedBy: currentUser.id || currentUser.Id,
      data: {
        'first name': firstPerson.firstName,
        'last name': firstPerson.lastName,
        'gender': firstPerson.gender,
        'birthday': firstPerson.birthday
      },
      rels: {
        parents: [],
        spouses: [],
        children: []
      },
      main: true
    }];

    try {
      setSaveLoading(true);
      setError('');
      await api.tree.updateGraph(treeId, initialNode);
      setTreeData(initialNode);
      setTempGraphData(initialNode);
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(err.message || 'Failed to add first family member.');
    } finally {
      setSaveLoading(false);
    }
  };

  // 5. Collaborators add/remove handlers
  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!collabEmail.trim()) return;
    
    try {
      setCollabLoading(true);
      setCollabError('');
      const updatedList = await api.tree.addCollaborator(treeId, collabEmail, collabRole);
      setCollaborators(updatedList);
      setCollabEmail('');
    } catch (err) {
      setCollabError(err.message || 'Failed to add collaborator.');
    } finally {
      setCollabLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    try {
      const updatedList = await api.tree.removeCollaborator(treeId, userId);
      setCollaborators(updatedList);
    } catch (err) {
      setCollabError(err.message || 'Failed to remove collaborator.');
    }
  };

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

    <div className="tree-container" style={{ flexDirection: 'column' }}>
      {/* Top Bar / Header */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 md:gap-4 p-3 md:px-16 lg:px-24 xl:px-32 md:py-3 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] z-20 shrink-0">
        <div className="flex items-center justify-between md:justify-start gap-3 flex-wrap w-full md:w-auto">
          <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={16} style={{ transform: i18n.language === 'fa' ? 'rotate(180deg)' : 'none' }} />
            <span>{t('back_to_dashboard')}</span>
          </Link>
          <div style={{ background: 'var(--bg-primary)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{treeInfo?.name}</span>
            <span style={{ margin: '0 0.5rem', color: 'var(--text-tertiary)' }}>|</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {t('role')}: <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{getRoleLabel(userRole)}</span>
            </span>
          </div>
        </div>

        <div className="flex justify-between md:justify-end gap-4 items-center flex-wrap w-full md:w-auto">
          {/* Real-time Sync Status Indicator */}
          {(userRole === 'owner' || userRole === 'editor') && (
            <div style={{ 
              fontSize: '0.8rem', 
              color: saveLoading ? 'var(--warning)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255,255,255,0.03)',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)'
            }}>
              <span style={{ 
                display: 'inline-block', 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%',
                background: saveLoading ? '#f59e0b' : '#10b981',
                boxShadow: saveLoading ? '0 0 6px #f59e0b' : '0 0 6px #10b981'
              }}></span>
              <span>
                {saveLoading ? t('saving_changes') : t('all_changes_saved')}
              </span>
            </div>
          )}

          <Link
            to={`/tree/${treeId}/calendar`}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
          >
            <span>📅</span>
            <span>{t('calendar')}</span>
          </Link>

          {userRole === 'owner' && (
            <button 
              className="btn btn-secondary"
              onClick={() => setShowCollabModal(true)}
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            >
              <Users size={16} />
              <span>{t('collaborators')} ({collaborators.length})</span>
            </button>
          )}

          <button 
            className="btn btn-secondary"
            onClick={() => {
              fetchHistoryLogs();
              setShowHistorySidebar(true);
            }}
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <History size={16} />
            <span>{t('change_history')}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace (Canvas & Sidebar) */}
      <div style={{ flexGrow: 1, display: 'flex', position: 'relative', minHeight: 0 }}>
        {error && (
          <div style={{ 
            position: 'absolute', 
            top: '1rem', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 100, 
            backgroundColor: '#fee2e2', 
            color: '#dc2626', 
            padding: '0.75rem 1.5rem', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid #fca5a5', 
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Main D3 Canvas Pane */}
        {treeData.length > 0 ? (
          <div ref={containerRef} className="canvas-pane f3" id="FamilyChart" style={{ flexGrow: 1, height: '100%' }}></div>
        ) : loading ? (
          <div className="canvas-pane flex-center" style={{ flexDirection: 'column', gap: '1rem', flexGrow: 1, height: '100%' }}>
            <div className="loading-spinner"></div>
            <span style={{ color: 'var(--text-secondary)' }}>{t('loading_canvas')}</span>
          </div>
        ) : (
          /* Empty Tree Onboarding Screen */
          <div className="canvas-pane flex-center" style={{ background: 'var(--bg-primary)', flexGrow: 1, height: '100%' }}>
            <motion.div 
              className="auth-card" 
              style={{ maxWidth: '520px', padding: '2.5rem', boxShadow: 'var(--shadow-lg)' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '0.5rem' }}>🌳</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{t('create_first_member')}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  {t('empty_tree_onboarding_desc')}
                </p>
              </div>

              <form onSubmit={handleAddFirstPerson}>
                <div className="responsive-form-grid">
                  <div className="form-group">
                    <label className="form-label">{t('first_name')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={firstPerson.firstName}
                      onChange={(e) => setFirstPerson({...firstPerson, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('last_name')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={firstPerson.lastName}
                      onChange={(e) => setFirstPerson({...firstPerson, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="responsive-form-grid">
                  <div className="form-group">
                    <label className="form-label">{t('gender')}</label>
                    <select
                      className="form-input"
                      value={firstPerson.gender}
                      onChange={(e) => setFirstPerson({...firstPerson, gender: e.target.value})}
                    >
                      <option value="M">{t('male')}</option>
                      <option value="F">{t('female')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <DatePicker
                      value={firstPerson.birthday}
                      onChange={(val) => setFirstPerson({...firstPerson, birthday: val})}
                      label={t('birthday')}
                      placeholder={t('birthday_placeholder')}
                    />
                  </div>

                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '1.5rem' }}
                  disabled={saveLoading}
                >
                  {saveLoading ? '...' : t('create_tree')}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Floating Canvas Zoom and navigation instructions */}
        {treeData.length > 0 && (
          <div className="canvas-toolbar hidden md:flex" style={{ bottom: '1.5rem', insetInlineStart: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0 0.5rem', flexWrap: 'wrap' }}>
              <Info size={14} />
              <span>
                {t('canvas_toolbar_instructions')}
                {(userRole === 'owner' || userRole === 'editor') && t('canvas_toolbar_instructions_edit')}
              </span>
            </span>
          </div>
        )}

        {/* Change History Sidebar */}
        <AnimatePresence>
          {showHistorySidebar && (
            <motion.div
              initial={{ opacity: 0, x: isFa ? -350 : 350 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isFa ? -350 : 350 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                insetInlineEnd: 0,
                width: '350px',
                backgroundColor: 'var(--bg-secondary)',
                borderInlineStart: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                backdropFilter: 'blur(12px)'
              }}
            >
              {/* Sidebar Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                  <History size={18} style={{ color: 'var(--accent)' }} />
                  <span>{t('tree_change_history')}</span>
                </h3>
                <button 
                  onClick={() => setShowHistorySidebar(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sidebar Content */}
              <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {historyLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <div className="loading-spinner"></div>
                  </div>
                ) : historyError ? (
                  <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{historyError}</div>
                ) : historyLogs.length > 0 ? (
                  historyLogs.map((log, index) => {
                    const dateVal = new Date(log.timestamp);
                    const formattedDate = dateVal.toLocaleDateString(isFa ? 'fa-IR' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div 
                        key={index} 
                        style={{ 
                          fontSize: '0.82rem', 
                          color: 'var(--text-secondary)', 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '6px', 
                          padding: '0.75rem' 
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{log.changedBy}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{formattedDate}</span>
                        </div>
                        <div style={{ textDirection: 'ltr', textAlign: 'start', marginBottom: '0.25rem' }}>
                          {log.description}
                        </div>
                        <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.25rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{t('history_member_label')}</span>
                          <Link 
                            to={`/tree/${treeId}/profile/${log.personId}`}
                            style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}
                          >
                            {log.personName} ↗
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                    {t('no_history_logs')}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 6. Collaborators Management Modal */}
      <AnimatePresence>
        {showCollabModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}>
            <motion.div
              className="auth-card"
              style={{ maxWidth: '600px', width: '100%', padding: '2.5rem', background: 'white' }}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{t('collaborators')}</h3>
                <button 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  onClick={() => {
                    setShowCollabModal(false);
                    setCollabError('');
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {collabError && (
                <div style={{ 
                  backgroundColor: '#fee2e2', 
                  color: '#dc2626', 
                  padding: '0.75rem 1rem', 
                  borderRadius: 'var(--radius-sm)', 
                  marginBottom: '1rem',
                  fontSize: '0.85rem'
                }}>
                  {collabError}
                </div>
              )}

              {/* Add Collaborator Form */}
              <form onSubmit={handleAddCollaborator} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
                <div style={{ flexGrow: 1 }} className="form-group">
                  <label className="form-label" style={{ marginBottom: '0.25rem' }}>{t('email')}</label>
                  <input
                    type="email"
                    className="form-input"
                    value={collabEmail}
                    onChange={(e) => setCollabEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div style={{ width: '120px' }} className="form-group">
                  <label className="form-label" style={{ marginBottom: '0.25rem' }}>{t('role')}</label>
                  <select 
                    className="form-input" 
                    value={collabRole}
                    onChange={(e) => setCollabRole(e.target.value)}
                  >
                    <option value="editor">{t('editor')}</option>
                    <option value="visitor">{t('visitor')}</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ height: '41px', padding: '0 1.25rem', marginBottom: '1.25rem' }}
                  disabled={collabLoading}
                >
                  <UserPlus size={18} />
                </button>
              </form>

              {/* Active Collaborators list */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                {t('active_collaborations')}
              </h4>

              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {collaborators.map((c) => (
                  <div 
                    key={c.userId} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: '#f8fafc',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.email}</span>
                      <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: c.role === 'owner' ? '#fef3c7' : c.role === 'editor' ? '#d1fae5' : '#e0f2fe', color: c.role === 'owner' ? '#d97706' : c.role === 'editor' ? '#059669' : '#0284c7' }}>
                        {getRoleLabel(c.role)}
                      </span>
                    </div>

                    {c.role !== 'owner' && (
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                        onClick={() => handleRemoveCollaborator(c.userId)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DatePicker Modal Overlay for family-chart birthday input */}
      <AnimatePresence>
        {modalDatePickerOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: 'Vazirmatn, sans-serif'
          }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: '340px',
                background: 'rgba(8, 12, 24, 0.98)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {i18n.language === 'fa' ? 'انتخاب تاریخ تولد' : 'Select Birthday'}
                </h4>
                <button
                  type="button"
                  onClick={() => setModalDatePickerOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.2rem'
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <DatePicker
                  value={modalDatePickerValue}
                  inline={true}
                  onChange={(val) => {
                    setModalDatePickerValue(val);
                    if (targetInputEl) {
                      targetInputEl.value = val;
                      // Trigger input and change events so D3 framework updates internal state
                      targetInputEl.dispatchEvent(new Event('input', { bubbles: true }));
                      targetInputEl.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    setModalDatePickerOpen(false);
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (targetInputEl) {
                      targetInputEl.value = '';
                      targetInputEl.dispatchEvent(new Event('input', { bubbles: true }));
                      targetInputEl.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    setModalDatePickerOpen(false);
                  }}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {i18n.language === 'fa' ? 'پاک کردن' : 'Clear'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Helper role translator */}

      {/* Helper inline style for D3 layout cards */}
      <style>{`
        /* family-chart visual overrides */
        #FamilyChart svg {
          font-family: inherit;
        }
        #FamilyChart .card {
          border-radius: var(--radius-md) !important;
        }
        #FamilyChart .card-inner {
          transition: transform 0.15s ease-in-out !important;
        }
        #FamilyChart .card:hover .card-inner {
          transform: scale(1.02) !important;
        }
        #FamilyChart .view-profile-btn:hover {
          background: #eff6ff !important;
          transform: translateY(-1px);
        }
        #FamilyChart path.link {
          fill: none !important;
          stroke: #cbd5e1 !important;
          stroke-width: 2.5px !important;
        }
        #FamilyChart path.link-active {
          fill: none !important;
          stroke: var(--accent) !important;
        }

        /* Beautiful styling for Add Relative / Placeholder cards */
        #FamilyChart .card-new-rel .card-inner {
          background-color: #f8fafc !important;
          border: 2px dashed #cbd5e1 !important;
          border-radius: var(--radius-md) !important;
          color: var(--text-secondary) !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.5rem !important;
          padding: 0.75rem !important;
          box-shadow: none !important;
          width: 100% !important;
          height: 100% !important;
        }
        #FamilyChart .card-new-rel.card-male .card-inner {
          border-color: rgba(59, 130, 246, 0.4) !important;
          color: #3b82f6 !important;
          background-color: #f0f7ff !important;
        }
        #FamilyChart .card-new-rel.card-female .card-inner {
          border-color: rgba(236, 72, 153, 0.4) !important;
          color: #ec4899 !important;
          background-color: #fdf2f8 !important;
        }
        #FamilyChart .card-new-rel .person-icon {
          width: 32px !important;
          height: 32px !important;
          margin: 0 !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex: 0 0 auto !important;
        }
        #FamilyChart .card-new-rel .person-icon svg {
          width: 100% !important;
          height: 100% !important;
          background-color: transparent !important;
          color: currentColor !important;
        }
        #FamilyChart .card-new-rel .card-label {
          font-size: 0.85rem !important;
          font-weight: 600 !important;
          text-align: center !important;
          margin: 0 !important;
          padding: 0 !important;
          position: static !important;
          transform: none !important;
          background-color: transparent !important;
          color: currentColor !important;
        }

        /* RTL overrides for family-chart edit form */
        [dir="rtl"] #FamilyChart .f3-close-btn {
          left: auto !important;
          right: 10px !important;
        }
        [dir="rtl"] #FamilyChart .f3-form div[style*="text-align: right"] {
          text-align: left !important;
        }
        [dir="rtl"] #FamilyChart .f3-modal-close {
          right: auto !important;
          left: 10px !important;
        }
      `}</style>
    </div>
  );
}

// Role translation helper
const getRoleLabel = (role) => {
  if (role === 'owner') return 'مالک / Owner';
  if (role === 'editor') return 'ویرایشگر / Editor';
  return 'بیننده / Visitor';
};

export default TreeCanvas;
