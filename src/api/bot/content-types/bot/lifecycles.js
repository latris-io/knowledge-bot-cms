'use strict';

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Use the same secret as the widget
const JWT_SECRET = process.env.WIDGET_JWT_SECRET || 'my-ultra-secure-signing-key';

console.log('🔌 [BOT LIFECYCLE] Module loaded with JWT_SECRET:', JWT_SECRET ? 'SET' : 'NOT SET');

module.exports = {
  beforeCreate(event) {
    console.log('🎯 [BOT LIFECYCLE] beforeCreate triggered!');
    console.log('📦 [BOT LIFECYCLE] Event data:', JSON.stringify(event.params.data, null, 2));
    
    const { data } = event.params;
    
    // Generate a unique bot_id if not provided
    if (!data.bot_id) {
      data.bot_id = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🆔 [BOT LIFECYCLE] Generated bot_id:', data.bot_id);
    }
    
    // Extract company ID (handle different formats)
    let companyId;
    if (typeof data.company === 'object' && data.company.set && data.company.set[0]) {
      companyId = data.company.set[0].id;
      console.log('📍 [BOT LIFECYCLE] Company ID from set format:', companyId);
    } else if (typeof data.company === 'object' && data.company.connect && data.company.connect[0]) {
      companyId = data.company.connect[0].id;
      console.log('📍 [BOT LIFECYCLE] Company ID from connect format:', companyId);
    } else if (typeof data.company === 'object' && data.company.id) {
      companyId = data.company.id;
      console.log('📍 [BOT LIFECYCLE] Company ID from object.id:', companyId);
    } else if (typeof data.company === 'number' || typeof data.company === 'string') {
      companyId = data.company;
      console.log('📍 [BOT LIFECYCLE] Company ID from direct value:', companyId);
    }
    
    // Generate JWT token if we have a company
    if (companyId) {
      console.log('🔐 [BOT LIFECYCLE] Creating JWT with payload:', { company_id: companyId, bot_id: data.bot_id });
      
      try {
        // Generate JWT token with company_id and bot_id
        const token = jwt.sign(
          { 
            company_id: companyId,
          bot_id: data.bot_id
          },
          JWT_SECRET,
          { algorithm: 'HS256' }
        );
        
        console.log('✅ [BOT LIFECYCLE] JWT token generated successfully');
        console.log('🔐 [BOT LIFECYCLE] Token preview:', token.substring(0, 50) + '...');
        
        // Create widget installation instructions
        const instructions = `
<!-- Knowledge Bot Widget Installation -->
<!-- Place this code just before the closing </body> tag -->

<!-- Dependencies -->
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@2.3.8/dist/purify.min.js"></script>

<!-- Widget Script -->
<script src="https://your-widget-domain.com/widget.js"></script>

<!-- Initialize Widget -->
<script>
  KnowledgeBotWidget.init({
    token: '${token}'
  });
</script>

<!-- Widget Trigger Button (optional - widget can also be triggered programmatically) -->
<button onclick="KnowledgeBotWidget.toggle()">Open Knowledge Bot</button>

<!-- Installation Notes -->
<!--
1. Replace 'https://your-widget-domain.com/widget.js' with your actual widget URL
2. The token is unique to your bot and company - keep it secure
3. You can customize the trigger button or use KnowledgeBotWidget.open() / .close() programmatically
4. For Webflow: Add this code to your site's custom code section
5. For WordPress: Use a plugin like "Insert Headers and Footers" or add to your theme
6. For other platforms: Add to your site's HTML template before </body>
-->
`;
        
        // Store the JWT token and instructions
        data.jwt_token = token;
        data.instructions = instructions;
        
        console.log('✅ [BOT LIFECYCLE] beforeCreate completed');
      } catch (error) {
        console.error('❌ [BOT LIFECYCLE] Error generating JWT token:', error);
      }
    }
  },

  beforeUpdate(event) {
    console.log('🎯 [BOT LIFECYCLE] beforeUpdate triggered!');
    const { data } = event.params;
    
    // Only regenerate JWT if company changes or if JWT is missing
    if (data.company || !event.params.where.jwt_token) {
      console.log('🔧 [BOT LIFECYCLE] beforeUpdate - Regenerating JWT token');
      
      // Extract company ID (handle different formats)
      let companyId;
      if (typeof data.company === 'object' && data.company.set && data.company.set[0]) {
        companyId = data.company.set[0].id;
        console.log('📍 [BOT LIFECYCLE] Company ID from set format:', companyId);
      } else if (typeof data.company === 'object' && data.company.connect && data.company.connect[0]) {
        companyId = data.company.connect[0].id;
        console.log('📍 [BOT LIFECYCLE] Company ID from connect format:', companyId);
      } else if (typeof data.company === 'object' && data.company.id) {
        companyId = data.company.id;
        console.log('📍 [BOT LIFECYCLE] Company ID from object.id:', companyId);
      } else if (typeof data.company === 'number' || typeof data.company === 'string') {
        companyId = data.company;
        console.log('📍 [BOT LIFECYCLE] Company ID from direct value:', companyId);
      }
      
      if (companyId && data.bot_id) {
        try {
          // Create token payload with only company_id and bot_id
          const tokenPayload = {
            company_id: parseInt(companyId),
            bot_id: data.bot_id
          };
          
          console.log('🔐 [BOT LIFECYCLE] Creating JWT with payload:', tokenPayload);
          
          // Sign the token without timestamp
          const token = jwt.sign(tokenPayload, JWT_SECRET, { 
            algorithm: 'HS256',
            noTimestamp: true 
          });
          
          data.jwt_token = token;
          console.log('✅ [BOT LIFECYCLE] JWT token regenerated successfully');
        } catch (error) {
          console.error('❌ [BOT LIFECYCLE] Error generating JWT token:', error);
        }
      }
    }
  },

  async afterCreate(event) {
    const { result } = event;
    
    // Add a small delay to prevent database lock issues
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      console.log(`🤖 [BOT LIFECYCLE] Creating folder for bot: ${result.name} (ID: ${result.id})`);
      
      // Get the bot with its company relation
      const botWithCompany = await strapi.entityService.findOne('api::bot.bot', result.id, {
        populate: ['company']
      });
      
      if (!botWithCompany?.company) {
        console.warn(`⚠️ [BOT LIFECYCLE] Bot ${result.id} has no company assigned`);
        return;
      }
      
      const company = botWithCompany.company;
      const botFolderPath = `/bot-${result.id}`;
      const botFolderName = `${result.name} (${company.name})`;
      
      console.log(`📁 [BOT LIFECYCLE] Creating folder with:`, {
        companyId: company.id,
        companyName: company.name,
        botId: result.id,
        botName: result.name,
        folderPath: botFolderPath
      });
      
      // Debug: Check company object structure
      console.log(`🔍 [BOT LIFECYCLE] Company object:`, JSON.stringify(company, null, 2));
      
      // Check if bot folder already exists
      const existingBotFolders = await strapi.entityService.findMany('plugin::upload.folder', {
        filters: { path: botFolderPath },
        limit: 1
      });
      
      if (existingBotFolders.length === 0) {
        try {
          // Get the highest pathId
          const folders = await strapi.entityService.findMany('plugin::upload.folder', {
            sort: { pathId: 'desc' },
            limit: 1
          });
          const nextPathId = folders.length > 0 ? folders[0].pathId + 1 : 1;
          
          // Create bot folder at root level
          const botFolder = await strapi.entityService.create('plugin::upload.folder', {
            data: {
              name: botFolderName,
              path: botFolderPath,
              pathId: nextPathId,
              parent: null, // Root level folder
              metadata: {
                bot_id: result.id,
                company_id: company.id,
                bot_name: result.name,
                company_name: company.name
              }
            }
          });
          
          // Update folder with company relation using db.query
          await strapi.db.query('plugin::upload.folder').update({
            where: { id: botFolder.id },
            data: { company: company.id }
          });
          
          console.log(`✅ [BOT LIFECYCLE] Created folder: ${botFolderName} with company ID: ${company.id}`);
          
          // Update the bot with the folder reference - wrap in try-catch to prevent crash
          try {
          await strapi.entityService.update('api::bot.bot', result.id, {
            data: {
              folder_id: botFolder.id,
              folder_path: botFolderPath
            }
          });
          } catch (updateError) {
            console.error(`⚠️ [BOT LIFECYCLE] Failed to update bot with folder info:`, updateError);
            // Don't throw - bot is created, folder is created, just the reference update failed
          }
        } catch (folderError) {
          console.error(`❌ [BOT LIFECYCLE] Error creating folder:`, folderError);
          // Don't throw - bot creation should not fail due to folder issues
        }
      } else {
        console.log(`📁 [BOT LIFECYCLE] Folder already exists at ${botFolderPath}`);
      }
    } catch (error) {
      console.error(`❌ [BOT LIFECYCLE] Error in afterCreate for bot ${result.id}:`, error);
      // Don't throw - prevent system crash
    }
  },
  
  async afterUpdate(event) {
    const { result } = event;
    
    try {
      // If bot name changed, update the folder name
      const botWithCompany = await strapi.entityService.findOne('api::bot.bot', result.id, {
        populate: ['company']
      });
      
      if (botWithCompany?.company) {
        const botFolderPath = `/bot-${result.id}`;
        const newFolderName = `${result.name} (${botWithCompany.company.name})`;
        
        const botFolders = await strapi.entityService.findMany('plugin::upload.folder', {
          filters: { path: botFolderPath },
          limit: 1
        });
        
        if (botFolders.length > 0 && botFolders[0].name !== newFolderName) {
          await strapi.entityService.update('plugin::upload.folder', botFolders[0].id, {
            data: {
              name: newFolderName,
              metadata: {
                bot_id: result.id,
                company_id: botWithCompany.company.id,
                bot_name: result.name,
                company_name: botWithCompany.company.name
              }
            }
          });
          console.log(`✏️ [BOT LIFECYCLE] Updated folder name to: ${newFolderName}`);
        }
      }
    } catch (error) {
      console.error(`❌ [BOT LIFECYCLE] Error updating folder for bot ${result.id}:`, error);
    }
  },
  
  async beforeDelete(event) {
    const { where } = event.params;
    
    try {
      console.log(`🗑️ [BOT LIFECYCLE] Checking if bot ${where.id} can be deleted`);
      
      // Get the bot to find its folder
      const bot = await strapi.entityService.findOne('api::bot.bot', where.id, {
        populate: ['company', 'files']
      });
      
      if (bot) {
        const botFolderPath = `/bot-${where.id}`;
        
        // Find the bot's folder
        const botFolders = await strapi.entityService.findMany('plugin::upload.folder', {
          filters: { path: botFolderPath },
          limit: 1
        });
        
        if (botFolders.length > 0) {
          const folder = botFolders[0];
          
          // Check if there are files in the folder
          const filesInFolder = await strapi.entityService.findMany('plugin::upload.file', {
            filters: { folder: folder.id }
          });
          
          if (filesInFolder.length > 0) {
            // Prevent deletion if files exist
            console.log(`❌ [BOT LIFECYCLE] Cannot delete bot - folder contains ${filesInFolder.length} file(s)`);
            
            // Create a more descriptive error message
            const fileList = filesInFolder.slice(0, 3).map(f => f.name).join(', ');
            const moreFiles = filesInFolder.length > 3 ? ` and ${filesInFolder.length - 3} more` : '';
            
            const error = new Error(
              `Cannot delete bot "${bot.name}" because its folder contains ${filesInFolder.length} file(s): ${fileList}${moreFiles}. ` +
              `Please delete or move all files from the bot's folder before deleting the bot.`
            );
            error.name = 'ValidationError';
            throw error;
            
          } else {
            // Delete empty folder
            await strapi.entityService.delete('plugin::upload.folder', folder.id);
            console.log(`✅ [BOT LIFECYCLE] Deleted empty folder: ${botFolderPath}`);
          }
        } else {
          console.log(`📁 [BOT LIFECYCLE] No folder found for bot ${where.id}`);
        }
      }
    } catch (error) {
      // Re-throw the error to prevent bot deletion
      if (error.name === 'ValidationError') {
        throw error;
      }
      console.error(`❌ [BOT LIFECYCLE] Error handling bot deletion ${where.id}:`, error);
    }
  }
};

