'use strict';

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
    const isUploadUrl = ctx.request.url.startsWith('/upload') || ctx.request.url.startsWith('/api/upload');
    const isActionUrl = ctx.request.url.startsWith('/upload/actions') || ctx.request.url.startsWith('/api/upload/actions');
    
    if (ctx.request.method !== 'POST' || !isUploadUrl || isActionUrl) {
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
    
    // 🎯 PROPER STRAPI 5 WAY: Use built-in authentication context
    let user = ctx.state.user;        // users-permissions user
    let admin = ctx.state.admin;       // admin user
    
    console.log('🔍 Authentication Context:');
    console.log('   ctx.state.user:', user ? { id: user.id, email: user.email } : 'null');
    console.log('   ctx.state.admin:', admin ? { id: admin.id, email: admin.email } : 'null');
    console.log('   Authorization header:', ctx.request.headers.authorization ? 'SET' : 'NOT SET');
    
    // 🎯 STRAPI 5 USER RESOLUTION (Best Practice First)
    if (!user && admin) {
      // For admin users, find the corresponding users-permissions user
      console.log('🔄 Admin user detected, finding corresponding users-permissions user...');
      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { email: admin.email },
        limit: 1,
        populate: ['company']
      });
      user = users[0];
      console.log('✅ Found corresponding users-permissions user:', user?.email || 'null');
    } else if (user) {
      // Ensure user has company populated
      console.log('🔄 Ensuring user company is populated...');
      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { documentId: user.documentId },
        limit: 1,
        populate: ['company']
      });
      if (users?.length > 0) {
        user = users[0];
        console.log('✅ User company populated:', user?.company?.id || 'no company');
      }
    }
    
    // 🛡️ FALLBACK: Manual JWT Authentication 
    // This should NOT be needed in proper Strapi 5, but serves as a safety net
    // when ctx.state.user/admin are unexpectedly empty (e.g., middleware timing issues)
    if (!user && !admin) {
      console.log('⚠️ FALLBACK: ctx.state is empty, attempting manual JWT authentication...');
      
      const authHeader = ctx.request.headers.authorization;
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '');
          console.log('🔍 Found authorization token (length:', token.length, '), attempting to verify...');
          
          // Try admin JWT first - Method 1: Admin JWT Service
          try {
            const adminJwtService = strapi.service('admin::token');
            if (!adminJwtService) {
              throw new Error('Admin JWT service not available');
            }
            const jwtResult = await adminJwtService.decodeJwtToken(token);
            console.log('🔍 Admin JWT Service result:', JSON.stringify(jwtResult, null, 2));
            
            // Extract the actual payload (Admin JWT Service returns {payload: {...}, isValid: true})
            const adminPayload = jwtResult?.payload || jwtResult;
            const adminId = adminPayload?.id;
            
            if (!adminId) {
              throw new Error('Admin JWT payload missing ID field');
            }
            
            console.log('✅ Admin JWT verified (Method 1):', { id: adminId });
            console.log('🔄 Looking up admin user by ID (Method 1)...');
            
            // Look up the admin user to get their email
            const adminUser = await strapi.entityService.findOne('admin::user', adminId);
            const adminEmail = adminUser?.email;
            console.log('🔍 Found admin user email (Method 1):', adminEmail);
            
            if (adminEmail) {
              // Find corresponding users-permissions user
              const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
                filters: { email: adminEmail },
                limit: 1,
                populate: ['company']
              });
              user = users[0];
              console.log('✅ Found users-permissions user for admin (Method 1):', user?.email || 'null');
              
              // Skip alternative methods if we found a user
              if (user) {
                throw new Error('SUCCESS_WITH_ADMIN_JWT_METHOD1'); // Use error to break out of try-catch chain
              }
            } else {
              console.log('❌ Admin user found but no email (Method 1)');
            }
                      } catch (adminError) {
              console.log('⚠️ Admin JWT Service failed:', adminError.message);
              console.log('🔄 Trying alternative admin JWT method...');
              
              // Try alternative admin JWT decoding method
              try {
                const jwt = require('jsonwebtoken');
                const jwtSecret = strapi.config.get('admin.auth.secret');
                console.log('🔍 Using JWT secret available:', !!jwtSecret);
                
                const decoded = jwt.verify(token, jwtSecret);
                const adminPayload = typeof decoded === 'string' ? null : decoded;
                console.log('🔍 Alternative admin JWT payload:', JSON.stringify(adminPayload, null, 2));
                console.log('✅ Admin JWT verified (Method 2):', { id: adminPayload?.id, email: adminPayload?.email });
                
                // Admin JWT only contains ID, so look up the admin user by ID
                const adminId = adminPayload?.id;
                console.log('🔍 Admin ID from JWT:', adminId);
                
                if (adminId) {
                  console.log('🔄 Looking up admin user by ID...');
                  // Look up the admin user to get their email
                  const adminUser = await strapi.entityService.findOne('admin::user', adminId);
                  const adminEmail = adminUser?.email;
                  console.log('🔍 Found admin user email:', adminEmail);
                  
                  if (adminEmail) {
                    // Now find the corresponding users-permissions user
                    const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
                      filters: { email: adminEmail },
                      limit: 1,
                      populate: ['company']
                    });
                    user = users[0];
                    console.log('✅ Found users-permissions user for admin (Method 2):', user?.email || 'null');
                    
                    // Skip users-permissions JWT if we found a user
                    if (user) {
                      throw new Error('SUCCESS_WITH_ADMIN_JWT_METHOD2'); // Use error to break out of try-catch chain
                    }
                  } else {
                    console.log('❌ Admin user found but no email');
                  }
                } else {
                  console.log('❌ No admin ID found in JWT payload');
                }
              } catch (altAdminError) {
                if (altAdminError.message === 'SUCCESS_WITH_ADMIN_JWT_METHOD2') {
                  throw altAdminError; // Re-throw success signal
                }
                console.log('⚠️ Alternative admin JWT method also failed:', altAdminError.message);
              }
              
                            console.log('⚠️ All admin JWT methods failed, trying users-permissions JWT...');
              
              // Try users-permissions JWT (wrap in try-catch to prevent uncaught exceptions)
              try {
                const userJwtService = strapi.plugins['users-permissions'].services.jwt;
                const userPayload = await userJwtService.verify(token);
                console.log('🔍 Raw users-permissions JWT payload:', userPayload);
                console.log('✅ Users-permissions JWT verified:', { id: userPayload?.id });
                
                if (userPayload?.id) {
                  // Get user with company populated
                  const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
                    filters: { id: userPayload.id },
                    limit: 1,
                    populate: ['company']
                  });
                  user = users[0];
                  console.log('✅ Found users-permissions user:', user?.email || 'null');
                } else {
                  console.log('❌ No user ID found in users-permissions JWT payload');
                }
              } catch (userJwtError) {
                console.log('⚠️ Users-permissions JWT verification failed:', userJwtError.message);
                console.log('❌ Token is not a valid users-permissions JWT');
              }
          }
        } catch (authError) {
          if (authError.message === 'SUCCESS_WITH_ADMIN_JWT_METHOD1') {
            console.log('✅ Successfully authenticated using Admin JWT Service (Method 1)');
          } else if (authError.message === 'SUCCESS_WITH_ADMIN_JWT_METHOD2') {
            console.log('✅ Successfully authenticated using alternative admin JWT method (Method 2)');
          } else {
            console.log('❌ Manual authentication completely failed:', authError.message);
            console.log('❌ Auth error details:', authError);
          }
        }
      } else {
        console.log('⚠️ No authorization header found for fallback authentication');
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
      
      // Handle response format - check if wrapped by controller override
      let actualBody = body;
      if (body && typeof body === 'object' && body.data && !body.id) {
        // Response was wrapped by controller override, extract the actual data
        actualBody = body.data;
        console.log('📦 Detected wrapped response format, extracting data');
      }

      // Handle both array (new uploads) and single object (replacements) responses
      if (Array.isArray(actualBody)) {
        filesToProcess = actualBody;
        console.log(`✅ Upload successful - processing ${actualBody.length} file(s)`);
      } else if (typeof actualBody === 'object' && actualBody.id) {
        filesToProcess = [actualBody];
        console.log(`✅ File replacement successful - processing 1 file`);
      } else {
        console.log('⚠️ Unexpected response format:', {
          status: status,
          dataType: typeof body,
          isArray: Array.isArray(body),
          hasId: body?.id ? true : false,
          hasData: body?.data ? true : false,
          actualBodyType: typeof actualBody
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
  }; // closes async (ctx, next) => {
}; // closes module.exports


