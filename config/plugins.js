module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
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
      },
      actionOptions: {
        upload: {
          ACL: 'private',  // ✅ Correct: makes uploads private, no public-read
        },
        uploadStream: {
          ACL: 'private',  // ✅ Correct for streamed uploads
        },
        delete: {},
      },
    },
  },
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
    },
  },
  'document-service': {
    enabled: false // Disable Document Service globally
  },
});
