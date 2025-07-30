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

  // Override the upload service to track file deletions ONLY
  const defaultUploadService = plugin.services.upload;
  
  plugin.services.upload = ({ strapi }) => {
    const baseService = defaultUploadService({ strapi });

    return {
      ...baseService,
      
      async remove(file) {
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
            
            // Extract required fields with fallback to null
            const botId = fileWithRelations.bot?.id || null;
            const companyId = fileWithRelations.company?.id || null;
            const userId = fileWithRelations.user?.id || null;
            
            // Only create file event if we have the required fields (schema validation)
            if (botId && companyId && userId) {
              const eventData = {
                event_type: 'deleted',
                file_document_id: fileWithRelations.documentId || fileWithRelations.id.toString(),
                file_name: fileWithRelations.name,
                file_type: fileWithRelations.mime,
                file_size: fileSizeInBytes,
                processing_status: 'completed', // Deleted files are considered "completed"
                processed: false,
                bot_id: botId,
                company_id: companyId,
                user_id: userId,
                publishedAt: new Date().toISOString(),
              };
              
              console.log('📝 Creating file event (deleted) with data:', eventData);
              await strapi.entityService.create('api::file-event.file-event', {
                data: eventData,
              });
              console.log(`✅ File event (deleted) logged for file ${fileId}`);
            } else {
              console.log(`⚠️ Skipping file event creation - missing required fields: bot_id=${botId}, company_id=${companyId}, user_id=${userId}`);
              console.log(`   This file was likely uploaded before the upload middleware was working correctly.`);
            }
          } else {
            console.log(`⚠️ Could not find file with ID ${fileId} for deletion tracking`);
          }
        } catch (eventError) {
          console.error('❌ Failed to log file deletion event:', eventError);
        }
        
        // Call the original remove method
        return baseService.remove(file);
      },
    };
  };

  return plugin;
}; 