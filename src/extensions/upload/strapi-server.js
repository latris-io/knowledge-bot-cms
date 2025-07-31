'use strict';

console.log('🚨🚨🚨 UPLOAD EXTENSION FILE IS BEING LOADED 🚨🚨🚨');

module.exports = (plugin) => {
  console.log('🚨 [UPLOAD EXTENSION] Loading upload extension with folder filtering and file relations');
  
  // Override the folder controller
  plugin.controllers.folder = require('./controllers/folder');
  
  // Remove the route override that's not working
  // We'll handle folder-structure filtering differently
  
  // Note: Create and update events are now handled in assign-user-bot-to-upload.js middleware
  // Only delete events are handled here via service override


  // Add notification message to upload response
  const originalController = plugin.controllers['admin-upload'];
  if (originalController && originalController.upload) {
    const originalUploadMethod = originalController.upload;
    plugin.controllers['admin-upload'].upload = async function(ctx) {
      
      // Call the original upload controller with proper binding
      const result = await originalUploadMethod.call(originalController, ctx);
      
      // Add notification message to response
      if (ctx.response.status === 201 && ctx.response.body) {
        const files = Array.isArray(ctx.response.body) ? ctx.response.body : [ctx.response.body];
        const fileCount = files.length;
        const fileWord = fileCount === 1 ? 'file' : 'files';
        
        // Add notification message
        ctx.response.body = {
          data: ctx.response.body,
          message: `Your ${fileWord} will be processed and you'll receive an email notification when ready.`
        };
      }
      
      return result;
    };
  }


  // Override the upload service to track file deletions ONLY
  const defaultUploadService = plugin.services.upload;
  
  plugin.services.upload = ({ strapi }) => {
    const baseService = defaultUploadService({ strapi });
    
    // Add AWS SDK imports for S3 deletion
    const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const { fromEnv } = require('@aws-sdk/credential-provider-env');

    return {
      ...baseService,
      
      async remove(file, ctx) {  // Add ctx parameter to access request context
        const fileId = file.id || file.documentId;
        console.log('🗑️ [UPLOAD SERVICE] Custom remove called for file:', {
          id: fileId,
          name: file.name,
          documentId: file.documentId,
        });
        
        // Log the deletion event before removing the file
        try {
          // Get file with populated relationships to extract user, bot, and company info
          const fileWithRelations = await strapi.entityService.findOne(
            'plugin::upload.file',
            fileId,
            { populate: ['user', 'bot', 'company'] }
          );
          
          if (fileWithRelations) {
            // Convert file size from KB to bytes for consistency
            const fileSizeInBytes = Math.round((fileWithRelations.size || 0) * 1024);
            
            // 🎯 STRAPI 5 USER DETECTION (Same logic as upload middleware)
            let currentUser = null;
            let currentAdmin = null;
            
            // Try to get user from request context if available
            if (ctx) {
              currentUser = ctx.state?.user;
              currentAdmin = ctx.state?.admin;
              console.log('🔍 [DELETE] Authentication Context:');
              console.log('   ctx.state.user:', currentUser ? { id: currentUser.id, email: currentUser.email } : 'null');
              console.log('   ctx.state.admin:', currentAdmin ? { id: currentAdmin.id, email: currentAdmin.email } : 'null');
            }
            
            // Resolve user similar to upload middleware
            if (!currentUser && currentAdmin) {
              // For admin users, find the corresponding users-permissions user
              console.log('🔄 [DELETE] Admin user detected, finding corresponding users-permissions user...');
              const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
                filters: { email: currentAdmin.email },
                limit: 1,
                populate: ['company']
              });
              currentUser = users[0];
              console.log('✅ [DELETE] Found corresponding users-permissions user:', currentUser?.email || 'null');
            } else if (currentUser) {
              // Ensure user has company populated
              console.log('🔄 [DELETE] Ensuring user company is populated...');
              const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
                filters: { documentId: currentUser.documentId },
                limit: 1,
                populate: ['company']
              });
              if (users?.length > 0) {
                currentUser = users[0];
                console.log('✅ [DELETE] User company populated:', currentUser?.company?.id || 'no company');
              }
            }
            
            // 🛡️ FALLBACK: Manual JWT Authentication (same as upload middleware)
            if (!currentUser && !currentAdmin && ctx?.request?.headers?.authorization) {
              console.log('⚠️ [DELETE] FALLBACK: ctx.state is empty, attempting manual JWT authentication...');
              
              const authHeader = ctx.request.headers.authorization;
              const token = authHeader.replace('Bearer ', '');
              console.log('🔍 [DELETE] Found authorization token (length:', token.length, '), attempting to verify...');
              
              try {
                // Try admin JWT first - Method 1: Admin JWT Service
                try {
                  const adminJwtService = strapi.service('admin::token');
                  if (!adminJwtService) {
                    throw new Error('Admin JWT service not available');
                  }
                  const jwtResult = await adminJwtService.decodeJwtToken(token);
                  console.log('🔍 [DELETE] Admin JWT Service result:', JSON.stringify(jwtResult, null, 2));
                  
                  // Extract the actual payload (Admin JWT Service returns {payload: {...}, isValid: true})
                  const adminPayload = jwtResult?.payload || jwtResult;
                  const adminId = adminPayload?.id;
                  
                  if (!adminId) {
                    throw new Error('Admin JWT payload missing ID field');
                  }
                  
                  console.log('✅ [DELETE] Admin JWT verified (Method 1):', { id: adminId });
                  console.log('🔄 [DELETE] Looking up admin user by ID (Method 1)...');
                  
                  // Look up the admin user to get their email
                  const adminUser = await strapi.entityService.findOne('admin::user', adminId);
                  const adminEmail = adminUser?.email;
                  console.log('🔍 [DELETE] Found admin user email (Method 1):', adminEmail);
                  
                  if (adminEmail) {
                    // Find corresponding users-permissions user
                    const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
                      filters: { email: adminEmail },
                      limit: 1,
                      populate: ['company']
                    });
                    currentUser = users[0];
                    console.log('✅ [DELETE] Found users-permissions user for admin (Method 1):', currentUser?.email || 'null');
                    
                    // Skip alternative methods if we found a user
                    if (currentUser) {
                      throw new Error('SUCCESS_WITH_ADMIN_JWT_METHOD1'); // Use error to break out of try-catch chain
                    }
                  } else {
                    console.log('❌ [DELETE] Admin user found but no email (Method 1)');
                  }
                } catch (adminError) {
                  if (adminError.message === 'SUCCESS_WITH_ADMIN_JWT_METHOD1') {
                    throw adminError; // Re-throw success signal
                  }
                  console.log('⚠️ [DELETE] Admin JWT Service failed:', adminError.message);
                  console.log('🔄 [DELETE] Trying alternative admin JWT method...');
                  
                  // Try alternative admin JWT decoding method - Method 2: Direct JWT Verification
                  try {
                    const jwt = require('jsonwebtoken');
                    const jwtSecret = strapi.config.get('admin.auth.secret');
                    console.log('🔍 [DELETE] Using JWT secret available:', !!jwtSecret);
                    
                    const decoded = jwt.verify(token, jwtSecret);
                    const adminPayload = typeof decoded === 'string' ? null : decoded;
                    console.log('🔍 [DELETE] Alternative admin JWT payload:', JSON.stringify(adminPayload, null, 2));
                    console.log('✅ [DELETE] Admin JWT verified (Method 2):', { id: adminPayload?.id, email: adminPayload?.email });
                    
                    // Admin JWT only contains ID, so look up the admin user by ID
                    const adminId = adminPayload?.id;
                    console.log('🔍 [DELETE] Admin ID from JWT:', adminId);
                    
                    if (adminId) {
                      console.log('🔄 [DELETE] Looking up admin user by ID...');
                      // Look up the admin user to get their email
                      const adminUser = await strapi.entityService.findOne('admin::user', adminId);
                      const adminEmail = adminUser?.email;
                      console.log('🔍 [DELETE] Found admin user email:', adminEmail);
                      
                      if (adminEmail) {
                        // Now find the corresponding users-permissions user
                        const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
                          filters: { email: adminEmail },
                          limit: 1,
                          populate: ['company']
                        });
                        currentUser = users[0];
                        console.log('✅ [DELETE] Found users-permissions user for admin (Method 2):', currentUser?.email || 'null');
                        
                        // Skip users-permissions JWT if we found a user
                        if (currentUser) {
                          throw new Error('SUCCESS_WITH_ADMIN_JWT_METHOD2'); // Use error to break out of try-catch chain
                        }
                      } else {
                        console.log('❌ [DELETE] Admin user found but no email');
                      }
                    } else {
                      console.log('❌ [DELETE] No admin ID found in JWT payload');
                    }
                  } catch (altAdminError) {
                    if (altAdminError.message === 'SUCCESS_WITH_ADMIN_JWT_METHOD2') {
                      throw altAdminError; // Re-throw success signal
                    }
                    console.log('⚠️ [DELETE] Alternative admin JWT method also failed:', altAdminError.message);
                  }
                  
                  console.log('⚠️ [DELETE] All admin JWT methods failed, trying users-permissions JWT...');
                  
                  // Try users-permissions JWT (wrap in try-catch to prevent uncaught exceptions)
                  try {
                    const userJwtService = strapi.plugins['users-permissions'].services.jwt;
                    const userPayload = await userJwtService.verify(token);
                    console.log('🔍 [DELETE] Raw users-permissions JWT payload:', userPayload);
                    console.log('✅ [DELETE] Users-permissions JWT verified:', { id: userPayload?.id });
                    
                    if (userPayload?.id) {
                      // Get user with company populated
                      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
                        filters: { id: userPayload.id },
                        limit: 1,
                        populate: ['company']
                      });
                      currentUser = users[0];
                      console.log('✅ [DELETE] Found users-permissions user:', currentUser?.email || 'null');
                    } else {
                      console.log('❌ [DELETE] No user ID found in users-permissions JWT payload');
                    }
                  } catch (userJwtError) {
                    console.log('⚠️ [DELETE] Users-permissions JWT verification failed:', userJwtError.message);
                    console.log('❌ [DELETE] Token is not a valid users-permissions JWT');
                  }
                }
              } catch (authError) {
                if (authError.message === 'SUCCESS_WITH_ADMIN_JWT_METHOD1') {
                  console.log('✅ [DELETE] Successfully authenticated using Admin JWT Service (Method 1)');
                } else if (authError.message === 'SUCCESS_WITH_ADMIN_JWT_METHOD2') {
                  console.log('✅ [DELETE] Successfully authenticated using alternative admin JWT method (Method 2)');
                } else {
                  console.log('❌ [DELETE] Manual authentication completely failed:', authError.message);
                  console.log('❌ [DELETE] Auth error details:', authError);
                }
              }
            }
            
            // Determine user, company, and bot for file event creation
            // Priority: current user context > stored file relations
            let eventUserId = currentUser?.id || fileWithRelations.user?.id || null;
            let eventCompanyId = currentUser?.company?.id || fileWithRelations.company?.id || null;
            let eventBotId = fileWithRelations.bot?.id || null; // Bot comes from file relations or folder path
            
            // If we have current user but no bot from file relations, try to determine from folder path
            if (currentUser && !eventBotId && fileWithRelations.folderPath) {
              const botMatch = fileWithRelations.folderPath.match(/\/bot-(\d+)/);
              if (botMatch) {
                eventBotId = parseInt(botMatch[1], 10);
                console.log('🤖 [DELETE] Bot determined from folder path:', eventBotId);
              }
            }
            
            console.log('📊 [DELETE] Final event data IDs:', {
              userId: eventUserId,
              companyId: eventCompanyId, 
              botId: eventBotId,
              source: {
                user: currentUser ? 'current_context' : 'file_relations',
                company: currentUser?.company?.id ? 'current_context' : 'file_relations',
                bot: fileWithRelations.bot?.id ? 'file_relations' : 'folder_path'
              }
            });
            
            // Only create file event if we have the required fields (schema validation)
            if (eventBotId && eventCompanyId && eventUserId) {
              const eventData = {
                event_type: 'deleted',
                file_document_id: fileWithRelations.documentId || fileWithRelations.id.toString(),
                file_name: fileWithRelations.name,
                file_type: fileWithRelations.mime,
                file_size: fileSizeInBytes,
                processing_status: 'completed', // Deleted files are considered "completed"
                processed: false,
                bot_id: eventBotId,
                company_id: eventCompanyId,
                user_id: eventUserId,
                publishedAt: new Date().toISOString(),
              };
              
              console.log('📝 Creating file event (deleted) with data:', eventData);
              await strapi.entityService.create('api::file-event.file-event', {
                data: eventData,
              });
              console.log(`✅ File event (deleted) logged for file ${fileId}`);
            } else {
              console.log(`⚠️ [DELETE] Skipping file event creation - missing required fields:`);
              console.log(`   bot_id=${eventBotId}, company_id=${eventCompanyId}, user_id=${eventUserId}`);
              console.log(`   Context: currentUser=${!!currentUser}, fileRelations=${!(!fileWithRelations.user && !fileWithRelations.company && !fileWithRelations.bot)}`);
              if (!currentUser) {
                console.log(`   💡 Unable to identify current user from request context or JWT - file event will be skipped`);
              }
            }
          } else {
            console.log(`⚠️ Could not find file with ID ${fileId} for deletion tracking`);
          }
        } catch (eventError) {
          console.error('❌ Failed to log file deletion event:', eventError);
        }
        
        // Add S3 deletion logic (restored from backup) - only in production
        if (process.env.NODE_ENV === 'production') {
          try {
            console.log('[S3] 🔧 Production environment detected - attempting S3 deletion...');
            
            // Initialize AWS S3 client
            const s3 = new S3Client({
              region: process.env.AWS_REGION,
              credentials: fromEnv(),
            });
            
            // Construct S3 key from file data
            const s3Key = file.storage_key || `${file.hash}${file.ext}`;
            console.log(`[S3] 🗑️ Attempting to delete from bucket: ${process.env.AWS_BUCKET_NAME}, key: ${s3Key}`);
            
            // Delete from S3
            const deleteResult = await s3.send(new DeleteObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: s3Key,
            }));
            
            console.log(`[S3] ✅ S3 deletion response:`, deleteResult);
            
          } catch (s3Error) {
            console.error('🔴 [S3] Failed to delete from S3:', s3Error.message);
            // Don't throw error - still allow DB deletion to proceed
            console.log('⚠️ [S3] Continuing with database deletion despite S3 error...');
          }
        } else {
          console.log('[S3] 🔧 Development environment - skipping S3 deletion');
        }
        
        // Call the original remove method
        return baseService.remove(file);
      },
    };
  };

  return plugin;
}; 