# Production Deployment Guide for Render

## Required Environment Variables

When deploying to Render, you must set the following environment variables in your Render dashboard:

### Database Configuration

**Option 1: Using DATABASE_URL (Recommended for Render)**
```
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
NODE_ENV=production
```

**Option 2: Using Individual Database Variables**
```
NODE_ENV=production
DATABASE_CLIENT=postgres
DATABASE_HOST=your-database-host.render.com
DATABASE_PORT=5432
DATABASE_NAME=your_database_name
DATABASE_USERNAME=your_database_user
DATABASE_PASSWORD=your_database_password
```

### Strapi Configuration
```
APP_KEYS=your-app-keys-comma-separated
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
JWT_SECRET=your-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
```

### Optional Configuration
```
HOST=0.0.0.0
PORT=10000
STRAPI_ADMIN_BACKEND_URL=https://your-app.onrender.com
```

## Troubleshooting Database Connection

### 1. Check Environment Variables
In your Render dashboard:
- Go to your service
- Click on "Environment" tab
- Verify all required variables are set

### 2. Database Client Detection
The system will automatically use PostgreSQL when:
- `NODE_ENV=production` is set
- OR `DATABASE_URL` is provided

### 3. Common Issues

**Issue: Still using SQLite in production**
- Solution: Ensure `NODE_ENV=production` is set in Render environment variables
- The logs should show: `🔧 [DATABASE] Using PostgreSQL configuration for production`

**Issue: Database connection timeout**
- Solution: Ensure your database is accessible from Render
- Check that SSL is enabled with `rejectUnauthorized: false`

**Issue: Authentication failed**
- Solution: Double-check your database credentials
- Ensure the database user has proper permissions

### 4. Verifying Configuration
After deployment, check your logs for:
```
🔧 [DATABASE] Using PostgreSQL configuration for production
│ Database           │ postgres                                         │
```

If you see `sqlite` instead, the production configuration is not being applied correctly.

## Build Command
```bash
npm run build
```

## Start Command
```bash
npm start
```

## Important Notes

1. **Never commit** `.env` files or sensitive credentials to your repository
2. **Always use** environment variables for production configuration
3. **SSL is required** for PostgreSQL connections on Render (handled by `rejectUnauthorized: false`)
4. **Database migrations** will run automatically on startup if configured

## Testing Database Connection

You can test your database connection by:
1. Checking the Strapi startup logs
2. Attempting to access the admin panel
3. Creating a test content entry

If the database is not connected properly, you'll see errors in the logs and won't be able to access the admin panel. 