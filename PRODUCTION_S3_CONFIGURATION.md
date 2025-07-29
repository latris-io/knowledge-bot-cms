# Production S3 Configuration Guide

## Overview

Files are currently being saved locally in production because the S3 configuration was commented out. This guide explains how to enable S3 storage in production.

## Required Environment Variables

Add these environment variables to your production environment (Render):

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=your-aws-region (e.g., us-east-1)
AWS_BUCKET_NAME=your-s3-bucket-name

# Ensure NODE_ENV is set to production
NODE_ENV=production
```

## AWS S3 Bucket Configuration

1. **Create an S3 Bucket** (if not already created):
   - Go to AWS S3 Console
   - Create a new bucket with a unique name
   - Choose the appropriate region
   - Block all public access (files should be private)

2. **Configure Bucket Permissions**:
   - Keep "Block all public access" enabled
   - Files will be accessed through pre-signed URLs

3. **Create IAM User for Strapi**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket",
           "s3:PutObjectAcl",
           "s3:GetObjectAcl"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name/*",
           "arn:aws:s3:::your-bucket-name"
         ]
       }
     ]
   }
   ```

## Storage Key Format

When files are uploaded to S3, the `storage_key` field will contain just the filename (e.g., `Lucas_Offices_a5fc8b82d0.xlsx`), which matches the S3 object key format expected by the v1.3.0 milestone code.

## File URL Format

- **Local (Development)**: `/uploads/filename.ext`
- **S3 (Production)**: `https://your-bucket-name.s3.your-region.amazonaws.com/filename.ext`

## Deployment Steps

1. **Add Environment Variables in Render**:
   - Go to your Render dashboard
   - Navigate to your service
   - Go to Environment > Environment Variables
   - Add all AWS variables listed above

2. **Verify NODE_ENV**:
   - Ensure `NODE_ENV=production` is set
   - This triggers the S3 configuration in `config/plugins.js`

3. **Deploy Changes**:
   - Commit and push the updated `config/plugins.js`
   - Render will automatically redeploy

4. **Test Upload**:
   - Upload a file through the Media Library
   - Check the `files` table to verify:
     - `url` contains the S3 URL
     - `storage_key` contains just the filename
     - `provider` is set to `aws-s3`

## Troubleshooting

1. **Files still saving locally**:
   - Verify `NODE_ENV=production` is set
   - Check Render logs for AWS credential errors
   - Ensure all AWS environment variables are set

2. **Upload failures**:
   - Check IAM permissions
   - Verify bucket name and region
   - Check Render logs for specific S3 errors

3. **File deletion issues**:
   - The custom `remove` service in `src/extensions/upload/strapi-server.js` handles S3 deletion
   - It uses the `storage_key` field to identify the S3 object

## Migration of Existing Files

If you have files stored locally that need to be migrated to S3:

1. Download files from `public/uploads/`
2. Upload them to your S3 bucket
3. Update the database records:
   - Change `provider` from `local` to `aws-s3`
   - Update `url` to the S3 URL
   - Ensure `storage_key` contains just the filename 