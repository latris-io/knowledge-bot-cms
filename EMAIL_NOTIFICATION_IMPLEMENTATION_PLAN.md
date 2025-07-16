# 📧 Email Notification System - Ingestion Service Implementation Plan

## 🎯 **Implementation Overview**

This document outlines the **Ingestion Service Team's** specific implementation responsibilities for the Email Notification & Auto-Correction system, based on the approved hybrid architecture design.

### **Team Responsibility Summary**
- **🔵 Strapi Team**: User preferences content type + basic API (3-4 days)
- **🔴 Ingestion Service Team**: All operational processing & business logic (2-3 weeks)

---

## 🗄️ **Database Implementation**

### **1. Database Migration Script**
```sql
-- File: database/migrations/001_email_notification_system.sql
-- Owner: 🔴 Ingestion Service Team

BEGIN;

-- ========================================
-- OPERATIONAL TABLES (Ingestion Service)
-- ========================================

-- 1. Batch Processing Sessions
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_batch_status CHECK (status IN ('processing', 'completed', 'failed')),
    CONSTRAINT chk_batch_time_order CHECK (
        batch_end_time IS NULL OR batch_end_time >= batch_start_time
    )
);

-- 2. Batch Files Tracking
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_file_status CHECK (processing_status IN ('pending', 'processing', 'success', 'failed')),
    CONSTRAINT chk_file_time_order CHECK (
        processing_start_time IS NULL OR 
        processing_end_time IS NULL OR 
        processing_end_time >= processing_start_time
    )
);

-- 3. File Processing Status
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_stage CHECK (processing_stage IN ('download', 'processing', 'storage', 'completed', 'failed')),
    CONSTRAINT chk_stage_status CHECK (status IN ('pending', 'processing', 'success', 'failed'))
);

-- 4. Auto-Correction Tasks
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
    error_during_correction TEXT,
    
    -- Constraints
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
    resolved_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_error_resolution CHECK (resolution_status IN ('unresolved', 'auto_corrected', 'manual_fix', 'ignored'))
);

-- 6. Email Notification Log
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_email_type CHECK (email_type IN ('batch_completion', 'error_alert', 'summary')),
    CONSTRAINT chk_email_send_status CHECK (send_status IN ('pending', 'sent', 'failed')),
    CONSTRAINT chk_email_attempts CHECK (send_attempts >= 0)
);

-- 7. Notification Retry Log
CREATE TABLE notification_retry_log (
    id SERIAL PRIMARY KEY,
    batch_id UUID NOT NULL REFERENCES batch_processing_sessions(batch_id),
    retry_attempt INTEGER NOT NULL,
    error_message TEXT,
    retry_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT FALSE,
    next_retry_at TIMESTAMP,
    
    -- Constraints
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
CREATE INDEX idx_file_processing_status_batch_id ON file_processing_status(batch_id);
CREATE INDEX idx_file_processing_status_stage ON file_processing_status(processing_stage);
CREATE INDEX idx_file_processing_status_status ON file_processing_status(status);

-- Auto-Correction Tasks Indexes
CREATE INDEX idx_auto_correction_tasks_document_id ON auto_correction_tasks(file_document_id);
CREATE INDEX idx_auto_correction_tasks_status ON auto_correction_tasks(status);
CREATE INDEX idx_auto_correction_tasks_batch_id ON auto_correction_tasks(batch_id);
CREATE INDEX idx_auto_correction_tasks_company_bot ON auto_correction_tasks(company_id, bot_id);
CREATE INDEX idx_auto_correction_tasks_failure_category ON auto_correction_tasks(failure_category);

-- Processing Errors Indexes
CREATE INDEX idx_processing_errors_document_id ON processing_errors(file_document_id);
CREATE INDEX idx_processing_errors_category ON processing_errors(error_category);
CREATE INDEX idx_processing_errors_batch_id ON processing_errors(batch_id);
CREATE INDEX idx_processing_errors_status ON processing_errors(resolution_status);

-- Email Notification Log Indexes
CREATE INDEX idx_email_notification_log_batch_id ON email_notification_log(batch_id);
CREATE INDEX idx_email_notification_log_recipient ON email_notification_log(recipient_email);
CREATE INDEX idx_email_notification_log_status ON email_notification_log(send_status);
CREATE INDEX idx_email_notification_log_company_bot ON email_notification_log(company_id, bot_id);

-- Notification Retry Log Indexes
CREATE INDEX idx_notification_retry_log_batch_id ON notification_retry_log(batch_id);
CREATE INDEX idx_notification_retry_log_retry_at ON notification_retry_log(retry_at);
CREATE INDEX idx_notification_retry_log_success ON notification_retry_log(success);

COMMIT;
```

