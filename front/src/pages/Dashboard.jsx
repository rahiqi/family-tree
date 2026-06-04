import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Calendar, User, Users, ChevronRight, FileText, ArrowLeft, GitBranch } from 'lucide-react';
import { api } from '../services/api';

function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [trees, setTrees] = useState([]);
  const [newTreeName, setNewTreeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchTrees();
  }, []);

  const fetchTrees = async () => {
    try {
      setLoading(true);
      const data = await api.tree.getAll();
      setTrees(data);
    } catch (err) {
      setError(err.message || 'Failed to load trees.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTree = async (e) => {
    e.preventDefault();
    if (!newTreeName.trim()) return;

    try {
      setCreateLoading(true);
      setError('');
      const created = await api.tree.create(newTreeName);
      setNewTreeName('');
      setTrees([created, ...trees]);
      // Navigate straight to the new tree canvas
      navigate(`/tree/${created.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create tree.');
    } finally {
      setCreateLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    if (role === 'owner') return t('owner');
    if (role === 'editor') return t('editor');
    return t('visitor');
  };

  const getRoleClass = (role) => {
    if (role === 'owner') return 'badge-owner';
    if (role === 'editor') return 'badge-editor';
    return 'badge-visitor';
  };

  return (
    <div className="layout-container" style={{ paddingBottom: '4rem' }}>
      <div className="dashboard-header">
        <motion.div
          initial={{ opacity: 0, x: i18n.language === 'fa' ? 30 : -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {t('dashboard')}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {i18n.language === 'fa' 
              ? `خوش آمدید، ${currentUser.firstName || ''} ${currentUser.lastName || ''}`
              : `Welcome back, ${currentUser.firstName || ''} ${currentUser.lastName || ''}`}
          </p>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '1.5rem' }}>
        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: '#dc2626', 
            padding: '1rem', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid #fca5a5',
            fontSize: '0.95rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem' }} className="dashboard-layout-responsive">
          {/* Trees Section */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GitBranch size={20} style={{ color: 'var(--accent)' }} />
              {i18n.language === 'fa' ? 'شجره‌نامه‌های شما' : 'Your Family Trees'}
            </h2>

            {loading ? (
              <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="loading-spinner"></div>
                <p style={{ marginTop: '1rem' }}>{i18n.language === 'fa' ? 'در حال بارگذاری...' : 'Loading trees...'}</p>
              </div>
            ) : trees.length === 0 ? (
              <div style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px dashed var(--border-color)', 
                borderRadius: 'var(--radius-lg)', 
                padding: '4rem 2rem', 
                textAlign: 'center' 
              }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🌳</span>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{t('no_trees')}</p>
              </div>
            ) : (
              <div className="tree-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {trees.map((tree, idx) => {
                  const userCollab = tree.collaborators?.find(c => c.userId?.toLowerCase() === currentUser.id?.toLowerCase()) || 
                                     tree.collaborators?.find(c => c.email?.toLowerCase() === currentUser.email?.toLowerCase());
                  const userRole = userCollab?.role || 'owner';
                  
                  return (
                    <motion.div
                      key={tree.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link to={`/tree/${tree.id}`} className="tree-card">
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div className="tree-card-title">{tree.name}</div>
                            <span className={`badge ${getRoleClass(userRole)}`}>
                              {getRoleLabel(userRole)}
                            </span>
                          </div>
                          
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={14} />
                            <span>
                              {i18n.language === 'fa' ? 'آخرین به‌روزرسانی:' : 'Updated:'}{' '}
                              {new Date(tree.updatedAt).toLocaleDateString(i18n.language === 'fa' ? 'fa-IR' : 'en-US')}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {i18n.language === 'fa' ? 'مشاهده و ویرایش' : 'View & Edit'}
                            <ChevronRight size={14} style={{ transform: i18n.language === 'fa' ? 'rotate(180deg)' : 'none' }} />
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                            {tree.collaborators?.length || 1} {i18n.language === 'fa' ? 'عضو همکاری' : 'collab(s)'}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Creation Sidebar */}
          <div>
            <div style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '2rem', 
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-color)'
            }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                {t('create_tree')}
              </h2>
              
              <form onSubmit={handleCreateTree}>
                <div className="form-group">
                  <label className="form-label" htmlFor="tree-name-input">
                    {t('tree_name')}
                  </label>
                  <input
                    id="tree-name-input"
                    type="text"
                    className="form-input"
                    value={newTreeName}
                    onChange={(e) => setNewTreeName(e.target.value)}
                    placeholder={i18n.language === 'fa' ? 'نام درخت خانوادگی...' : 'e.g. Smith Family Tree'}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}
                  disabled={createLoading}
                >
                  <Plus size={18} />
                  <span>{createLoading ? '...' : t('create_tree')}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded style query for CSS layout changes */}
      <style>{`
        @media (max-width: 768px) {
          .dashboard-layout-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
