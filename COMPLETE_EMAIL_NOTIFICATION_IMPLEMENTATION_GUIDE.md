# Complete Email Notification & Auto-Correction Implementation Guide

## 📋 Executive Summary

This document provides a comprehensive implementation guide for the email notification and auto-correction system, clearly delineating responsibilities between the **Strapi team** and the **Ingestion Service team**. The solution follows a **separation of concerns** architecture where Strapi handles content management and user preferences, while the ingestion service manages operational processing.

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Implementation Timeline:** 5 weeks total  
**Phase 1 Duration:** 2 weeks  

---

## 🗄️ **Complete Database Schema Changes**

### **📊 Database Changes Summary**

| Component | Tables | Responsibility | Implementation Method |
|-----------|--------|---------------|---------------------|
| **User Preferences** | 1 table | 🔵 Strapi | Content Type |
| **Strapi Extensions** | 3 table modifications | 🔵 Strapi | Database Migration |
| **Batch Processing** | 2 tables | 🔴 Ingestion Service | Custom Migration |
| **File Processing** | 1 table | 🔴 Ingestion Service | Custom Migration |
| **Auto-Correction** | 1 table | 🔴 Ingestion Service | Custom Migration |
| **Error Tracking** | 1 table | 🔴 Ingestion Service | Custom Migration |
| **Email Logging** | 1 table | 🔴 Ingestion Service | Custom Migration |
| **Notification Retry** | 1 table | 🔴 Ingestion Service | Custom Migration |

**Total:** 11 database changes (1 new + 3 modifications + 7 new operational tables)

---

## 🔵 **STRAPI TEAM RESPONSIBILITIES**

### **1. Content Type Creation**

#### **📝 User Notification Preferences**
```json
{
  "kind": "collectionType",
  "collectionName": "user_notification_preferences",
  "info": {
    "singularName": "user-notification-preference",
    "pluralName": "user-notification-preferences",
    "displayName": "User Notification Preferences",
    "description": "User-specific notification settings for email alerts"
  },
  "options": {
    "draftAndPublish": false
  },
  "attributes": {
    "company": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::company.company",
      "inversedBy": "notification_preferences"
    },
    "bot": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::bot.bot",
      "inversedBy": "notification_preferences"
    },
    "user_email": {
      "type": "email",
      "required": true,
      "unique": false
    },
    "notification_enabled": {
      "type": "boolean",
      "default": true,
      "required": true
    },
    "batch_size_threshold": {
      "type": "integer",
      "default": 5,
      "min": 1,
      "max": 100
    },
    "notification_delay_minutes": {
      "type": "integer",
      "default": 30,
      "min": 1,
      "max": 1440
    },
    "email_format": {
      "type": "enumeration",
      "enum": ["html", "text"],
      "default": "html",
      "required": true
    },
    "include_success_details": {
      "type": "boolean",
      "default": true
    },
    "include_error_details": {
      "type": "boolean",
      "default": true
    }
  }
}
```

#### **📝 Resulting Database Table (Auto-created by Strapi)**
```sql
-- Table: user_notification_preferences
-- Managed by: Strapi Content Type System
-- Responsibility: 🔵 Strapi Team

CREATE TABLE user_notification_preferences (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(255) NOT NULL,
    company_id INTEGER REFERENCES companies(id),
    bot_id INTEGER REFERENCES bots(id),
    user_email VARCHAR(255) NOT NULL,
    notification_enabled BOOLEAN DEFAULT TRUE,
    batch_size_threshold INTEGER DEFAULT 5,
    notification_delay_minutes INTEGER DEFAULT 30,
    email_format VARCHAR(10) DEFAULT 'html',
    include_success_details BOOLEAN DEFAULT TRUE,
    include_error_details BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_id INTEGER,
    updated_by_id INTEGER,
    locale VARCHAR(255)
);
```

### **2. Database Migrations (Strapi-Managed)**