---

## 🔧 **Core Component Implementation**

### **1. Batch Manager (`batch_manager.py`)**
```python
# File: services/batch_manager.py
# Owner: 🔴 Ingestion Service Team

import uuid
import asyncio
import json
import time
import httpx
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

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
    
    async def add_file_to_batch(self, batch_id: str, file_document_id: str, file_name: str, file_size: int = 0):
        """Add file to batch tracking"""
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO batch_files 
                (batch_id, file_document_id, file_name, file_size_bytes, processing_status)
                VALUES ($1, $2, $3, $4, $5)
            """, batch_id, file_document_id, file_name, file_size, 'pending')
            
            # Update batch total count
            await conn.execute("""
                UPDATE batch_processing_sessions 
                SET total_files = total_files + 1
                WHERE batch_id = $1
            """, batch_id)
    
    async def update_file_status(self, batch_id: str, file_document_id: str, 
                                status: str, processing_time: int = 0, 
                                chunks_created: int = 0, error_message: str = None):
        """Update file processing status in batch"""
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                UPDATE batch_files 
                SET processing_status = $1, 
                    processing_end_time = CURRENT_TIMESTAMP,
                    processing_time_seconds = $2,
                    chunks_created = $3,
                    error_message = $4,
                    updated_at = CURRENT_TIMESTAMP
                WHERE batch_id = $5 AND file_document_id = $6
            """, status, processing_time, chunks_created, error_message, batch_id, file_document_id)
            
            # Update batch counters
            if status == 'success':
                await conn.execute("""
                    UPDATE batch_processing_sessions 
                    SET successful_files = successful_files + 1
                    WHERE batch_id = $1
                """, batch_id)
            elif status == 'failed':
                await conn.execute("""
                    UPDATE batch_processing_sessions 
                    SET failed_files = failed_files + 1
                    WHERE batch_id = $1
                """, batch_id)
    
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
        from .notification_service import NotificationService
        notification_service = NotificationService(self.db_pool)
        await notification_service.send_batch_notification(batch_id)
        
        self.logger.info(f"Completed batch {batch_id}")
    
    async def is_batch_active(self, batch_id: str) -> bool:
        """Check if batch is still active"""
        async with self.db_pool.acquire() as conn:
            result = await conn.fetchrow("""
                SELECT status, batch_start_time 
                FROM batch_processing_sessions 
                WHERE batch_id = $1
            """, batch_id)
            
            if not result:
                return False
            
            # Check if batch is too old (safety check)
            if datetime.now() - result['batch_start_time'] > timedelta(hours=24):
                return False
            
            return result['status'] == 'processing'
    
    async def cleanup_expired_batch(self, batch_id: str):
        """Clean up expired batch"""
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                UPDATE batch_processing_sessions 
                SET status = 'failed', 
                    batch_end_time = CURRENT_TIMESTAMP
                WHERE batch_id = $1
            """, batch_id)
        
        # Cancel timer if it exists
        if batch_id in self.batch_timers:
            self.batch_timers[batch_id].cancel()
            del self.batch_timers[batch_id]
```