/**
 * Ensure folder structure exists for a bot
 */
async function ensureBotFolderStructure(strapi, bot) {
  try {
    const companyFolderPath = `/companies/${bot.company.company_id || bot.company.id}`;
    const botFolderPath = `${companyFolderPath}/bots/${bot.bot_id || bot.id}`;
    
    // Check if bot folder already exists
    const existingBotFolder = await strapi.entityService.findMany('plugin::upload.folder', {
      filters: { path: botFolderPath },
      limit: 1
    });
    
    if (existingBotFolder.length > 0) {
      console.log('📁 Bot folder already exists:', botFolderPath);
      return;
    }
    
    // Ensure company structure exists first
    let companyFolder = await strapi.entityService.findMany('plugin::upload.folder', {
      filters: { path: companyFolderPath },
      limit: 1
    });
    
    if (companyFolder.length === 0) {
      // Create companies root if needed
      let companiesFolder = await strapi.entityService.findMany('plugin::upload.folder', {
        filters: { path: '/companies' },
        limit: 1
      });
      
      if (companiesFolder.length === 0) {
        const folders = await strapi.entityService.findMany('plugin::upload.folder', {
          sort: { pathId: 'desc' },
          limit: 1
        });
        const nextPathId = folders.length > 0 ? folders[0].pathId + 1 : 1;
        
        companiesFolder = await strapi.entityService.create('plugin::upload.folder', {
          data: {
            name: 'Companies',
            path: '/companies',
            pathId: nextPathId
          }
        });
      } else {
        companiesFolder = companiesFolder[0];
      }
      
      // Create company folder
      const folders = await strapi.entityService.findMany('plugin::upload.folder', {
        sort: { pathId: 'desc' },
        limit: 1
      });
      const nextPathId = folders.length > 0 ? folders[0].pathId + 1 : 1;
      
      companyFolder = await strapi.entityService.create('plugin::upload.folder', {
        data: {
          name: `Company: ${bot.company.name}`,
          path: companyFolderPath,
          pathId: nextPathId,
          parent: companiesFolder.id,
          company: bot.company.id  // Associate folder with company
        }
      });
    } else {
      companyFolder = companyFolder[0];
    }
    
    // Create bots folder if needed
    let botsFolder = await strapi.entityService.findMany('plugin::upload.folder', {
      filters: { path: `${companyFolderPath}/bots` },
      limit: 1
    });
    
    if (botsFolder.length === 0) {
      const folders = await strapi.entityService.findMany('plugin::upload.folder', {
        sort: { pathId: 'desc' },
        limit: 1
      });
      const nextPathId = folders.length > 0 ? folders[0].pathId + 1 : 1;
      
      botsFolder = await strapi.entityService.create('plugin::upload.folder', {
        data: {
          name: 'Bots',
          path: `${companyFolderPath}/bots`,
          pathId: nextPathId,
          parent: companyFolder.id,
          company: bot.company.id  // Associate folder with company
        }
      });
    } else {
      botsFolder = botsFolder[0];
    }
    
    // Create bot folder
    const folders = await strapi.entityService.findMany('plugin::upload.folder', {
      sort: { pathId: 'desc' },
      limit: 1
    });
    const nextPathId = folders.length > 0 ? folders[0].pathId + 1 : 1;
    
    await strapi.entityService.create('plugin::upload.folder', {
      data: {
        name: `Bot: ${bot.name}`,
        path: botFolderPath,
        pathId: nextPathId,
        parent: botsFolder.id,
        company: bot.company.id  // Associate folder with company
      }
    });
    
    console.log(`📁 Created bot folder: ${botFolderPath}`);
  } catch (error) {
    console.error('🔴 Error ensuring bot folder structure:', error);
  }
}