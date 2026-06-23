import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Calendar, User, Users, ChevronRight, FileText, ArrowLeft, GitBranch, Trash2 } from 'lucide-react';
import { api } from '../services/api';

function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [trees, setTrees] = useState([]);
  const [newTreeName, setNewTreeName] = useState('');
  const [newTreeIsPublic, setNewTreeIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.id || currentUser.Id;
  const currentUserEmail = currentUser.email || currentUser.Email;

  useEffect(() => {
    fetchTrees();
  }, []);

  const fetchTrees = async () => {
    try {
      setLoading(true);
      const data = await api.tree.getAll();
      const mappedData = data.map(t => ({
        ...t,
        isPublic: t.isPublic ?? false
      }));
      setTrees(mappedData);
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
      const created = await api.tree.create(newTreeName, newTreeIsPublic);
      const mappedCreated = {
        ...created,
        isPublic: created.isPublic ?? false
      };
      setNewTreeName('');
      setNewTreeIsPublic(false);
      setTrees([mappedCreated, ...trees]);
      // Navigate straight to the new tree canvas
      navigate(`/tree/${created.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create tree.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleTogglePrivacy = async (e, treeId, currentIsPublic) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      setError('');
      const updated = await api.tree.updatePrivacy(treeId, !currentIsPublic);
      setTrees(prevTrees => prevTrees.map(t => t.id === treeId ? { ...t, isPublic: updated.isPublic } : t));
    } catch (err) {
      setError(err.message || 'Failed to update tree privacy.');
    }
  };

  const handleDeleteTree = async (e, treeId, treeName) => {
    e.stopPropagation();
    e.preventDefault();
    
    const confirmMessage = t('delete_confirm', { name: treeName });
    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      setError('');
      await api.tree.delete(treeId);
      setTrees(prevTrees => prevTrees.filter(t => t.id !== treeId));
      
      // Toast notification
      const successToast = document.createElement('div');
      successToast.innerHTML = t('delete_success');
      successToast.style.cssText = `
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
        text-align: center;
        font-size: 0.9rem;
      `;
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete family tree.');
    } finally {
      setLoading(false);
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

      <div className="grid grid-cols-1 gap-8 mt-6">
        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          {/* Trees Section */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GitBranch size={20} style={{ color: 'var(--accent)' }} />
              {t('your_trees')}
            </h2>

            {loading ? (
              <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="loading-spinner"></div>
                <p style={{ marginTop: '1rem' }}>{t('loading_trees')}</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-16">
                {trees.map((tree, idx) => {
                  const userCollab = tree.collaborators?.find(c => c.userId && currentUserId && c.userId.toLowerCase() === currentUserId.toLowerCase()) || 
                                     tree.collaborators?.find(c => c.email && currentUserEmail && c.email.toLowerCase() === currentUserEmail.toLowerCase());
                  const userRole = userCollab?.role || 'owner';
                  const isPublic = !!tree.isPublic;
                  
                  return (
                    <motion.div
                       key={tree.id}
                       initial={{ opacity: 0, y: 15 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: idx * 0.05 }}
                    >
                      <Link to={`/tree/${tree.id}`} className="tree-card">
                        <div>
                          <div style={{ marginBottom: '1.25rem' }}>
                            <div className="tree-card-title" style={{ fontSize: '1.25rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tree.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                              <span className={`badge ${getRoleClass(userRole)}`} style={{ margin: 0 }}>
                                {getRoleLabel(userRole)}
                              </span>
                              {userRole === 'owner' ? (
                                <>
                                  <button
                                    onClick={(e) => handleTogglePrivacy(e, tree.id, isPublic)}
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: 'var(--radius-sm)',
                                      padding: '0.2rem 0.5rem',
                                      color: isPublic ? 'var(--success)' : 'var(--text-tertiary)',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      fontSize: '0.75rem',
                                      transition: 'all 0.2s',
                                      fontWeight: 500
                                    }}
                                    title={isPublic ? (i18n.language === 'fa' ? 'عمومی (قابل مشاهده برای همه) - کلیک برای خصوصی کردن' : 'Public (visible to everyone) - Click to make Private') : (i18n.language === 'fa' ? 'خصوصی (فقط برای همکاران) - کلیک برای عمومی کردن' : 'Private (collaborators only) - Click to make Public')}
                                  >
                                    <span>{isPublic ? '🌐' : '🔒'}</span>
                                    <span>{isPublic ? t('public') : t('private')}</span>
                                  </button>

                                  <button
                                    onClick={(e) => handleDeleteTree(e, tree.id, tree.name)}
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.08)',
                                      border: '1px solid rgba(239, 68, 68, 0.2)',
                                      borderRadius: 'var(--radius-sm)',
                                      padding: '0.2rem 0.4rem',
                                      color: 'var(--danger)',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      fontSize: '0.75rem',
                                      transition: 'all 0.2s',
                                      fontWeight: 500
                                    }}
                                    title={t('delete')}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              ) : (
                                <span
                                  style={{
                                    padding: '0.2rem 0.5rem',
                                    color: isPublic ? 'var(--success)' : 'var(--text-tertiary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 500
                                  }}
                                >
                                  <span>{isPublic ? '🌐' : '🔒'}</span>
                                  <span>{isPublic ? t('public') : t('private')}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={14} />
                            <span>
                              {t('updated_label')}{' '}
                              {new Date(tree.updatedAt).toLocaleDateString(i18n.language === 'fa' ? 'fa-IR' : 'en-US')}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {t('view_and_edit')}
                            <ChevronRight size={14} style={{ transform: i18n.language === 'fa' ? 'rotate(180deg)' : 'none' }} />
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                            {tree.collaborators?.length === 1 
                              ? t('collab_count_one') 
                              : t('collab_count_other', { count: tree.collaborators?.length || 1 })}
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
                    placeholder={t('tree_name_placeholder')}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.4rem', display: 'block' }}>
                    {t('access_level')}
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '0.25rem', 
                    background: 'rgba(0,0,0,0.2)', 
                    padding: '0.2rem', 
                    borderRadius: 'var(--radius-sm)', 
                    border: '1px solid var(--border-color)' 
                  }}>
                    <button
                      type="button"
                      onClick={() => setNewTreeIsPublic(false)}
                      style={{
                        padding: '0.4rem 0',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        background: !newTreeIsPublic ? 'var(--accent)' : 'transparent',
                        color: !newTreeIsPublic ? 'white' : 'var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      🔒 {t('private')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTreeIsPublic(true)}
                      style={{
                        padding: '0.4rem 0',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        background: newTreeIsPublic ? 'var(--accent)' : 'transparent',
                        color: newTreeIsPublic ? 'white' : 'var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      🌐 {t('public')}
                    </button>
                  </div>
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
    </div>
  );
}

export default Dashboard;
