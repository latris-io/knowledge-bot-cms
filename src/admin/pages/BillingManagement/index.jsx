import React, { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

const BillingManagement = () => {
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showPricingToggle, setShowPricingToggle] = useState('monthly');
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState({});
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { get, post, put } = useFetchClient();

  const fetchBillingData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      
      const response = await get('/api/users-permissions/billing/management/overview');
      setBillingData(response.data?.data || response.data);
      
      // Fetch notification preferences if company exists
      if (response.data?.company?.id) {
        await fetchNotificationPreferences(response.data.company.id);
      }
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load billing information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchNotificationPreferences = async (companyId) => {
    try {
      const response = await get(`/api/users-permissions/billing/notification-preferences/${companyId}`);
      setNotifications(response.data || {});
    } catch (err) {
      console.warn('Failed to load notification preferences:', err);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handlePlanUpgrade = async (planLevel) => {
    if (!billingData || !billingData.company || !billingData.company.id) {
      alert('Loading billing information. Please wait a moment and try again.');
      return;
    }
    
    try {
      setProcessing(true);
      const response = await post('/api/users-permissions/billing/checkout/create', {
        planLevel,
        companyId: billingData.company.id,
        pricingType: showPricingToggle
      });
      
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        alert('Plan upgrade initiated successfully!');
        await fetchBillingData(true);
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to initiate upgrade');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      // Create download link that opens in new tab as a simpler approach
      const downloadUrl = `/api/users-permissions/billing/invoice/${invoiceId}/download`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `invoice-${invoiceId}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to download invoice');
    }
  };

  const handleManagePaymentMethods = async () => {
    try {
      setProcessing(true);
      const response = await post('/api/users-permissions/billing/customer-portal', {
        companyId: billingData.company.id
      });
      
      if (response.data.portalUrl) {
        window.open(response.data.portalUrl, '_blank');
      }
    } catch (err) {
      alert('Failed to open payment management portal');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setProcessing(true);
      await post('/api/users-permissions/billing/cancel', {
        companyId: billingData.company.id
      });
      
      alert('Subscription canceled successfully. You\'ll retain access until your current period ends.');
      setShowCancelModal(false);
      await fetchBillingData(true);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to cancel subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setProcessing(true);
      await post('/api/users-permissions/billing/reactivate', {
        companyId: billingData.company.id
      });
      
      alert('Subscription reactivated successfully!');
      await fetchBillingData(true);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to reactivate subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateNotifications = async (settings) => {
    try {
      await put(`/api/users-permissions/billing/notification-preferences/${billingData.company.id}`, settings);
      setNotifications(settings);
      alert('Notification preferences updated successfully!');
    } catch (err) {
      alert('Failed to update notification preferences');
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCurrency = (amount, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const getStatusColor = (status) => {
    const colors = {
      trial: '#6366f1',
      active: '#10b981',
      past_due: '#f59e0b',
      canceled: '#ef4444',
      unpaid: '#ef4444'
    };
    return colors[status] || colors.trial;
  };

  const getStatusLabel = (status) => {
    const labels = {
      trial: 'FREE TRIAL',
      active: 'ACTIVE',
      past_due: 'PAST DUE',
      canceled: 'CANCELED',
      unpaid: 'UNPAID'
    };
    return labels[status] || labels.trial;
  };

  const planFeatures = {
    starter: { 
      name: 'Starter', 
      monthlyPrice: 49, 
      annualPrice: 39,
      storage: '2GB',
      users: '5 users',
      features: [
        'Basic AI Chat Support',
        'File Upload & Management',
        'Standard Analytics',
        'Email Support',
        'Basic API Access'
      ]
    },
    professional: { 
      name: 'Professional', 
      monthlyPrice: 149, 
      annualPrice: 119,
      storage: '20GB',
      users: '25 users',
      features: [
        'Advanced AI Chat Features',
        'Priority File Processing',
        'Advanced Analytics & Reports',
        'Priority Email Support',
        'Full API Access',
        'Custom Domain Support',
        'Advanced Integrations',
        'Team Collaboration Tools'
      ]
    },
    enterprise: { 
      name: 'Enterprise', 
      monthlyPrice: 499, 
      annualPrice: 399,
      storage: '100GB',
      users: 'Unlimited',
      features: [
        'Enterprise AI Chat',
        'Unlimited File Processing',
        'Enterprise Analytics',
        '24/7 Phone & Email Support',
        'Enterprise API Access',
        'Custom Domain & Branding',
        'Advanced Security Features',
        'Dedicated Account Manager',
        'Custom Integrations',
        'SLA Guarantee',
        'Advanced User Management',
        'Audit Logs & Compliance'
      ]
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: 'white',
      padding: '2rem'
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
      marginBottom: '1rem'
    },
    title: {
      fontSize: '3rem',
      fontWeight: '900',
      background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      marginBottom: '1rem',
      textAlign: 'center'
    },
    button: {
      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      color: 'white',
      border: 'none',
      padding: '1rem 2rem',
      borderRadius: '12px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
      margin: '0.5rem'
    },
    dangerButton: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: 'white',
      border: 'none',
      padding: '1rem 2rem',
      borderRadius: '12px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
      margin: '0.5rem'
    },
    successButton: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      padding: '1rem 2rem',
      borderRadius: '12px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
      margin: '0.5rem'
    },
    tabButton: {
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      padding: '0.75rem 1.5rem',
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: '500',
      cursor: 'pointer',
      margin: '0.25rem'
    },
    activeTab: {
      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
    },
    refreshButton: {
      position: 'absolute',
      top: '2rem',
      right: '2rem',
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      color: 'white',
      padding: '0.75rem 1.5rem',
      borderRadius: '50px',
      fontWeight: '600',
      cursor: 'pointer'
    },
    statusBadge: {
      padding: '0.5rem 1rem',
      borderRadius: '50px',
      fontSize: '0.8rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      display: 'inline-block',
      marginLeft: '1rem'
    },
    progressBar: {
      position: 'relative',
      height: '12px',
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '6px',
      overflow: 'hidden',
      margin: '1rem 0'
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
      borderRadius: '6px',
      transition: 'width 0.3s ease'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '2rem',
      marginBottom: '2rem'
    },
    twoColumnGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem'
    },
    loader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      fontSize: '1.2rem'
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '24px',
      padding: '3rem',
      maxWidth: '500px',
      width: '90%',
      color: 'white'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loader}>
          <div>Loading your billing information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Error Loading Billing Data</h2>
          <p style={{ marginBottom: '2rem' }}>{error}</p>
          <button style={styles.button} onClick={() => fetchBillingData()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const storageUsed = Number(billingData?.usage?.storageUsed) || 0;
  const storageLimit = Number(billingData?.usage?.storageLimit) || 2147483648;
  const storagePercentage = (storageUsed / storageLimit) * 100;
  const userCount = Number(billingData?.usage?.userCount) || 0;
  const currentPlan = billingData?.subscription?.planLevel || 'starter';
  const subscriptionStatus = billingData?.subscription?.status || 'trial';
  const trialDays = billingData?.subscription?.trialDaysRemaining || 0;

  // Calculate user percentage based on plan limits
  const planUserLimit = planFeatures[currentPlan]?.users === 'Unlimited' ? null : 
    (currentPlan === 'starter' ? 5 : currentPlan === 'professional' ? 25 : 999);
  const userPercentage = planUserLimit ? (userCount / planUserLimit) * 100 : 0;

  return (
    <div style={styles.container}>
      <button
        onClick={() => fetchBillingData(true)}
        disabled={refreshing}
        style={styles.refreshButton}
      >
        🔄 {refreshing ? 'Loading...' : 'Refresh'}
      </button>

      <h1 style={styles.title}>Billing & Subscription Management</h1>

      {/* Navigation Tabs */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        {['overview', 'plans', 'history', 'settings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab ? styles.activeTab : {})
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Current Plan Status */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
              {planFeatures[currentPlan]?.name || 'Starter'} Plan
              <span style={{
                ...styles.statusBadge,
                background: getStatusColor(subscriptionStatus),
                color: 'white'
              }}>
                {getStatusLabel(subscriptionStatus)}
              </span>
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem' }}>
              {subscriptionStatus === 'trial' 
                ? `${trialDays} days remaining in your free trial`
                : billingData?.subscription?.currentPeriodEnd 
                  ? `Next billing: ${new Date(billingData.subscription.currentPeriodEnd).toLocaleDateString()}`
                  : 'Manage your subscription settings'
              }
            </p>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>
                {subscriptionStatus === 'trial' ? 'Free' : 
                  `$${planFeatures[currentPlan]?.[showPricingToggle === 'monthly' ? 'monthlyPrice' : 'annualPrice']}`}
          </div>
        </div>

        {/* Trial Warning */}
        {subscriptionStatus === 'trial' && trialDays <= 3 && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            ⚠️ <strong>Trial ending soon:</strong> Your trial expires in {trialDays} days. Choose a plan to continue using the service.
          </div>
        )}

            {/* Usage Statistics */}
            <div style={styles.twoColumnGrid}>
        {/* Storage Usage */}
              <div style={styles.smallCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.5rem', margin: 0 }}>📁 Storage Usage</h3>
            <span style={{ fontSize: '1.1rem' }}>
              {formatBytes(storageUsed)} / {formatBytes(storageLimit)}
            </span>
          </div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                      width: `${Math.min(storagePercentage, 100)}%`,
                      background: storagePercentage > 90 ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' :
                        storagePercentage > 70 ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' :
                        'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
              {storagePercentage.toFixed(1)}% used
            </span>
            {storagePercentage > 80 && (
              <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                ⚠️ Approaching limit
              </span>
            )}
          </div>
              </div>

              {/* User Count */}
              <div style={styles.smallCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.5rem', margin: 0 }}>👥 Team Members</h3>
                  <span style={{ fontSize: '1.1rem' }}>
                    {userCount} / {planFeatures[currentPlan]?.users}
                  </span>
                </div>
                {planUserLimit && (
                  <>
                    <div style={styles.progressBar}>
                      <div 
                        style={{
                          ...styles.progressFill,
                          width: `${Math.min(userPercentage, 100)}%`,
                          background: userPercentage > 90 ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' :
                            userPercentage > 70 ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' :
                            'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                        {userPercentage.toFixed(1)}% of limit
                      </span>
                      {userPercentage > 80 && (
                        <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                          ⚠️ Near limit
                        </span>
                      )}
                    </div>
                  </>
                )}
                {!planUserLimit && (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0', opacity: 0.7 }}>
                    <span style={{ fontSize: '2rem' }}>∞</span><br />
                    <span style={{ fontSize: '0.9rem' }}>Unlimited users</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
              <button style={styles.button} onClick={handleManagePaymentMethods}>
                💳 Manage Payment Methods
              </button>
              {subscriptionStatus === 'active' && (
                <button 
                  style={styles.dangerButton} 
                  onClick={() => setShowCancelModal(true)}
                >
                  ❌ Cancel Subscription
                </button>
              )}
              {subscriptionStatus === 'canceled' && (
                <button style={styles.successButton} onClick={handleReactivateSubscription}>
                  ✅ Reactivate Subscription
                </button>
              )}
              <button style={styles.button} onClick={() => setActiveTab('plans')}>
                📈 View All Plans
              </button>
            </div>
          </div>
        </>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <>
          {/* Pricing Toggle */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50px',
              padding: '0.5rem',
              display: 'inline-flex'
            }}>
              <button
                onClick={() => setShowPricingToggle('monthly')}
                style={{
                  ...styles.tabButton,
                  margin: 0,
                  borderRadius: '50px',
                  ...(showPricingToggle === 'monthly' ? styles.activeTab : {})
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setShowPricingToggle('annual')}
                style={{
                  ...styles.tabButton,
                  margin: 0,
                  borderRadius: '50px',
                  ...(showPricingToggle === 'annual' ? styles.activeTab : {})
                }}
              >
                Annual (Save 20%)
              </button>
        </div>
      </div>

      {/* Available Plans */}
      <div style={styles.card}>
            <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>Choose Your Plan</h2>
        <div style={styles.grid}>
          {Object.entries(planFeatures).map(([key, plan]) => (
            <div
              key={key}
              style={{
                background: currentPlan === key 
                  ? 'rgba(99, 102, 241, 0.2)' 
                  : 'rgba(255, 255, 255, 0.1)',
                border: currentPlan === key 
                  ? '2px solid #6366f1' 
                  : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '2rem',
                    textAlign: 'center',
                    position: 'relative'
              }}
            >
                  {key === 'professional' && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '50px',
                      fontSize: '0.8rem',
                      fontWeight: '700'
                    }}>
                      MOST POPULAR
                    </div>
                  )}
                  
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{plan.name}</h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '0.5rem' }}>
                    ${showPricingToggle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                    <span style={{ fontSize: '1rem', opacity: 0.7 }}>
                      /{showPricingToggle === 'monthly' ? 'month' : 'month'}
                    </span>
                  </div>
                  {showPricingToggle === 'annual' && (
                    <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '1rem' }}>
                      Billed annually (${plan.annualPrice * 12}/year)
                    </div>
                  )}
                  <div style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.8 }}>
                    📁 {plan.storage} storage • 👥 {plan.users}
                  </div>
                  
                  {/* Feature List */}
                  <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                    {plan.features.map((feature, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem'
                      }}>
                        <span style={{ color: '#10b981', marginRight: '0.5rem' }}>✓</span>
                        {feature}
              </div>
                    ))}
              </div>
              
              {currentPlan === key ? (
                <div style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '12px',
                  fontWeight: '700'
                }}>
                  ✅ Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handlePlanUpgrade(key)}
                  disabled={processing || !billingData || loading}
                  style={{
                    ...styles.button,
                    width: '100%',
                    opacity: (processing || !billingData || loading) ? 0.6 : 1,
                    cursor: (processing || !billingData || loading) ? 'not-allowed' : 'pointer'
                  }}
                >
                      {subscriptionStatus === 'trial' ? 'Start Plan' : 
                       key === 'starter' && ['professional', 'enterprise'].includes(currentPlan) ? 'Downgrade' :
                       'Upgrade'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
        </>
      )}

      {/* Billing History Tab */}
      {activeTab === 'history' && (
      <div style={styles.card}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>Billing History</h2>
          {billingData?.invoices && billingData.invoices.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Amount</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {billingData.invoices.map((invoice) => (
                    <tr key={invoice.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <td style={{ padding: '1rem' }}>
                        {new Date(invoice.created).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem' }}>{invoice.description}</td>
                      <td style={{ padding: '1rem' }}>
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          ...styles.statusBadge,
                          background: invoice.status === 'paid' ? '#10b981' : 
                            invoice.status === 'open' ? '#f59e0b' : '#ef4444',
                          color: 'white',
                          marginLeft: 0
                        }}>
                          {invoice.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
          <button
                          onClick={() => handleDownloadInvoice(invoice.id)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          📄 Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.7 }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
              <h3>No billing history yet</h3>
              <p>Your invoices and payment history will appear here once you have an active subscription.</p>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div style={styles.card}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>Billing Settings</h2>
          
          {/* Notification Preferences */}
          <div style={styles.smallCard}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📧 Email Notifications</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {[
                { key: 'invoiceReminders', label: 'Invoice reminders', description: 'Get notified before invoices are due' },
                { key: 'paymentFailures', label: 'Payment failures', description: 'Alert me when payments fail' },
                { key: 'planChanges', label: 'Plan changes', description: 'Notify me of subscription changes' },
                { key: 'usageAlerts', label: 'Usage alerts', description: 'Warn me when approaching limits' }
              ].map(setting => (
                <div key={setting.key} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{setting.label}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>{setting.description}</div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={notifications[setting.key] || false}
                      onChange={(e) => {
                        const newSettings = { ...notifications, [setting.key]: e.target.checked };
                        handleUpdateNotifications(newSettings);
                      }}
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        marginRight: '0.5rem',
                        accentColor: '#6366f1'
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Account Management */}
          <div style={styles.smallCard}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⚙️ Account Management</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <button style={styles.button} onClick={handleManagePaymentMethods}>
                💳 Manage Payment Methods
              </button>
              <button 
                style={styles.button} 
                onClick={() => window.open('mailto:support@knowledgebot.com?subject=Account Support Request', '_blank')}
          >
            📧 Contact Support
          </button>
          <button
                style={styles.button} 
                onClick={() => window.open('/admin/content-manager/collectionType/api::company.company', '_blank')}
          >
                🏢 Company Settings
          </button>
        </div>
      </div>

          {/* Danger Zone */}
          {subscriptionStatus === 'active' && (
            <div style={{
              ...styles.smallCard,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ef4444' }}>⚠️ Danger Zone</h3>
              <p style={{ marginBottom: '1rem', opacity: 0.8 }}>
                Cancel your subscription. You'll retain access until your current billing period ends on{' '}
                {billingData?.subscription?.currentPeriodEnd 
                  ? new Date(billingData.subscription.currentPeriodEnd).toLocaleDateString()
                  : 'the end of your current period'}.
              </p>
              <button 
                style={styles.dangerButton} 
                onClick={() => setShowCancelModal(true)}
              >
                Cancel Subscription
              </button>
            </div>
          )}
        </div>
      )}

      {/* Company Info Footer */}
      {billingData?.company && (
        <div style={{ ...styles.card, textAlign: 'center', opacity: 0.8 }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            Company: <strong>{billingData.company.name}</strong>
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Cancel Subscription</h3>
            <p style={{ marginBottom: '2rem', lineHeight: '1.6' }}>
              Are you sure you want to cancel your subscription? You'll retain access to all features until your current billing period ends on{' '}
              {billingData?.subscription?.currentPeriodEnd 
                ? new Date(billingData.subscription.currentPeriodEnd).toLocaleDateString()
                : 'the end of your current period'}.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={styles.button}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={processing}
                style={styles.dangerButton}
              >
                {processing ? 'Canceling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingManagement; 
 
 
 
 
 