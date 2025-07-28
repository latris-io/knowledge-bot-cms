import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Flex,
  Button,
  Loader
} from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';

// Custom icon components
const ExclamationMarkCircle = ({ color = 'currentColor', ...props }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <path d="M12 8V12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="16" r="1" fill={color}/>
  </svg>
);

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Refresh = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 8C14 11.3137 11.3137 14 8 14C5.5 14 3.5 12.5 2.5 10.5M2 8C2 4.68629 4.68629 2 8 2C10.5 2 12.5 3.5 13.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 5V9H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 11V7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ProgressBar = ({ value, color = 'primary600', height = 4 }) => (
  <Box
    background="neutral150"
    hasRadius
    style={{ height: `${height}px`, overflow: 'hidden' }}
  >
    <Box
      background={color}
      style={{
        width: `${Math.min(value, 100)}%`,
        height: '100%',
        transition: 'width 0.3s ease'
      }}
    />
  </Box>
);

const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: { bg: 'success100', color: 'success600', text: 'ACTIVE' },
    trial: { bg: 'secondary100', color: 'secondary600', text: 'TRIAL' },
    past_due: { bg: 'warning100', color: 'warning600', text: 'PAST DUE' },
    canceled: { bg: 'danger100', color: 'danger600', text: 'CANCELED' },
    unpaid: { bg: 'danger100', color: 'danger600', text: 'UNPAID' }
  };

  const config = statusConfig[status] || statusConfig.trial;

  return (
    <Box
      background={config.bg}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      paddingRight={2}
      hasRadius
    >
      <Typography variant="pi" textColor={config.color} fontWeight="bold">
        {config.text}
      </Typography>
    </Box>
  );
};

