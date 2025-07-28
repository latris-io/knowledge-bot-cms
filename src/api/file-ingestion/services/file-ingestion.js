'use strict';

/**
 * file-ingestion service
 * Business logic for file ingestion APIs
 */

module.exports = {
  /**
   * Get default preferences based on company settings
   */
  getDefaultPreferences(company, user) {
    return {
      notifications: {
        enabled: company.default_notifications_enabled ?? true,
        channel: "email",
        frequency: "immediate",
        emailFormat: "detailed",
        includeFailures: true,
        includeSuccesses: true,
        groupingWindow: (company.default_notification_delay_minutes || 2) * 60
      },
      emailSettings: {
        primaryEmail: user.email,
        ccEmails: [`manager@${user.email.split('@')[1]}`],
        replyTo: "support@company.com"
      },
      batchProcessing: {
        batchSizeThreshold: company.default_batch_size_threshold || 10,
        maxBatchWaitTime: 300 // 5 minutes
      },
      quotas: {
        daily: company.notification_quota_daily || 100,
        monthly: company.notification_quota_monthly || 1000
      }
    };
  },

  /**
   * Create a batch session ID
   */
  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Check if a file should be processed
   */
  async shouldProcessFile(file, bot) {
    // Check file type
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/msword'
    ];
    
    if (!supportedTypes.includes(file.mime)) {
      return { shouldProcess: false, reason: 'Unsupported file type' };
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return { shouldProcess: false, reason: 'File too large (max 50MB)' };
    }

    // Check bot processing settings
    if (!bot || !bot.processing_enabled) {
      return { shouldProcess: false, reason: 'Processing disabled for bot' };
    }

    return { shouldProcess: true };
  },

  /**
   * Format file event for ingestion service
   */
  formatFileEventForIngestion(fileEvent, file) {
    return {
      eventId: fileEvent.id,
      eventType: fileEvent.event_type,
      fileId: file.id,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.mime,
      uploadedAt: file.createdAt,
      botId: fileEvent.bot_id,
      companyId: fileEvent.company_id,
      userId: fileEvent.user_id,
      retryAttempt: fileEvent.retry_attempt || 0,
      metadata: {
        documentId: file.documentId,
        url: file.url,
        provider: file.provider
      }
    };
  },

  /**
   * Calculate processing metrics
   */
  calculateProcessingMetrics(fileEvents) {
    const metrics = {
      totalEvents: fileEvents.length,
      byStatus: {},
      byType: {},
      avgProcessingTime: 0,
      successRate: 0
    };

    // Count by status
    fileEvents.forEach(event => {
      const status = event.processing_status || 'pending';
      metrics.byStatus[status] = (metrics.byStatus[status] || 0) + 1;
      
      const type = event.file_type || 'unknown';
      metrics.byType[type] = (metrics.byType[type] || 0) + 1;
    });

    // Calculate average processing time
    const processedEvents = fileEvents.filter(e => e.processing_time_seconds);
    if (processedEvents.length > 0) {
      const totalTime = processedEvents.reduce((sum, e) => sum + e.processing_time_seconds, 0);
      metrics.avgProcessingTime = Math.round(totalTime / processedEvents.length);
    }

    // Calculate success rate
    const completedEvents = fileEvents.filter(e => e.processing_status === 'completed');
    if (fileEvents.length > 0) {
      metrics.successRate = Math.round((completedEvents.length / fileEvents.length) * 100);
    }

    return metrics;
  }
}; 