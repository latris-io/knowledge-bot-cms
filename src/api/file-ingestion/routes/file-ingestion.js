module.exports = {
  routes: [
    // User APIs
    {
      method: 'GET',
      path: '/users/:userId/email',
      handler: 'file-ingestion.getUserEmail',
      config: {
        auth: false, // External API - uses its own auth
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/users/:userId/preferences',
      handler: 'file-ingestion.getUserPreferences',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/users/batch-lookup',
      handler: 'file-ingestion.batchUserLookup',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/users/:userId/preferences',
      handler: 'file-ingestion.updateUserPreferences',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },

    // Batch Processing APIs
    {
      method: 'GET',
      path: '/batch/:batchId/status',
      handler: 'file-ingestion.getBatchStatus',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },

    // File Status APIs
    {
      method: 'GET',
      path: '/files/:fileId/status',
      handler: 'file-ingestion.getFileStatus',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/files/:fileId/retry',
      handler: 'file-ingestion.retryFileProcessing',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },

    // Statistics APIs
    {
      method: 'GET',
      path: '/stats/processing',
      handler: 'file-ingestion.getProcessingStats',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
}; 