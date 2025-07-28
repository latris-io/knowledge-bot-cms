'use strict';

/**
 * `assign-user-bot-to-upload` middleware
 * This middleware automatically assigns user, bot, and company relations to uploaded files.
 * It determines the bot based on the folder the file is uploaded to.
 */

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    console.log('🔍 Upload middleware called for:', ctx.request.method, ctx.request.url);
    
    // Only process POST requests to upload endpoints
    if (ctx.request.method !== 'POST' || !ctx.request.url.includes('/upload')) {
      return await next();
    }
    
    // Skip if this is an upload action (like delete)
    if (ctx.request.url.includes('/actions/')) {
      return await next();
    }
    
    // Store the original response
    const originalSend = ctx.send;
    
    // Override ctx.send to intercept the response
    ctx.send = async function(data) {
      console.log('📤 Upload response intercepted');
      
      // Process uploaded files if successful
      if (ctx.response.status === 201 && Array.isArray(data)) {
        console.log(`✅ Upload successful - processing ${data.length} file(s)`);
        
        // Process each uploaded file
        for (const file of data) {
          if (file && file.id) {
            try {
              let updateData = {};
              
              // Get the user context
              let user = ctx.state.user;
              let isAdminUpload = false;
              
              // Check for admin user
              if (!user && ctx.state.admin) {
                console.log('👤 Admin upload detected');
                isAdminUpload = true;
                
                // Find the user account associated with this admin
                const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
                  filters: { email: ctx.state.admin.email },
                  limit: 1,
                  populate: ['company']
                });
                
                if (users && users.length > 0) {
                  user = users[0];
                  console.log(`✅ Found user for admin: ${user.email}`);
                }
              }
              
              if (user) {
                console.log(`👤 Processing upload for user: ${user.email} (Admin: ${isAdminUpload})`);
                
                // Get user with company relation if not already populated
                if (!user.company || typeof user.company === 'number') {
                  const fullUser = await strapi.entityService.findOne(
                    'plugin::users-permissions.user',
                    user.id,
                    { populate: ['company'] }
                  );
                  if (fullUser) {
                    user = fullUser;
                  }
                }
                
                updateData.user = user.id;
                
                // Set company from user
                if (user.company) {
                  updateData.company = user.company.id || user.company;
                  console.log(`🏢 User company: ${user.company.name || 'ID: ' + updateData.company}`);
                }
              }
              
              // Determine bot from folder
              if (file.folder) {
                console.log(`📂 File uploaded to folder ID: ${file.folder}`);
                
                // Get folder details
                const folder = await strapi.entityService.findOne(
                  'plugin::upload.folder',
                  file.folder,
                  { fields: ['path', 'name'] }
                );
                
                if (folder) {
                  console.log(`📁 Folder path: ${folder.path}, name: ${folder.name}`);
                  
                  // Check if this is a bot folder (pattern: /bot-{id})
                  const botMatch = folder.path.match(/^\/bot-(\d+)$/);
                  if (botMatch) {
                    const botId = parseInt(botMatch[1]);
                    console.log(`🤖 Bot folder detected - Bot ID: ${botId}`);
                    
                    // Verify bot exists and get its company
                    const bot = await strapi.entityService.findOne('api::bot.bot', botId, {
                      populate: ['company']
                    });
                    
                    if (bot) {
                      updateData.bot = botId;
                      console.log(`✅ Bot found: ${bot.name}`);
                      
                      // Use bot's company if user doesn't have one
                      if (!updateData.company && bot.company) {
                        updateData.company = bot.company.id;
                        console.log(`🏢 Using bot's company: ${bot.company.name}`);
                      }
                    } else {
                      console.log(`⚠️ Bot with ID ${botId} not found`);
                    }
                  } else {
                    console.log(`ℹ️ Not a bot folder: ${folder.path}`);
                  }
                } else {
                  console.log(`⚠️ Could not find folder with ID: ${file.folder}`);
                }
              } else {
                console.log(`⚠️ File has no folder assigned`);
              }
              
              // Update the file with relations
              if (Object.keys(updateData).length > 0) {
                console.log(`📝 Updating file ${file.id} with relations:`, updateData);
                
                const updatedFile = await strapi.entityService.update('plugin::upload.file', file.id, {
                  data: updateData
                });
                
                console.log(`✅ File ${file.name} updated successfully`);
                console.log(`📋 Updated file bot relation:`, updatedFile.bot);
                
                // Update the file object in the response data
                if (updatedFile.bot) {
                  file.bot = updatedFile.bot;
                }
                if (updatedFile.user) {
                  file.user = updatedFile.user;
                }
                if (updatedFile.company) {
                  file.company = updatedFile.company;
                }
                
                // Create file-event record if bot is assigned
                if (updateData.bot) {
                  try {
                    await strapi.entityService.create('api::file-event.file-event', {
                      data: {
                        file_id: file.id,
                        file_name: file.name,
                        file_path: file.url,
                        status: 'uploaded',
                        event_type: 'upload',
                        event_timestamp: new Date(),
                        user: updateData.user,
                        bot: updateData.bot,
                        company: updateData.company,
                        metadata: {
                          size: file.size,
                          mime: file.mime,
                          ext: file.ext
                        }
                      }
                    });
                    console.log('📊 File event created for tracking');
                  } catch (error) {
                    console.error('❌ Error creating file event:', error);
                  }
                }
              } else {
                console.log('⚠️ No relations to set for file');
              }
            } catch (error) {
              console.error(`❌ Error updating file ${file.id} relations:`, error);
            }
          }
        }
      }
      
      // Call the original send
      originalSend.call(this, data);
    };
    
    await next();
  };
};