#### **📝 Migration File: `database/migrations/2024_01_01_000000_add_notification_features.js`**
```javascript
'use strict';

module.exports = {
  async up(knex) {
    console.log('🔵 Running Strapi notification features migration...');
    
    // 1. Add notification settings to companies table
    console.log('  → Adding notification settings to companies table');
    await knex.schema.table('companies', (table) => {
      table.jsonb('default_notification_settings').defaultTo('{}');
      table.integer('notification_quota').defaultTo(1000);
      table.integer('notification_usage').defaultTo(0);
    });

    // 2. Add processing settings to bots table
    console.log('  → Adding processing settings to bots table');
    await knex.schema.table('bots', (table) => {
      table.jsonb('processing_settings').defaultTo('{}');
    });

    // 3. Add notification metadata to files table
    console.log('  → Adding notification metadata to files table');
    await knex.schema.table('files', (table) => {
      table.boolean('notification_sent').defaultTo(false);
      table.string('last_notification_batch');
      table.jsonb('processing_metadata').defaultTo('{}');
    });

    // 4. Add indexes for performance
    console.log('  → Adding performance indexes');
    await knex.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_files_notification_sent 
      ON files(notification_sent);
      
      CREATE INDEX IF NOT EXISTS idx_files_last_notification_batch 
      ON files(last_notification_batch);
      
      CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_lookup 
      ON user_notification_preferences(company_id, bot_id, user_email);
      
      CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_company 
      ON user_notification_preferences(company_id);
      
      CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_bot 
      ON user_notification_preferences(bot_id);
      
      CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_email 
      ON user_notification_preferences(user_email);
    `);

    console.log('✅ Strapi notification features migration completed');
  },

  async down(knex) {
    console.log('🔵 Rolling back Strapi notification features migration...');
    
    // Remove indexes
    await knex.schema.raw(`
      DROP INDEX IF EXISTS idx_files_notification_sent;
      DROP INDEX IF EXISTS idx_files_last_notification_batch;
      DROP INDEX IF EXISTS idx_user_notification_preferences_lookup;
      DROP INDEX IF EXISTS idx_user_notification_preferences_company;
      DROP INDEX IF EXISTS idx_user_notification_preferences_bot;
      DROP INDEX IF EXISTS idx_user_notification_preferences_email;
    `);

    // Remove columns from files table
    await knex.schema.table('files', (table) => {
      table.dropColumn('notification_sent');
      table.dropColumn('last_notification_batch');
      table.dropColumn('processing_metadata');
    });

    // Remove columns from bots table
    await knex.schema.table('bots', (table) => {
      table.dropColumn('processing_settings');
    });

    // Remove columns from companies table
    await knex.schema.table('companies', (table) => {
      table.dropColumn('default_notification_settings');
      table.dropColumn('notification_quota');
      table.dropColumn('notification_usage');
    });

    console.log('✅ Strapi notification features migration rollback completed');
  }
};
```

### **3. API Implementation (Strapi)**

#### **📝 Custom Controller: `src/api/user-notification-preference/controllers/user-notification-preference.js`**
```javascript
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::user-notification-preference.user-notification-preference', ({ strapi }) => ({
  
  /**
   * GET /api/user-notification-preferences/by-user/:companyId/:botId/:userEmail
   * Custom endpoint for ingestion service to fetch user preferences
   */
  async findByUser(ctx) {
    const { companyId, botId, userEmail } = ctx.params;
    
    // Validate parameters
    if (!companyId || !botId || !userEmail) {
      return ctx.badRequest('Missing required parameters: companyId, botId, userEmail');
    }
    
    try {
      // Record API usage metrics
      strapi.metrics.increment('api.preferences.findByUser');
      const startTime = Date.now();
      
      // Check memory cache first
      const cacheKey = `prefs:${companyId}:${botId}:${userEmail}`;
      const cached = strapi.memoryCache?.get(cacheKey);
      
      if (cached) {
        strapi.log.info('Preference cache hit', { cacheKey });
        strapi.metrics.increment('api.preferences.cache.hit');
        return ctx.send({
          data: cached,
          cache_hit: true,
          fallback_applied: false
        });
      }
      
      // Query database
      const preferences = await strapi.documents('api::user-notification-preference.user-notification-preference').findFirst({
        filters: {
          company: { id: companyId },
          bot: { id: botId },
          user_email: { $eq: userEmail }
        },
        populate: {
          company: {
            fields: ['id', 'name', 'default_notification_settings']
          },
          bot: {
            fields: ['id', 'name', 'processing_settings']
          }
        }
      });
      
      let result = preferences;
      let fallback_applied = false;
      
      // Apply fallback if no preferences found
      if (!preferences) {
        strapi.log.info('No preferences found, applying defaults', { userEmail });
        
        // Get company defaults
        const company = await strapi.documents('api::company.company').findOne({
          documentId: companyId,
          fields: ['default_notification_settings']
        });
        
        const companyDefaults = company?.default_notification_settings || {};
        
        result = {
          user_email: userEmail,
          company: { id: parseInt(companyId) },
          bot: { id: parseInt(botId) },
          notification_enabled: companyDefaults.notification_enabled ?? true,
          batch_size_threshold: companyDefaults.batch_size_threshold ?? 5,
          notification_delay_minutes: companyDefaults.notification_delay_minutes ?? 30,
          email_format: companyDefaults.email_format ?? 'html',
          include_success_details: companyDefaults.include_success_details ?? true,
          include_error_details: companyDefaults.include_error_details ?? true
        };
        
        fallback_applied = true;
        strapi.metrics.increment('api.preferences.fallback.applied');
      }
      
      // Cache result
      if (strapi.memoryCache) {
        strapi.memoryCache.set(cacheKey, result, 300); // 5 minutes
        strapi.metrics.increment('api.preferences.cache.set');
      }
      
      // Record timing
      const duration = Date.now() - startTime;
      strapi.metrics.timing('api.preferences.findByUser.duration', duration);
      
      ctx.send({
        data: result,
        cache_hit: false,
        fallback_applied
      });
      
    } catch (error) {
      strapi.log.error('Error fetching user preferences', { 
        error: error.message, 
        userEmail,
        companyId,
        botId
      });
      
      strapi.metrics.increment('api.preferences.error');
      ctx.throw(500, 'Failed to fetch user preferences');
    }
  },
  
  /**
   * POST /api/user-notification-preferences/bulk-get
   * Bulk preferences retrieval for ingestion service
   */
  async bulkGet(ctx) {
    const { users } = ctx.request.body;
    
    if (!users || !Array.isArray(users)) {
      return ctx.badRequest('Users array is required');
    }
    
    if (users.length > 100) {
      return ctx.badRequest('Maximum 100 users per request');
    }
    
    try {
      strapi.metrics.increment('api.preferences.bulkGet');
      const startTime = Date.now();
      
      const results = {};
      const missing_preferences = [];
      
      for (const user of users) {
        const { company_id, bot_id, user_email } = user;
        const key = `${company_id}:${bot_id}:${user_email}`;
        
        // Check cache first
        const cacheKey = `prefs:${company_id}:${bot_id}:${user_email}`;
        const cached = strapi.memoryCache?.get(cacheKey);
        
        if (cached) {
          results[key] = cached;
          continue;
        }
        
        // Query database
        const preferences = await strapi.documents('api::user-notification-preference.user-notification-preference').findFirst({
          filters: {
            company: { id: company_id },
            bot: { id: bot_id },
            user_email: { $eq: user_email }
          }
        });
        
        if (preferences) {
          results[key] = preferences;
          
          // Cache result
          if (strapi.memoryCache) {
            strapi.memoryCache.set(cacheKey, preferences, 300);
          }
        } else {
          results[key] = null;
          missing_preferences.push(key);
        }
      }
      
      const duration = Date.now() - startTime;
      strapi.metrics.timing('api.preferences.bulkGet.duration', duration);
      
      ctx.send({
        data: results,
        missing_preferences,
        processed_count: users.length
      });
      
    } catch (error) {
      strapi.log.error('Error in bulk preferences retrieval', { error: error.message });
      strapi.metrics.increment('api.preferences.bulkGet.error');
      ctx.throw(500, 'Failed to retrieve bulk preferences');
    }
  },
  
  /**
   * Override default create to add cache invalidation
   */
  async create(ctx) {
    const { data } = ctx.request.body;
    
    try {
      // Check if preferences already exist
      const existing = await strapi.documents('api::user-notification-preference.user-notification-preference').findFirst({
        filters: {
          company: { id: data.company },
          bot: { id: data.bot },
          user_email: { $eq: data.user_email }
        }
      });
      
      if (existing) {
        return ctx.conflict('Preferences already exist for this user/company/bot combination');
      }
      
      // Create new preferences
      const preferences = await strapi.documents('api::user-notification-preference.user-notification-preference').create({
        data: data
      });
      
      // Clear cache
      const cacheKey = `prefs:${data.company}:${data.bot}:${data.user_email}`;
      if (strapi.memoryCache) {
        strapi.memoryCache.delete(cacheKey);
      }
      
      // Trigger webhook for ingestion service
      await strapi.service('api::webhook.webhook').notifyPreferenceChange({
        action: 'created',
        company_id: data.company,
        bot_id: data.bot,
        user_email: data.user_email,
        preferences: preferences
      });
      
      strapi.log.info('User preferences created', { 
        userEmail: data.user_email,
        companyId: data.company,
        botId: data.bot
      });
      
      strapi.metrics.increment('api.preferences.created');
      ctx.send({ data: preferences });
      
    } catch (error) {
      strapi.log.error('Error creating user preferences', { error: error.message });
      strapi.metrics.increment('api.preferences.create.error');
      ctx.throw(500, 'Failed to create user preferences');
    }
  },
  
  /**
   * Override default update to add cache invalidation
   */
  async update(ctx) {
    const { id } = ctx.params;
    const { data } = ctx.request.body;
    
    try {
      // Get existing preferences for cache invalidation
      const existing = await strapi.documents('api::user-notification-preference.user-notification-preference').findOne({
        documentId: id,
        populate: ['company', 'bot']
      });
      
      if (!existing) {
        return ctx.notFound('Preferences not found');
      }
      
      // Update preferences
      const updated = await strapi.documents('api::user-notification-preference.user-notification-preference').update({
        documentId: id,
        data: data
      });
      
      // Clear cache
      const cacheKey = `prefs:${existing.company.id}:${existing.bot.id}:${existing.user_email}`;
      if (strapi.memoryCache) {
        strapi.memoryCache.delete(cacheKey);
      }
      
      // Trigger webhook for ingestion service
      await strapi.service('api::webhook.webhook').notifyPreferenceChange({
        action: 'updated',
        company_id: existing.company.id,
        bot_id: existing.bot.id,
        user_email: existing.user_email,
        preferences: updated
      });
      
      strapi.log.info('User preferences updated', { 
        userEmail: existing.user_email,
        companyId: existing.company.id,
        botId: existing.bot.id
      });
      
      strapi.metrics.increment('api.preferences.updated');
      ctx.send({ data: updated });
      
    } catch (error) {
      strapi.log.error('Error updating user preferences', { error: error.message });
      strapi.metrics.increment('api.preferences.update.error');
      ctx.throw(500, 'Failed to update user preferences');
    }
  }
}));
```

#### **📝 Custom Routes: `src/api/user-notification-preference/routes/custom-routes.js`**
```javascript
'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/user-notification-preferences/by-user/:companyId/:botId/:userEmail',
      handler: 'user-notification-preference.findByUser',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/user-notification-preferences/bulk-get',
      handler: 'user-notification-preference.bulkGet',
      config: {
        policies: [],
        middlewares: [],
      },
    }
  ]
};
```

### **4. Supporting Services (Strapi)**

#### **📝 Memory Cache Service: `src/services/memory-cache.js`**
```javascript
'use strict';

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }
  
  set(key, value, ttl = 300) {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    
    // Set value
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    // Set expiration timer
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttl * 1000);
    
    this.timers.set(key, timer);
    this.stats.sets++;
    
    strapi.log.debug('Cache set', { key, ttl });
  }
  
  get(key) {
    const cached = this.cache.get(key);
    
    if (cached) {
      this.stats.hits++;
      strapi.log.debug('Cache hit', { key });
      return cached.value;
    } else {
      this.stats.misses++;
      strapi.log.debug('Cache miss', { key });
      return null;
    }
  }
  
  delete(key) {
    const deleted = this.cache.delete(key);
    
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    
    if (deleted) {
      this.stats.deletes++;
      strapi.log.debug('Cache delete', { key });
    }
    
    return deleted;
  }
  
  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.cache.clear();
    this.timers.clear();
    
    strapi.log.info('Cache cleared');
  }
  
  size() {
    return this.cache.size;
  }
  
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }
}

module.exports = MemoryCache;
```

#### **📝 Webhook Service: `src/api/webhook/services/webhook.js`**
```javascript
'use strict';

