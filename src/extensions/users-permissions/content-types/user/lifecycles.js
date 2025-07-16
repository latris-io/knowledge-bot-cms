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

  // Handle direct ID format
  if (typeof relationData === 'number' || typeof relationData === 'string') {
    return false;
  }

  // Handle object with id property
  if (typeof relationData === 'object' && relationData.id) {
    return false;
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
    console.log('🔧 [USER LIFECYCLE] beforeCreate - Bot data:', data.bot, '(type:', typeof data.bot, ')');
    console.log('🔧 [USER LIFECYCLE] beforeCreate - Company data:', data.company, '(type:', typeof data.company, ')');
    
    // Use helper function to check empty states
    const isBotEmpty = isRelationEmpty(data.bot);
    const isCompanyEmpty = isRelationEmpty(data.company);
    
    console.log('🔧 [USER LIFECYCLE] beforeCreate - isBotEmpty:', isBotEmpty);
    console.log('🔧 [USER LIFECYCLE] beforeCreate - isCompanyEmpty:', isCompanyEmpty);
    
    // Always require bot and company for user creation
    if (isBotEmpty || isCompanyEmpty) {
      console.log('❌ [USER LIFECYCLE] Validation failed: Missing bot or company');
      const error = new Error('Bot and Company are required before saving. Please select both fields.');
      error.name = 'ValidationError';
      throw error;
    }
    
    console.log('✅ [USER LIFECYCLE] Bot and Company validation passed - proceeding with instructions generation');

    try {
      // Extract IDs using helper function
      const botId = extractId(data.bot);
      const companyId = extractId(data.company);

      console.log('🔧 [CREATE] Extracted botId:', botId, '(type:', typeof botId, ')');
      console.log('🔧 [CREATE] Extracted companyId:', companyId, '(type:', typeof companyId, ')');

      if (botId && companyId) {
        // Generate JWT token
        const token = jwt.sign(
          { company_id: parseInt(companyId), bot_id: parseInt(botId) },
          JWT_SECRET,
          { algorithm: 'HS256' }
        );

        console.log('🔧 [CREATE] Generated JWT token:', token);

        // Generate and set instructions
        data.instructions = generateInstructions(token);
        console.log('✅ [CREATE] Instructions generated successfully');
      } else {
        console.log('⚠️ [CREATE] Missing botId or companyId - setting instructions to null');
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
    console.log('🔧 [USER LIFECYCLE] beforeUpdate - Bot data:', data.bot, '(type:', typeof data.bot, ')');
    console.log('🔧 [USER LIFECYCLE] beforeUpdate - Company data:', data.company, '(type:', typeof data.company, ')');
    
    // Get current user data to check existing relations
    const currentUser = await strapi.entityService.findOne('plugin::users-permissions.user', where.id, {
      populate: ['bot', 'company']
    });
    
    console.log('🔧 [USER LIFECYCLE] beforeUpdate - Current user bot:', currentUser?.bot);
    console.log('🔧 [USER LIFECYCLE] beforeUpdate - Current user company:', currentUser?.company);
    
    // Calculate final state after connect/disconnect operations
    const finalBotState = calculateFinalRelationState(currentUser?.bot, data.bot);
    const finalCompanyState = calculateFinalRelationState(currentUser?.company, data.company);
    
    console.log('🔧 [USER LIFECYCLE] beforeUpdate - Final bot state:', finalBotState);
    console.log('🔧 [USER LIFECYCLE] beforeUpdate - Final company state:', finalCompanyState);
    
    // Check if final state will be empty
    const willBotBeEmpty = !finalBotState || finalBotState.length === 0;
    const willCompanyBeEmpty = !finalCompanyState || finalCompanyState.length === 0;
    
    console.log('🔧 [USER LIFECYCLE] beforeUpdate - willBotBeEmpty:', willBotBeEmpty);
    console.log('🔧 [USER LIFECYCLE] beforeUpdate - willCompanyBeEmpty:', willCompanyBeEmpty);
    
    // Always require bot and company for user updates
    if (willBotBeEmpty || willCompanyBeEmpty) {
      console.log('❌ [USER LIFECYCLE] Validation failed: Missing bot or company');
      const error = new Error('Bot and Company are required before saving. Please select both fields.');
      error.name = 'ValidationError';
      throw error;
    }
    
    console.log('✅ [USER LIFECYCLE] Bot and Company validation passed - proceeding with instructions generation');

    try {
      // Extract IDs from the final state (after connect/disconnect operations)
      const botId = finalBotState.length > 0 ? finalBotState[0].id : null;
      const companyId = finalCompanyState.length > 0 ? finalCompanyState[0].id : null;

      console.log('🔧 [UPDATE] Extracted botId from final state:', botId, '(type:', typeof botId, ')');
      console.log('🔧 [UPDATE] Extracted companyId from final state:', companyId, '(type:', typeof companyId, ')');

      if (botId && companyId) {
        // Generate JWT token
        const token = jwt.sign(
          { company_id: parseInt(companyId), bot_id: parseInt(botId) },
          JWT_SECRET,
          { algorithm: 'HS256' }
        );

        console.log('🔧 [UPDATE] Generated JWT token:', token);

        // Generate and set instructions
        data.instructions = generateInstructions(token);
        console.log('✅ [UPDATE] Instructions generated successfully');
      } else {
        console.log('⚠️ [UPDATE] Missing botId or companyId - setting instructions to null');
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