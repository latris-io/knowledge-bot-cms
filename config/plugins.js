module.exports = ({ env }) => {
  // Determine if we're in production
  const isProduction = env('NODE_ENV') === 'production';
  
  // Base configuration
  const baseConfig = {
    enabled: true,
    config: {
      sizeLimit: 250 * 1024 * 1024, // 250mb in bytes
    },
  };

  // Production configuration (S3)
  if (isProduction) {
    baseConfig.config.provider = 'aws-s3';
    baseConfig.config.providerOptions = {
        s3Options: {
          credentials: {
            accessKeyId: env('AWS_ACCESS_KEY_ID'),
            secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
          },
          region: env('AWS_REGION'),
          params: {
            Bucket: env('AWS_BUCKET_NAME'),
          },
        },
        // Add file extension restrictions - matching ingestion service supported formats
        allowedExtensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.xls', '.xlsx', '.ods', '.csv', '.ppt', '.pptx', '.odp', '.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.html', '.htm', '.md', '.markdown', '.zip', '.rar', '.7z'],
    };
    baseConfig.config.actionOptions = {
        upload: {
        ACL: 'private', // Makes uploads private, no public-read
        },
        uploadStream: {
        ACL: 'private', // For streamed uploads
        },
        delete: {},
    };
  } else {
    // Development configuration (local)
    baseConfig.config.provider = 'local';
  }

  // Debug email configuration
  const emailConfig = {
    config: {
      provider: isProduction ? 'nodemailer' : 'sendmail',
      providerOptions: isProduction ? {
        // Production SMTP configuration
        host: env('SMTP_HOST', 'smtp.gmail.com'),
        port: env.int('SMTP_PORT', 587),
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
        secure: false, // true for 465, false for other ports
      } : {
        // Development sendmail configuration
        dkim: false,
        host: 'localhost',
        port: 1025,
      },
      settings: {
        defaultFrom: env('DEFAULT_FROM_EMAIL', env('SMTP_USERNAME')),
        defaultReplyTo: env('DEFAULT_REPLY_TO_EMAIL', env('SMTP_USERNAME'))
      }
    }
  };

  console.log('🔧 [PLUGINS] Email config being returned:', JSON.stringify(emailConfig, null, 2));
  console.log('🔧 [PLUGINS] isProduction:', isProduction);
  
  return {
    upload: baseConfig,
    
    // Add email provider configuration
    email: emailConfig,
    
    // Configure users-permissions plugin for email verification
    'users-permissions': {
      config: {
        register: {
          allowedFields: ['username', 'email', 'password', 'company', 'firstname', 'lastname']
        },
        jwt: {
          expiresIn: '7d'
        },
        // Enable email confirmation
        email: {
          enabled: true,
          template: {
            subject: 'Welcome to Knowledge Bot - Please Verify Your Email',
            text: `Welcome to Knowledge Bot!

Please confirm your email address by clicking the link below:
<%= URL %>?confirmation=<%= CODE %>

If you did not create this account, please ignore this email.

Best regards,
The Knowledge Bot Team`,
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Welcome to Knowledge Bot!</h2>
  <p>Thank you for creating your account. To get started, please verify your email address by clicking the button below:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="<%= URL %>?confirmation=<%= CODE %>" 
       style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
      Verify Email Address
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px;">
    If the button doesn't work, copy and paste this link into your browser:<br>
    <a href="<%= URL %>?confirmation=<%= CODE %>"><%= URL %>?confirmation=<%= CODE %></a>
  </p>
  
  <p style="color: #666; font-size: 12px;">
    If you did not create this account, please ignore this email.
  </p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 11px;">
    © 2024 Knowledge Bot. All rights reserved.
  </p>
</div>`
          }
        }
      }
    }
  };
}
