# Strapi Production Configuration for Knowledge Bot System

## 🔐 **Required Environment Variables**

Create a `.env` file in your project root with these variables:

```bash
# Strapi Core Configuration
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-keys-here
API_TOKEN_SALT=your-api-token-salt-here
ADMIN_JWT_SECRET=your-admin-jwt-secret-here
TRANSFER_TOKEN_SALT=your-transfer-token-salt-here
JWT_SECRET=your-jwt-secret-here

# Database Configuration
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=strapi_db
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=strapi_password
DATABASE_SSL=false

# Knowledge Bot Configuration
WIDGET_JWT_SECRET=my-ultra-secure-signing-key
ENABLE_USER_VALIDATION=true
ENABLE_TOAST_NOTIFICATIONS=true

# File Upload Configuration
UPLOAD_PROVIDER=aws-s3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_BUCKET=your-s3-bucket-name

# CORS Configuration (if frontend runs on different domain)
CORS_ORIGIN=http://localhost:3000,https://your-frontend-domain.com

# Security
SECURE_HEADERS=true
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

## 🔧 **Required Configuration Steps**

### **1. Generate Required Secrets**
```bash
# Generate secrets using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Generate JWT secret for widget tokens
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### **2. Database Setup**
```sql
-- Create database and user
CREATE DATABASE strapi_db;
CREATE USER strapi_user WITH PASSWORD 'strapi_password';
GRANT ALL PRIVILEGES ON DATABASE strapi_db TO strapi_user;
```

### **3. Content Types Setup**
The system requires these content types:
- **Users** (users-permissions) - with bot, company, and instructions fields
- **Bots** (api::bot.bot) - bot configurations
- **Companies** (api::company.company) - company configurations
- **Files** (upload plugin) - file uploads with user assignments

### **4. API Token for External Services**
- Access admin panel: `http://localhost:1337/admin`
- Go to Settings → API Tokens
- Create token with Full Access
- Provide token to external services that need API access

### **5. Content Type Permissions**
- Settings → Users & Permissions → Roles
- Configure Public and Authenticated roles
- Enable permissions for:
  - User management (for admins)
  - Bot and Company access
  - File upload permissions

### **6. Production Security**
```bash
# Set proper file permissions
chmod 600 .env

# Use PM2 for process management
npm install -g pm2
pm2 start npm --name "strapi" -- run start

# Set up log rotation
pm2 install pm2-logrotate
```

## 🎯 **System Features**

### **User Validation System**
- Users must have both Bot and Company assigned before saving
- Lifecycle hooks validate data and prevent saves without required fields
- Toast notifications show validation errors to administrators

### **JWT Token Generation**
- Automatic JWT token generation when users have bot and company
- Tokens include `{ company_id: X, bot_id: Y }` payload
- Uses HS256 algorithm with configurable secret
- Tokens embedded in widget installation instructions

### **Toast Notification System**
- Persistent toast notifications for file uploads
- Error notifications for validation failures
- Silent success (no toast for successful saves)
- Manual close functionality with batching

### **File Upload Processing**
- Automatic user, bot, and company assignment to uploads
- File-event creation for processing tracking
- Middleware for metadata assignment
- S3 storage integration

## 📊 **Production Monitoring**

### **Health Checks**
```bash
# Check server status
curl -f http://localhost:1337/admin/init || exit 1

# Check database connection
curl -f http://localhost:1337/api/bots?pagination[pageSize]=1 || exit 1
```

### **Log Monitoring**
```bash
# PM2 logs
pm2 logs strapi

# Application logs
tail -f logs/strapi.log
```

### **Performance Monitoring**
- Monitor JWT token generation performance
- Track file upload processing times
- Monitor database query performance for user validations

## 🚀 **Deployment Checklist**

- [ ] Environment variables configured
- [ ] Database created and accessible
- [ ] Widget JWT secret configured
- [ ] File upload provider configured (S3)
- [ ] Content type permissions configured
- [ ] CORS configured for frontend domain
- [ ] SSL certificates installed (production)
- [ ] PM2 process management configured
- [ ] Health checks implemented
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented

## 🔍 **Troubleshooting**

### **Common Issues**

1. **User Validation Not Working**
   - Check lifecycle hooks are properly registered
   - Verify `src/extensions/users-permissions/strapi-server.js` exists
   - Check server logs for validation errors

2. **JWT Tokens Not Generated**
   - Verify `WIDGET_JWT_SECRET` is set in environment
   - Check user has both bot and company assigned
   - Review lifecycle hook logs

3. **Toast Notifications Not Showing**
   - Check `src/admin/extensions.js` is loaded
   - Verify admin panel is using latest version
   - Check browser console for JavaScript errors

4. **File Upload Issues**
   - Verify S3 credentials are correct
   - Check upload middleware is active
   - Review file permissions and CORS settings

### **Debug Mode**
```bash
# Start in debug mode
DEBUG=strapi:* npm run develop

# Check specific logs
grep "USER LIFECYCLE" logs/strapi.log
grep "JWT" logs/strapi.log
```

## 📚 **API Documentation**

### **Core Endpoints**
- `GET /api/bots` - List available bots
- `GET /api/companies` - List available companies
- `GET /api/users` - List users (admin only)
- `POST /upload` - File upload with user assignment

### **Authentication**
- Admin panel: `http://localhost:1337/admin`
- API authentication via JWT tokens
- Widget authentication via generated JWT tokens

---

**This configuration is for the Knowledge Bot system implemented with user validation, toast notifications, JWT token generation, and file upload processing. Last updated: July 2025** 