const SubscriptionUsageWidget = () => {
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);

  const { get } = useFetchClient();

  const fetchUsageData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      
      const response = await get('/subscription/usage/dashboard');
      setUsageData(response.data);
      setError(null);
      setLastUpdate(Date.now());
    } catch (err) {
      console.error('Failed to fetch usage data:', err);
      setError(err.response?.data?.error?.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
    const interval = setInterval(() => fetchUsageData(), 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'danger600';
    if (percentage >= 70) return 'warning600';
    return 'success600';
  };

  const handleRefresh = () => {
    fetchUsageData(true);
  };

  const handleViewBilling = () => {
    // Navigate to billing management (you can implement this based on your routing)
    window.location.href = '/admin/settings/subscription-billing';
  };

  const handleUpgrade = () => {
    if (usageData?.upgradeUrl) {
      window.open(usageData.upgradeUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <Box 
        background="neutral0" 
        padding={6} 
        shadow="filterShadow" 
        hasRadius
        style={{ minHeight: '200px' }}
      >
        <Flex direction="column" alignItems="center" justifyContent="center" gap={3}>
          <Loader />
          <Typography variant="omega" textColor="neutral600">
            Loading subscription data...
          </Typography>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
        <Flex direction="column" gap={3}>
          <Flex alignItems="center" gap={2}>
            <ExclamationMarkCircle color="danger600" />
            <Typography variant="sigma" textColor="danger600">
              Subscription Usage
            </Typography>
          </Flex>
          <Typography variant="omega" textColor="neutral600">
            {error}
          </Typography>
          <Button size="S" variant="secondary" onClick={handleRefresh}>
            Try Again
          </Button>
        </Flex>
      </Box>
    );
  }

  if (!usageData) {
    return (
      <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
        <Typography variant="omega" textColor="neutral600">
          No subscription data available
        </Typography>
      </Box>
    );
  }

  const storagePercentage = usageData.usagePercentages?.storage || 0;
  const userPercentage = usageData.usagePercentages?.users || 0;
  const isNearLimit = storagePercentage > 80 || userPercentage > 80;

  return (
    <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
      {/* Header */}
      <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
        <Typography variant="sigma" textColor="neutral600">
          Subscription Usage
        </Typography>
        <Button
          size="S"
          variant="ghost"
          onClick={handleRefresh}
          disabled={refreshing}
          startIcon={<Refresh />}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Flex>

      {/* Plan and Status */}
      <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
        <Box>
          <Typography variant="omega" fontWeight="bold" textColor="neutral800">
            {usageData.planLevel?.charAt(0).toUpperCase() + usageData.planLevel?.slice(1)} Plan
          </Typography>
          <Typography variant="pi" textColor="neutral600">
            {usageData.companyName}
          </Typography>
        </Box>
        <StatusBadge status={usageData.subscriptionStatus} />
      </Flex>

      {/* Storage Usage */}
      <Box marginBottom={4}>
        <Flex justifyContent="space-between" alignItems="center" marginBottom={2}>
          <Typography variant="pi" textColor="neutral600">
            Storage Used
          </Typography>
          <Typography variant="pi" textColor="neutral800" fontWeight="semiBold">
            {formatBytes(usageData.storageUsed)} / {formatBytes(usageData.storageLimit)}
          </Typography>
        </Flex>
        <ProgressBar 
          value={storagePercentage} 
          color={getUsageColor(storagePercentage)}
          height={6}
        />
        <Flex justifyContent="space-between" alignItems="center" marginTop={1}>
          <Typography variant="pi" textColor="neutral600">
            {storagePercentage.toFixed(1)}% used
          </Typography>
          {storagePercentage > 90 && (
            <Typography variant="pi" textColor="danger600" fontWeight="semiBold">
              Limit exceeded!
            </Typography>
          )}
        </Flex>
      </Box>

      {/* User Count (if plan has user limits) */}
      {usageData.planLimits?.maxUsers > 0 && (
        <Box marginBottom={4}>
          <Flex justifyContent="space-between" alignItems="center" marginBottom={2}>
            <Typography variant="pi" textColor="neutral600">
              Users
            </Typography>
            <Typography variant="pi" textColor="neutral800" fontWeight="semiBold">
              {usageData.userCount} / {usageData.planLimits.maxUsers}
            </Typography>
          </Flex>
          <ProgressBar 
            value={userPercentage} 
            color={getUsageColor(userPercentage)}
            height={6}
          />
          <Typography variant="pi" textColor="neutral600" marginTop={1}>
            {userPercentage.toFixed(1)}% used
          </Typography>
        </Box>
      )}

      {/* Next Billing Date */}
      {usageData.nextBillingDate && usageData.subscriptionStatus === 'active' && (
        <Box marginBottom={4}>
          <Typography variant="pi" textColor="neutral600">
            Next billing: {new Date(usageData.nextBillingDate).toLocaleDateString()}
          </Typography>
        </Box>
      )}

      {/* Warning Messages */}
      {isNearLimit && (
        <Box 
          background="warning100" 
          padding={3} 
          marginBottom={4} 
          hasRadius
        >
          <Flex alignItems="center" gap={2}>
            <ExclamationMarkCircle color="warning600" />
            <Typography variant="pi" textColor="warning600">
              {storagePercentage > 90 ? 'Storage limit exceeded' : 'Approaching plan limits'}
            </Typography>
          </Flex>
        </Box>
      )}

      {/* Action Buttons */}
      <Flex gap={2} style={{ flexWrap: 'wrap' }}>
        <Button 
          size="S" 
          variant="secondary" 
          onClick={handleViewBilling}
          endIcon={<ArrowRight />}
        >
          View Billing
        </Button>
        {isNearLimit && (
          <Button 
            size="S" 
            variant="default"
            onClick={handleUpgrade}
          >
            Upgrade Plan
          </Button>
        )}
      </Flex>

      {/* Last Updated */}
      <Box marginTop={3}>
        <Typography variant="pi" textColor="neutral500">
          Last updated: {Math.round((Date.now() - lastUpdate) / 1000)}s ago
        </Typography>
      </Box>
    </Box>
  );
};

export default SubscriptionUsageWidget; 
 
 
 
 
 