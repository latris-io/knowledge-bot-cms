'use strict';

/**
 * Custom Oops Page Middleware
 * Intercepts /admin/auth/oops route to serve custom "Hello Maggie" branded message
 */

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Only intercept the specific oops route
    if (ctx.request.url === '/admin/auth/oops' && ctx.request.method === 'GET') {
      console.log('🎯 [CUSTOM OOPS] Intercepting oops page request');
      
      // Set appropriate headers
      ctx.type = 'text/html';
      ctx.status = 200;
      
      // Custom HTML page that matches Strapi's look and feel
      ctx.body = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HeyChat!</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #32324d;
    }
    
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      padding: 48px;
      max-width: 480px;
      width: 90%;
      text-align: center;
    }
    
    .logo {
      width: 64px;
      height: 64px;
      margin: 0 auto 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
    }
    
    h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #32324d;
    }
    
    p {
      font-size: 16px;
      line-height: 1.6;
      color: #666;
      margin-bottom: 32px;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }
    
    .footer {
      margin-top: 32px;
      font-size: 14px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">M</div>
    <h1>HeyChat!</h1>
    <p>Your account is waiting for email verification. Please check your inbox and click the verification link to access your dashboard.</p>
    <a href="/admin/auth/login" class="button">Back to Login</a>
    <div class="footer">
      Need help? Contact your administrator.
    </div>
  </div>
</body>
</html>
      `;
      
      console.log('✅ [CUSTOM OOPS] Served custom oops page');
      return; // Don't call next() - we've handled the request
    }
    
    // For all other requests, continue normally
    await next();
  };
}; 