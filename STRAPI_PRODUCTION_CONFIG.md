# Strapi Production Configuration for Email Notifications

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

# Email Notification Integration
ENABLE_EMAIL_NOTIFICATIONS=true
NOTIFICATION_DEFAULT_DELAY_MINUTES=30
NOTIFICATION_DEFAULT_BATCH_SIZE=5

# CORS Configuration (if ingestion service runs on different domain)
CORS_ORIGIN=http://localhost:3000,https://your-ingestion-service.com

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
```

### **2. Database Setup**
```sql
-- Create database and user
CREATE DATABASE strapi_db;
CREATE USER strapi_user WITH PASSWORD 'strapi_password';
GRANT ALL PRIVILEGES ON DATABASE strapi_db TO strapi_user;
```

### **3. API Token for Ingestion Service**
- Access admin panel: `http://localhost:1337/admin`
- Go to Settings → API Tokens
- Create token with Full Access
- Provide token to ingestion service team

### **Updated API Endpoints**
After the userId change, the endpoints are:
- `GET /api/user-notification-preferences/by-user/:companyId/:botId/:userId`
- `POST /api/user-notification-preferences/upsert`

### **4. Content Type Permissions**
- Settings → Users & Permissions → Roles
- Configure Public and Authenticated roles
- Enable user-notification-preference permissions

### **5. Production Security**
```bash
# Set proper file permissions
chmod 600 .env

# Use PM2 for process management
npm install -g pm2
pm2 start npm --name "strapi" -- run start
```

## 🚀 **Deployment Checklist**

- [ ] Environment variables configured
- [ ] Database created and accessible
- [ ] API token generated for ingestion service
- [ ] Content type permissions configured
- [ ] CORS configured for ingestion service domain
- [ ] SSL certificates installed (production)
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented 