'use strict';

/**
 * file-ingestion controller
 * Provides APIs for the external file ingestion service
 */

module.exports = {
  /**
   * Get user email
   * GET /api/users/{userId}/email
   */
  async getUserEmail(ctx) {
    try {
      const { userId } = ctx.params;

      if (!userId) {
        return ctx.badRequest('User ID is required');
      }

      // Get user
      const user = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        userId,
        { fields: ['email'] }
      );

      if (!user) {
        return ctx.notFound('User not found');
      }

      return ctx.send({
        email: user.email
      });
    } catch (error) {
      strapi.log.error('Error fetching user email:', error);
      return ctx.internalServerError('Failed to fetch user email');
    }
  },

  /**
   * Get user preferences with email
   * GET /api/users/{userId}/preferences?companyId={companyId}&botId={botId}
   */
  async getUserPreferences(ctx) {
    try {
      const { userId } = ctx.params;
      const { companyId, botId } = ctx.query;

      // Validate required parameters
      if (!userId || !companyId || !botId) {
        return ctx.badRequest('Missing required parameters: userId, companyId, and botId are required');
      }

      // Get user with company relationship and all preference fields
      const user = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        userId,
        { 
          populate: ['company'],
          fields: [
            'email',
            'notification_channel',
            'notification_frequency',
            'email_format',
            'include_failures',
            'include_successes',
            'include_processing',
            'cc_email',
            'notification_grouping_window'
          ]
        }
      );

      if (!user) {
        return ctx.notFound('User not found');
      }

      // Verify user belongs to the specified company
      if (user.company?.id !== parseInt(companyId)) {
        return ctx.forbidden('User does not belong to the specified company');
      }

      // Get company with all fields including email settings
      const company = await strapi.entityService.findOne(
        'api::company.company',
        companyId,
        { 
          fields: [
            'name',
            'default_notifications_enabled',
            'default_batch_size_threshold',
            'default_notification_delay_minutes',
            'notification_quota_daily',
            'notification_quota_monthly'
          ]
        }
      );

      if (!company) {
        return ctx.notFound('Company not found');
      }

      // Get bot information
      const bot = await strapi.entityService.findOne(
        'api::bot.bot',
        botId,
        { fields: ['name', 'processing_enabled'] }
      );

      if (!bot) {
        return ctx.notFound('Bot not found');
      }

      // Build comprehensive response using actual data
      const response = {
        email: user.email,
        preferences: {
          notifications: {
            enabled: user.notification_channel ? true : (company.default_notifications_enabled ?? true),
            channel: user.notification_channel || null,
            frequency: user.notification_frequency || null,
            emailFormat: user.email_format || null,
            includeFailures: user.include_failures ?? false,
            includeSuccesses: user.include_successes ?? false,
            includeProcessing: user.include_processing ?? false,
            groupingWindow: user.notification_grouping_window || null
          },
          emailSettings: {
            primaryEmail: user.email,
            ccEmails: user.cc_email ? [user.cc_email] : []
          }
        },
        company: {
          id: parseInt(companyId)
        },
        bot: {
          id: parseInt(botId),
          name: bot.name
        }
      };

      return ctx.send(response);
    } catch (error) {
      strapi.log.error('Error fetching user preferences:', error);
      return ctx.internalServerError('Failed to fetch user preferences');
    }
  },

  /**
   * Batch user lookup
   * POST /api/users/batch-lookup
   */
  async batchUserLookup(ctx) {
    try {
      const { userIds, fields = ['email', 'preferences'], context } = ctx.request.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return ctx.badRequest('userIds array is required and must not be empty');
      }

      if (!context || !context.companyId || !context.botId) {
        return ctx.badRequest('context with companyId and botId is required');
      }

      // Get company information with email settings
      const company = await strapi.entityService.findOne(
        'api::company.company',
        context.companyId,
        { 
          fields: [
            'name',
            'default_notifications_enabled',
            'default_batch_size_threshold',
            'default_notification_delay_minutes'
          ]
        }
      );

      if (!company) {
        return ctx.notFound('Company not found');
      }

      // Get users with company relationship and all preference fields
      const users = await strapi.entityService.findMany(
        'plugin::users-permissions.user',
        {
          filters: {
            id: {
              $in: userIds
            },
            company: {
              id: context.companyId
            }
          },
          fields: [
            'id',
            'email',
            'notification_channel',
            'notification_frequency',
            'email_format',
            'include_failures',
            'include_successes',
            'include_processing',
            'cc_email',
            'notification_grouping_window'
          ],
          populate: ['company']
        }
      );

      // Build response
      const usersMap = {};
      
      users.forEach(user => {
        const userResponse = {
          email: user.email
        };

        // Include preferences if requested
        if (fields.includes('preferences')) {
          userResponse.preferences = {
            notifications: {
              enabled: user.notification_channel ? true : (company.default_notifications_enabled ?? true),
              channel: user.notification_channel || null,
              frequency: user.notification_frequency || null,
              emailFormat: user.email_format || null,
              includeFailures: user.include_failures ?? false,
              includeSuccesses: user.include_successes ?? false,
              includeProcessing: user.include_processing ?? false,
              groupingWindow: user.notification_grouping_window || null
            },
            emailSettings: {
              ccEmails: user.cc_email ? [user.cc_email] : []
            }
          };
        }

        usersMap[user.id] = userResponse;
      });

      const response = {
        users: usersMap
      };

      return ctx.send(response);
    } catch (error) {
      strapi.log.error('Error in batch user lookup:', error);
      return ctx.internalServerError('Failed to perform batch user lookup');
    }
  },

  /**
   * Update user preferences (updates user-specific settings)
   * PUT /api/users/{userId}/preferences
   */
  async updateUserPreferences(ctx) {
    try {
      const { userId } = ctx.params;
      const { preferences } = ctx.request.body;

      if (!preferences) {
        return ctx.badRequest('Preferences object is required');
      }

      // Get user with company
      const user = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        userId,
        { populate: ['company'] }
      );

      if (!user) {
        return ctx.notFound('User not found');
      }

      if (!user.company) {
        return ctx.badRequest('User must be assigned to a company');
      }

      // Update user notification settings
      const updateData = {};
      
      if (preferences.notifications) {
        if (preferences.notifications.channel !== undefined) {
          updateData.notification_channel = preferences.notifications.channel;
        }
        if (preferences.notifications.frequency !== undefined) {
          updateData.notification_frequency = preferences.notifications.frequency;
        }
        if (preferences.notifications.emailFormat !== undefined) {
          updateData.email_format = preferences.notifications.emailFormat;
        }
        if (preferences.notifications.includeFailures !== undefined) {
          updateData.include_failures = preferences.notifications.includeFailures;
        }
        if (preferences.notifications.includeSuccesses !== undefined) {
          updateData.include_successes = preferences.notifications.includeSuccesses;
        }
        if (preferences.notifications.includeProcessing !== undefined) {
          updateData.include_processing = preferences.notifications.includeProcessing;
        }
        if (preferences.notifications.groupingWindow !== undefined) {
          updateData.notification_grouping_window = preferences.notifications.groupingWindow;
        }
      }

      if (preferences.emailSettings && preferences.emailSettings.ccEmails !== undefined) {
        // If ccEmails is an array, take the first email, otherwise use as is
        updateData.cc_email = Array.isArray(preferences.emailSettings.ccEmails) 
          ? preferences.emailSettings.ccEmails[0] || null
          : preferences.emailSettings.ccEmails;
      }

      const updatedUser = await strapi.entityService.update(
        'plugin::users-permissions.user',
        userId,
        {
          data: updateData
        }
      );

      return ctx.send({ 
        message: 'Preferences updated successfully',
        preferences: preferences 
      });
    } catch (error) {
      strapi.log.error('Error updating user preferences:', error);
      return ctx.internalServerError('Failed to update user preferences');
    }
  },

  /**
   * Get batch processing status
   * GET /api/batch/{batchId}/status
   */
  async getBatchStatus(ctx) {
    try {
      const { batchId } = ctx.params;

      if (!batchId) {
        return ctx.badRequest('Batch ID is required');
      }

      // This is a mock implementation
      // In production, this would query your batch processing tables
      const batchStatus = {
        batchId: batchId,
        status: 'processing',
        totalFiles: 25,
        processedFiles: 15,
        successfulFiles: 14,
        failedFiles: 1,
        startTime: new Date(Date.now() - 300000).toISOString(),
        estimatedCompletionTime: new Date(Date.now() + 300000).toISOString(),
        files: [
          {
            fileId: 'file_123',
            fileName: 'document1.pdf',
            status: 'success',
            processingTime: 45,
            chunksCreated: 12
          },
          {
            fileId: 'file_124',
            fileName: 'document2.pdf',
            status: 'failed',
            error: 'File format not supported',
            processingTime: 10
          }
        ]
      };

      return ctx.send(batchStatus);
    } catch (error) {
      strapi.log.error('Error fetching batch status:', error);
      return ctx.internalServerError('Failed to fetch batch status');
    }
  },

  /**
   * Get file processing status
   * GET /api/files/{fileId}/status
   */
  async getFileStatus(ctx) {
    try {
      const { fileId } = ctx.params;

      if (!fileId) {
        return ctx.badRequest('File ID is required');
      }

      // Find the file
      const file = await strapi.entityService.findOne(
        'plugin::upload.file',
        fileId,
        { populate: ['user', 'bot', 'company'] }
      );

      if (!file) {
        return ctx.notFound('File not found');
      }

      // Check for related file events
      const fileEvents = await strapi.entityService.findMany(
        'api::file-event.file-event',
        {
          filters: {
            file_document_id: file.documentId || fileId
          },
          sort: { createdAt: 'desc' },
          limit: 1
        }
      );

      const latestEvent = fileEvents[0];

      // Build status response
      const fileStatus = {
        fileId: fileId,
        fileName: file.name,
        status: latestEvent?.processing_status || 'pending',
        uploadTime: file.createdAt,
        processingStage: latestEvent?.processing_status || 'pending',
        processingDetails: {
          startTime: latestEvent?.processing_started_at,
          endTime: latestEvent?.processing_completed_at,
          duration: latestEvent?.processing_time_seconds,
          chunksCreated: latestEvent?.chunks_created || 0,
          errorMessage: latestEvent?.error_message || null
        },
        metadata: {
          size: file.size,
          mimeType: file.mime,
          botId: file.bot?.id,
          companyId: file.company?.id,
          userId: file.user?.id
        }
      };

      return ctx.send(fileStatus);
    } catch (error) {
      strapi.log.error('Error fetching file status:', error);
      return ctx.internalServerError('Failed to fetch file status');
    }
  },

  /**
   * Retry failed file processing
   * POST /api/files/{fileId}/retry
   */
  async retryFileProcessing(ctx) {
    try {
      const { fileId } = ctx.params;

      if (!fileId) {
        return ctx.badRequest('File ID is required');
      }

      // Verify file exists
      const file = await strapi.entityService.findOne(
        'plugin::upload.file',
        fileId,
        { populate: ['user', 'bot', 'company'] }
      );

      if (!file) {
        return ctx.notFound('File not found');
      }

      // Create a new file event for reprocessing
      const newEvent = await strapi.entityService.create(
        'api::file-event.file-event',
        {
          data: {
            event_type: 'retry',
            processed: false,
            file_document_id: file.documentId || fileId,
            bot_id: file.bot?.id,
            company_id: file.company?.id,
            user_id: file.user?.id,
            file_name: file.name,
            file_type: file.ext,
            file_size: file.size,
            processing_status: 'queued',
            retry_attempt: 1
          }
        }
      );

      return ctx.send({
        message: 'File reprocessing initiated',
        eventId: newEvent.id,
        fileId: fileId,
        status: 'queued'
      });
    } catch (error) {
      strapi.log.error('Error retrying file processing:', error);
      return ctx.internalServerError('Failed to retry file processing');
    }
  },

  /**
   * Get processing statistics
   * GET /api/stats/processing?companyId={companyId}&botId={botId}&timeRange={timeRange}
   */
  async getProcessingStats(ctx) {
    try {
      const { companyId, botId, timeRange = '24h' } = ctx.query;

      if (!companyId || !botId) {
        return ctx.badRequest('Company ID and Bot ID are required');
      }

      // Calculate time range
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '1h':
          startDate.setHours(now.getHours() - 1);
          break;
        case '24h':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        default:
          startDate.setDate(now.getDate() - 1);
      }

      // Get file events for the time range
      const fileEvents = await strapi.entityService.findMany(
        'api::file-event.file-event',
        {
          filters: {
            company_id: companyId,
            bot_id: botId,
            createdAt: {
              $gte: startDate.toISOString()
            }
          }
        }
      );

      // Calculate statistics
      const stats = {
        timeRange: timeRange,
        period: {
          start: startDate.toISOString(),
          end: now.toISOString()
        },
        summary: {
          totalFiles: fileEvents.length,
          processedFiles: fileEvents.filter(e => e.processing_status === 'completed').length,
          pendingFiles: fileEvents.filter(e => ['pending', 'queued', 'processing'].includes(e.processing_status)).length,
          failedFiles: fileEvents.filter(e => e.processing_status === 'failed').length,
          successRate: fileEvents.length > 0 
            ? Math.round((fileEvents.filter(e => e.processing_status === 'completed').length / fileEvents.length) * 100) 
            : 0
        },
        fileTypes: {
          pdf: fileEvents.filter(e => e.file_type === '.pdf').length,
          docx: fileEvents.filter(e => e.file_type === '.docx').length,
          txt: fileEvents.filter(e => e.file_type === '.txt').length,
          other: fileEvents.filter(e => !['.pdf', '.docx', '.txt'].includes(e.file_type)).length
        },
        performance: {
          averageProcessingTime: this.calculateAverageProcessingTime(fileEvents),
          peakHour: this.calculatePeakHour(fileEvents),
          totalStorageUsed: await this.calculateStorageUsed(companyId)
        }
      };

      return ctx.send(stats);
    } catch (error) {
      strapi.log.error('Error fetching processing statistics:', error);
      return ctx.internalServerError('Failed to fetch processing statistics');
    }
  },

  // Helper methods
  calculateAverageProcessingTime(fileEvents) {
    const completedEvents = fileEvents.filter(e => e.processing_time_seconds);
    if (completedEvents.length === 0) return 0;
    
    const totalTime = completedEvents.reduce((sum, e) => sum + e.processing_time_seconds, 0);
    return Math.round(totalTime / completedEvents.length);
  },

  calculatePeakHour(fileEvents) {
    const hourCounts = {};
    fileEvents.forEach(event => {
      const hour = new Date(event.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    let peakHour = 0;
    let maxCount = 0;
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = parseInt(hour);
      }
    });
    
    return `${peakHour}:00`;
  },

  async calculateStorageUsed(companyId) {
    const company = await strapi.entityService.findOne(
      'api::company.company',
      companyId,
      { fields: ['storage_used_bytes'] }
    );
    
    return company?.storage_used_bytes || 0;
  }
}; 