'use strict';

/**
 * An asynchronous register function that runs before
 * your application is initialized.
 *
 * This gives you an opportunity to extend code.
 */
exports.register = ({ strapi }) => {};

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 */
exports.bootstrap = async ({ strapi }) => {
  console.log('🚀 Bootstrap function: No role management code - manual configuration only');
  
  // Require jwt once at the top
  const jwt = require('jsonwebtoken');
  
  // Test middleware to verify registration
  strapi.server.use(async (ctx, next) => {
    if (ctx.request.url.includes('/upload/')) {
      console.log('🔥 [TEST MIDDLEWARE] Upload request detected:', ctx.request.method, ctx.request.url);
    }
    await next();
  });
  
  // Add global middleware to intercept content-manager relation requests
  strapi.server.use(async (ctx, next) => {
    // Enhanced logging for ALL requests to identify dropdown endpoints
    const url = ctx.request.url;
    const method = ctx.request.method;
    
    // Log ALL requests during investigation
    if (method === 'GET' || method === 'POST') {
      console.log(`🌐 [ALL REQUESTS] ${method} ${url}`);
    }
    
    // Log ALL requests that might be folder-related
    if (url.includes('folder') || 
        url.includes('Folder') ||
        url.includes('upload') && url.includes('relation')) {
      console.log('🔍 [REQUEST MONITOR]', method, url);
      console.log('   Query params:', JSON.stringify(ctx.query));
      console.log('   Body:', ctx.request.body ? JSON.stringify(ctx.request.body).substring(0, 200) : 'none');
    }
    
    // Check if this is a content-manager request involving folders OR any upload folder endpoint
    const isContentManagerFolderRequest = 
      (url.includes('/content-manager/relations/plugin::upload.file') && url.includes('/folder')) ||
      url.includes('/content-manager/relations/plugin::upload.folder') ||
      url.includes('/content-manager/collection-types/plugin::upload.folder') ||
      (url.includes('/content-manager/') && url.includes('folder'));
      
    const isFolderStructureRequest = url.includes('/upload/folder-structure');
    const isFolderRequest = url.includes('/upload/folders') || url.includes('/upload/folder/');
    
    // Re-enabled after fixing
    if (isContentManagerFolderRequest || isFolderStructureRequest || isFolderRequest) {
      console.log('🎯 [GLOBAL-MIDDLEWARE] Intercepting folder request:', url);
      console.log('🎯 [GLOBAL-MIDDLEWARE] Method:', method);
      console.log('🎯 [GLOBAL-MIDDLEWARE] Query:', JSON.stringify(ctx.query));
      
      try {
        // Get the authenticated user
        let user = ctx.state.user || ctx.state.admin;
        console.log('🎯 [GLOBAL-MIDDLEWARE] Initial user:', user ? user.email : 'none');
        
        // If no user in state, try to decode JWT from authorization header
        if (!user) {
          const authHeader = ctx.request.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            console.log('🎯 [GLOBAL-MIDDLEWARE] Found authorization header, attempting to decode');
            const token = authHeader.replace('Bearer ', '');
            
            try {
              const adminSecret = strapi.config.get('admin.auth.secret');
              const decoded = jwt.verify(token, adminSecret);
              const decodedId = typeof decoded === 'object' ? decoded.id : null;
              console.log('🎯 [GLOBAL-MIDDLEWARE] Decoded token:', { id: decodedId });
              
              if (typeof decoded === 'object' && decoded.id) {
                // Get admin user
                const adminUsers = await strapi.documents('admin::user').findMany({
                  filters: { id: decoded.id },
                  limit: 1
                });
                
                if (adminUsers && adminUsers.length > 0) {
                  const adminUser = adminUsers[0];
                  console.log('🎯 [GLOBAL-MIDDLEWARE] Found admin user:', adminUser.email);
                  
                  // Find corresponding regular user by email
                  const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
                    filters: { email: adminUser.email },
                    limit: 1,
                    populate: ['company']
                  });
                  
                  if (users && users.length > 0) {
                    user = users[0];
                    console.log('🎯 [GLOBAL-MIDDLEWARE] Found user with company:', user.email);
                  }
                }
              }
            } catch (tokenError) {
              console.log('🎯 [GLOBAL-MIDDLEWARE] Token decode error:', tokenError.message);
            }
          }
        }
        
        if (user && !user.company) {
          // If it's an admin user, find the corresponding regular user
          const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
            filters: { email: user.email },
            limit: 1,
            populate: ['company']
          });
          user = users[0];
          console.log('🎯 [GLOBAL-MIDDLEWARE] Loaded user with company:', user ? user.email : 'none');
        }
        
        if (user && user.company) {
          const companyId = user.company.id || user.company;
          console.log(`🎯 [GLOBAL-MIDDLEWARE] Filtering for company ID: ${companyId}`);
          
          // Get all bots for this company
          const companyBots = await strapi.entityService.findMany('api::bot.bot', {
            filters: { company: companyId },
            fields: ['id']
          });
          const botIds = companyBots.map(bot => bot.id);
          console.log(`🎯 [GLOBAL-MIDDLEWARE] Company ${companyId} has bot IDs: ${botIds.join(', ')}`);
          
          // For content-manager requests and regular folder requests, apply filters to the query
          if (isContentManagerFolderRequest || isFolderRequest) {
            // Initialize filters if not present
            if (!ctx.query.filters) {
              ctx.query.filters = {};
            }
            
            // Apply company-based filtering
            const companyFilter = {
              $or: [
                { company: companyId },
                { path: { $in: botIds.map(id => `/bot-${id}`) } },
                { $and: [{ path: '/' }, { company: null }] }
              ]
            };
            
            // If there are existing filters, combine them with our company filter
            if (ctx.query.filters.$and) {
              ctx.query.filters.$and.push(companyFilter);
            } else if (Object.keys(ctx.query.filters).length > 0) {
              // Wrap existing filters and our filter in an $and
              const existingFilters = { ...ctx.query.filters };
              ctx.query.filters = {
                $and: [existingFilters, companyFilter]
              };
            } else {
              // No existing filters, just apply our company filter
              ctx.query.filters = companyFilter;
            }
            
            console.log('🎯 [GLOBAL-MIDDLEWARE] Applied filters:', JSON.stringify(ctx.query.filters, null, 2));
          }
        } else {
          console.log('🎯 [GLOBAL-MIDDLEWARE] No user or company found - no filtering applied');
        }
      } catch (error) {
        console.error('❌ [GLOBAL-MIDDLEWARE] Error applying filters:', error);
      }
    }
    
    await next();
    
    // For folder-structure requests, filter the response
    if (isFolderStructureRequest && ctx.response.body) {
      try {
        let user = ctx.state.user || ctx.state.admin;
        console.log('🎯 [GLOBAL-MIDDLEWARE] Filtering folder-structure response, user:', user ? user.email : 'none');
        
        // If no user in state, try to decode JWT from authorization header
        if (!user) {
          const authHeader = ctx.request.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            
            try {
              const adminSecret = strapi.config.get('admin.auth.secret');
              const decoded = jwt.verify(token, adminSecret);
              
              if (typeof decoded === 'object' && decoded.id) {
                // Get admin user
                const adminUsers = await strapi.documents('admin::user').findMany({
                  filters: { id: decoded.id },
                  limit: 1
                });
                
                if (adminUsers && adminUsers.length > 0) {
                  const adminUser = adminUsers[0];
                  
                  // Find corresponding regular user by email
                  const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
                    filters: { email: adminUser.email },
                    limit: 1,
                    populate: ['company']
                  });
                  
                  if (users && users.length > 0) {
                    user = users[0];
                    console.log('🎯 [GLOBAL-MIDDLEWARE] Found user for response filtering:', user.email);
                  }
                }
              }
            } catch (tokenError) {
              console.log('🎯 [GLOBAL-MIDDLEWARE] Response filter token error:', tokenError.message);
            }
          }
        }
        
        if (user && !user.company) {
          const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
            filters: { email: user.email },
            limit: 1,
            populate: ['company']
          });
          user = users[0];
          console.log('🎯 [GLOBAL-MIDDLEWARE] Loaded user with company:', user ? user.email : 'none');
        }
        
        if (user && user.company) {
          const companyId = user.company.id || user.company;
          console.log('🎯 [GLOBAL-MIDDLEWARE] Filtering folder-structure response for company:', companyId);
          
          // Get all bots for this company
          const companyBots = await strapi.entityService.findMany('api::bot.bot', {
            filters: { company: companyId },
            fields: ['id']
          });
          const botIds = companyBots.map(bot => bot.id);
          console.log('🎯 [GLOBAL-MIDDLEWARE] Company bots:', botIds);
          
          // Recursive function to filter folder tree
          const filterFolderTree = async (folders) => {
            if (!Array.isArray(folders)) return folders;
            
            console.log('🎯 [GLOBAL-MIDDLEWARE] Filtering folders, count:', folders.length);
            if (folders.length > 0) {
              console.log('🎯 [GLOBAL-MIDDLEWARE] Sample folder:', JSON.stringify(folders[0], null, 2));
            }
            
            // For folder-structure endpoint, we need to fetch full folder data
            const filteredFolders = [];
            
            for (const folder of folders) {
              // Fetch full folder data if path/company not available
              let folderData = folder;
              if (!folder.path || folder.company === undefined) {
                console.log(`🎯 [GLOBAL-MIDDLEWARE] Fetching full data for folder ${folder.id}`);
                const fullFolders = await strapi.entityService.findMany('plugin::upload.folder', {
                  filters: { id: folder.id },
                  limit: 1,
                  populate: ['company']
                });
                
                if (fullFolders && fullFolders.length > 0) {
                  folderData = { ...folder, ...fullFolders[0] };
                  console.log(`🎯 [GLOBAL-MIDDLEWARE] Full folder data: path=${folderData.path}, company=${folderData.company?.id || folderData.company}`);
                }
              }
              
              // Check access
              const companyMatch = folderData.company === companyId || 
                                 folderData.company?.id === companyId;
              const botMatch = botIds.some(id => folderData.path === `/bot-${id}`);
              const rootMatch = folderData.path === '/' && !folderData.company;
              
              const hasAccess = companyMatch || botMatch || rootMatch;
              
              console.log(`🎯 [GLOBAL-MIDDLEWARE] Folder ${folderData.path || folder.name} access: ${hasAccess} (company: ${companyMatch}, bot: ${botMatch}, root: ${rootMatch})`);
              
              if (hasAccess) {
                // Process children recursively
                if (folder.children && folder.children.length > 0) {
                  folder.children = await filterFolderTree(folder.children);
                }
                filteredFolders.push(folder);
              }
            }
            
            return filteredFolders;
          };
          
          // Filter the response
          if (ctx.response.body.data) {
            console.log('🎯 [GLOBAL-MIDDLEWARE] Filtering response.body.data');
            console.log('🎯 [GLOBAL-MIDDLEWARE] Original folder count:', ctx.response.body.data.length);
            
            // Log the structure of the first folder to understand the format
            if (ctx.response.body.data.length > 0) {
              console.log('🎯 [GLOBAL-MIDDLEWARE] First folder structure:', JSON.stringify(ctx.response.body.data[0], null, 2));
            }
            
            ctx.response.body.data = await filterFolderTree(ctx.response.body.data);
            console.log(`🎯 [GLOBAL-MIDDLEWARE] Filtered folder-structure to ${ctx.response.body.data.length} root folders`);
          } else if (Array.isArray(ctx.response.body)) {
            console.log('🎯 [GLOBAL-MIDDLEWARE] Filtering response.body array');
            console.log('🎯 [GLOBAL-MIDDLEWARE] Original folder count:', ctx.response.body.length);
            ctx.response.body = await filterFolderTree(ctx.response.body);
            console.log(`🎯 [GLOBAL-MIDDLEWARE] Filtered folder-structure to ${ctx.response.body.length} root folders`);
          } else {
            console.log('🎯 [GLOBAL-MIDDLEWARE] Response body format:', typeof ctx.response.body, Object.keys(ctx.response.body || {}));
          }
        } else {
          console.log('🎯 [GLOBAL-MIDDLEWARE] No user or company found for folder-structure filtering');
        }
      } catch (error) {
        console.error('❌ [GLOBAL-MIDDLEWARE] Error filtering folder-structure response:', error);
      }
    }
  });
  
  // Create bot folder structure
  await createCompanyFolders(strapi);
};

