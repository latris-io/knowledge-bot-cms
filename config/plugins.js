console.log('AWS_ACCESS_KEY_ID:', env('AWS_ACCESS_KEY_ID'));
console.log('AWS_ACCESS_SECRET:', env('AWS_ACCESS_SECRET'));
console.log('AWS_REGION:', env('AWS_REGION'));
console.log('AWS_BUCKET_NAME:', env('AWS_BUCKET_NAME'));

module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          accessKeyId: env('AWS_ACCESS_KEY_ID'),
          secretAccessKey: env('AWS_ACCESS_SECRET'),
          region: env('AWS_REGION'),
          params: {
            Bucket: env('AWS_BUCKET_NAME'),
          },
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
