'use strict';

module.exports = {
  // Before creating a new preference
  async beforeCreate(event) {
    const { data } = event.params;
    
    if (data.user) {
      try {
        // Extract user ID from connect structure
        let userId;
        if (data.user.connect && data.user.connect.length > 0) {
          userId = data.user.connect[0].id;
        } else {
          userId = data.user;
        }
        
        const userRecord = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
          fields: ['email']
        });
        
        if (userRecord && userRecord.email) {
          data.email = userRecord.email;
        }
      } catch (error) {
        console.error('Error fetching user email in beforeCreate:', error);
      }
    }
  },

  // Before updating a preference
  async beforeUpdate(event) {
    const { data } = event.params;
    
    if (data.user) {
      try {
        // Extract user ID from connect structure
        let userId;
        if (data.user.connect && data.user.connect.length > 0) {
          userId = data.user.connect[0].id;
        } else {
          userId = data.user;
        }
        
        const userRecord = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
          fields: ['email']
        });
        
        if (userRecord && userRecord.email) {
          data.email = userRecord.email;
        }
      } catch (error) {
        console.error('Error fetching user email in beforeUpdate:', error);
      }
    }
  }
}; 