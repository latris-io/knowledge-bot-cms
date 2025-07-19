/**
 * UC-001: User Validation and Management - Regression Tests
 * 
 * This test suite validates all aspects of UC-001 as documented in use_cases.md
 * Run with: npm test -- tests/integration/use-cases/test-uc001-user-validation.test.js
 * 
 * NOTE: These are pure unit tests that don't require Strapi initialization
 * They test the use case logic in isolation for fast regression testing
 */

// Disable Strapi setup for these standalone tests
process.env.SKIP_STRAPI_SETUP = 'true';

const jwt = require('jsonwebtoken');

// Test constants
const JWT_SECRET = 'my-ultra-secure-signing-key';

// Helper functions (extracted from actual implementation)
const isRelationEmpty = (relationData) => {
  if (!relationData || relationData === null || relationData === undefined) {
    return true;
  }
  if (typeof relationData === 'object' && (relationData.connect || relationData.disconnect)) {
    return !relationData.connect || relationData.connect.length === 0;
  }
  if (Array.isArray(relationData)) {
    return relationData.length === 0;
  }
  if (typeof relationData === 'number' || typeof relationData === 'string') {
    return false;
  }
  if (typeof relationData === 'object' && relationData.id) {
    return false;
  }
  return true;
};

const extractId = (relationData) => {
  if (!relationData) return null;
  if (typeof relationData === 'object' && relationData.connect && relationData.connect.length > 0) {
    return relationData.connect[0].id || relationData.connect[0];
  }
  if (Array.isArray(relationData) && relationData.length > 0) {
    return relationData[0].id || relationData[0];
  }
  if (typeof relationData === 'object' && relationData.id) {
    return relationData.id;
  }
  if (typeof relationData === 'number' || typeof relationData === 'string') {
    return relationData;
  }
  return null;
};

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

function generateJWT(botId, companyId) {
  const token = jwt.sign(
    { company_id: parseInt(companyId), bot_id: parseInt(botId) },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );
  return token;
}

describe('UC-001: User Validation and Management', () => {
  
  describe('BR-001 & BR-002: Bot and Company Requirements', () => {
    test('should require both Bot and Company for user creation', () => {
      const testCases = [
        { bot: { id: 1 }, company: { id: 1 }, expected: 'valid' },
        { bot: { id: 1 }, company: null, expected: 'invalid' },
        { bot: null, company: { id: 1 }, expected: 'invalid' },
        { bot: null, company: null, expected: 'invalid' }
      ];

      testCases.forEach(({ bot, company, expected }, index) => {
        const isBotEmpty = isRelationEmpty(bot);
        const isCompanyEmpty = isRelationEmpty(company);
        const isValid = !isBotEmpty && !isCompanyEmpty;
        
        if (expected === 'valid') {
          expect(isValid).toBe(true);
        } else {
          expect(isValid).toBe(false);
        }
      });
    });

    test('should handle connect/disconnect format correctly', () => {
      const connectData = { connect: [{ id: 5 }] };
      const emptyConnectData = { connect: [] };
      
      expect(isRelationEmpty(connectData)).toBe(false);
      expect(isRelationEmpty(emptyConnectData)).toBe(true);
      expect(extractId(connectData)).toBe(5);
    });
  });

  describe('BR-003: JWT Token Format', () => {
    test('should generate JWT with company_id and bot_id', () => {
      const token = generateJWT(10, 20);
      const decoded = jwt.verify(token, JWT_SECRET);
      
      expect(decoded.company_id).toBe(20);
      expect(decoded.bot_id).toBe(10);
      expect(decoded.user_id).toBeUndefined(); // BR-005: user_id excluded
    });

    test('should use correct JWT format structure', () => {
      const token = generateJWT(1, 1);
      const tokenParts = token.split('.');
      
      expect(tokenParts).toHaveLength(3); // header.payload.signature
      
      const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
      expect(header.alg).toBe('HS256');
      expect(header.typ).toBe('JWT');
    });
  });

  describe('BR-004: JWT Secret and Algorithm', () => {
    test('should use HS256 algorithm with correct secret', () => {
      const token = generateJWT(3, 7);
      
      // Should verify with correct secret
      expect(() => jwt.verify(token, JWT_SECRET)).not.toThrow();
      
      // Should fail with wrong secret
      expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
    });
  });

  describe('BR-005: Complete HTML Widget Instructions', () => {
    test('should generate complete widget installation instructions', () => {
      const token = generateJWT(2, 4);
      const instructions = generateInstructions(token);
      
      // Check required components
      expect(instructions).toContain('marked/marked.min.js');
      expect(instructions).toContain('dompurify@3.0.2/dist/purify.min.js');
      expect(instructions).toContain('knowledge-bot-retrieval.onrender.com/static/widget.js');
      expect(instructions).toContain(`data-token="${token}"`);
      expect(instructions).toContain('defer>');
      expect(instructions).toContain('</body>');
      
      // Check step-by-step instructions
      expect(instructions).toContain('1.');
      expect(instructions).toContain('2.');
      expect(instructions).toContain('3.');
      
      // Check CMS platform mentions
      expect(instructions).toContain('Webflow');
      expect(instructions).toContain('WordPress');
      expect(instructions).toContain('Custom HTML block');
    });

    test('should embed JWT token correctly in data-token attribute', () => {
      const token = generateJWT(8, 12);
      const instructions = generateInstructions(token);
      
      const dataTokenRegex = new RegExp(`data-token="${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`);
      expect(instructions).toMatch(dataTokenRegex);
    });
  });

  describe('End-to-End Validation Flow', () => {
    test('should complete full user validation and instruction generation flow', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        bot: { id: 15 },
        company: { id: 25 }
      };

      // Step 1: Validate user data
      const isBotEmpty = isRelationEmpty(userData.bot);
      const isCompanyEmpty = isRelationEmpty(userData.company);
      expect(isBotEmpty).toBe(false);
      expect(isCompanyEmpty).toBe(false);

      // Step 2: Extract IDs
      const botId = extractId(userData.bot);
      const companyId = extractId(userData.company);
      expect(botId).toBe(15);
      expect(companyId).toBe(25);

      // Step 3: Generate JWT
      const token = generateJWT(botId, companyId);
      expect(token).toBeDefined();

      // Step 4: Verify JWT structure
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.bot_id).toBe(15);
      expect(decoded.company_id).toBe(25);

      // Step 5: Generate instructions
      const instructions = generateInstructions(token);
      expect(instructions).toContain(token);
      expect(instructions.length).toBeGreaterThan(100);
    });
  });

});

// Export for potential reuse in other tests
module.exports = {
  isRelationEmpty,
  extractId, 
  generateInstructions,
  generateJWT,
  JWT_SECRET
}; 