### **2. Notification Service (`notification_service.py`)**
```python
# File: services/notification_service.py
# Owner: 🔴 Ingestion Service Team

import smtplib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import logging
import os

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
    
    async def get_batch_info(self, batch_id: str) -> dict:
        """Get batch information including files"""
        async with self.db_pool.acquire() as conn:
            # Get batch session info
            batch_result = await conn.fetchrow("""
                SELECT * FROM batch_processing_sessions 
                WHERE batch_id = $1
            """, batch_id)
            
            if not batch_result:
                return None
            
            # Get batch files
            files_result = await conn.fetch("""
                SELECT file_name, processing_status, processing_time_seconds, 
                       chunks_created, error_message
                FROM batch_files 
                WHERE batch_id = $1
                ORDER BY created_at
            """, batch_id)
            
            return {
                **dict(batch_result),
                'files': [dict(file) for file in files_result]
            }
    
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
                .file-list {{ margin: 15px 0; }}
                .file-item {{ padding: 10px; border-bottom: 1px solid #eee; }}
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
            <div class="file-list">
            """
            for file in successful_files:
                html_content += f"""
                <div class="file-item">
                    <strong>{file['file_name']}</strong> - {file['processing_time_seconds']}s, {file['chunks_created']} chunks
                </div>
                """
            html_content += "</div>"
        
        if preferences.get('include_error_details', True) and failed_files:
            html_content += f"""
            <h3 class="error">❌ Failed Files ({len(failed_files)})</h3>
            <div class="file-list">
            """
            for file in failed_files:
                html_content += f"""
                <div class="file-item">
                    <strong>{file['file_name']}</strong> - {file['error_message'] or 'Unknown error'}
                    <br><em>Action: File automatically removed from system</em>
                </div>
                """
            html_content += "</div>"
        
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

SUCCESSFUL FILES:
"""
        
        for file in successful_files:
            text_content += f"✅ {file['file_name']} ({file['processing_time_seconds']}s, {file['chunks_created']} chunks)\n"
        
        if failed_files:
            text_content += "\nFAILED FILES:\n"
            for file in failed_files:
                text_content += f"❌ {file['file_name']} - {file['error_message'] or 'Unknown error'}\n"
        
        return {
            'subject': subject,
            'html': html_content,
            'text': text_content
        }
    
    async def send_email(self, recipient: str, content: dict):
        """Send email via SMTP"""
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = content['subject']
            msg['From'] = self.from_email
            msg['To'] = recipient
            
            # Create text and HTML parts
            text_part = MIMEText(content['text'], 'plain')
            html_part = MIMEText(content['html'], 'html')
            
            msg.attach(text_part)
            msg.attach(html_part)
            
            # Send via SMTP
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            self.logger.info(f"Email sent successfully to {recipient}")
            
        except Exception as e:
            self.logger.error(f"Failed to send email to {recipient}: {e}")
            raise
    
    async def update_notification_status(self, batch_id: str, success: bool, error_message: str = None):
        """Update notification status in database"""
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                UPDATE batch_processing_sessions 
                SET notification_sent = $1, notification_sent_at = CURRENT_TIMESTAMP
                WHERE batch_id = $2
            """, success, batch_id)
            
            # Log notification attempt
            batch_info = await conn.fetchrow("""
                SELECT user_email, company_id, bot_id FROM batch_processing_sessions 
                WHERE batch_id = $1
            """, batch_id)
            
            if batch_info:
                await conn.execute("""
                    INSERT INTO email_notification_log 
                    (batch_id, recipient_email, company_id, bot_id, email_type, 
                     email_subject, send_status, sent_at, error_message)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """, batch_id, batch_info['user_email'], batch_info['company_id'], 
                    batch_info['bot_id'], 'batch_completion', 
                    'File Processing Complete', 
                    'sent' if success else 'failed',
                    datetime.now() if success else None,
                    error_message)
```

### **3. Auto-Correction Service (`auto_correction_service.py`)**
```python
# File: services/auto_correction_service.py
# Owner: 🔴 Ingestion Service Team

import json
import asyncio
from typing import List, Dict
import logging
import httpx

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
    
    def determine_correction_actions(self, error_category: str) -> List[str]:
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
```

