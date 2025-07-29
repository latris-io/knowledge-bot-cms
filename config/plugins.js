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
    baseConfig.config.providerOptions = {};
  }

  return {
    upload: baseConfig,
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
    },
  },
  'document-service': {
    enabled: false // Disable Document Service globally
  },
  };
};