module.exports = ({ strapi }) => ({
  
  async notifyPreferenceChange(payload) {
    const webhookUrl = process.env.INGESTION_SERVICE_WEBHOOK_URL;
    
    if (!webhookUrl) {
      strapi.log.warn('Ingestion service webhook URL not configured');
      return;
    }
    
    try {
      strapi.metrics.increment('webhook.preference.attempt');
      const startTime = Date.now();
      
      const response = await fetch(webhookUrl + '/webhooks/preference-updated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INGESTION_SERVICE_API_KEY}`,
          'X-Webhook-Source': 'strapi',
          'X-Webhook-Timestamp': Date.now().toString()
        },
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString()
        }),
        timeout: 5000
      });
      
      const duration = Date.now() - startTime;
      strapi.metrics.timing('webhook.preference.duration', duration);
      
      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }
      
      strapi.log.info('Preference change notification sent successfully', { 
        action: payload.action,
        user_email: payload.user_email,
        duration
      });
      
      strapi.metrics.increment('webhook.preference.success');
      
    } catch (error) {
      strapi.log.error('Webhook notification failed', { 
        error: error.message,
        payload: payload 
      });
      
      strapi.metrics.increment('webhook.preference.error');
      
      // Don't throw error - failing webhook shouldn't break preference updates
      // Consider adding retry logic in Phase 2
    }
  }
});
```

---

## 🔴 **INGESTION SERVICE TEAM RESPONSIBILITIES**

### **1. Operational Database Tables**

#### **📝 Batch Processing Sessions**
```sql
-- Table: batch_processing_sessions
-- Managed by: Ingestion Service
-- Responsibility: 🔴 Ingestion Service Team

