module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          credentials: {
            accessKeyId: env('AWS_ACCESS_KEY_ID'),
            secretAccessKey: env('AWS_ACCESS_SECRET'),
          },
          region: env('AWS_REGION'),
          params: {
            Bucket: env('AWS_BUCKET_NAME'),
          },
        },
        uploadParams: (file) => {
          return {
            Bucket: env('AWS_BUCKET_NAME'),
            Key: file.hash + file.ext,
            ContentType: file.mime,
            // 🚫 NO ACL SET HERE 🚫
          };
        },
      },
    },
  },
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
    },
  },
});
