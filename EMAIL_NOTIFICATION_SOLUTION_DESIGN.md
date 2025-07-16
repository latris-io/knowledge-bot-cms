# 📧 Email Notification & Auto-Correction Solution Design
## Hybrid Architecture with Clear Team Responsibilities

### **Document Information**
- **Version**: 2.0 (Updated)
- **Date**: 2025-01-16
- **Target**: Universal Ingestion Service + Minimal Strapi Integration
- **Scope**: Email notifications and auto-correction functionality
- **Architecture**: CMS-agnostic design with clear separation of concerns

---

## 🎯 **Solution Overview**

This solution implements email notification and auto-correction capabilities using a **hybrid architecture** that minimizes CMS dependencies while maximizing ingestion service autonomy. The design is **CMS-agnostic** to support future platform changes.

### **Core Principles**
1. **Minimal CMS Footprint**: Only user preferences and basic file metadata in Strapi
2. **Operational Autonomy**: All processing logic in ingestion service
3. **CMS Agnostic**: Design supports future CMS replacement
4. **Clear Responsibilities**: Each team owns specific components

### **Architecture Overview**
```
┌─────────────────────────────────────────────────────────────────────┐
│                         STRAPI CMS (🔵)                            │
│                     [Minimal Responsibilities]                      │
├─────────────────────────────────────────────────────────────────────┤
│  📝 User Preferences    📁 File Metadata     🔗 Basic API           │
│  • Notification prefs   • Names, statuses   • Read preferences     │
│  • Email settings       • Last batch info   • Update file status   │
│  • User management      • Notification sent • Health checks        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   INGESTION SERVICE (🔴)                           │
│                   [Full Operational Control]                        │
├─────────────────────────────────────────────────────────────────────┤
│  📊 Batch Management    📧 Email Service     🔧 Auto-Correction     │
│  • Session tracking     • SMTP integration   • S3 cleanup          │
│  • File coordination    • Template engine    • CMS cleanup         │
│  • Timing control       • Delivery tracking  • ChromaDB cleanup    │
│                                                                     │
│  📈 Status Tracking     💾 Operational DB    🔍 Error Handling     │
│  • Processing stages    • 7 operational tbl  • Categorization      │
│  • Progress monitoring  • Complete audit     • Auto-correction     │
│  • Metrics collection   • Performance data   • Recovery logic      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ **Database Schema & Responsibilities**

### **📊 Complete Database Changes Summary**

| Component | Tables | Owner | Implementation | Purpose |
|-----------|--------|-------|----------------|---------|
| **User Preferences** | 1 new content type | 🔵 Strapi | Content Type | User notification settings |
| **File Metadata** | 3 column additions | 🔵 Strapi | Migration | Batch tracking in files |
| **Batch Operations** | 2 new tables | 🔴 Ingestion | Migration | Session & file tracking |
| **Processing Status** | 1 new table | 🔴 Ingestion | Migration | Detailed stage tracking |
| **Auto-Correction** | 1 new table | 🔴 Ingestion | Migration | Cleanup task management |
| **Error Tracking** | 1 new table | 🔴 Ingestion | Migration | Comprehensive error log |
| **Email Operations** | 2 new tables | 🔴 Ingestion | Migration | Email log & retry tracking |

**Total:** 11 database changes (1 Strapi content type + 3 Strapi columns + 7 ingestion tables)

---

## 🔵 **STRAPI TEAM RESPONSIBILITIES**
### **[Content Management & User Interface Only]**

### **1. User Notification Preferences Content Type**
```json
{
  "kind": "collectionType",
  "collectionName": "user_notification_preferences",
  "info": {
    "singularName": "user-notification-preference",
    "pluralName": "user-notification-preferences",
    "displayName": "User Notification Preferences"
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

### **2. File Metadata Enhancements**
```sql
-- Migration: Add notification tracking to files table
-- Responsibility: 🔵 Strapi Team

ALTER TABLE files ADD COLUMN notification_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE files ADD COLUMN last_notification_batch UUID;
ALTER TABLE files ADD COLUMN processing_metadata JSONB DEFAULT '{}';

-- Indexes for performance
CREATE INDEX idx_files_notification_sent ON files(notification_sent);
CREATE INDEX idx_files_last_notification_batch ON files(last_notification_batch);
```

### **3. Simple API Endpoints (Strapi)**
```javascript
// Basic API endpoints - no complex logic
// GET /api/user-notification-preferences
// POST /api/user-notification-preferences
// PUT /api/user-notification-preferences/:id
// DELETE /api/user-notification-preferences/:id

// Custom endpoint for ingestion service
// GET /api/user-notification-preferences/by-user/:companyId/:botId/:userEmail
module.exports = {
  async findByUser(ctx) {
    const { companyId, botId, userEmail } = ctx.params;
    
    const preferences = await strapi.documents('api::user-notification-preference.user-notification-preference').findFirst({
      filters: {
        company: { id: companyId },
        bot: { id: botId },
        user_email: { $eq: userEmail }
      }
    });
    
    // Return preferences or defaults
    ctx.send({
      data: preferences || {
        notification_enabled: true,
        batch_size_threshold: 5,
        notification_delay_minutes: 30,
        email_format: 'html',
        include_success_details: true,
        include_error_details: true
      }
    });
  }
};
```

### **4. Strapi Team Deliverables**
- ✅ User notification preferences content type
- ✅ File metadata column additions
- ✅ Basic API endpoints for preference CRUD
- ✅ Simple preference lookup endpoint
- ✅ Admin UI for managing preferences
- ✅ Database migration for file metadata

**Timeline: 3-4 days**

---

## 🔴 **INGESTION SERVICE TEAM RESPONSIBILITIES**
### **[All Operational Processing & Business Logic]**

### **1. Operational Database Tables**

#### **Batch Processing Sessions**
```sql
-- Table: batch_processing_sessions
-- Owner: 🔴 Ingestion Service Team

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
    status VARCHAR(20) DEFAULT 'processing',  -- 'processing', 'completed', 'failed'
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP,
    user_preferences_snapshot JSONB,     -- Cache preferences at batch creation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **Batch Files Tracking**
```sql
-- Table: batch_files
-- Owner: 🔴 Ingestion Service Team

CREATE TABLE batch_files (
    id SERIAL PRIMARY KEY,
    batch_id UUID NOT NULL REFERENCES batch_processing_sessions(batch_id) ON DELETE CASCADE,
    file_document_id TEXT NOT NULL,      -- References strapi.files.document_id
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT,
    processing_status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'processing', 'success', 'failed'
    processing_start_time TIMESTAMP,
    processing_end_time TIMESTAMP,
    processing_time_seconds INTEGER,
    chunks_created INTEGER DEFAULT 0,
    error_message TEXT,
    error_category VARCHAR(50),          -- 'file_not_found', 's3_error', 'processing_error', 'storage_error'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **File Processing Status**
```sql
-- Table: file_processing_status
-- Owner: 🔴 Ingestion Service Team

CREATE TABLE file_processing_status (
    id SERIAL PRIMARY KEY,
    file_event_id INTEGER NOT NULL REFERENCES file_events(id),
    file_document_id TEXT NOT NULL,
    batch_id UUID REFERENCES batch_processing_sessions(batch_id),
    processing_stage VARCHAR(50) NOT NULL,  -- 'download', 'processing', 'storage', 'completed', 'failed'
    status VARCHAR(20) NOT NULL,            -- 'pending', 'processing', 'success', 'failed'
    stage_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    stage_end_time TIMESTAMP,
    error_message TEXT,
    error_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **Auto-Correction Tasks**
```sql
-- Table: auto_correction_tasks
-- Owner: 🔴 Ingestion Service Team

CREATE TABLE auto_correction_tasks (
    id SERIAL PRIMARY KEY,
    file_document_id TEXT NOT NULL,
    file_name TEXT,
    company_id INTEGER,
    bot_id INTEGER,
    batch_id UUID REFERENCES batch_processing_sessions(batch_id),
    failure_category VARCHAR(50) NOT NULL,  -- 'file_not_found', 's3_error', 'processing_error', 'storage_error'
    original_error_message TEXT NOT NULL,
    correction_actions JSONB NOT NULL,      -- ['s3_delete', 'cms_delete', 'chroma_delete']
    status VARCHAR(20) DEFAULT 'pending',   -- 'pending', 'processing', 'completed', 'failed'
    s3_cleanup_completed BOOLEAN DEFAULT FALSE,
    cms_cleanup_completed BOOLEAN DEFAULT FALSE,
    chroma_cleanup_completed BOOLEAN DEFAULT FALSE,
    execution_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_during_correction TEXT
);
```

#### **Processing Errors**
```sql
-- Table: processing_errors
-- Owner: 🔴 Ingestion Service Team

CREATE TABLE processing_errors (
    id SERIAL PRIMARY KEY,
    file_event_id INTEGER REFERENCES file_events(id),
    file_document_id TEXT NOT NULL,
    batch_id UUID REFERENCES batch_processing_sessions(batch_id),
    error_category VARCHAR(50) NOT NULL,
    error_message TEXT NOT NULL,
    error_details JSONB,
    stack_trace TEXT,
    processing_stage VARCHAR(50),
    auto_correction_triggered BOOLEAN DEFAULT FALSE,
    resolution_status VARCHAR(20) DEFAULT 'unresolved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);
```

#### **Email Notification Log**
```sql
-- Table: email_notification_log
-- Owner: 🔴 Ingestion Service Team

CREATE TABLE email_notification_log (
    id SERIAL PRIMARY KEY,
    batch_id UUID NOT NULL REFERENCES batch_processing_sessions(batch_id),
    recipient_email VARCHAR(255) NOT NULL,
    company_id INTEGER NOT NULL,
    bot_id INTEGER NOT NULL,
    email_type VARCHAR(50) DEFAULT 'batch_completion',
    email_subject TEXT NOT NULL,
    email_content_html TEXT,
    email_content_text TEXT,
    send_status VARCHAR(20) DEFAULT 'pending',
    send_attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    sent_at TIMESTAMP,
    error_message TEXT,
    smtp_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **Notification Retry Log**
```sql
-- Table: notification_retry_log
-- Owner: 🔴 Ingestion Service Team

CREATE TABLE notification_retry_log (
    id SERIAL PRIMARY KEY,
    batch_id UUID NOT NULL REFERENCES batch_processing_sessions(batch_id),
    retry_attempt INTEGER NOT NULL,
    error_message TEXT,
    retry_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT FALSE,
    next_retry_at TIMESTAMP
);
```

### **2. Core Python Components**

#### **Batch Manager**
```python
# batch_manager.py
# Owner: 🔴 Ingestion Service Team

class BatchManager:
    """Manages batch processing sessions and coordination"""
    
    def __init__(self, db_pool, strapi_client):
        self.db_pool = db_pool
        self.strapi_client = strapi_client
        self.active_batches = {}  # company_id:bot_id:user_email -> batch_id
        self.batch_timers = {}    # batch_id -> timer_task
        self.preference_cache = {}  # Simple memory cache
        self.logger = logging.getLogger(__name__)
    
    async def get_or_create_batch(self, company_id: int, bot_id: int, user_email: str) -> str:
        """Get existing batch or create new one"""
        user_key = f"{company_id}:{bot_id}:{user_email}"
        
        # Check for existing active batch
        if user_key in self.active_batches:
            batch_id = self.active_batches[user_key]
            if await self.is_batch_active(batch_id):
                return batch_id
            else:
                await self.cleanup_expired_batch(batch_id)
                del self.active_batches[user_key]
        
        # Create new batch
        batch_id = await self.create_new_batch(company_id, bot_id, user_email)
        self.active_batches[user_key] = batch_id
        return batch_id
    
    async def get_user_preferences(self, company_id: int, bot_id: int, user_email: str) -> dict:
        """Get user preferences with caching and fallback"""
        cache_key = f"{company_id}:{bot_id}:{user_email}"
        
        # Check cache first
        if cache_key in self.preference_cache:
            cached_data, timestamp = self.preference_cache[cache_key]
            if time.time() - timestamp < 300:  # 5 minutes
                return cached_data
        
        # Fetch from Strapi
        try:
            response = await self.strapi_client.get(
                f"/api/user-notification-preferences/by-user/{company_id}/{bot_id}/{user_email}"
            )
            preferences = response.json()['data']
            
            # Cache result
            self.preference_cache[cache_key] = (preferences, time.time())
            return preferences
            
        except Exception as e:
            self.logger.warning(f"Failed to get preferences from Strapi: {e}")
            
            # Return cached data if available (even if expired)
            if cache_key in self.preference_cache:
                cached_data, _ = self.preference_cache[cache_key]
                return cached_data
            
            # Fall back to defaults
            return {
                'notification_enabled': True,
                'batch_size_threshold': 5,
                'notification_delay_minutes': 30,
                'email_format': 'html',
                'include_success_details': True,
                'include_error_details': True
            }
    
    async def create_new_batch(self, company_id: int, bot_id: int, user_email: str) -> str:
        """Create new batch processing session"""
        batch_id = str(uuid.uuid4())
        
        # Get user preferences
        preferences = await self.get_user_preferences(company_id, bot_id, user_email)
        
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO batch_processing_sessions 
                (batch_id, company_id, bot_id, user_email, batch_start_time, 
                 status, user_preferences_snapshot)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            """, batch_id, company_id, bot_id, user_email, datetime.now(), 
                'processing', json.dumps(preferences))
        
        # Schedule batch completion
        delay_minutes = preferences.get('notification_delay_minutes', 30)
        self.batch_timers[batch_id] = asyncio.create_task(
            self.schedule_batch_completion(batch_id, delay_minutes)
        )
        
        self.logger.info(f"Created new batch {batch_id} for {user_email}")
        return batch_id
    
    async def schedule_batch_completion(self, batch_id: str, delay_minutes: int):
        """Schedule batch completion after delay"""
        await asyncio.sleep(delay_minutes * 60)
        
        try:
            await self.complete_batch(batch_id)
        except Exception as e:
            self.logger.error(f"Error completing batch {batch_id}: {e}")
        finally:
            if batch_id in self.batch_timers:
                del self.batch_timers[batch_id]
    
    async def complete_batch(self, batch_id: str):
        """Complete batch and trigger notification"""
        async with self.db_pool.acquire() as conn:
            # Update batch status
            await conn.execute("""
                UPDATE batch_processing_sessions 
                SET status = 'completed', 
                    batch_end_time = CURRENT_TIMESTAMP
                WHERE batch_id = $1
            """, batch_id)
            
            # Remove from active batches
            batch_info = await conn.fetchrow("""
                SELECT company_id, bot_id, user_email 
                FROM batch_processing_sessions 
                WHERE batch_id = $1
            """, batch_id)
            
            if batch_info:
                user_key = f"{batch_info['company_id']}:{batch_info['bot_id']}:{batch_info['user_email']}"
                if user_key in self.active_batches:
                    del self.active_batches[user_key]
        
        # Trigger notification
        notification_service = NotificationService(self.db_pool)
        await notification_service.send_batch_notification(batch_id)
        
        self.logger.info(f"Completed batch {batch_id}")
```

#### **Enhanced Event Handler Integration**
```python
# enhanced_event_handlers.py
# Owner: 🔴 Ingestion Service Team

class EnhancedEventHandler:
    """Enhanced event handlers with batch tracking and auto-correction"""
    
    def __init__(self, batch_manager, auto_correction_service):
        self.batch_manager = batch_manager
        self.auto_correction_service = auto_correction_service
        self.logger = logging.getLogger(__name__)
    
    async def handle_created_event(self, conn, file_event, _unused_embedding_model=None):
        """Enhanced created event handler"""
        start_time = time.time()
        
        # Get file details
        result = conn.execute(
            text("SELECT company_id, bot_id, name, storage_key FROM files WHERE document_id = :document_id"),
            {"document_id": file_event.file_document_id}
        ).fetchone()
        
        if not result:
            # File not found - create auto-correction task
            await self.auto_correction_service.create_correction_task(
                file_event.file_document_id, "unknown", 0, 0, None,
                "file_not_found", f"No file found for document_id: {file_event.file_document_id}"
            )
            return
        
        company_id, bot_id, file_name, storage_key = result
        
        # Get or create batch (TODO: Get actual user email from context)
        batch_id = await self.batch_manager.get_or_create_batch(company_id, bot_id, "user@example.com")
        
        # Add file to batch
        await self.batch_manager.add_file_to_batch(batch_id, file_event.file_document_id, file_name)
        
        try:
            # ... existing processing logic ...
            
            # Update batch file status on success
            processing_time = int(time.time() - start_time)
            await self.batch_manager.update_file_status(
                batch_id, file_event.file_document_id, 'success', 
                processing_time, len(chunks_created)
            )
            
        except Exception as e:
            # Handle failure
            processing_time = int(time.time() - start_time)
            await self.batch_manager.update_file_status(
                batch_id, file_event.file_document_id, 'failed', 
                processing_time, 0, str(e)
            )
            
            # Create auto-correction task
            error_category = self.categorize_error(e)
            await self.auto_correction_service.create_correction_task(
                file_event.file_document_id, file_name, company_id, bot_id, batch_id,
                error_category, str(e)
            )
    
    def categorize_error(self, error: Exception) -> str:
        """Categorize error for auto-correction"""
        error_str = str(error).lower()
        
        if 'file not found' in error_str:
            return 'file_not_found'
        elif 's3' in error_str or 'bucket' in error_str:
            return 's3_error'
        elif 'chroma' in error_str or 'vector' in error_str:
            return 'storage_error'
        else:
            return 'processing_error'
```

### **3. Email & Auto-Correction Services**

#### **Notification Service**
```python
# notification_service.py
# Owner: 🔴 Ingestion Service Team

class NotificationService:
    """Handles email notifications with full template engine"""
    
    def __init__(self, db_pool):
        self.db_pool = db_pool
        self.logger = logging.getLogger(__name__)
        
        # SMTP configuration
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_user = os.getenv('SMTP_USER')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@knowledgebot.com')
    
    async def send_batch_notification(self, batch_id: str):
        """Send email notification for completed batch"""
        try:
            # Get batch details
            batch_info = await self.get_batch_info(batch_id)
            
            if not batch_info:
                self.logger.error(f"Batch {batch_id} not found")
                return
            
            # Check if notification is enabled
            preferences = json.loads(batch_info['user_preferences_snapshot'])
            if not preferences.get('notification_enabled', True):
                self.logger.info(f"Notifications disabled for batch {batch_id}")
                return
            
            # Generate email content
            email_content = await self.generate_email_content(batch_id, batch_info)
            
            # Send email
            await self.send_email(batch_info['user_email'], email_content)
            
            # Update batch notification status
            await self.update_notification_status(batch_id, True)
            
        except Exception as e:
            self.logger.error(f"Failed to send notification for batch {batch_id}: {e}")
            await self.update_notification_status(batch_id, False, str(e))
    
    async def generate_email_content(self, batch_id: str, batch_info: dict) -> dict:
        """Generate email content (HTML and text)"""
        successful_files = [f for f in batch_info['files'] if f['processing_status'] == 'success']
        failed_files = [f for f in batch_info['files'] if f['processing_status'] == 'failed']
        
        processing_time = (batch_info['batch_end_time'] - batch_info['batch_start_time']).total_seconds() / 60
        
        subject = f"File Processing Complete - {len(successful_files)} Success, {len(failed_files)} Failed"
        
        # Generate HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
                .success {{ color: #28a745; }}
                .error {{ color: #dc3545; }}
                .stats {{ background-color: #e9ecef; padding: 15px; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h2>📁 File Processing Complete</h2>
                <p><strong>Batch ID:</strong> {batch_id}</p>
                <p><strong>Completion Time:</strong> {batch_info['batch_end_time'].strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <div class="stats">
                <h3>📊 Processing Summary</h3>
                <ul>
                    <li><strong>Total Files:</strong> {batch_info['total_files']}</li>
                    <li><strong class="success">✅ Successful:</strong> {len(successful_files)}</li>
                    <li><strong class="error">❌ Failed:</strong> {len(failed_files)}</li>
                    <li><strong>Processing Time:</strong> {processing_time:.1f} minutes</li>
                </ul>
            </div>
        """
        
        # Add file details based on user preferences
        preferences = json.loads(batch_info['user_preferences_snapshot'])
        
        if preferences.get('include_success_details', True) and successful_files:
            html_content += f"""
            <h3 class="success">✅ Successfully Processed Files ({len(successful_files)})</h3>
            <ul>
            """
            for file in successful_files:
                html_content += f"""
                <li><strong>{file['file_name']}</strong> - {file['processing_time_seconds']}s, {file['chunks_created']} chunks</li>
                """
            html_content += "</ul>"
        
        if preferences.get('include_error_details', True) and failed_files:
            html_content += f"""
            <h3 class="error">❌ Failed Files ({len(failed_files)})</h3>
            <ul>
            """
            for file in failed_files:
                html_content += f"""
                <li><strong>{file['file_name']}</strong> - {file['error_message'] or 'Unknown error'}</li>
                """
            html_content += "</ul>"
        
        html_content += """
            <hr>
            <p><em>This is an automated notification from the Knowledge Bot Ingestion Service.</em></p>
        </body>
        </html>
        """
        
        # Generate text version
        text_content = f"""
FILE PROCESSING COMPLETE

Batch ID: {batch_id}
Completion Time: {batch_info['batch_end_time'].strftime('%Y-%m-%d %H:%M:%S')}

PROCESSING SUMMARY:
- Total Files: {batch_info['total_files']}
- Successful: {len(successful_files)}
- Failed: {len(failed_files)}
- Processing Time: {processing_time:.1f} minutes
        """
        
        if preferences.get('include_success_details', True):
            text_content += "\n\nSUCCESSFUL FILES:\n"
            for file in successful_files:
                text_content += f"✅ {file['file_name']} ({file['processing_time_seconds']}s, {file['chunks_created']} chunks)\n"
        
        if preferences.get('include_error_details', True):
            text_content += "\n\nFAILED FILES:\n"
            for file in failed_files:
                text_content += f"❌ {file['file_name']} - {file['error_message'] or 'Unknown error'}\n"
        
        return {
            'subject': subject,
            'html': html_content,
            'text': text_content
        }
```

#### **Auto-Correction Service**
```python
# auto_correction_service.py
# Owner: 🔴 Ingestion Service Team

class AutoCorrectionService:
    """Handles automatic rollback of failed files"""
    
    def __init__(self, db_pool, s3_client, bucket_name, chroma_client, strapi_client):
        self.db_pool = db_pool
        self.s3_client = s3_client
        self.bucket_name = bucket_name
        self.chroma_client = chroma_client
        self.strapi_client = strapi_client
        self.logger = logging.getLogger(__name__)
    
    async def create_correction_task(self, file_document_id: str, file_name: str, 
                                   company_id: int, bot_id: int, batch_id: str,
                                   error_category: str, error_message: str):
        """Create auto-correction task for failed file"""
        
        # Determine correction actions based on error category
        correction_actions = self.determine_correction_actions(error_category)
        
        async with self.db_pool.acquire() as conn:
            task_id = await conn.fetchval("""
                INSERT INTO auto_correction_tasks 
                (file_document_id, file_name, company_id, bot_id, batch_id,
                 failure_category, original_error_message, correction_actions, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
            """, file_document_id, file_name, company_id, bot_id, batch_id,
                error_category, error_message, json.dumps(correction_actions), 'pending')
        
        # Execute correction asynchronously
        asyncio.create_task(self.execute_correction_task(task_id))
        
        self.logger.info(f"Created auto-correction task {task_id} for {file_document_id}")
    
    def determine_correction_actions(self, error_category: str) -> list:
        """Determine what cleanup actions are needed"""
        action_map = {
            'file_not_found': ['cms_delete'],
            's3_error': ['s3_delete', 'cms_delete'],
            'processing_error': ['s3_delete', 'cms_delete', 'chroma_delete'],
            'storage_error': ['chroma_delete']
        }
        
        return action_map.get(error_category, ['s3_delete', 'cms_delete', 'chroma_delete'])
    
    async def execute_correction_task(self, task_id: int):
        """Execute auto-correction task"""
        try:
            # Get task details
            async with self.db_pool.acquire() as conn:
                task = await conn.fetchrow("""
                    SELECT * FROM auto_correction_tasks WHERE id = $1
                """, task_id)
            
            if not task:
                return
            
            # Update status to processing
            await self.update_task_status(task_id, 'processing')
            
            correction_actions = json.loads(task['correction_actions'])
            execution_log = []
            
            # Execute each correction action
            for action in correction_actions:
                try:
                    if action == 's3_delete':
                        await self.cleanup_s3_file(task['file_document_id'])
                        await self.mark_action_completed(task_id, 's3_cleanup_completed')
                        execution_log.append(f"S3 cleanup completed for {task['file_name']}")
                        
                    elif action == 'cms_delete':
                        await self.cleanup_cms_file(task['file_document_id'])
                        await self.mark_action_completed(task_id, 'cms_cleanup_completed')
                        execution_log.append(f"CMS cleanup completed for {task['file_name']}")
                        
                    elif action == 'chroma_delete':
                        await self.cleanup_chroma_file(task['file_document_id'])
                        await self.mark_action_completed(task_id, 'chroma_cleanup_completed')
                        execution_log.append(f"ChromaDB cleanup completed for {task['file_name']}")
                    
                except Exception as e:
                    execution_log.append(f"Failed to execute {action}: {str(e)}")
                    self.logger.error(f"Auto-correction action {action} failed for task {task_id}: {e}")
            
            # Update execution log
            await self.update_execution_log(task_id, execution_log)
            
            # Mark task as completed
            await self.update_task_status(task_id, 'completed')
            
        except Exception as e:
            self.logger.error(f"Auto-correction task {task_id} failed: {e}")
            await self.update_task_status(task_id, 'failed', str(e))
    
    async def cleanup_s3_file(self, file_document_id: str):
        """Remove file from S3"""
        try:
            # Get storage key from database
            async with self.db_pool.acquire() as conn:
                result = await conn.fetchrow("""
                    SELECT storage_key FROM files WHERE document_id = $1
                """, file_document_id)
            
            if result and result['storage_key']:
                self.s3_client.delete_object(
                    Bucket=self.bucket_name,
                    Key=result['storage_key']
                )
                self.logger.info(f"Deleted S3 file: {result['storage_key']}")
            
        except Exception as e:
            self.logger.error(f"Failed to cleanup S3 file {file_document_id}: {e}")
            raise
    
    async def cleanup_cms_file(self, file_document_id: str):
        """Remove file record from CMS via API"""
        try:
            # Use Strapi API to delete file
            await self.strapi_client.delete(f"/api/files/{file_document_id}")
            self.logger.info(f"Deleted CMS file record: {file_document_id}")
            
        except Exception as e:
            self.logger.error(f"Failed to cleanup CMS file {file_document_id}: {e}")
            raise
    
    async def cleanup_chroma_file(self, file_document_id: str):
        """Remove file chunks from ChromaDB"""
        try:
            collection = self.chroma_client.get_or_create_collection(name="global")
            
            # Get existing chunks
            existing_chunks = collection.get(
                where={"document_id": {"$eq": file_document_id}},
                include=["metadatas"]
            )
            
            if existing_chunks and existing_chunks['ids']:
                collection.delete(ids=existing_chunks['ids'])
                self.logger.info(f"Deleted {len(existing_chunks['ids'])} chunks from ChromaDB for {file_document_id}")
            
        except Exception as e:
            self.logger.error(f"Failed to cleanup ChromaDB file {file_document_id}: {e}")
            raise
    
    async def update_task_status(self, task_id: int, status: str, error_message: str = None):
        """Update task status"""
        async with self.db_pool.acquire() as conn:
            if status == 'processing':
                await conn.execute("""
                    UPDATE auto_correction_tasks 
                    SET status = $1, started_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                """, status, task_id)
            elif status == 'completed':
                await conn.execute("""
                    UPDATE auto_correction_tasks 
                    SET status = $1, completed_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                """, status, task_id)
            elif status == 'failed':
                await conn.execute("""
                    UPDATE auto_correction_tasks 
                    SET status = $1, error_during_correction = $2, completed_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                """, status, error_message, task_id)
    
    async def mark_action_completed(self, task_id: int, column: str):
        """Mark specific action as completed"""
        async with self.db_pool.acquire() as conn:
            await conn.execute(f"""
                UPDATE auto_correction_tasks 
                SET {column} = true
                WHERE id = $1
            """, task_id)
    
    async def update_execution_log(self, task_id: int, log_entries: list):
        """Update execution log"""
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                UPDATE auto_correction_tasks 
                SET execution_log = $1
                WHERE id = $2
            """, json.dumps(log_entries), task_id)
    
    async def process_pending_tasks(self):
        """Background process to handle pending auto-correction tasks"""
        try:
            async with self.db_pool.acquire() as conn:
                pending_tasks = await conn.fetch("""
                    SELECT id FROM auto_correction_tasks 
                    WHERE status = 'pending'
                    ORDER BY created_at ASC
                    LIMIT 10
                """)
            
            for task in pending_tasks:
                asyncio.create_task(self.execute_correction_task(task['id']))
                
        except Exception as e:
            self.logger.error(f"Error processing pending auto-correction tasks: {e}")
```

### **4. Ingestion Service Team Deliverables**
- ✅ 7 operational database tables with migrations
- ✅ Enhanced event handlers with batch tracking
- ✅ Batch management system with timing control
- ✅ Email notification service with SMTP integration
- ✅ Auto-correction service with multi-system cleanup
- ✅ Error handling and categorization system
- ✅ Comprehensive logging and monitoring
- ✅ Preference caching with fallback mechanisms

**Timeline: 2-3 weeks**

---

## 🔗 **Integration Points**

### **1. API Contract**
```typescript
// Strapi provides simple API for preferences
interface PreferencesAPI {
  GET: '/api/user-notification-preferences/by-user/{companyId}/{botId}/{userEmail}';
  POST: '/api/user-notification-preferences';
  PUT: '/api/user-notification-preferences/{id}';
  DELETE: '/api/user-notification-preferences/{id}';
}

// Response format
interface PreferencesResponse {
  data: {
    notification_enabled: boolean;
    batch_size_threshold: number;
    notification_delay_minutes: number;
    email_format: 'html' | 'text';
    include_success_details: boolean;
    include_error_details: boolean;
  };
}
```

### **2. Database References**
```sql
-- Ingestion Service tables reference Strapi entities by ID
-- NO foreign key constraints across systems for CMS independence

-- References (loose coupling)
batch_processing_sessions.company_id → strapi.companies.id
batch_processing_sessions.bot_id → strapi.bots.id
batch_files.file_document_id → strapi.files.document_id
```

---

## ⚙️ **Configuration**

### **Environment Variables**
```bash
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@knowledgebot.com

# Strapi Integration (CMS Agnostic)
CMS_API_URL=https://your-cms-instance.com
CMS_API_TOKEN=your-cms-api-token

# Notification Settings
ENABLE_EMAIL_NOTIFICATIONS=true
DEFAULT_NOTIFICATION_DELAY_MINUTES=30
DEFAULT_BATCH_SIZE_THRESHOLD=5
MAX_BATCH_AGE_HOURS=24

# Auto-correction Settings
ENABLE_AUTO_CORRECTION=true
AUTO_CORRECTION_DELAY_SECONDS=60
MAX_CORRECTION_ATTEMPTS=3
```

---

## 🚀 **Implementation Timeline**

### **Phase 1: Core Implementation (2-3 weeks)**

#### **Week 1: Foundation**
```
🔵 Strapi Team (3-4 days):
├── Create user notification preferences content type
├── Add file metadata columns
├── Create basic API endpoints
└── Test preference lookup functionality

🔴 Ingestion Service Team (4-5 days):
├── Create operational database tables
├── Implement BatchManager with preference fetching
├── Enhance event handlers with batch tracking
└── Create basic auto-correction service
```

#### **Week 2: Integration & Testing**
```
🔴 Ingestion Service Team (7 days):
├── Implement NotificationService with SMTP
├── Complete auto-correction with all cleanup actions
├── Add comprehensive error handling
├── Create monitoring and logging
└── End-to-end testing

🤝 Joint Testing (2 days):
├── API integration testing
├── Email notification testing
├── Auto-correction flow testing
└── Performance validation
```

#### **Week 3: Production Ready**
```
🔴 Ingestion Service Team (5 days):
├── Add retry logic for email sending
├── Implement preference caching optimization
├── Add comprehensive monitoring
├── Performance optimization
└── Production deployment preparation

🤝 Joint Deployment (2 days):
├── Staging environment deployment
├── Production deployment
└── Monitoring setup
```

### **Phase 2: Enhancements (Optional)**
- Redis caching for preferences
- Advanced email templates
- Batch size optimization
- Performance analytics

---

## 📊 **Success Criteria**

### **Functional Requirements**
- ✅ Users receive email notifications for batch processing completion
- ✅ Failed files are automatically removed from all systems (S3, CMS, ChromaDB)
- ✅ Notifications include detailed success/failure information based on preferences
- ✅ System handles bulk file uploads (100+ files) efficiently
- ✅ Graceful degradation when CMS is unavailable (cached preferences)

### **Performance Requirements**
- ✅ Batch processing completes within user-specified timeframes
- ✅ Email notifications sent within 5 minutes of batch completion
- ✅ Auto-correction executes within 2 minutes of failure detection
- ✅ Preference caching reduces CMS API calls by 90%
- ✅ System handles 1000+ concurrent files without degradation

### **CMS Independence**
- ✅ Minimal CMS footprint (only user preferences)
- ✅ Loose coupling via API calls (no direct database access)
- ✅ Graceful fallback when CMS is unavailable
- ✅ Easy to replace CMS with different platform

---

## 🔄 **Maintenance & Monitoring**

### **Operational Queries**
```sql
-- Monitor batch processing health
SELECT status, COUNT(*) FROM batch_processing_sessions 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Check auto-correction effectiveness
SELECT status, COUNT(*) FROM auto_correction_tasks
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Email notification success rate
SELECT send_status, COUNT(*) FROM email_notification_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY send_status;
```

### **Health Checks**
```python
async def health_check():
    """System health check"""
    return {
        'database': await check_database_health(),
        'email_service': await check_smtp_health(),
        'cms_api': await check_cms_health(),
        'active_batches': len(batch_manager.active_batches),
        'pending_corrections': await get_pending_corrections_count()
    }
```

---

## 📚 **Key Benefits of This Approach**

### **1. CMS Independence**
- Minimal CMS footprint (only user preferences)
- Easy to replace CMS in future
- Loose coupling via API calls
- Graceful degradation

### **2. Clear Responsibilities**
- **Strapi**: User preferences + file metadata only
- **Ingestion Service**: All operational processing
- No overlap or confusion

### **3. Operational Autonomy**
- Ingestion service controls all business logic
- Independent scaling and deployment
- Complete audit trail in operational database

### **4. Production Ready**
- Comprehensive error handling
- Auto-correction with full cleanup
- Monitoring and logging
- Performance optimization

---

**🎯 This hybrid design takes the best from both approaches: minimal CMS involvement for future flexibility, comprehensive operational control in the ingestion service, and clear team responsibilities for efficient implementation.** 