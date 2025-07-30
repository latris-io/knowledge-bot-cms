'use strict';

/**
 * company controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::company.company', ({ strapi }) => ({
  // 🛡️ SECURE MULTI-TENANT: Company uniqueness validation endpoint  
  // Accessible via GET /api/companies/validate-unique?name=CompanyName
  async validateUnique(ctx) {
    try {
      const { name } = ctx.query;
      const nameStr = String(name || '');
      
      if (!nameStr.trim()) {
        return ctx.badRequest('Company name is required');
      }

      const trimmedName = nameStr.trim();
      console.log(`🔍 [SECURITY] Validating company uniqueness: "${trimmedName}"`);

      // Check if company with this name already exists (case-insensitive)
      const existingCompany = await strapi.entityService.findMany('api::company.company', {
        filters: {
          name: {
            $eqi: trimmedName // Case-insensitive equals
          }
        },
        limit: 1
      });

      const isUnique = !existingCompany || existingCompany.length === 0;
      
      if (isUnique) {
        console.log(`✅ [SECURITY] Company name "${trimmedName}" is unique`);
      } else {
        console.log(`❌ [SECURITY] Company name "${trimmedName}" already exists`);
      }

      ctx.body = {
        isUnique,
        message: isUnique 
          ? 'Company name is available' 
          : 'A company with this name already exists'
      };
    } catch (error) {
      console.error('❌ [SECURITY] Company uniqueness validation error:', error);
      ctx.internalServerError('Unable to validate company name');
    }
  }
}));
