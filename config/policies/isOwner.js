'use strict';

module.exports = async (policyContext, config, { strapi }) => {
  const { user } = policyContext.state;
  const { id } = policyContext.params;
  
  if (!user || !id) {
    return false;
  }
  
  // Check if user is admin
  const isAdmin = user.roles?.some(role => 
    role.code === 'strapi-super-admin' || role.code === 'strapi-editor'
  );
  
  if (isAdmin) {
    return true; // Admins can access all files
  }
  
  // For standard users, check if they own the file
  try {
    const file = await strapi.entityService.findOne('plugin::upload.file', id, {
      populate: ['createdBy']
    });
    
    return file && file.createdBy && file.createdBy.id === user.id;
  } catch (error) {
    strapi.log.error('Error in isOwner policy:', error);
    return false;
  }
}; 