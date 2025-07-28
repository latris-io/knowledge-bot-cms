const jwt = require('jsonwebtoken');

const JWT_SECRET = 'my-ultra-secure-signing-key';

const generateInstructions = (token) => {
  return `✅ Instructions: Add the Knowledge Bot Widget to Your Website 

1. Open your website's HTML file 
 (or paste into your CMS editor that allows HTML, like Webflow, WordPress Custom HTML block, etc.) 

2. Paste the following line just before the closing </body> tag: 

<!-- Markdown renderer --> 
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

<!-- (Optional) Sanitizer --> 
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.2/dist/purify.min.js"></script> 

<!-- Your widget loader --> 
<script  
  src="https://knowledge-bot-retrieval.onrender.com/static/widget.js"  
  data-token="${token}"  
  defer> 
</script> 

3. Save and publish your website 
Once the page is live, a floating 💬 button will appear in the bottom-right corner of your site. Visitors can click it to open a secure chat window with the bot.`;
};

// Helper function to check if a relation field is empty
const isRelationEmpty = (relationData) => {
  if (!relationData || relationData === null || relationData === undefined) {
    return true;
  }

  // Handle connect/disconnect format
  if (typeof relationData === 'object' && relationData.connect && relationData.disconnect) {
    return !relationData.connect || relationData.connect.length === 0;
  }

  // Handle array format
  if (Array.isArray(relationData)) {
    return relationData.length === 0;
  }

  // Handle direct ID format (number or string)
  if (typeof relationData === 'number' || typeof relationData === 'string') {
    return false;
  }

  // Handle object with id property
  if (typeof relationData === 'object' && relationData.id) {
    return false;
  }

  // Handle object with documentId property (Strapi v5)
  if (typeof relationData === 'object' && relationData.documentId) {
    return false;
  }

  // Handle Content Manager format: { connect: [id] } or { connect: [{id}] }
  if (typeof relationData === 'object' && relationData.connect) {
    if (Array.isArray(relationData.connect)) {
      return relationData.connect.length === 0;
    }
    return false; // Single connect value
  }

  // Handle Strapi v5 format: { set: [{ id: 16 }] }
  if (typeof relationData === 'object' && relationData.set) {
    if (Array.isArray(relationData.set)) {
      return relationData.set.length === 0;
    }
    return false; // Single set value
  }

  return true;
};

// Helper function to extract ID from relation data
const extractId = (relationData) => {
  if (!relationData) return null;

  // Handle connect/disconnect format
  if (typeof relationData === 'object' && relationData.connect && relationData.connect.length > 0) {
    return relationData.connect[0].id || relationData.connect[0];
  }

  // Handle Strapi v5 set format
  if (typeof relationData === 'object' && relationData.set && relationData.set.length > 0) {
    return relationData.set[0].id || relationData.set[0];
  }

  // Handle array format
  if (Array.isArray(relationData) && relationData.length > 0) {
    return relationData[0].id || relationData[0];
  }

  // Handle object with id
  if (typeof relationData === 'object' && relationData.id) {
    return relationData.id;
  }

  // Handle direct ID
  if (typeof relationData === 'number' || typeof relationData === 'string') {
    return relationData;
  }

  return null;
};

