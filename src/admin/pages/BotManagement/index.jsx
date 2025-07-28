import React, { useState, useEffect } from 'react';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';

const BotManagement = () => {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBot, setEditingBot] = useState(null);
  const [copiedTokenId, setCopiedTokenId] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    processing_enabled: true,
    auto_correction_enabled: false,
    max_retry_attempts: 3,
    retry_delay_minutes: 5
  });

  const { get, post, put, del } = useFetchClient();
  const { toggleNotification } = useNotification();

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      setLoading(true);
      const response = await get('/api/bot-management/list');
      console.log('📊 Bot Management - Fetched bots:', response.data);
      setBots(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bots:', error);
      toggleNotification({
        type: 'warning',
        message: error.message || 'Failed to load bots'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBot) {
        await put(`/api/bot-management/${editingBot.documentId || editingBot.id}`, { data: formData });
        toggleNotification({
          type: 'success',
          message: 'Bot updated successfully'
        });
      } else {
        await post('/api/bot-management/create', { data: formData });
        toggleNotification({
          type: 'success',
          message: 'Bot created successfully'
        });
      }
      setIsModalOpen(false);
      resetForm();
      fetchBots();
    } catch (error) {
      console.error('Error saving bot:', error);
      toggleNotification({
        type: 'danger',
        message: 'Failed to save bot'
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bot?')) {
      try {
        await del(`/api/bot-management/${id}`);
        toggleNotification({
          type: 'success',
          message: 'Bot deleted successfully'
        });
        fetchBots();
      } catch (error) {
        console.error('Error deleting bot:', error);
        // Extract the error message from the response
        const errorMessage = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           error.message || 
                           'Failed to delete bot';
        toggleNotification({
          type: 'danger',
          message: errorMessage,
          timeout: 999999  // Very long timeout (effectively persistent)
        });
      }
    }
  };

  const handleEdit = (bot) => {
    console.log('📝 Bot Management - Editing bot:', bot);
    setEditingBot(bot);
    setFormData({
      name: bot.name || '',
      description: bot.description || '',
      processing_enabled: bot.processing_enabled || false,
      auto_correction_enabled: bot.auto_correction_enabled || false,
      max_retry_attempts: bot.max_retry_attempts || 3,
      retry_delay_minutes: bot.retry_delay_minutes || 5
    });
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (bot) => {
    console.log('👁️ Bot Management - Viewing bot:', bot);
    setEditingBot(bot);
    setFormData({
      name: bot.name || '',
      description: bot.description || '',
      processing_enabled: bot.processing_enabled || false,
      auto_correction_enabled: bot.auto_correction_enabled || false,
      max_retry_attempts: bot.max_retry_attempts || 3,
      retry_delay_minutes: bot.retry_delay_minutes || 5
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleCopyToken = (bot) => {
    if (bot.jwt_token) {
      navigator.clipboard.writeText(bot.jwt_token);
      setCopiedTokenId(bot.documentId || bot.id);
      toggleNotification({
        type: 'success',
        message: 'JWT token copied to clipboard!'
      });
      setTimeout(() => setCopiedTokenId(null), 3000);
    }
  };

  const resetForm = () => {
    setEditingBot(null);
    setIsViewMode(false);
    setFormData({
      name: '',
      description: '',
      processing_enabled: true,
      auto_correction_enabled: false,
      max_retry_attempts: 3,
      retry_delay_minutes: 5
    });
  };

  // Updated styles with larger, contemporary fonts
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: 'white',
      padding: '2rem',
      fontSize: '18px' // Base font size increased
    },
    card: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      padding: '3rem',
      marginBottom: '2rem'
    },
    smallCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '16px',
      padding: '2rem',
      marginBottom: '1.5rem',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      fontSize: '16px'
    },
    title: {
      fontSize: '4rem',
      fontWeight: '900',
      background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      marginBottom: '2rem',
      textAlign: 'center',
      letterSpacing: '-0.02em'
    },
    button: {
      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      color: 'white',
      border: 'none',
      padding: '1.2rem 2.5rem',
      borderRadius: '12px',
      fontSize: '1.2rem',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
      margin: '0.5rem',
      transition: 'all 0.3s ease',
      letterSpacing: '-0.01em'
    },
    dangerButton: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: 'white',
      border: 'none',
      padding: '0.9rem 1.8rem',
      borderRadius: '12px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
      margin: '0.5rem',
      transition: 'all 0.3s ease'
    },
    secondaryButton: {
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      color: 'white',
      padding: '0.9rem 1.8rem',
      borderRadius: '12px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      margin: '0.5rem',
      transition: 'all 0.3s ease',
      letterSpacing: '-0.01em'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '3rem',
      maxWidth: '700px',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    },
    formGroup: {
      marginBottom: '2rem'
    },
    label: {
      display: 'block',
      marginBottom: '0.75rem',
      fontWeight: '600',
      color: '#4b5563',
      fontSize: '1.1rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    input: {
      width: '100%',
      padding: '1rem 1.25rem',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      fontSize: '1.2rem',
      background: 'white',
      color: '#1f2937',
      transition: 'all 0.3s ease'
    },
    textarea: {
      width: '100%',
      padding: '1rem 1.25rem',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      fontSize: '1.2rem',
      background: 'white',
      color: '#1f2937',
      minHeight: '120px',
      resize: 'vertical',
      transition: 'all 0.3s ease'
    },
    checkbox: {
      width: '24px',
      height: '24px',
      marginRight: '1rem',
      cursor: 'pointer'
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      fontSize: '1.2rem',
      color: '#4b5563',
      marginBottom: '1.25rem'
    },
    statusBadge: {
      padding: '0.6rem 1.2rem',
      borderRadius: '50px',
      fontSize: '1rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      display: 'inline-block'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
      gap: '2rem',
      marginBottom: '2rem'
    },
    loader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      fontSize: '1.2rem'
    },
    emptyState: {
      textAlign: 'center',
      padding: '4rem'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loader}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
            <p>Loading your bots...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Bot Management</h1>
      
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Your AI Bots</h2>
            <p style={{ opacity: 0.8 }}>Create and manage bots for your knowledge system</p>
          </div>
          <button
            style={styles.button}
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.4)';
            }}
          >
            🤖 Create New Bot
          </button>
        </div>

        {bots.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem', opacity: 0.5 }}>🤖</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600' }}>No bots created yet</h3>
            <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Create your first bot to get started with your AI knowledge system</p>
            <button
              style={styles.button}
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
            >
              Create Your First Bot
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {bots.map((bot) => (
              <div 
                key={bot.documentId || bot.id} 
                style={styles.smallCard}
                onClick={() => handleView(bot)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 30px 60px -15px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', letterSpacing: '-0.03em' }}>
                      <span style={{ fontSize: '3.5rem', marginRight: '1rem' }}>🤖</span>
                      {bot.name}
                    </h3>
                    <p style={{ opacity: 0.9, fontSize: '1.5rem', lineHeight: '1.8', fontWeight: '400' }}>
                      {bot.description || 'No description provided'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <span style={{ 
                    ...styles.statusBadge,
                    background: bot.processing_enabled ? '#10b981' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '1.2rem',
                    padding: '0.75rem 1.75rem'
                  }}>
                    {bot.processing_enabled ? '⚡ Active' : '💤 Inactive'}
                  </span>
                  <span style={{ 
                    ...styles.statusBadge,
                    background: bot.auto_correction_enabled ? '#6366f1' : '#6b7280',
                    color: 'white',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '1.2rem',
                    padding: '0.75rem 1.75rem'
                  }}>
                    {bot.auto_correction_enabled ? '🔄 Auto-Correction' : '🔧 Manual Mode'}
                  </span>
                </div>

                {bot.jwt_token && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginTop: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <label style={{ 
                        fontSize: '1rem', 
                        fontWeight: '600', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        opacity: 0.8
                      }}>
                        🔑 JWT Token
                      </label>
                      <button
                        type="button"
                        style={{
                          background: copiedTokenId === (bot.documentId || bot.id) 
                            ? 'rgba(16, 185, 129, 0.2)' 
                            : 'rgba(255, 255, 255, 0.2)',
                          border: `1px solid ${copiedTokenId === (bot.documentId || bot.id) 
                            ? '#10b981' 
                            : 'rgba(255, 255, 255, 0.3)'}`,
                          borderRadius: '8px',
                          padding: '0.4rem 1rem',
                          fontSize: '0.95rem',
                          color: copiedTokenId === (bot.documentId || bot.id) ? '#10b981' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyToken(bot);
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = copiedTokenId === (bot.documentId || bot.id) 
                            ? 'rgba(16, 185, 129, 0.2)' 
                            : 'rgba(255, 255, 255, 0.2)';
                        }}
                      >
                        {copiedTokenId === (bot.documentId || bot.id) ? '✓ Copied!' : '📋 Copy'}
                      </button>
                    </div>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      wordBreak: 'break-all',
                      opacity: 0.9,
                      lineHeight: '1.4',
                      maxHeight: '80px',
                      overflow: 'auto',
                      padding: '0.5rem',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '8px'
                    }}>
                      {bot.jwt_token}
                    </div>
                  </div>
                )}

                <div style={{ 
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)', 
                  paddingTop: '1rem',
                  marginTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '1.4rem', opacity: 0.9, fontWeight: '600' }}>
                    <span style={{ marginRight: '0.75rem', fontSize: '1.6rem' }}>🔄</span>
                    {bot.max_retry_attempts || 0} retries • {bot.retry_delay_minutes || 0}min delay
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      style={styles.secondaryButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(bot);
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      style={styles.dangerButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(bot.documentId || bot.id);
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)';
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={styles.modal} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              marginBottom: '2rem',
              color: '#1f2937'
            }}>
              {isViewMode ? '👁️ View Bot Details' : (editingBot ? '✏️ Edit Bot' : '🤖 Create New Bot')}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Bot Name *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Customer Support Bot"
                  required
                  disabled={isViewMode}
                  onFocus={(e) => {
                    if (!isViewMode) {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  style={styles.textarea}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this bot does..."
                  disabled={isViewMode}
                  onFocus={(e) => {
                    if (!isViewMode) {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ 
                background: '#f9fafb', 
                borderRadius: '12px', 
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                  Bot Settings
                </h3>
                
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    style={styles.checkbox}
                    checked={formData.processing_enabled}
                    onChange={(e) => setFormData({ ...formData, processing_enabled: e.target.checked })}
                    disabled={isViewMode}
                  />
                  Enable Processing
                </label>

                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    style={styles.checkbox}
                    checked={formData.auto_correction_enabled}
                    onChange={(e) => setFormData({ ...formData, auto_correction_enabled: e.target.checked })}
                    disabled={isViewMode}
                  />
                  Enable Auto Correction
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Max Retry Attempts</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={formData.max_retry_attempts}
                    onChange={(e) => setFormData({ ...formData, max_retry_attempts: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="10"
                    disabled={isViewMode}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Retry Delay (minutes)</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={formData.retry_delay_minutes}
                    onChange={(e) => setFormData({ ...formData, retry_delay_minutes: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="60"
                    disabled={isViewMode}
                  />
                </div>
              </div>

              {editingBot && editingBot.jwt_token && (
                <div style={{
                  background: '#f9fafb',
                  borderRadius: '12px',
                  padding: '2rem',
                  marginBottom: '2rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <label style={{ 
                      fontSize: '1.3rem', 
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      🔑 JWT Token (Read-only)
                    </label>
                    <button
                      type="button"
                      style={{
                        background: copiedTokenId === (editingBot.documentId || editingBot.id) 
                          ? '#10b981' 
                          : '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.75rem 1.5rem',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontWeight: '500'
                      }}
                      onClick={() => handleCopyToken(editingBot)}
                    >
                      {copiedTokenId === (editingBot.documentId || editingBot.id) ? '✓ Copied!' : '📋 Copy Token'}
                    </button>
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    wordBreak: 'break-all',
                    color: '#6b7280',
                    lineHeight: '1.6',
                    maxHeight: '150px',
                    overflow: 'auto',
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {editingBot.jwt_token}
              </div>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#9ca3af',
                    marginTop: '0.75rem',
                    marginBottom: '0'
                  }}>
                    This token is automatically generated and cannot be edited.
                  </p>
              </div>
              )}

              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '1rem', 
                marginTop: '2rem',
                paddingTop: '2rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  type="button"
                  style={{
                    ...styles.secondaryButton,
                    background: '#f3f4f6',
                    color: '#6b7280',
                    border: '1px solid #e5e7eb'
                  }}
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsViewMode(false);
                  }}
                >
                  {isViewMode ? 'Close' : 'Cancel'}
                </button>
                {isViewMode ? (
                  <button
                    type="button"
                    style={styles.button}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsViewMode(false);
                    }}
                  >
                    ✏️ Edit Bot
                  </button>
                ) : (
                <button
                  type="submit"
                  style={styles.button}
                >
                  {editingBot ? 'Update Bot' : 'Create Bot'}
                </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotManagement; 