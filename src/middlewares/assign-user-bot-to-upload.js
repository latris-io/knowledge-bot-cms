'use strict';

const jwt = require('jsonwebtoken');

/**
 * `assign-user-bot-to-upload` middleware
 * This middleware automatically assigns user, bot, and company relations to uploaded files.
 * It determines the bot based on the folder the file is uploaded to.
 * It also creates file events for create and update operations.
 */

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    console.log('🚨🚨🚨 ASSIGN-USER-BOT-TO-UPLOAD MIDDLEWARE CALLED 🚨🚨🚨');
    console.log('🔍 Upload middleware called for:', ctx.request.method, ctx.request.url);
    
    // Only process POST requests to upload endpoints (exclude actions)
    if (ctx.request.method !== 'POST' || !ctx.request.url.startsWith('/upload') || ctx.request.url.startsWith('/upload/actions')) {
      console.log('⏭️ Skipping - not a POST upload request');
      return await next();
    }
    
    // Detect if this is a file replacement (update) or new upload (create) - v1.3.0 method
    console.log('🔍 Request debugging:');
    console.log('🔍 ctx.query:', JSON.stringify(ctx.query));
    console.log('🔍 ctx.request.body keys:', Object.keys(ctx.request.body || {}));
    console.log('🔍 ctx.request.body.ref:', ctx.request.body?.ref);
    console.log('🔍 ctx.request.body.refId:', ctx.request.body?.refId);
    console.log('🔍 ctx.request.body.field:', ctx.request.body?.field);
    
    const isReplacement = !!ctx.query.id || ctx.request.body.ref || ctx.request.body.refId || ctx.request.body.field;
    const eventType = isReplacement ? 'updated' : 'created';
    console.log(`📌 Upload event type: ${eventType} (isReplacement: ${isReplacement})`);
    
    // Get user context from JWT token (handle both admin and users-permissions tokens)
    let user = null;
    const authHeader = ctx.request.header.authorization;
    console.log('🔍 Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const adminJwtSecret = strapi.config.get('admin.jwtSecret') || process.env.ADMIN_JWT_SECRET;
        
        // First, try admin JWT authentication
        try {
          if (adminJwtSecret) {
            const decoded = jwt.verify(token, adminJwtSecret);
            console.log('🔍 Admin JWT decoded:', { id: typeof decoded === 'object' && decoded?.id, type: 'admin' });
            
            if (typeof decoded === 'object' && decoded && decoded.id) {
              // This is an admin user - find corresponding users-permissions user by email
              const adminUser = await strapi.entityService.findOne(
                'admin::user',
                decoded.id,
                { populate: ['roles'] }
              );
              console.log('🔍 Found admin user:', adminUser ? { id: adminUser.id, email: adminUser.email } : 'null');
              
              if (adminUser?.email) {
                // Find corresponding users-permissions user by email
                const usersPermissionsUsers = await strapi.entityService.findMany(
                  'plugin::users-permissions.user',
                  {
                    filters: { email: adminUser.email },
                    populate: ['company']
                  }
                );
                
                if (usersPermissionsUsers && usersPermissionsUsers.length > 0) {
                  user = usersPermissionsUsers[0];
                  console.log('✅ Found corresponding users-permissions user:', { id: user.id, email: user.email, company: user.company?.id });
                } else {
                  console.log('⚠️ No users-permissions user found for admin email:', adminUser.email);
                }
              }
            }
          }
        } catch (adminJwtError) {
          console.log('🔍 Admin JWT verification failed, trying users-permissions JWT:', adminJwtError.message);
          
          // If admin JWT fails, try users-permissions JWT
          const userJwtSecret = strapi.config.get('server.jwtSecret') || process.env.JWT_SECRET;
          if (userJwtSecret) {
            const decoded = jwt.verify(token, userJwtSecret);
            console.log('🔍 Users-permissions JWT decoded:', { id: typeof decoded === 'object' && decoded?.id, type: 'user' });
            
            if (typeof decoded === 'object' && decoded && decoded.id) {
              user = await strapi.entityService.findOne(
                'plugin::users-permissions.user',
                decoded.id,
                { populate: ['company'] }
              );
              console.log('✅ Found users-permissions user:', user ? { id: user.id, email: user.email, company: user.company?.id } : 'null');
            }
          }
        }
        
      } catch (err) {
        console.error('🔴 JWT verification completely failed:', err.message);
      }
    }
    
    // Let the upload complete first
    await next();
    
    // Now process the response
    const { status, body } = ctx.response;
    console.log('📤 Response status:', status);
    console.log('📤 Response body type:', typeof body);
    console.log('📤 Response body:', Array.isArray(body) ? `Array with ${body.length} items` : body);
    
    // Process uploaded files if successful
    if ((status === 201 || status === 200) && body) {
      let filesToProcess = [];
      
      // Handle both array (new uploads) and single object (replacements) responses
      if (Array.isArray(body)) {
        filesToProcess = body;
        console.log(`✅ Upload successful - processing ${body.length} file(s)`);
      } else if (typeof body === 'object' && body.id) {
        filesToProcess = [body];
        console.log(`✅ File replacement successful - processing 1 file`);
      } else {
        console.log('⚠️ Unexpected response format:', {
          status: status,
          dataType: typeof body,
          isArray: Array.isArray(body),
          hasId: body?.id ? true : false
        });
        return;
      }
      
      // Process each uploaded file
      for (const file of filesToProcess) {
        console.log('📁 Processing file:', file);
        if (file && file.id) {
          try {
            let updateData = {};
            let fileEventData = {};
            
            // Set user_id (required)
            if (user) {
              updateData.user = user.id;
              fileEventData.user_id = user.id;
              console.log(`👤 User ID: ${user.id}`);
            } else {
              console.error('❌ No user found - cannot create file event');
              continue; // Skip this file if no user
            }
            
            // Set company_id (required) - use user's assigned company
            if (user.company) {
              updateData.company = user.company.id || user.company;
              fileEventData.company_id = user.company.id || user.company;
              console.log(`🏢 Company ID: ${fileEventData.company_id}`);
            } else {
              console.error('❌ No company found for user - cannot create file event');
              continue; // Skip this file if no company
            }
            
            // Determine bot from folder path (required) - as requested by user
            let botId = null;
            if (file.folderPath) {
              console.log(`📁 File folderPath: ${file.folderPath}`);
              console.log(`📁 folderPath type: ${typeof file.folderPath}`);
              console.log(`📁 folderPath length: ${file.folderPath.length}`);
              console.log(`📁 folderPath JSON: ${JSON.stringify(file.folderPath)}`);
              
              // Extract bot ID from folderPath (pattern: /bot-{id})
              const botMatch = file.folderPath.match(/^\/bot-(\d+)$/);
              console.log(`📁 Regex match result: ${botMatch}`);
              if (botMatch) {
                botId = parseInt(botMatch[1], 10);
                console.log(`🤖 Bot folder detected - Bot ID: ${botId}`);
              } else {
                console.log(`⚠️ File not in bot folder, folderPath: ${file.folderPath}`);
                console.log(`⚠️ Testing regex manually: ${/^\/bot-(\d+)$/.test(file.folderPath)}`);
              }
            } else {
              console.log('⚠️ File has no folderPath');
            }
            
            if (botId) {
              // Verify bot exists and belongs to user's company
              try {
                const bot = await strapi.entityService.findOne('api::bot.bot', botId, {
                  populate: ['company']
                });
                
                if (bot && bot.company && (bot.company.id === fileEventData.company_id || bot.company === fileEventData.company_id)) {
                  updateData.bot = botId;
                  fileEventData.bot_id = botId;
                  console.log(`✅ Bot verified and assigned: ${botId}`);
                } else {
                  console.error(`❌ Bot ${botId} not found or doesn't belong to user's company`);
                  continue; // Skip this file if bot verification fails
          }
        } catch (error) {
                console.error(`❌ Error verifying bot ${botId}:`, error.message);
                continue; // Skip this file if bot verification fails
              }
            } else {
              console.error('❌ No bot ID found from folder path - cannot create file event');
              continue; // Skip this file if no bot
            }
            
            // Set storage_key (just the filename without path)
            if (file.hash && file.ext) {
              updateData.storage_key = `${file.hash}${file.ext}`;
              console.log(`🔑 Setting storage_key: ${updateData.storage_key}`);
            }
            
            // Set source_type
            updateData.source_type = 'manual_upload';
            
            // Update the file with relations
            if (Object.keys(updateData).length > 0) {
              console.log(`📝 Updating file ${file.id} with relations:`, updateData);
              
              const updatedFile = await strapi.entityService.update('plugin::upload.file', file.id, {
                data: updateData
              });
              
              console.log(`✅ File ${file.name} updated successfully`);
            } else {
              console.log('⚠️ No relations to set for file');
            }
            
            // Create file event with all required fields
            try {
              // Convert file size from KB to bytes and ensure it's an integer
              const fileSizeInBytes = Math.round((file.size || 0) * 1024);
              
              // Prepare file event data with all required fields
              const finalFileEventData = {
                file_document_id: file.documentId || file.id.toString(),
                file_name: file.name,
                file_type: file.mime,
                file_size: fileSizeInBytes,
                event_type: eventType,
                processing_status: 'pending',
                user_id: fileEventData.user_id,
                bot_id: fileEventData.bot_id,
                company_id: fileEventData.company_id,
                publishedAt: new Date().toISOString(),
              };
              
              console.log(`📊 Creating file event (${eventType}) for file ${file.name}`);
              console.log(`📊 File event data:`, finalFileEventData);
              
              const fileEvent = await strapi.entityService.create('api::file-event.file-event', {
                data: finalFileEventData
              });
              
              console.log(`✅ File event (${eventType}) created for file ${file.name}:`, fileEvent.id);
            } catch (error) {
              console.error('❌ Error creating file event:', error);
              console.error('❌ Error details:', error.message);
              console.error('❌ Error stack:', error.stack);
            }
          } catch (error) {
            console.error(`❌ Error updating file ${file.id} relations:`, error);
          }
        } else {
          console.log('⚠️ File object is invalid:', file);
        }
      }
    } else {
      console.log('⚠️ Upload not successful or not array data:', {
        status: status,
        dataType: typeof body,
        isArray: Array.isArray(body)
      });
    }
  };
};