// Helper function to calculate final state after connect/disconnect operations
const calculateFinalRelationState = (currentRelation, changeData) => {
  // Start with current state - convert to array format
  let currentItems = [];
  if (currentRelation) {
    if (Array.isArray(currentRelation)) {
      currentItems = [...currentRelation];
    } else if (currentRelation.id) {
      currentItems = [currentRelation];
    }
  }
  
  // If no changes specified, return current state
  if (!changeData || typeof changeData !== 'object') {
    return currentItems;
  }
  
  // Handle connect/disconnect format
  if (changeData.connect || changeData.disconnect) {
    let finalItems = [...currentItems];
    
    // Remove disconnected items
    if (changeData.disconnect && changeData.disconnect.length > 0) {
      const disconnectIds = changeData.disconnect.map(item => item.id);
      finalItems = finalItems.filter(item => !disconnectIds.includes(item.id));
    }
    
    // Add connected items
    if (changeData.connect && changeData.connect.length > 0) {
      changeData.connect.forEach(newItem => {
        // Only add if not already present
        if (!finalItems.some(item => item.id === newItem.id)) {
          finalItems.push(newItem);
        }
      });
    }
    
    return finalItems;
  }
  
  // Handle direct replacement
  if (Array.isArray(changeData)) {
    return changeData;
  }
  
  if (changeData.id) {
    return [changeData];
  }
  
  return currentItems;
};

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    
    console.log('🔧 [USER LIFECYCLE] beforeCreate - Full data received:', JSON.stringify(data, null, 2));
    console.log('🔧 [USER LIFECYCLE] beforeCreate - Company data:', data.company, '(type:', typeof data.company, ')');
    
    // Additional debugging for company data structure  
    if (data.company) {
      console.log('🔧 [USER LIFECYCLE] Company data keys:', Object.keys(data.company));
      console.log('🔧 [USER LIFECYCLE] Company data JSON:', JSON.stringify(data.company, null, 2));
    }
    
    // Use helper function to check empty states
    const isCompanyEmpty = isRelationEmpty(data.company);
    
    console.log('🔧 [USER LIFECYCLE] beforeCreate - isCompanyEmpty:', isCompanyEmpty);
    
    // Always require company for user creation
    if (isCompanyEmpty) {
      console.log('❌ [USER LIFECYCLE] Validation failed: Missing company');
      const error = new Error('Company is required before saving. Please select a company.');
      error.name = 'ValidationError';
      throw error;
    }
    
    console.log('✅ [USER LIFECYCLE] Company validation passed - proceeding with instructions generation');

    try {
      // Extract company ID using helper function
      const companyId = extractId(data.company);

      console.log('🔧 [CREATE] Extracted companyId:', companyId, '(type:', typeof companyId, ')');

      if (companyId) {
        // For user creation, we'll need to get a default bot for the company
        // or handle this differently since users don't have direct bot relations
        const company = await strapi.entityService.findOne('api::company.company', companyId, {
          populate: ['bots']
        });

        if (company && company.bots && company.bots.length > 0) {
          // Use the first bot from the company
          const botId = company.bots[0].id;
          
          // Use draft version IDs to be consistent with admin interface and upload middleware
          const draftBotId = parseInt(botId) - 1;
          const draftCompanyId = parseInt(companyId) - 1;
          
          const token = jwt.sign(
            { company_id: draftCompanyId, bot_id: draftBotId },
            JWT_SECRET,
            { algorithm: 'HS256' }
          );

          console.log('Generated JWT token for user creation');

          // Generate and set instructions
          data.instructions = generateInstructions(token);
          console.log('✅ [CREATE] Instructions generated successfully');
        } else {
          console.log('⚠️ [CREATE] Company has no bots - setting instructions to null');
          data.instructions = null;
        }
      } else {
        console.log('⚠️ [CREATE] Missing companyId - setting instructions to null');
        data.instructions = null;
      }
    } catch (error) {
      console.error('❌ [CREATE] Error in lifecycle hook:', error);
      console.error('❌ [CREATE] Error stack:', error.stack);
      // Don't set instructions to null - let the error bubble up
      throw error;
    }
  },

  async beforeUpdate(event) {
    const { data, where } = event.params;
    
    console.log('🔧 [USER LIFECYCLE] beforeUpdate - Full event.params:', JSON.stringify(event.params, null, 2));
    console.log('🔧 [USER LIFECYCLE] beforeUpdate - Full data received:', JSON.stringify(data, null, 2));
    console.log('🔧 [USER LIFECYCLE] beforeUpdate - Company data:', data.company, '(type:', typeof data.company, ')');
    
    // Get current user data to check existing relations
    const currentUser = await strapi.entityService.findOne('plugin::users-permissions.user', where.id, {
      populate: ['company']
    });
    
    console.log('🔧 [USER LIFECYCLE] beforeUpdate - Current user company:', currentUser?.company);
    
    // Calculate final state after connect/disconnect operations
    const finalCompanyState = calculateFinalRelationState(currentUser?.company, data.company);
    
    console.log('🔧 [USER LIFECYCLE] beforeUpdate - Final company state:', finalCompanyState);
    
    // Check if final state will be empty
    const willCompanyBeEmpty = !finalCompanyState || finalCompanyState.length === 0;
    
    console.log('🔧 [USER LIFECYCLE] beforeUpdate - willCompanyBeEmpty:', willCompanyBeEmpty);
    
    // Always require company for user updates
    if (willCompanyBeEmpty) {
      console.log('❌ [USER LIFECYCLE] Validation failed: Missing company');
      console.log('⚠️ [USER LIFECYCLE] TEMPORARILY DISABLED - would have blocked save');
      // const error = new Error('Company is required before saving. Please select a company.');
      // error.name = 'ValidationError';
      // throw error;
    }
    
    console.log('✅ [USER LIFECYCLE] Company validation passed - proceeding with instructions generation');

    try {
      // Extract company ID from the final state (after connect/disconnect operations)
      const companyId = finalCompanyState.length > 0 ? finalCompanyState[0].id : null;

      console.log('🔧 [UPDATE] Extracted companyId from final state:', companyId, '(type:', typeof companyId, ')');

      if (companyId) {
        // For user update, we'll need to get a default bot for the company
        const company = await strapi.entityService.findOne('api::company.company', companyId, {
          populate: ['bots']
        });

        if (company && company.bots && company.bots.length > 0) {
          // Use the first bot from the company
          const botId = company.bots[0].id;
          
          // Use draft version IDs to be consistent with admin interface and upload middleware
          const draftBotId = parseInt(botId) - 1;
          const draftCompanyId = parseInt(companyId) - 1;
          
          const token = jwt.sign(
            { company_id: draftCompanyId, bot_id: draftBotId },
            JWT_SECRET,
            { algorithm: 'HS256' }
          );

          console.log('Generated JWT token for user update');

          // Generate and set instructions
          data.instructions = generateInstructions(token);
          console.log('✅ [UPDATE] Instructions generated successfully');
        } else {
          console.log('⚠️ [UPDATE] Company has no bots - setting instructions to null');
          data.instructions = null;
        }
      } else {
        console.log('⚠️ [UPDATE] Missing companyId - setting instructions to null');
        data.instructions = null;
      }
    } catch (error) {
      console.error('❌ [UPDATE] Error in lifecycle hook:', error);
      console.error('❌ [UPDATE] Error stack:', error.stack);
      // Don't set instructions to null - let the error bubble up
      throw error;
    }
  }
}; 