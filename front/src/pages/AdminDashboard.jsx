import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, GitBranch, BookOpen, Calendar, Shield, Trash2, 
  Edit, Search, Check, AlertTriangle, Activity, X 
} from 'lucide-react';
import { api } from '../services/api';

function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'fa';

  const [activeTab, setActiveTab] = useState('overview'); // overview, users, trees
  
  // Stats state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Trees state
  const [trees, setTrees] = useState([]);
  const [treesLoading, setTreesLoading] = useState(false);
  const [treeSearch, setTreeSearch] = useState('');

  // Modals / Actions state
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Tree Name Modal
  const [editingTree, setEditingTree] = useState(null);
  const [newTreeName, setNewTreeName] = useState('');

  // Load Overview Stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setError('');
      const res = await api.admin.getStats();
      setStats(res);
    } catch (err) {
      setError(err.message || 'Failed to load statistics.');
    } finally {
      setStatsLoading(false);
    }
  };

  // Load Users List
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setError('');
      const res = await api.admin.getUsers();
      setUsers(res || []);
    } catch (err) {
      setError(err.message || 'Failed to load users list.');
    } finally {
      setUsersLoading(false);
    }
  };

  // Load Trees List
  const fetchTrees = async () => {
    try {
      setTreesLoading(true);
      setError('');
      const res = await api.admin.getTrees();
      setTrees(res || []);
    } catch (err) {
      setError(err.message || 'Failed to load family trees list.');
    } finally {
      setTreesLoading(false);
    }
  };

  // Trigger loads based on active tab
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'trees') {
      fetchTrees();
    }
  }, [activeTab]);

  // Handle Super Admin Role Toggle
  const handleToggleAdmin = async (userId, currentStatus) => {
    const confirmMessage = currentStatus ? t('remove_admin_confirm') : t('make_admin_confirm');
    if (!window.confirm(confirmMessage)) return;

    try {
      setActionLoading(true);
      setError('');
      await api.admin.updateUser(userId, { isSuperAdmin: !currentStatus });
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuperAdmin: !currentStatus } : u));
    } catch (err) {
      setError(err.message || 'Failed to update user role.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId) => {
    if (!window.confirm(t('delete_user_confirm'))) return;

    try {
      setActionLoading(true);
      setError('');
      await api.admin.deleteUser(userId);
      
      // Update local state
      setUsers(prev => prev.filter(u => u.id !== userId));
      // Refresh stats if they are loaded
      if (stats) fetchStats();
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Tree Name
  const handleOpenEditTree = (tree) => {
    setEditingTree(tree);
    setNewTreeName(tree.name);
  };

  const handleUpdateTree = async (e) => {
    e.preventDefault();
    if (!editingTree || !newTreeName.trim()) return;

    try {
      setActionLoading(true);
      setError('');
      await api.admin.updateTree(editingTree.id, { name: newTreeName.trim() });
      
      // Update local state
      setTrees(prev => prev.map(t => t.id === editingTree.id ? { ...t, name: newTreeName.trim() } : t));
      setEditingTree(null);
    } catch (err) {
      setError(err.message || 'Failed to update family tree.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Tree
  const handleDeleteTree = async (treeId) => {
    if (!window.confirm(t('delete_tree_confirm'))) return;

    try {
      setActionLoading(true);
      setError('');
      await api.admin.deleteTree(treeId);
      
      // Update local state
      setTrees(prev => prev.filter(t => t.id !== treeId));
      if (stats) fetchStats();
    } catch (err) {
      setError(err.message || 'Failed to delete family tree.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtering lists
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.firstName + ' ' + u.lastName).toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredTrees = trees.filter(t => 
    t.name.toLowerCase().includes(treeSearch.toLowerCase()) ||
    t.ownerEmail.toLowerCase().includes(treeSearch.toLowerCase())
  );

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={28} style={{ color: 'var(--accent)' }} />
            <span>{t('admin_panel')}</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {isRtl ? 'مدیریت و نظارت بر کل سیستم شجره‌نامه‌ها، کاربران و رویدادها' : 'System-wide monitoring and management of trees, users, and events'}
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.25rem' }}>
          <button 
            onClick={() => setActiveTab('overview')}
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', border: 'none', borderRadius: '8px' }}
          >
            {t('admin_overview')}
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', border: 'none', borderRadius: '8px', marginInlineStart: '0.25rem' }}
          >
            {t('admin_users')}
          </button>
          <button 
            onClick={() => setActiveTab('trees')}
            className={`btn ${activeTab === 'trees' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', border: 'none', borderRadius: '8px', marginInlineStart: '0.25rem' }}
          >
            {t('admin_trees')}
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {statsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                  
                  {/* Users Stats */}
                  <div style={{ 
                    padding: '1.5rem', 
                    borderRadius: '16px', 
                    border: '1px solid var(--border-color)', 
                    background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.05) 0%, rgba(129, 140, 248, 0.01) 100%)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('total_users')}</span>
                      <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>{stats?.totalUsers ?? 0}</h2>
                    </div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(129, 140, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                      <Users size={22} />
                    </div>
                  </div>

                  {/* Trees Stats */}
                  <div style={{ 
                    padding: '1.5rem', 
                    borderRadius: '16px', 
                    border: '1px solid var(--border-color)', 
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.01) 100%)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('total_trees')}</span>
                      <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>{stats?.totalTrees ?? 0}</h2>
                    </div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                      <GitBranch size={22} />
                    </div>
                  </div>

                  {/* Profiles Stats */}
                  <div style={{ 
                    padding: '1.5rem', 
                    borderRadius: '16px', 
                    border: '1px solid var(--border-color)', 
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.01) 100%)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('total_profiles')}</span>
                      <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>{stats?.totalProfiles ?? 0}</h2>
                    </div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                      <BookOpen size={22} />
                    </div>
                  </div>

                  {/* Parties Stats */}
                  <div style={{ 
                    padding: '1.5rem', 
                    borderRadius: '16px', 
                    border: '1px solid var(--border-color)', 
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(249, 115, 22, 0.01) 100%)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('total_parties')}</span>
                      <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>{stats?.totalParties ?? 0}</h2>
                    </div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(249, 115, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}>
                      <Calendar size={22} />
                    </div>
                  </div>

                </div>

                {/* System Health */}
                <div style={{ padding: '2rem', border: '1px solid var(--border-color)', borderRadius: '16px', background: 'var(--bg-secondary)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                    <Activity size={18} style={{ color: 'var(--accent)' }} />
                    <span>{t('system_status')}</span>
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Database Status:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem', color: '#22c55e', fontWeight: 600, fontSize: '0.9rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                        <span>MongoDB Connect ({t('healthy')})</span>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Backend Framework:</span>
                      <div style={{ marginTop: '0.25rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        .NET 10.0 Web API
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Frontend Build:</span>
                      <div style={{ marginTop: '0.25rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        React + Vite (RTL/LTR Adaptive)
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </motion.div>
        )}

        {/* Tab 2: Users Management */}
        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: '400px' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder={t('search_users')}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ paddingInlineStart: '2.5rem', height: '40px', fontSize: '0.88rem' }}
              />
              <Search size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.85rem', color: 'var(--text-secondary)' }} />
            </div>

            {usersLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'start' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('email')}</th>
                        <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('first_name')}</th>
                        <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('last_name')}</th>
                        <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('registered_at')}</th>
                        <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('role')}</th>
                        <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s' }} className="table-row-hover">
                            <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {user.email}
                              <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                                {user.hasGoogle && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px' }}>Google</span>}
                                {user.hasTelegram && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '4px' }}>Telegram</span>}
                                {user.hasPassword && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '4px' }}>Credentials</span>}
                              </div>
                            </td>
                            <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{user.firstName}</td>
                            <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{user.lastName}</td>
                            <td style={{ padding: '1rem', color: 'var(--text-tertiary)' }}>
                              {new Date(user.createdAt).toLocaleDateString(isRtl ? 'fa-IR' : 'en-US')}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <button 
                                onClick={() => handleToggleAdmin(user.id, user.isSuperAdmin)}
                                disabled={actionLoading}
                                style={{
                                  padding: '0.25rem 0.65rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  border: '1px solid var(--border-color)',
                                  backgroundColor: user.isSuperAdmin ? 'rgba(129, 140, 248, 0.15)' : 'transparent',
                                  color: user.isSuperAdmin ? 'var(--accent)' : 'var(--text-secondary)'
                                }}
                              >
                                {user.isSuperAdmin ? t('role_superadmin') : t('role_user')}
                              </button>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={actionLoading}
                                className="btn-icon"
                                style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem' }}
                                title={t('delete')}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                            {t('no_events_found')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 3: Trees Management */}
        {activeTab === 'trees' && (
          <motion.div
            key="trees"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: '400px' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder={t('search_trees')}
                value={treeSearch}
                onChange={(e) => setTreeSearch(e.target.value)}
                style={{ paddingInlineStart: '2.5rem', height: '40px', fontSize: '0.88rem' }}
              />
              <Search size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.85rem', color: 'var(--text-secondary)' }} />
            </div>

            {treesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'start' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('tree_name')}</th>
                        <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('tree_owner')}</th>
                        <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('members_count')}</th>
                        <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('collaborators_count')}</th>
                        <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('visibility')}</th>
                        <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('updated_label')}</th>
                        <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrees.length > 0 ? (
                        filteredTrees.map((tree) => (
                          <tr key={tree.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s' }} className="table-row-hover">
                            <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>{tree.name}</td>
                            <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{tree.ownerEmail}</td>
                            <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{tree.membersCount}</td>
                            <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{tree.collaboratorsCount}</td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '0.15rem 0.5rem',
                                fontSize: '0.75rem',
                                borderRadius: '4px',
                                backgroundColor: tree.isPublic ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                color: tree.isPublic ? '#22c55e' : 'var(--text-secondary)',
                                fontWeight: 600
                              }}>
                                {tree.isPublic ? t('public') : t('private')}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', color: 'var(--text-tertiary)' }}>
                              {new Date(tree.updatedAt).toLocaleDateString(isRtl ? 'fa-IR' : 'en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                <Link 
                                  to={`/tree/${tree.id}`}
                                  className="btn btn-secondary"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                >
                                  {t('view_tree_canvas')}
                                </Link>
                                <button 
                                  onClick={() => handleOpenEditTree(tree)}
                                  className="btn btn-secondary"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                >
                                  <Edit size={12} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTree(tree.id)}
                                  disabled={actionLoading}
                                  className="btn btn-secondary"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: 'var(--danger)' }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                            {t('no_events_found')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* Edit Tree Name Modal Overlay */}
      <AnimatePresence>
        {editingTree && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              style={{
                width: '100%',
                maxWidth: '450px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.75rem',
                boxShadow: 'var(--shadow-xl)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t('edit_tree_name')}
                </h3>
                <button 
                  onClick={() => setEditingTree(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateTree} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' }}>
                    {t('tree_name')}
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={newTreeName}
                    onChange={(e) => setNewTreeName(e.target.value)}
                    required
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setEditingTree(null)}
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={actionLoading || !newTreeName.trim()}
                  >
                    {actionLoading ? '...' : t('save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default AdminDashboard;
