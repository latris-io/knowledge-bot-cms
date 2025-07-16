# Strapi Database Changes Implementation Guide

## 🎯 **Database Changes Method: Code-Based Content Types**

**Answer to your question**: Database changes are implemented by **updating files in the project**, not through the admin UI. This ensures version control, team collaboration, and proper deployment practices.

---

## �� **What Has Been Implemented**

### **1. New Content Type: User Notification Preferences**

**Created Files:**
- `src/api/user-notification-preference/content-types/user-notification-preference/schema.json`
- `src/api/user-notification-preference/routes/user-notification-preference.js`
- `src/api/user-notification-preference/controllers/user-notification-preference.js`
- `src/api/user-notification-preference/services/user-notification-preference.js`

**Database Table Created**: `user_notification_preferences`

**Fields Added:**
- `company_id` (integer, required)
- `bot_id` (integer, required)
- `user_email` (email, required)
- `notifications_enabled` (boolean, default: true)
- `success_notifications` (boolean, default: true)
- `failure_notifications` (boolean, default: true)
- `batch_completion_notifications` (boolean, default: true)
- `notification_delay_minutes` (integer, default: 5, min: 0, max: 60)
- `batch_size_threshold` (integer, default: 10, min: 1, max: 100)
- `daily_summary_enabled` (boolean, default: false)
- `daily_summary_time` (time, default: '09:00')
- `timezone` (string, default: 'UTC')
- `language` (enum, default: 'en')
- Relations to company, bot, and user

### **2. Extended Company Content Type**

**Modified File**: `src/api/company/content-types/company/schema.json`

**Fields Added:**
- `default_notifications_enabled` (boolean, default: true)
- `default_batch_size_threshold` (integer, default: 10)
- `default_notification_delay_minutes` (integer, default: 5)
- `notification_quota_daily` (integer, default: 100)
- `notification_quota_monthly` (integer, default: 1000)
- `user_notification_preferences` (relation to user preferences)

### **3. Extended Bot Content Type**

**Modified File**: `src/api/bot/content-types/bot/schema.json`

**Fields Added:**
- `processing_enabled` (boolean, default: true)
- `auto_correction_enabled` (boolean, default: true)
- `max_retry_attempts` (integer, default: 3, min: 0, max: 10)
- `retry_delay_minutes` (integer, default: 5, min: 1, max: 60)
- `user_notification_preferences` (relation to user preferences)

### **4. Extended File Content Type**

**Modified File**: `src/extensions/upload/content-types/file/schema.json`

**Fields Added:**
- `last_notification_sent` (datetime)
- `notification_count` (integer, default: 0)

### **5. Extended User Content Type**

**Modified File**: `src/extensions/users-permissions/content-types/user/schema.json`

**Fields Added:**
- `notification_preferences` (relation to user notification preferences)

---

## 🚀 **How to Deploy These Changes**

### **Step 1: Restart Strapi Development Server**

```bash
# Stop current server (Ctrl+C)
# Then restart
npm run develop
```

### **Step 2: Database Migration**

Strapi will automatically:
- Create the new `user_notification_preferences` table
- Add new columns to existing tables (`companies`, `bots`, `files`, `up_users`)
- Create necessary indexes and foreign key relationships

**No manual SQL required** - Strapi handles all database changes automatically.

### **Step 3: Verify in Admin Panel**

1. Go to `/admin` in your browser
2. Navigate to **Content Manager**
3. You should see:
   - New "User Notification Preferences" content type
   - Extended fields in Company, Bot, and File content types

### **Step 4: API Endpoints Available**

**New Endpoints:**
- `GET /api/user-notification-preferences` - List all preferences
- `POST /api/user-notification-preferences` - Create new preferences
- `GET /api/user-notification-preferences/:id` - Get specific preferences
- `PUT /api/user-notification-preferences/:id` - Update preferences
- `DELETE /api/user-notification-preferences/:id` - Delete preferences

**Custom Endpoints:**
- `GET /api/user-notification-preferences/findForUser?company_id=1&bot_id=1&user_email=test@example.com`
- `POST /api/user-notification-preferences/upsertForUser` - Create or update preferences

---

## 🔧 **API Usage Examples**

### **Get User Preferences with Fallback**

```javascript
// For your ingestion service
const getUserPreferences = async (companyId, botId, userEmail) => {
  const response = await fetch(
    `${STRAPI_URL}/api/user-notification-preferences/findForUser?company_id=${companyId}&bot_id=${botId}&user_email=${userEmail}`,
    {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`
      }
    }
  );
  
  return await response.json();
  // Returns user preferences or defaults if none found
};
```

### **Create/Update User Preferences**

```javascript
const upsertUserPreferences = async (preferences) => {
  const response = await fetch(
    `${STRAPI_URL}/api/user-notification-preferences/upsertForUser`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`
      },
      body: JSON.stringify(preferences)
    }
  );
  
  return await response.json();
};
```

---

## 🚨 **Important Notes**

### **Linter Warnings**
- You may see TypeScript linter errors about `@strapi/strapi` imports
- These are **false positives** - the imports work correctly at runtime
- The existing controllers in your project use the same import pattern

### **Database Responsibility Boundaries**

**✅ Strapi Handles:**
- User notification preferences
- Company/bot/file extensions
- User preference management
- Admin UI for configuration

**❌ Strapi Does NOT Handle:**
- `file_processing_status` table
- `batch_processing_sessions` table
- `email_notification_log` table
- `auto_correction_attempts` table
- `processing_error_log` table

**These operational tables are managed by your ingestion service.**

---

## 🧪 **Testing Your Implementation**

### **1. Test Content Type Creation**

```bash
# After restarting Strapi
curl -X GET "http://localhost:1337/api/user-notification-preferences" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### **2. Test Custom Endpoints**

```bash
# Test findForUser endpoint
curl -X GET "http://localhost:1337/api/user-notification-preferences/findForUser?company_id=1&bot_id=1&user_email=test@example.com" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### **3. Test Preference Creation**

```bash
curl -X POST "http://localhost:1337/api/user-notification-preferences" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "data": {
      "company_id": 1,
      "bot_id": 1,
      "user_email": "test@example.com",
      "notifications_enabled": true,
      "batch_size_threshold": 15
    }
  }'
```

---

## 📚 **Next Steps**

1. **Deploy and Test**: Restart your Strapi server and test the new endpoints
2. **Configure Permissions**: Set up proper API permissions for the new content type
3. **Update Your Ingestion Service**: Modify your service to call these new endpoints
4. **Create Database Tables**: Have your ingestion service team create the operational tables
5. **Integration Testing**: Test the complete flow from file upload to email notification

---

## 🔐 **Security Considerations**

- Set up proper API token authentication
- Configure role-based access for the new content types
- Ensure user preferences are properly scoped to company/bot combinations
- Validate email addresses and user permissions

---

**This implementation provides the Strapi foundation for your email notification system. Your ingestion service can now query user preferences and company settings via these APIs while managing its own operational processing tables.** 