CREATE TABLE batch_processing_sessions (
    id SERIAL PRIMARY KEY,
    batch_id UUID NOT NULL UNIQUE,
    company_id INTEGER NOT NULL,         -- References strapi.companies.id
    bot_id INTEGER NOT NULL,             -- References strapi.bots.id
    user_email VARCHAR(255) NOT NULL,
    batch_start_time TIMESTAMP NOT NULL,
    batch_end_time TIMESTAMP,
    total_files INTEGER DEFAULT 0,
    successful_files INTEGER DEFAULT 0,
    failed_files INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'processing',  -- 'processing', 'completed', 'partially_completed'
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_batch_sessions_batch_id ON batch_processing_sessions(batch_id);
CREATE INDEX idx_batch_sessions_company_bot ON batch_processing_sessions(company_id, bot_id);
CREATE INDEX idx_batch_sessions_user_email ON batch_processing_sessions(user_email);
CREATE INDEX idx_batch_sessions_status ON batch_processing_sessions(status);
CREATE INDEX idx_batch_sessions_notification_sent ON batch_processing_sessions(notification_sent);
CREATE INDEX idx_batch_sessions_created_at ON batch_processing_sessions(created_at);
```

#### **📝 Batch Files**
```sql
-- Table: batch_files
-- Managed by: Ingestion Service
-- Responsibility: 🔴 Ingestion Service Team

CREATE TABLE batch_files (
    id SERIAL PRIMARY KEY,
    batch_id UUID NOT NULL,              -- References batch_processing_sessions.batch_id
    file_document_id TEXT NOT NULL,      -- References strapi.files.document_id
    file_name TEXT NOT NULL,
    processing_status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'processing', 'success', 'failed'
    error_message TEXT,
    processing_time_seconds INTEGER,
    chunks_created INTEGER DEFAULT 0,
    file_size_bytes BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_batch_files_batch_id ON batch_files(batch_id);
CREATE INDEX idx_batch_files_document_id ON batch_files(file_document_id);
CREATE INDEX idx_batch_files_status ON batch_files(processing_status);
CREATE INDEX idx_batch_files_created_at ON batch_files(created_at);
```

#### **📝 File Processing Status**
```sql
-- Table: file_processing_status
-- Managed by: Ingestion Service
-- Responsibility: 🔴 Ingestion Service Team

CREATE TABLE file_processing_status (
    id SERIAL PRIMARY KEY,
    file_event_id INTEGER NOT NULL,     -- References strapi.file_events.id
    file_document_id TEXT NOT NULL,     -- References strapi.files.document_id
    processing_stage VARCHAR(50) NOT NULL,  -- 'download', 'processing', 'storage', 'completed', 'failed'
    status VARCHAR(20) NOT NULL,         -- 'pending', 'processing', 'success', 'failed'
    error_message TEXT,
    error_details JSONB,
    processing_start_time TIMESTAMP,
    processing_end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_file_processing_status_event_id ON file_processing_status(file_event_id);
CREATE INDEX idx_file_processing_status_document_id ON file_processing_status(file_document_id);
CREATE INDEX idx_file_processing_status_stage ON file_processing_status(processing_stage);
CREATE INDEX idx_file_processing_status_status ON file_processing_status(status);
CREATE INDEX idx_file_processing_status_created_at ON file_processing_status(created_at);
```

#### **📝 Auto-Correction Tasks**
```sql
-- Table: auto_correction_tasks
-- Managed by: Ingestion Service
-- Responsibility: 🔴 Ingestion Service Team

CREATE TABLE auto_correction_tasks (
    id SERIAL PRIMARY KEY,
    file_document_id TEXT NOT NULL,
    file_name TEXT,
    company_id INTEGER,                  -- References strapi.companies.id
    bot_id INTEGER,                      -- References strapi.bots.id
    failure_type VARCHAR(50) NOT NULL,   -- 'file_not_found', 'processing_failed', 's3_download_failed', etc.
    error_message TEXT NOT NULL,
    error_details JSONB,
    correction_actions JSONB,            -- Array of actions: ['s3_delete', 'cms_delete', 'chroma_delete']
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    s3_cleanup_completed BOOLEAN DEFAULT FALSE,
    cms_cleanup_completed BOOLEAN DEFAULT FALSE,
    chroma_cleanup_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_during_correction TEXT
);

-- Indexes
CREATE INDEX idx_auto_correction_tasks_document_id ON auto_correction_tasks(file_document_id);
CREATE INDEX idx_auto_correction_tasks_status ON auto_correction_tasks(status);
CREATE INDEX idx_auto_correction_tasks_company_bot ON auto_correction_tasks(company_id, bot_id);
CREATE INDEX idx_auto_correction_tasks_created_at ON auto_correction_tasks(created_at);
CREATE INDEX idx_auto_correction_tasks_failure_type ON auto_correction_tasks(failure_type);
```

#### **📝 Processing Errors**
```sql
-- Table: processing_errors
-- Managed by: Ingestion Service
-- Responsibility: 🔴 Ingestion Service Team

CREATE TABLE processing_errors (
    id SERIAL PRIMARY KEY,
    file_event_id INTEGER,              -- References strapi.file_events.id
    file_document_id TEXT NOT NULL,     -- References strapi.files.document_id
    error_type VARCHAR(50) NOT NULL,    -- 'file_not_found', 'processing_failed', 's3_error', 'chroma_error', etc.
    error_message TEXT NOT NULL,
    error_details JSONB,
    stack_trace TEXT,
    processing_stage VARCHAR(50),       -- 'download', 'processing', 'storage', etc.
    retry_count INTEGER DEFAULT 0,
    resolved BOOLEAN DEFAULT FALSE,
    resolution_action VARCHAR(100),     -- 'auto_correction', 'manual_fix', 'ignored'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_processing_errors_document_id ON processing_errors(file_document_id);
CREATE INDEX idx_processing_errors_type ON processing_errors(error_type);
CREATE INDEX idx_processing_errors_stage ON processing_errors(processing_stage);
CREATE INDEX idx_processing_errors_resolved ON processing_errors(resolved);
CREATE INDEX idx_processing_errors_created_at ON processing_errors(created_at);
```

#### **📝 Email Notification Log**
```sql
-- Table: email_notification_log
-- Managed by: Ingestion Service
-- Responsibility: 🔴 Ingestion Service Team

CREATE TABLE email_notification_log (
    id SERIAL PRIMARY KEY,
    batch_id UUID,                      -- References batch_processing_sessions.batch_id
    recipient_email VARCHAR(255) NOT NULL,
    company_id INTEGER NOT NULL,        -- References strapi.companies.id
    bot_id INTEGER NOT NULL,            -- References strapi.bots.id
    email_type VARCHAR(50) DEFAULT 'batch_completion',  -- 'batch_completion', 'error_alert', 'summary'
    email_subject TEXT NOT NULL,
    email_content_html TEXT,
    email_content_text TEXT,
    send_status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'sent', 'failed'
    send_attempts INTEGER DEFAULT 0,
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_email_notification_log_batch_id ON email_notification_log(batch_id);
CREATE INDEX idx_email_notification_log_recipient ON email_notification_log(recipient_email);
CREATE INDEX idx_email_notification_log_status ON email_notification_log(send_status);
CREATE INDEX idx_email_notification_log_company_bot ON email_notification_log(company_id, bot_id);
CREATE INDEX idx_email_notification_log_created_at ON email_notification_log(created_at);
```

#### **📝 Notification Retry Log**
```sql
-- Table: notification_retry_log
-- Managed by: Ingestion Service
-- Responsibility: 🔴 Ingestion Service Team

CREATE TABLE notification_retry_log (
    id SERIAL PRIMARY KEY,
    batch_id UUID NOT NULL,             -- References batch_processing_sessions.batch_id
    retry_attempt INTEGER NOT NULL,
    error_message TEXT,
    retry_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT FALSE,
    next_retry_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_notification_retry_log_batch_id ON notification_retry_log(batch_id);
CREATE INDEX idx_notification_retry_log_retry_at ON notification_retry_log(retry_at);
CREATE INDEX idx_notification_retry_log_success ON notification_retry_log(success);
```

### **2. Migration Script for Ingestion Service**

#### **📝 Complete Migration Script: `migrations/001_email_notification_system.sql`**
```sql
-- ========================================
-- Email Notification & Auto-Correction System
-- Ingestion Service Database Migration
-- ========================================
-- Responsibility: 🔴 Ingestion Service Team
-- Run this AFTER Strapi migration has completed

BEGIN;

-- Log migration start
INSERT INTO migration_log (migration_name, status, started_at) 
VALUES ('001_email_notification_system', 'STARTED', NOW());

-- 1. Batch Processing Sessions
CREATE TABLE batch_processing_sessions (
    id SERIAL PRIMARY KEY,
    batch_id UUID NOT NULL UNIQUE,
    company_id INTEGER NOT NULL,
    bot_id INTEGER NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    batch_start_time TIMESTAMP NOT NULL,
    batch_end_time TIMESTAMP,
    total_files INTEGER DEFAULT 0,
    successful_files INTEGER DEFAULT 0,
    failed_files INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'processing',
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_batch_status CHECK (status IN ('processing', 'completed', 'partially_completed')),
    CONSTRAINT chk_file_counts CHECK (
        total_files >= 0 AND 
        successful_files >= 0 AND 
        failed_files >= 0 AND
        successful_files + failed_files <= total_files
    )
);

-- 2. Batch Files
CREATE TABLE batch_files (
    id SERIAL PRIMARY KEY,
    batch_id UUID NOT NULL,
    file_document_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    processing_status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    processing_time_seconds INTEGER,
    chunks_created INTEGER DEFAULT 0,
    file_size_bytes BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_processing_status CHECK (processing_status IN ('pending', 'processing', 'success', 'failed')),
    CONSTRAINT chk_processing_time CHECK (processing_time_seconds >= 0),
    CONSTRAINT chk_chunks_created CHECK (chunks_created >= 0),
    CONSTRAINT chk_file_size CHECK (file_size_bytes >= 0)
);

-- 3. File Processing Status
CREATE TABLE file_processing_status (
    id SERIAL PRIMARY KEY,
    file_event_id INTEGER NOT NULL,
    file_document_id TEXT NOT NULL,
    processing_stage VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    error_details JSONB,
    processing_start_time TIMESTAMP,
    processing_end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_stage CHECK (processing_stage IN ('download', 'processing', 'storage', 'completed', 'failed')),
    CONSTRAINT chk_status CHECK (status IN ('pending', 'processing', 'success', 'failed')),
    CONSTRAINT chk_processing_time_order CHECK (
        processing_start_time IS NULL OR 
        processing_end_time IS NULL OR 
        processing_end_time >= processing_start_time
    )
);

-- 4. Auto-Correction Tasks
CREATE TABLE auto_correction_tasks (
    id SERIAL PRIMARY KEY,
    file_document_id TEXT NOT NULL,
    file_name TEXT,
    company_id INTEGER,
    bot_id INTEGER,
    failure_type VARCHAR(50) NOT NULL,
    error_message TEXT NOT NULL,
    error_details JSONB,
    correction_actions JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    s3_cleanup_completed BOOLEAN DEFAULT FALSE,
    cms_cleanup_completed BOOLEAN DEFAULT FALSE,
    chroma_cleanup_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_during_correction TEXT,
    
    CONSTRAINT chk_correction_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT chk_correction_time_order CHECK (
        started_at IS NULL OR 
        completed_at IS NULL OR 
        completed_at >= started_at
    )
);

-- 5. Processing Errors
CREATE TABLE processing_errors (
    id SERIAL PRIMARY KEY,
    file_event_id INTEGER,
    file_document_id TEXT NOT NULL,
    error_type VARCHAR(50) NOT NULL,
    error_message TEXT NOT NULL,
    error_details JSONB,
    stack_trace TEXT,
    processing_stage VARCHAR(50),
    retry_count INTEGER DEFAULT 0,
    resolved BOOLEAN DEFAULT FALSE,
    resolution_action VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    
    CONSTRAINT chk_retry_count CHECK (retry_count >= 0),
    CONSTRAINT chk_resolution_action CHECK (
        resolution_action IS NULL OR 
        resolution_action IN ('auto_correction', 'manual_fix', 'ignored')
    )
);

-- 6. Email Notification Log
CREATE TABLE email_notification_log (
    id SERIAL PRIMARY KEY,
    batch_id UUID,
    recipient_email VARCHAR(255) NOT NULL,
    company_id INTEGER NOT NULL,
    bot_id INTEGER NOT NULL,
    email_type VARCHAR(50) DEFAULT 'batch_completion',
    email_subject TEXT NOT NULL,
    email_content_html TEXT,
    email_content_text TEXT,
    send_status VARCHAR(20) DEFAULT 'pending',
    send_attempts INTEGER DEFAULT 0,
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_email_type CHECK (email_type IN ('batch_completion', 'error_alert', 'summary')),
    CONSTRAINT chk_send_status CHECK (send_status IN ('pending', 'sent', 'failed')),
    CONSTRAINT chk_send_attempts CHECK (send_attempts >= 0)
);

-- 7. Notification Retry Log
CREATE TABLE notification_retry_log (
    id SERIAL PRIMARY KEY,
    batch_id UUID NOT NULL,
    retry_attempt INTEGER NOT NULL,
    error_message TEXT,
    retry_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT FALSE,
    next_retry_at TIMESTAMP,
    
    CONSTRAINT chk_retry_attempt CHECK (retry_attempt > 0)
);

-- ========================================
-- CREATE ALL INDEXES
-- ========================================

-- Batch Processing Sessions Indexes
CREATE INDEX idx_batch_sessions_batch_id ON batch_processing_sessions(batch_id);
CREATE INDEX idx_batch_sessions_company_bot ON batch_processing_sessions(company_id, bot_id);
CREATE INDEX idx_batch_sessions_user_email ON batch_processing_sessions(user_email);
CREATE INDEX idx_batch_sessions_status ON batch_processing_sessions(status);
CREATE INDEX idx_batch_sessions_notification_sent ON batch_processing_sessions(notification_sent);
CREATE INDEX idx_batch_sessions_created_at ON batch_processing_sessions(created_at);

-- Batch Files Indexes
CREATE INDEX idx_batch_files_batch_id ON batch_files(batch_id);
CREATE INDEX idx_batch_files_document_id ON batch_files(file_document_id);
CREATE INDEX idx_batch_files_status ON batch_files(processing_status);
CREATE INDEX idx_batch_files_created_at ON batch_files(created_at);

-- File Processing Status Indexes
CREATE INDEX idx_file_processing_status_event_id ON file_processing_status(file_event_id);
CREATE INDEX idx_file_processing_status_document_id ON file_processing_status(file_document_id);
CREATE INDEX idx_file_processing_status_stage ON file_processing_status(processing_stage);
CREATE INDEX idx_file_processing_status_status ON file_processing_status(status);
CREATE INDEX idx_file_processing_status_created_at ON file_processing_status(created_at);

-- Auto-Correction Tasks Indexes
CREATE INDEX idx_auto_correction_tasks_document_id ON auto_correction_tasks(file_document_id);
CREATE INDEX idx_auto_correction_tasks_status ON auto_correction_tasks(status);
CREATE INDEX idx_auto_correction_tasks_company_bot ON auto_correction_tasks(company_id, bot_id);
CREATE INDEX idx_auto_correction_tasks_created_at ON auto_correction_tasks(created_at);
CREATE INDEX idx_auto_correction_tasks_failure_type ON auto_correction_tasks(failure_type);

-- Processing Errors Indexes
CREATE INDEX idx_processing_errors_document_id ON processing_errors(file_document_id);
CREATE INDEX idx_processing_errors_type ON processing_errors(error_type);
CREATE INDEX idx_processing_errors_stage ON processing_errors(processing_stage);
CREATE INDEX idx_processing_errors_resolved ON processing_errors(resolved);
CREATE INDEX idx_processing_errors_created_at ON processing_errors(created_at);

-- Email Notification Log Indexes
CREATE INDEX idx_email_notification_log_batch_id ON email_notification_log(batch_id);
CREATE INDEX idx_email_notification_log_recipient ON email_notification_log(recipient_email);
CREATE INDEX idx_email_notification_log_status ON email_notification_log(send_status);
CREATE INDEX idx_email_notification_log_company_bot ON email_notification_log(company_id, bot_id);
CREATE INDEX idx_email_notification_log_created_at ON email_notification_log(created_at);

-- Notification Retry Log Indexes
CREATE INDEX idx_notification_retry_log_batch_id ON notification_retry_log(batch_id);
CREATE INDEX idx_notification_retry_log_retry_at ON notification_retry_log(retry_at);
CREATE INDEX idx_notification_retry_log_success ON notification_retry_log(success);

-- ========================================
-- CREATE FOREIGN KEY CONSTRAINTS
-- ========================================

-- Note: These reference Strapi tables, ensure they exist first
ALTER TABLE batch_files 
ADD CONSTRAINT fk_batch_files_batch_id 
FOREIGN KEY (batch_id) REFERENCES batch_processing_sessions(batch_id) ON DELETE CASCADE;

ALTER TABLE email_notification_log 
ADD CONSTRAINT fk_email_notification_log_batch_id 
FOREIGN KEY (batch_id) REFERENCES batch_processing_sessions(batch_id) ON DELETE CASCADE;

ALTER TABLE notification_retry_log 
ADD CONSTRAINT fk_notification_retry_log_batch_id 
FOREIGN KEY (batch_id) REFERENCES batch_processing_sessions(batch_id) ON DELETE CASCADE;

-- Log migration completion
UPDATE migration_log 
SET status = 'COMPLETED', completed_at = NOW() 
WHERE migration_name = '001_email_notification_system';

COMMIT;

-- Final verification
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
    'batch_processing_sessions',
    'batch_files', 
    'file_processing_status',
    'auto_correction_tasks',
    'processing_errors',
    'email_notification_log',
    'notification_retry_log'
)
ORDER BY table_name, ordinal_position;
```

---

## 🔗 **Integration Points**

### **1. API Contract Definition**

#### **📝 Strapi → Ingestion Service**
```typescript
// User Preferences API (Strapi exposes to Ingestion Service)
interface UserPreferencesAPI {
  // Primary endpoint for getting user preferences
  GET: '/api/user-notification-preferences/by-user/{companyId}/{botId}/{userEmail}';
  
  // Bulk retrieval for multiple users
  POST: '/api/user-notification-preferences/bulk-get';
  
  // Standard CRUD operations
  GET: '/api/user-notification-preferences';
  POST: '/api/user-notification-preferences';
  PUT: '/api/user-notification-preferences/{id}';
  DELETE: '/api/user-notification-preferences/{id}';
}

// Response format
interface UserPreferencesResponse {
  data: {
    user_email: string;
    company: { id: number };
    bot: { id: number };
    notification_enabled: boolean;
    batch_size_threshold: number;
    notification_delay_minutes: number;
    email_format: 'html' | 'text';
    include_success_details: boolean;
    include_error_details: boolean;
  };
  cache_hit: boolean;
  fallback_applied: boolean;
}
```

#### **📝 Ingestion Service → Strapi**
```typescript
// Webhook endpoint (Ingestion Service implements)
interface WebhookEndpoint {
  POST: '/webhooks/preference-updated';
}

// Webhook payload format
interface PreferenceUpdateWebhook {
  action: 'created' | 'updated' | 'deleted';
  company_id: number;
  bot_id: number;
  user_email: string;
  preferences?: UserPreferences;
  timestamp: string;
}
```

### **2. Database Reference Points**

#### **📝 Cross-System References**
```sql
-- Ingestion Service tables reference Strapi entities by ID
-- NO foreign key constraints across systems

-- Batch Processing Sessions → Strapi
batch_processing_sessions.company_id → strapi.companies.id
batch_processing_sessions.bot_id → strapi.bots.id

-- Batch Files → Strapi
batch_files.file_document_id → strapi.files.document_id

-- File Processing Status → Strapi
file_processing_status.file_event_id → strapi.file_events.id
file_processing_status.file_document_id → strapi.files.document_id

-- Auto-Correction Tasks → Strapi
auto_correction_tasks.company_id → strapi.companies.id
auto_correction_tasks.bot_id → strapi.bots.id
auto_correction_tasks.file_document_id → strapi.files.document_id

-- Processing Errors → Strapi
processing_errors.file_event_id → strapi.file_events.id
processing_errors.file_document_id → strapi.files.document_id

-- Email Notification Log → Strapi
email_notification_log.company_id → strapi.companies.id
email_notification_log.bot_id → strapi.bots.id
```

---

## 🚀 **Implementation Timeline**

### **Phase 1: Core Implementation (2 weeks)**

#### **Week 1: Strapi Implementation**
```
Day 1-2: 🔵 Strapi Team
├── Create user-notification-preference content type
├── Run database migration for Strapi changes
├── Set up basic memory cache service
└── Create basic API endpoints

Day 3-4: 🔵 Strapi Team
├── Implement custom controllers with caching
├── Create webhook service for notifications
├── Add metrics collection and logging
└── Create health check endpoint

Day 5: 🔴 Ingestion Service Team
├── Review Strapi API documentation
├── Plan ingestion service integration
└── Prepare database migration script
```

#### **Week 2: Integration & Testing**
```
Day 6-7: 🔴 Ingestion Service Team
├── Run operational database migration
├── Implement preference caching in ingestion service
├── Create batch management logic
└── Implement webhook endpoint

Day 8-9: 🤝 Joint Integration
├── Test API integration between systems
├── Validate webhook notifications
├── Test cache invalidation flow
└── End-to-end testing of file processing

Day 10: 🤝 Joint Deployment
├── Deploy to staging environment
├── Performance testing
├── Production deployment preparation
└── Documentation finalization
```

### **Phase 2: Resilience (Week 3)**
```
🔵 Strapi Team:
├── Implement Redis caching
├── Add circuit breaker for webhooks
├── Enhanced error handling
└── Performance monitoring improvements

🔴 Ingestion Service Team:
├── Implement batch completion logic
├── Add email notification sending
├── Create auto-correction tasks
└── Enhanced error tracking
```

### **Phase 3: Advanced Features (Week 4-5)**
```
🔵 Strapi Team:
├── Event-driven preference updates
├── Advanced user preference options
├── Comprehensive analytics dashboard
└── Multi-language support

🔴 Ingestion Service Team:
├── Advanced batch management
├── Retry logic for failed notifications
├── Comprehensive auto-correction
└── Advanced error recovery
```

---

## 🧪 **Testing Strategy**

### **1. Unit Tests**

#### **📝 Strapi Unit Tests**
```javascript
// tests/unit/user-notification-preferences.test.js
describe('User Notification Preferences', () => {
  describe('findByUser', () => {
    it('should return cached preferences when available', async () => {
      // Mock cache hit
      strapi.memoryCache.get.mockReturnValue(mockPreferences);
      
      const result = await request(strapi.server.httpServer)
        .get('/api/user-notification-preferences/by-user/1/1/test@example.com')
        .expect(200);
      
      expect(result.body.cache_hit).toBe(true);
      expect(result.body.fallback_applied).toBe(false);
    });
    
    it('should return fallback preferences when none exist', async () => {
      // Mock cache miss and no database record
      strapi.memoryCache.get.mockReturnValue(null);
      
      const result = await request(strapi.server.httpServer)
        .get('/api/user-notification-preferences/by-user/1/1/newuser@example.com')
        .expect(200);
      
      expect(result.body.cache_hit).toBe(false);
      expect(result.body.fallback_applied).toBe(true);
      expect(result.body.data.notification_enabled).toBe(true);
    });
  });
  
  describe('webhook notifications', () => {
    it('should send webhook on preference creation', async () => {
      const webhookSpy = jest.spyOn(strapi.service('api::webhook.webhook'), 'notifyPreferenceChange');
      
      await request(strapi.server.httpServer)
        .post('/api/user-notification-preferences')
        .send({
          data: {
            company: 1,
            bot: 1,
            user_email: 'test@example.com',
            notification_enabled: true
          }
        })
        .expect(200);
      
      expect(webhookSpy).toHaveBeenCalledWith({
        action: 'created',
        company_id: 1,
        bot_id: 1,
        user_email: 'test@example.com',
        preferences: expect.any(Object)
      });
    });
  });
});
```

#### **📝 Ingestion Service Unit Tests**
```python
# tests/unit/test_batch_manager.py
import pytest
from unittest.mock import Mock, patch
from ingestion_service.batch_manager import BatchManager

class TestBatchManager:
    def test_create_batch_session(self):
        """Test batch session creation"""
        batch_manager = BatchManager(db_pool=Mock(), strapi_client=Mock())
        
        batch_data = {
            'company_id': 1,
            'bot_id': 1,
            'user_email': 'test@example.com',
            'files': ['file1.pdf', 'file2.pdf']
        }
        
        batch_id = batch_manager.create_batch_session(batch_data)
        
        assert batch_id is not None
        assert batch_manager.db_pool.execute.called
        
    def test_get_user_preferences_with_cache(self):
        """Test preference retrieval with caching"""
        batch_manager = BatchManager(db_pool=Mock(), strapi_client=Mock())
        
        # Mock cache hit
        batch_manager.preference_cache.get.return_value = {
            'notification_enabled': True,
            'batch_size_threshold': 10
        }
        
        prefs = batch_manager.get_user_preferences(1, 1, 'test@example.com')
        
        assert prefs['notification_enabled'] is True
        assert prefs['batch_size_threshold'] == 10
        assert not batch_manager.strapi_client.get.called  # Should not call API
```

### **2. Integration Tests**

#### **📝 Cross-System Integration Tests**
```python
# tests/integration/test_strapi_integration.py
import pytest
import requests
from unittest.mock import patch

class TestStrapiIntegration:
    def test_preference_api_integration(self):
        """Test end-to-end preference retrieval"""
        # Create preference in Strapi
        strapi_response = requests.post(
            f"{STRAPI_URL}/api/user-notification-preferences",
            json={
                "data": {
                    "company": 1,
                    "bot": 1,
                    "user_email": "integration@example.com",
                    "notification_enabled": True,
                    "batch_size_threshold": 15
                }
            },
            headers={"Authorization": f"Bearer {STRAPI_TOKEN}"}
        )
        
        assert strapi_response.status_code == 200
        
        # Retrieve preference from ingestion service
        ingestion_service = IngestionService()
        preferences = ingestion_service.get_user_preferences(1, 1, "integration@example.com")
        
        assert preferences['notification_enabled'] is True
        assert preferences['batch_size_threshold'] == 15
        
    def test_webhook_integration(self):
        """Test webhook notification flow"""
        with patch('ingestion_service.webhook_handler.handle_preference_update') as mock_handler:
            # Update preference in Strapi
            requests.put(
                f"{STRAPI_URL}/api/user-notification-preferences/1",
                json={
                    "data": {
                        "notification_enabled": False
                    }
                },
                headers={"Authorization": f"Bearer {STRAPI_TOKEN}"}
            )
            
            # Verify webhook was called
            mock_handler.assert_called_once()
            
    def test_batch_processing_flow(self):
        """Test complete batch processing flow"""
        # Simulate file upload event
        file_event = {
            'action': 'create',
            'file_document_id': 'test-file-123',
            'company_id': 1,
            'bot_id': 1,
            'user_email': 'batch@example.com'
        }
        
        # Process through ingestion service
        ingestion_service = IngestionService()
        batch_id = ingestion_service.handle_file_event(file_event)
        
        # Verify batch was created
        assert batch_id is not None
        
        # Verify batch exists in database
        batch = ingestion_service.get_batch_info(batch_id)
        assert batch['company_id'] == 1
        assert batch['bot_id'] == 1
        assert batch['user_email'] == 'batch@example.com'
```

### **3. Performance Tests**

#### **📝 Load Testing Scenarios**
```python
# tests/performance/test_api_performance.py
import pytest
import asyncio
import aiohttp
from locust import HttpUser, task, between

class StrapiAPIUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        self.token = self.get_auth_token()
    
    @task(3)
    def get_user_preferences(self):
        """Test preference retrieval performance"""
        self.client.get(
            "/api/user-notification-preferences/by-user/1/1/load-test@example.com",
            headers={"Authorization": f"Bearer {self.token}"}
        )
    
    @task(1)
    def bulk_get_preferences(self):
        """Test bulk preference retrieval"""
        users = [
            {"company_id": 1, "bot_id": 1, "user_email": f"user{i}@example.com"}
            for i in range(50)
        ]
        
        self.client.post(
            "/api/user-notification-preferences/bulk-get",
            json={"users": users},
            headers={"Authorization": f"Bearer {self.token}"}
        )
    
    @task(1)
    def update_preferences(self):
        """Test preference update performance"""
        self.client.put(
            "/api/user-notification-preferences/1",
            json={
                "data": {
                    "batch_size_threshold": 20
                }
            },
            headers={"Authorization": f"Bearer {self.token}"}
        )

# Run with: locust -f test_api_performance.py --host=http://localhost:1337
```

---

## 🚀 **Deployment Strategy**

### **1. Environment Setup**

#### **📝 Development Environment**
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # Strapi Service
  strapi:
    build: .
    ports:
      - "1337:1337"
    environment:
      - NODE_ENV=development
      - DATABASE_CLIENT=postgres
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_NAME=strapi_dev
      - DATABASE_USERNAME=strapi
      - DATABASE_PASSWORD=dev_password
      - INGESTION_SERVICE_WEBHOOK_URL=http://ingestion-service:8000
      - INGESTION_SERVICE_API_KEY=dev_api_key
    depends_on:
      - postgres
    volumes:
      - ./:/app
      - /app/node_modules
    command: npm run develop

  # Ingestion Service
  ingestion-service:
    build: ../ingestion-service
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://ingestion:dev_password@postgres:5432/ingestion_dev
      - STRAPI_URL=http://strapi:1337
      - STRAPI_API_TOKEN=dev_strapi_token
    depends_on:
      - postgres
    volumes:
      - ../ingestion-service:/app

  # Shared Database
  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=strapi_dev
      - POSTGRES_USER=strapi
      - POSTGRES_PASSWORD=dev_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

#### **📝 Production Environment**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  strapi:
    build: 
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "1337:1337"
    environment:
      - NODE_ENV=production
      - DATABASE_CLIENT=postgres
      - DATABASE_HOST=${DATABASE_HOST}
      - DATABASE_PORT=${DATABASE_PORT}
      - DATABASE_NAME=${DATABASE_NAME}
      - DATABASE_USERNAME=${DATABASE_USERNAME}
      - DATABASE_PASSWORD=${DATABASE_PASSWORD}
      - DATABASE_SSL=true
      - INGESTION_SERVICE_WEBHOOK_URL=${INGESTION_SERVICE_WEBHOOK_URL}
      - INGESTION_SERVICE_API_KEY=${INGESTION_SERVICE_API_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:1337/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  ingestion-service:
    build: ../ingestion-service
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${INGESTION_DATABASE_URL}
      - STRAPI_URL=${STRAPI_URL}
      - STRAPI_API_TOKEN=${STRAPI_API_TOKEN}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### **2. CI/CD Pipeline**

#### **📝 GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy Email Notification System

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-strapi:
    runs-on: ubuntu-latest
    name: Test Strapi Components
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: strapi_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run Strapi tests
      run: npm run test
      env:
        DATABASE_HOST: localhost
        DATABASE_PORT: 5432
        DATABASE_NAME: strapi_test
        DATABASE_USERNAME: postgres
        DATABASE_PASSWORD: test_password
    
    - name: Run Strapi linting
      run: npm run lint
    
    - name: Build Strapi application
      run: npm run build
      env:
        NODE_ENV: production

  test-ingestion:
    runs-on: ubuntu-latest
    name: Test Ingestion Service
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: ingestion_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Python
      uses: actions/setup-python@v3
      with:
        python-version: '3.9'
    
    - name: Install Python dependencies
      run: |
        cd ingestion-service
        pip install -r requirements.txt
    
    - name: Run ingestion service tests
      run: |
        cd ingestion-service
        python -m pytest tests/
      env:
        DATABASE_URL: postgresql://postgres:test_password@localhost:5432/ingestion_test

  integration-test:
    runs-on: ubuntu-latest
    name: Integration Tests
    needs: [test-strapi, test-ingestion]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Start test environment
      run: |
        docker-compose -f docker-compose.test.yml up -d
        sleep 30  # Wait for services to start
    
    - name: Run integration tests
      run: |
        python -m pytest tests/integration/
    
    - name: Stop test environment
      run: docker-compose -f docker-compose.test.yml down

  deploy:
    needs: [test-strapi, test-ingestion, integration-test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment..."
        # Add deployment commands here
    
    - name: Run smoke tests
      run: |
        echo "Running smoke tests..."
        # Add smoke test commands here
    
    - name: Deploy to production
      if: success()
      run: |
        echo "Deploying to production environment..."
        # Add production deployment commands here
```

### **3. Deployment Coordination**

#### **📝 Deployment Checklist**
```markdown
## Pre-Deployment Checklist

### 🔵 Strapi Team
- [ ] Database migration script tested
- [ ] API endpoints tested
- [ ] Webhook service tested
- [ ] Memory cache working
- [ ] Health check endpoint functional
- [ ] Metrics collection working
- [ ] All unit tests passing
- [ ] Integration tests passing

### 🔴 Ingestion Service Team
- [ ] Operational database migration ready
- [ ] Webhook endpoint implemented
- [ ] Preference caching implemented
- [ ] Batch management logic ready
- [ ] Email notification service ready
- [ ] Auto-correction tasks implemented
- [ ] All unit tests passing
- [ ] Integration tests passing

### 🤝 Joint Checklist
- [ ] API contract validated
- [ ] Cross-system integration tested
- [ ] Performance tests passed
- [ ] Security review completed
- [ ] Monitoring and alerting configured
- [ ] Documentation updated
- [ ] Rollback plan prepared
```

#### **📝 Deployment Order**
```bash
# Step 1: Deploy Strapi (🔵 Strapi Team)
echo "🔵 Deploying Strapi..."
npm run build
npm run strapi:deploy

# Step 2: Run Strapi migrations (🔵 Strapi Team)
echo "🔵 Running Strapi database migrations..."
npm run strapi migration:run

# Step 3: Deploy Ingestion Service (🔴 Ingestion Service Team)
echo "🔴 Deploying Ingestion Service..."
python manage.py migrate
python manage.py deploy

# Step 4: Run Ingestion Service migrations (🔴 Ingestion Service Team)
echo "🔴 Running Ingestion Service migrations..."
python manage.py migrate_operational_tables

# Step 5: Integration validation (🤝 Joint)
echo "🤝 Running integration validation..."
python tests/integration/test_full_integration.py

# Step 6: Enable traffic (🤝 Joint)
echo "🤝 Enabling production traffic..."
# Enable load balancer traffic
```

---

## 📊 **Monitoring and Maintenance**

### **1. Health Checks**

#### **📝 Strapi Health Check**
```javascript
// src/api/health/controllers/health.js
'use strict';

module.exports = {
  async check(ctx) {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {}
    };
    
    try {
      // Database connectivity
      await strapi.db.connection.raw('SELECT 1');
      healthCheck.services.database = 'healthy';
      
      // Memory cache
      healthCheck.services.cache = {
        status: 'healthy',
        size: strapi.memoryCache.size(),
        stats: strapi.memoryCache.getStats()
      };
      
      // Webhook connectivity (optional)
      if (process.env.INGESTION_SERVICE_WEBHOOK_URL) {
        try {
          const response = await fetch(process.env.INGESTION_SERVICE_WEBHOOK_URL + '/health', {
            method: 'GET',
            timeout: 2000
          });
          healthCheck.services.ingestion_service = response.ok ? 'healthy' : 'unhealthy';
        } catch (error) {
          healthCheck.services.ingestion_service = 'unhealthy';
        }
      }
      
      // System metrics
      healthCheck.system = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      };
      
      // API metrics
      healthCheck.api = strapi.metrics.getStats();
      
      ctx.send(healthCheck);
      
    } catch (error) {
      ctx.status = 503;
      ctx.send({
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error.message
      });
    }
  }
};
```

### **2. Monitoring Metrics**

#### **📝 Key Metrics to Track**
```javascript
// Strapi Metrics
const strapiMetrics = {
  // API Performance
  'api.preferences.requests_per_second': 'Counter',
  'api.preferences.response_time': 'Histogram',
  'api.preferences.error_rate': 'Counter',
  
  // Cache Performance
  'cache.hit_rate': 'Gauge',
  'cache.size': 'Gauge',
  'cache.evictions': 'Counter',
  
  // Webhook Performance
  'webhook.notifications_sent': 'Counter',
  'webhook.notification_errors': 'Counter',
  'webhook.notification_latency': 'Histogram',
  
  // Database Performance
  'db.connection_pool_size': 'Gauge',
  'db.query_duration': 'Histogram',
  'db.query_errors': 'Counter'
};

// Ingestion Service Metrics
const ingestionMetrics = {
  // Batch Processing
  'batch.sessions_created': 'Counter',
  'batch.sessions_completed': 'Counter',
  'batch.files_processed': 'Counter',
  'batch.processing_time': 'Histogram',
  
  // Email Notifications
  'email.notifications_sent': 'Counter',
  'email.notification_errors': 'Counter',
  'email.send_latency': 'Histogram',
  
  // Auto-Correction
  'auto_correction.tasks_created': 'Counter',
  'auto_correction.tasks_completed': 'Counter',
  'auto_correction.cleanup_success_rate': 'Gauge',
  
  // File Processing
  'file.processing_success_rate': 'Gauge',
  'file.processing_duration': 'Histogram',
  'file.processing_errors': 'Counter'
};
```

### **3. Alerting Rules**

#### **📝 Critical Alerts**
```yaml
# alerting-rules.yml
groups:
  - name: strapi-email-notification
    rules:
      # High error rate
      - alert: HighAPIErrorRate
        expr: rate(api_preferences_errors_total[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High API error rate in Strapi"
          description: "Error rate is {{ $value }} errors per second"
      
      # Cache hit rate too low
      - alert: LowCacheHitRate
        expr: cache_hit_rate < 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low cache hit rate"
          description: "Cache hit rate is {{ $value }}"
      
      # Webhook failures
      - alert: WebhookFailures
        expr: rate(webhook_notification_errors_total[5m]) > 0.05
        for: 3m
        labels:
          severity: critical
        annotations:
          summary: "High webhook failure rate"
          description: "Webhook error rate is {{ $value }}"
      
      # Database connection issues
      - alert: DatabaseConnectionIssues
        expr: db_connection_errors_total > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection issues"
          description: "Database connection errors detected"

  - name: ingestion-service-email
    rules:
      # Batch processing failures
      - alert: BatchProcessingFailures
        expr: rate(batch_processing_errors_total[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High batch processing failure rate"
          description: "Batch processing error rate is {{ $value }}"
      
      # Email notification failures
      - alert: EmailNotificationFailures
        expr: rate(email_notification_errors_total[5m]) > 0.05
        for: 3m
        labels:
          severity: critical
        annotations:
          summary: "High email notification failure rate"
          description: "Email notification error rate is {{ $value }}"
      
      # Auto-correction task backlog
      - alert: AutoCorrectionBacklog
        expr: auto_correction_tasks_pending > 100
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High auto-correction task backlog"
          description: "{{ $value }} auto-correction tasks pending"
```

---

## 🔐 **Security Considerations**

### **1. Authentication & Authorization**

#### **📝 API Security**
```javascript
// config/middlewares.js
module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  {
    name: 'strapi::rate-limit',
    config: {
      interval: 60000,
      max: 100,
      prefixKey: 'rl:',
      store: {
        get: (key) => strapi.memoryCache.get(key),
        set: (key, value, ttl) => strapi.memoryCache.set(key, value, ttl),
        del: (key) => strapi.memoryCache.delete(key)
      }
    },
  },
  'global::api-key-auth'  // Custom middleware for API key authentication
];
```

#### **📝 Custom API Key Authentication**
```javascript
// src/middlewares/api-key-auth.js
'use strict';

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Only apply to API routes
    if (!ctx.path.startsWith('/api/')) {
      return await next();
    }
    
    // Skip authentication for public routes
    const publicRoutes = ['/api/health'];
    if (publicRoutes.includes(ctx.path)) {
      return await next();
    }
    
    const apiKey = ctx.get('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return ctx.unauthorized('API key required');
    }
    
    // Validate API key
    const validKeys = [
      process.env.INGESTION_SERVICE_API_KEY,
      process.env.ADMIN_API_KEY
    ].filter(Boolean);
    
    if (!validKeys.includes(apiKey)) {
      strapi.log.warn('Invalid API key attempt', { 
        ip: ctx.ip, 
        userAgent: ctx.get('User-Agent'),
        path: ctx.path
      });
      return ctx.unauthorized('Invalid API key');
    }
    
    // Log API usage
    strapi.log.info('API access', {
      path: ctx.path,
      method: ctx.method,
      ip: ctx.ip,
      keyType: apiKey === process.env.INGESTION_SERVICE_API_KEY ? 'ingestion' : 'admin'
    });
    
    await next();
  };
};
```

### **2. Data Validation**

#### **📝 Input Validation**
```javascript
// src/api/user-notification-preference/middlewares/validate-input.js
'use strict';

const Joi = require('joi');

const userPreferenceSchema = Joi.object({
  company: Joi.number().integer().positive().required(),
  bot: Joi.number().integer().positive().required(),
  user_email: Joi.string().email().required(),
  notification_enabled: Joi.boolean().default(true),
  batch_size_threshold: Joi.number().integer().min(1).max(100).default(5),
  notification_delay_minutes: Joi.number().integer().min(1).max(1440).default(30),
  email_format: Joi.string().valid('html', 'text').default('html'),
  include_success_details: Joi.boolean().default(true),
  include_error_details: Joi.boolean().default(true)
});

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    if (ctx.request.method === 'POST' || ctx.request.method === 'PUT') {
      const { data } = ctx.request.body;
      
      const { error, value } = userPreferenceSchema.validate(data);
      
      if (error) {
        return ctx.badRequest('Validation error', { details: error.details });
      }
      
      ctx.request.body.data = value;
    }
    
    await next();
  };
};
```

### **3. Environment Variables**

#### **📝 Security Environment Variables**
```bash
# .env.production
# Database
DATABASE_CLIENT=postgres
DATABASE_HOST=your-secure-database-host
DATABASE_PORT=5432
DATABASE_NAME=strapi_production
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=secure_database_password
DATABASE_SSL=true

# API Keys
INGESTION_SERVICE_API_KEY=your-secure-ingestion-api-key-here
ADMIN_API_KEY=your-secure-admin-api-key-here

# Webhook Security
INGESTION_SERVICE_WEBHOOK_URL=https://your-secure-ingestion-service.com
WEBHOOK_SECRET=your-secure-webhook-secret

# Security
SESSION_SECRET=your-secure-session-secret
JWT_SECRET=your-secure-jwt-secret

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=100
RATE_LIMIT_INTERVAL=60000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

---

## 📚 **Documentation**

### **1. API Documentation**

#### **📝 OpenAPI Specification**
```yaml
# api-docs.yml
openapi: 3.0.0
info:
  title: Strapi Email Notification API
  version: 1.0.0
  description: API for managing user notification preferences

paths:
  /api/user-notification-preferences/by-user/{companyId}/{botId}/{userEmail}:
    get:
      summary: Get user notification preferences
      parameters:
        - name: companyId
          in: path
          required: true
          schema:
            type: integer
        - name: botId
          in: path
          required: true
          schema:
            type: integer
        - name: userEmail
          in: path
          required: true
          schema:
            type: string
            format: email
      responses:
        '200':
          description: User preferences retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/UserPreferences'
                  cache_hit:
                    type: boolean
                  fallback_applied:
                    type: boolean

  /api/user-notification-preferences/bulk-get:
    post:
      summary: Bulk retrieve user preferences
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                users:
                  type: array
                  items:
                    type: object
                    properties:
                      company_id:
                        type: integer
                      bot_id:
                        type: integer
                      user_email:
                        type: string
                        format: email
      responses:
        '200':
          description: Bulk preferences retrieved successfully

components:
  schemas:
    UserPreferences:
      type: object
      properties:
        user_email:
          type: string
          format: email
        company:
          type: object
          properties:
            id:
              type: integer
        bot:
          type: object
          properties:
            id:
              type: integer
        notification_enabled:
          type: boolean
        batch_size_threshold:
          type: integer
          minimum: 1
          maximum: 100
        notification_delay_minutes:
          type: integer
          minimum: 1
          maximum: 1440
        email_format:
          type: string
          enum: [html, text]
        include_success_details:
          type: boolean
        include_error_details:
          type: boolean
```

### **2. Implementation Guide**

#### **📝 Getting Started Guide**
```markdown
# Getting Started with Email Notification System

## Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Docker (optional)

## Setup Instructions

### 1. Strapi Setup
```bash
# Clone repository
git clone <repository-url>
cd strapi-email-notification

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run strapi migration:run

# Start development server
npm run develop
```

### 2. Ingestion Service Setup
```bash
# Clone ingestion service
git clone <ingestion-service-url>
cd ingestion-service

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run migrations
python manage.py migrate

# Start service
python manage.py runserver
```

### 3. Testing the Integration
```bash
# Create test user preferences
curl -X POST http://localhost:1337/api/user-notification-preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "data": {
      "company": 1,
      "bot": 1,
      "user_email": "test@example.com",
      "notification_enabled": true,
      "batch_size_threshold": 5
    }
  }'

# Test preference retrieval
curl -X GET http://localhost:1337/api/user-notification-preferences/by-user/1/1/test@example.com \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Configuration Options

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `INGESTION_SERVICE_WEBHOOK_URL` | Webhook URL for ingestion service | - |
| `INGESTION_SERVICE_API_KEY` | API key for ingestion service | - |
| `RATE_LIMIT_MAX` | Maximum requests per interval | 100 |
| `RATE_LIMIT_INTERVAL` | Rate limit interval in ms | 60000 |

### Performance Tuning
- **Memory Cache Size**: Configure based on expected user count
- **Database Connection Pool**: Adjust based on concurrent load
- **Webhook Timeout**: Set based on ingestion service response time

## Troubleshooting

### Common Issues
1. **Cache Miss Rate Too High**: Increase cache TTL or memory allocation
2. **Webhook Failures**: Check network connectivity and API keys
3. **Database Connection Issues**: Verify connection string and credentials
4. **High API Latency**: Enable database query logging to identify slow queries

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run develop

# Enable SQL query logging
DATABASE_DEBUG=true npm run develop
```
```

---

## 🎯 **Success Criteria**

### **Phase 1 Completion Criteria**
- [ ] **🔵 Strapi**: User preference content type created and functional
- [ ] **🔵 Strapi**: API endpoints working with proper validation
- [ ] **🔵 Strapi**: Memory caching implemented and tested
- [ ] **🔵 Strapi**: Webhook notifications working
- [ ] **🔵 Strapi**: Database migration completed successfully
- [ ] **🔴 Ingestion Service**: Operational tables created
- [ ] **🔴 Ingestion Service**: Preference API integration working
- [ ] **🔴 Ingestion Service**: Webhook endpoint implemented
- [ ] **🔴 Ingestion Service**: Basic batch management functional
- [ ] **🤝 Integration**: End-to-end testing completed
- [ ] **🤝 Integration**: Performance benchmarks met
- [ ] **🤝 Integration**: Security review passed
- [ ] **🤝 Integration**: Documentation complete

### **Performance Benchmarks**
- **API Response Time**: < 200ms for preference retrieval
- **Cache Hit Rate**: > 85% for frequently accessed preferences
- **Webhook Delivery**: < 2 seconds for preference updates
- **Database Query Time**: < 50ms for simple queries
- **Memory Usage**: < 512MB for Strapi service
- **Concurrent Users**: Support 100+ concurrent API requests

### **Security Requirements**
- **Authentication**: API key validation on all endpoints
- **Authorization**: Proper access control for preference data
- **Input Validation**: All user inputs validated and sanitized
- **Rate Limiting**: Protection against abuse and DDoS
- **Logging**: Complete audit trail of all API access
- **Encryption**: TLS/SSL for all communication

---

## 📝 **Final Notes**

This implementation guide provides a complete roadmap for implementing the email notification and auto-correction system with clear separation of responsibilities between the Strapi and ingestion service teams.

### **Key Success Factors**
1. **Clear Communication**: Regular sync meetings between teams
2. **Defined Interfaces**: Strict adherence to API contracts
3. **Thorough Testing**: Comprehensive unit and integration tests
4. **Performance Monitoring**: Real-time metrics and alerting
5. **Security First**: Security considerations at every level
6. **Documentation**: Complete and up-to-date documentation

### **Risk Mitigation**
- **Database Changes**: Proper backup and rollback procedures
- **API Changes**: Versioning and backward compatibility
- **Performance Issues**: Load testing and optimization
- **Security Vulnerabilities**: Regular security audits and updates

### **Next Steps**
1. **Review and Approval**: Both teams review and approve this guide
2. **Environment Setup**: Prepare development environments
3. **Implementation**: Begin Phase 1 implementation
4. **Testing**: Comprehensive testing at each phase
5. **Deployment**: Staged deployment with monitoring
6. **Maintenance**: Ongoing monitoring and optimization

**Total Implementation Time**: 5 weeks  
**Phase 1 Critical Path**: 2 weeks  
**Production Ready**: 3 weeks  

---

**Document Status**: Ready for Implementation  
**Review Required**: Yes  
**Approval Required**: Both Teams  
**Implementation Start**: Upon Approval  

This guide serves as the complete implementation blueprint for both teams to successfully deliver the email notification and auto-correction system. 