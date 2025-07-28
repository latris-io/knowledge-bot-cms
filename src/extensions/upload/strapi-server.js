'use strict';

console.log('🚨🚨🚨 UPLOAD EXTENSION FILE IS BEING LOADED 🚨🚨🚨');

module.exports = (plugin) => {
  console.log('🚨 [UPLOAD EXTENSION] Loading upload extension with folder filtering and file relations');
  
  // Override the folder controller
  plugin.controllers.folder = require('./controllers/folder');
  
  // Remove the route override that's not working
  // We'll handle folder-structure filtering differently
  
  // Register lifecycle hooks for file upload
  plugin.contentTypes.file.lifecycles = {
    async afterCreate(event) {
      const { result, params } = event;
      
      console.log('📎 [FILE LIFECYCLE] afterCreate triggered for file:', result.name);
      console.log('📋 Result folder:', result.folder);
      console.log('📋 Params data:', params.data);
      
      try {
        let updateData = {};
        
        // Try to get the current user from various sources
        let user = null;
        
        // Check if we have user info in params
        if (params.data?.user) {
          user = await strapi.entityService.findOne(
            'plugin::users-permissions.user',
            params.data.user,
            { populate: ['company'] }
          );
        }
        
        // If no user in params, try to get from request context
        if (!user) {
          try {
            const ctx = strapi.requestContext?.get?.();
            if (ctx) {
              // Check for regular user
              if (ctx.state?.user) {
                user = await strapi.entityService.findOne(
                  'plugin::users-permissions.user',
                  ctx.state.user.id,
                  { populate: ['company'] }
                );
                console.log('✅ Found regular user:', user.email);
              }
              // Check for admin user
              else if (ctx.state?.userAbility?.user) {
                user = await strapi.entityService.findOne(
                  'plugin::users-permissions.user',
                  ctx.state.userAbility.user.id,
                  { populate: ['company'] }
                );
                console.log('✅ Found admin user:', user.email);
              }
              // Check for admin via auth credentials
              else if (ctx.state?.auth?.credentials) {
                const adminEmail = ctx.state.auth.credentials.email;
                console.log(`👤 Admin upload detected: ${adminEmail}`);
                
                const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
                  filters: { email: adminEmail },
                  limit: 1,
                  populate: ['company']
                });
                
                if (users && users.length > 0) {
                  user = users[0];
                  console.log(`✅ Found user for admin: ${user.email}`);
                }
              }
            }
          } catch (error) {
            console.log('⚠️ Could not get user from request context:', error.message);
          }
        }
        
        if (user) {
          updateData.user = user.id;
          
          // Set company if user has one
          if (user.company) {
            updateData.company = user.company.id || user.company;
            console.log(`🏢 Setting company: ${user.company.name || user.company}`);
          }
        } else {
          console.log('⚠️ No user found for file upload');
        }
        
        // Try to determine bot from folder - check both result and params
        const folderId = result.folder || params.data?.folder;
        if (folderId) {
          console.log(`📂 File has folder ID: ${folderId}`);
          try {
            const folder = await strapi.entityService.findOne('plugin::upload.folder', folderId, {
              fields: ['path', 'name']
            });
            
            if (folder && folder.path) {
              console.log(`📂 File uploaded to folder: ${folder.path} (name: ${folder.name})`);
              
              // Check if this is a bot folder (pattern: /bot-{botId})
              const botFolderMatch = folder.path.match(/^\/bot-(\d+)$/);
              
              if (botFolderMatch) {
                const botId = parseInt(botFolderMatch[1]);
                console.log(`🤖 Bot folder detected - Bot ID: ${botId}`);
                
                const bot = await strapi.entityService.findOne('api::bot.bot', botId, {
                  populate: ['company']
                });
                
                if (bot) {
                  updateData.bot = botId;
                  console.log(`✅ Bot assigned: ${bot.name}`);
                  
                  // Use bot's company if user doesn't have one
                  if (!updateData.company && bot.company) {
                    updateData.company = bot.company.id;
                    console.log(`🏢 Using bot's company: ${bot.company.name}`);
                  }
                } else {
                  console.log(`⚠️ Bot with ID ${botId} not found`);
                }
              } else {
                console.log(`ℹ️ Not a bot folder, path: ${folder.path}`);
              }
            } else {
              console.log(`⚠️ Folder ${folderId} has no path`);
            }
          } catch (error) {
            console.error('❌ Error processing folder:', error);
          }
        } else {
          console.log('⚠️ File has no folder assigned in result or params');
        }
        
        // Update the file if we have any relations to set
        if (Object.keys(updateData).length > 0) {
          console.log(`📝 Updating file ${result.id} with:`, updateData);
          await strapi.entityService.update('plugin::upload.file', result.id, {
            data: updateData
          });
          console.log(`✅ File relations updated successfully`);
          
          // Create file event if bot is assigned
          if (updateData.bot) {
            try {
              await strapi.entityService.create('api::file-event.file-event', {
                data: {
                  file_document_id: result.documentId || result.id.toString(),
                  file_name: result.name,
                  file_type: result.mime,
                  file_size: result.size,
                  event_type: 'created',
                  processing_status: 'pending',
                  user_id: updateData.user,
                  bot_id: updateData.bot,
                  company_id: updateData.company
                }
              });
              console.log('�� File event created for tracking');
            } catch (error) {
              console.error('❌ Error creating file event:', error);
              if (error.details && error.details.errors) {
                console.error('Validation errors:', error.details.errors);
              }
            }
          }
        } else {
          console.log('⚠️ No relations to update for file');
        }
      } catch (error) {
        console.error('❌ Error in file afterCreate lifecycle:', error);
      }
    }
  };
  
  // Store original upload service
  const originalUpload = plugin.services.upload.upload;
  const originalUploadFiles = plugin.services.upload.uploadFiles;
  
  // Override upload service methods
  plugin.services.upload.upload = async (params, { user } = {}) => {
    console.log('🎯 Custom upload method called');
    
    // Call original method
    const result = await originalUpload.call(plugin.services.upload, params, { user });
    
    // Process uploaded files
    if (result && Array.isArray(result)) {
      await processUploadedFiles(result);
    }
    
    return result;
  };
  
  plugin.services.upload.uploadFiles = async (files) => {
    console.log('🎯 Custom uploadFiles method called');
    
    // Call original method
    const result = await originalUploadFiles.call(plugin.services.upload, files);
    
    // Process uploaded files
    if (result && Array.isArray(result)) {
      await processUploadedFiles(result);
    }
    
    return result;
  };
  
  // Helper function to process uploaded files
  async function processUploadedFiles(files) {
    for (const file of files) {
      try {
        console.log(`📎 Processing uploaded file: ${file.name} (ID: ${file.id})`);
        
        let updateData = {};
        
        // Try to get the current user context from various sources
        let user = null;
        
        // Check strapi request context
        try {
          const ctx = strapi.requestContext?.get?.();
          if (ctx) {
            user = ctx.state?.user || ctx.state?.userAbility?.user;
            
            // If no regular user, check for admin user
            if (!user && ctx.state?.auth?.credentials) {
              const adminEmail = ctx.state.auth.credentials.email;
              console.log(`👤 Admin upload detected via auth: ${adminEmail}`);
              
              const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
                filters: { email: adminEmail },
                limit: 1,
                populate: ['company']
              });
              
              if (users && users.length > 0) {
                user = users[0];
                console.log(`✅ Found user for admin: ${user.email}`);
              }
            }
          }
        } catch (error) {
          console.log('⚠️ Could not get request context:', error.message);
        }
        
        if (user) {
          updateData.user = user.id;
          
          // Set company if user has one
          if (user.company) {
            updateData.company = user.company.id || user.company;
            console.log(`🏢 Setting company: ${user.company.name || user.company}`);
          }
        } else {
          console.log('⚠️ No user context found for file upload');
        }
        
        // Try to determine bot from folder
        if (file.folder) {
          try {
            const folder = await strapi.entityService.findOne('plugin::upload.folder', file.folder, {
              fields: ['path']
            });
            
            if (folder && folder.path) {
              console.log(`📂 File in folder: ${folder.path}`);
              
              // Check if this is a bot folder
              const botFolderMatch = folder.path.match(/^\/bot-(\d+)$/);
              if (botFolderMatch) {
                const botId = parseInt(botFolderMatch[1]);
                console.log(`🤖 Bot folder detected - Bot ID: ${botId}`);
                
                const bot = await strapi.entityService.findOne('api::bot.bot', botId, {
                  populate: ['company']
                });
                
                if (bot) {
                  updateData.bot = botId;
                  console.log(`✅ Bot assigned: ${bot.name}`);
                  
                  // Use bot's company if user doesn't have one
                  if (!updateData.company && bot.company) {
                    updateData.company = bot.company.id;
                    console.log(`🏢 Using bot's company: ${bot.company.name}`);
                  }
                }
              }
            }
          } catch (error) {
            console.error('❌ Error processing folder:', error);
          }
        }
        
        // Update the file if we have any relations to set
        if (Object.keys(updateData).length > 0) {
          console.log(`📝 Updating file ${file.id} with:`, updateData);
          await strapi.entityService.update('plugin::upload.file', file.id, {
            data: updateData
          });
          console.log(`✅ File relations updated successfully`);
          
          // Create file event if bot is assigned
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
              console.log('📊 File event created');
            } catch (error) {
              console.error('❌ Error creating file event:', error);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing file ${file.id}:`, error);
      }
    }
  }
  
  // File lifecycle hooks remain active for setting user/company/bot relations
  // The folder filtering middleware has been removed since it was interfering with 
  // the global middleware that handles all folder-related filtering

  return plugin;
}; 