### **4. Enhanced Event Handlers (`enhanced_event_handlers.py`)**
```python
# File: event_handlers/enhanced_event_handlers.py
# Owner: 🔴 Ingestion Service Team

import time
import logging
from sqlalchemy import text
from .batch_manager import BatchManager
from .auto_correction_service import AutoCorrectionService

class EnhancedEventHandler:
    """Enhanced event handlers with batch tracking and auto-correction"""
    
    def __init__(self, batch_manager: BatchManager, auto_correction_service: AutoCorrectionService):
        self.batch_manager = batch_manager
        self.auto_correction_service = auto_correction_service
        self.logger = logging.getLogger(__name__)
    
    async def handle_created_event(self, conn, file_event, _unused_embedding_model=None):
        """Enhanced created event handler with batch tracking"""
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
        
        # Create processing status record
        processing_status_id = await self.create_processing_status(
            conn, file_event.id, file_event.file_document_id, batch_id
        )
        
        try:
            # Stage 1: Download
            await self.update_processing_stage(conn, processing_status_id, 'download', 'processing')
            
            # ... existing download logic ...
            
            # Stage 2: Processing
            await self.update_processing_stage(conn, processing_status_id, 'processing', 'processing')
            
            # ... existing processing logic ...
            
            # Stage 3: Storage
            await self.update_processing_stage(conn, processing_status_id, 'storage', 'processing')
            
            # ... existing storage logic ...
            
            # Stage 4: Completed
            await self.update_processing_stage(conn, processing_status_id, 'completed', 'success')
            
            # Update batch file status
            processing_time = int(time.time() - start_time)
            await self.batch_manager.update_file_status(
                batch_id, file_event.file_document_id, 'success', 
                processing_time, len(chunks_created)
            )
            
        except Exception as e:
            # Handle failure
            await self.update_processing_stage(conn, processing_status_id, 'failed', 'failed', str(e))
            
            # Update batch file status
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
    
    async def create_processing_status(self, conn, file_event_id: int, file_document_id: str, batch_id: str) -> int:
        """Create processing status record"""
        result = conn.execute(
            text("""
                INSERT INTO file_processing_status 
                (file_event_id, file_document_id, batch_id, processing_stage, status)
                VALUES (:file_event_id, :file_document_id, :batch_id, :stage, :status)
                RETURNING id
            """),
            {
                "file_event_id": file_event_id,
                "file_document_id": file_document_id,
                "batch_id": batch_id,
                "stage": "pending",
                "status": "pending"
            }
        ).fetchone()
        
        return result.id
    
    async def update_processing_stage(self, conn, processing_status_id: int, stage: str, status: str, error_message: str = None):
        """Update processing stage"""
        conn.execute(
            text("""
                UPDATE file_processing_status 
                SET processing_stage = :stage, status = :status, 
                    stage_end_time = CURRENT_TIMESTAMP, error_message = :error_message
                WHERE id = :id
            """),
            {
                "stage": stage,
                "status": status,
                "error_message": error_message,
                "id": processing_status_id
            }
        )
        conn.commit()
```

---

## ⚙️ **Configuration & Environment**

### **Environment Variables**
```bash
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@knowledgebot.com

# CMS Integration (CMS Agnostic)
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

### **Week 1: Foundation (Days 1-7)**
- ✅ Database migration creation and execution
- ✅ BatchManager implementation with preference fetching
- ✅ Basic auto-correction service structure
- ✅ Enhanced event handler integration

### **Week 2: Core Services (Days 8-14)**
- ✅ NotificationService with SMTP integration
- ✅ Complete auto-correction with all cleanup actions
- ✅ Email template system implementation
- ✅ Comprehensive error handling

### **Week 3: Production Ready (Days 15-21)**
- ✅ Retry logic for email sending
- ✅ Preference caching optimization
- ✅ Comprehensive monitoring and logging
- ✅ Production deployment preparation

---

## 📊 **Success Criteria**

### **Functional Requirements**
- ✅ Batch processing sessions created and managed
- ✅ Email notifications sent with detailed content
- ✅ Auto-correction removes failed files from all systems
- ✅ User preferences cached with fallback
- ✅ Comprehensive error tracking and logging

### **Performance Requirements**
- ✅ Email notifications sent within 5 minutes of batch completion
- ✅ Auto-correction executes within 2 minutes of failure
- ✅ Preference caching reduces API calls by 90%
- ✅ System handles 1000+ concurrent files

### **Reliability Requirements**
- ✅ 99.9% email delivery success rate
- ✅ 100% auto-correction execution for failed files
- ✅ Graceful degradation when CMS unavailable
- ✅ Complete audit trail for all operations

---

## 🔧 **Testing Strategy**

### **Unit Tests**
- BatchManager functionality
- NotificationService email generation
- AutoCorrectionService cleanup logic
- Event handler integration

### **Integration Tests**
- End-to-end batch processing flow
- Email notification delivery
- Auto-correction execution
- CMS API integration

### **Performance Tests**
- Large batch processing (100+ files)
- Email delivery under load
- Auto-correction concurrent execution
- Memory and resource usage

---

**🎯 This implementation plan provides a comprehensive roadmap for the ingestion service team to deliver a production-ready email notification and auto-correction system.** 