async function createCompanyFolders(strapi) {
  try {
    console.log('📁 Creating bot folder structure...');
    
    // Get all companies with their bots
    const companies = await strapi.entityService.findMany('api::company.company', {
      populate: ['bots']
    });
    
    // Get the highest pathId to continue from
    const folders = await strapi.entityService.findMany('plugin::upload.folder', {
      sort: { pathId: 'desc' },
      limit: 1
    });
    let nextPathId = folders.length > 0 ? folders[0].pathId + 1 : 1;
    
    for (const company of companies) {
      if (company.bots && company.bots.length > 0) {
        // Create bot folders directly at root level for easy access
        for (const bot of company.bots) {
          const botFolderPath = `/bot-${bot.id}`;
          const botFolderName = `${company.name} - ${bot.name}`;
          
          // Check if bot folder exists
          let botFolder = await strapi.entityService.findMany('plugin::upload.folder', {
            filters: { path: botFolderPath },
          limit: 1
        });
        
          if (botFolder.length === 0) {
            // Create bot folder at root level
            botFolder = await strapi.entityService.create('plugin::upload.folder', {
              data: {
                name: botFolderName,
                path: botFolderPath,
                pathId: nextPathId++,
                parent: null, // Root level folder
                company: company.id, // Set the company relation
                metadata: {
                  bot_id: bot.id,
                  company_id: company.id,
                  bot_name: bot.name,
                  company_name: company.name
                }
              }
            });
            console.log(`✅ Created folder: ${botFolderName}`);
            
            // Update bot with folder info
            await strapi.entityService.update('api::bot.bot', bot.id, {
              data: {
                folder_id: botFolder.id,
                folder_path: botFolderPath
              }
            });
          }
        }
      }
    }
    
    console.log('✅ Bot folder structure created');
  } catch (error) {
    console.error('❌ Error creating bot folders:', error);
  }
}
