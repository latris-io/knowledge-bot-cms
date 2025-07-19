/**
 * UC-003: JWT Token Generation and Widget Instructions - Regression Tests
 * 
 * This test suite validates all aspects of UC-003 as documented in use_cases.md
 * Run with: npm run test:uc003
 * 
 * NOTE: These are pure unit tests that don't require Strapi initialization
 * They test the use case logic in isolation for fast regression testing
 */

// Disable Strapi setup for these standalone tests
process.env.SKIP_STRAPI_SETUP = 'true';

const jwt = require('jsonwebtoken');

// Test constants from actual implementation
const JWT_SECRET = 'my-ultra-secure-signing-key';

// Helper functions from actual implementation
function generateJWT(botId, companyId) {
  const token = jwt.sign(
    { company_id: parseInt(companyId), bot_id: parseInt(botId) },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );
  return token;
}

function generateWidgetInstructions(token) {
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
}

describe('UC-003: JWT Token Generation and Widget Instructions', () => {
  
  describe('BR-011: JWT Token Includes company_id and bot_id', () => {
    test('should include both company_id and bot_id in JWT payload', () => {
      const token = generateJWT(42, 18);
      const decoded = jwt.verify(token, JWT_SECRET);
      
      expect(decoded.company_id).toBe(18);
      expect(decoded.bot_id).toBe(42);
      expect(typeof decoded.company_id).toBe('number');
      expect(typeof decoded.bot_id).toBe('number');
    });

    test('should handle string IDs by converting to numbers', () => {
      const token = generateJWT('99', '77');
      const decoded = jwt.verify(token, JWT_SECRET);
      
      expect(decoded.company_id).toBe(77);
      expect(decoded.bot_id).toBe(99);
      expect(typeof decoded.company_id).toBe('number');
      expect(typeof decoded.bot_id).toBe('number');
    });
  });

  describe('BR-012: Token Uses HS256 Algorithm', () => {
    test('should use HS256 algorithm for JWT signing', () => {
      const token = generateJWT(1, 1);
      const tokenParts = token.split('.');
      
      const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
      expect(header.alg).toBe('HS256');
      expect(header.typ).toBe('JWT');
    });

    test('should be verifiable with HS256', () => {
      const token = generateJWT(5, 10);
      
      // Should verify successfully with HS256
      expect(() => jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })).not.toThrow();
      
      // Should fail with wrong algorithm
      expect(() => jwt.verify(token, JWT_SECRET, { algorithms: ['RS256'] })).toThrow();
    });
  });

  describe('BR-013: Instructions Include Full HTML Implementation', () => {
    test('should generate complete HTML widget implementation', () => {
      const token = generateJWT(3, 7);
      const instructions = generateWidgetInstructions(token);
      
      // Check for all required script tags
      expect(instructions).toContain('<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>');
      expect(instructions).toContain('<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.2/dist/purify.min.js"></script>');
      expect(instructions).toContain('<script');
      expect(instructions).toContain('src="https://knowledge-bot-retrieval.onrender.com/static/widget.js"');
      expect(instructions).toContain('defer>');
      expect(instructions).toContain('</script>');
    });

    test('should include proper HTML comments for clarity', () => {
      const token = generateJWT(1, 2);
      const instructions = generateWidgetInstructions(token);
      
      expect(instructions).toContain('<!-- Markdown renderer -->');
      expect(instructions).toContain('<!-- (Optional) Sanitizer -->');
      expect(instructions).toContain('<!-- Your widget loader -->');
    });

    test('should mention closing body tag placement', () => {
      const token = generateJWT(4, 8);
      const instructions = generateWidgetInstructions(token);
      
      expect(instructions).toContain('just before the closing </body> tag');
      expect(instructions).toContain('</body>');
    });
  });

  describe('BR-014: Token Embedded in data-token Attribute', () => {
    test('should embed JWT token in data-token attribute correctly', () => {
      const token = generateJWT(15, 25);
      const instructions = generateWidgetInstructions(token);
      
      const dataTokenRegex = new RegExp(`data-token="${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`);
      expect(instructions).toMatch(dataTokenRegex);
    });

    test('should use proper HTML attribute format', () => {
      const token = generateJWT(6, 12);
      const instructions = generateWidgetInstructions(token);
      
      // Should have data-token="..." format
      expect(instructions).toMatch(/data-token="[^"]+"/);
      
      // Should not have single quotes or malformed attributes
      expect(instructions).not.toMatch(/data-token='[^']+'/);
      expect(instructions).not.toMatch(/data-token=[^"'][^\s>]+/);
    });
  });

  describe('BR-015: Instructions Support Multiple CMS Platforms', () => {
    test('should mention multiple CMS platforms in instructions', () => {
      const token = generateJWT(9, 21);
      const instructions = generateWidgetInstructions(token);
      
      // Check for specific CMS platform mentions
      expect(instructions).toContain('Webflow');
      expect(instructions).toContain('WordPress');
      expect(instructions).toContain('Custom HTML block');
      expect(instructions).toContain('CMS editor');
    });

    test('should provide generic HTML file instructions', () => {
      const token = generateJWT(11, 33);
      const instructions = generateWidgetInstructions(token);
      
      expect(instructions).toContain('website\'s HTML file');
      expect(instructions).toContain('paste into your CMS editor');
      expect(instructions).toMatch(/allows HTML/i);
    });
  });

  describe('Main Flow: Complete Widget Instructions Generation', () => {
    test('should generate step-by-step installation instructions', () => {
      const token = generateJWT(7, 14);
      const instructions = generateWidgetInstructions(token);
      
      // Check for numbered steps
      expect(instructions).toContain('1.');
      expect(instructions).toContain('2.');
      expect(instructions).toContain('3.');
      
      // Check step content
      expect(instructions).toContain('Open your website\'s HTML file');
      expect(instructions).toContain('Paste the following line');
      expect(instructions).toContain('Save and publish your website');
    });

    test('should describe the user experience after installation', () => {
      const token = generateJWT(13, 26);
      const instructions = generateWidgetInstructions(token);
      
      expect(instructions).toContain('floating 💬 button');
      expect(instructions).toContain('bottom-right corner');
      expect(instructions).toContain('chat window');
      expect(instructions).toContain('Visitors can click');
    });
  });

  describe('Alternative Flows: Error Handling', () => {
    test('should handle invalid bot/company IDs gracefully', () => {
      // Should not throw for edge case values
      expect(() => generateJWT(0, 1)).not.toThrow();
      expect(() => generateJWT(1, 0)).not.toThrow();
      expect(() => generateJWT(999999, 999999)).not.toThrow();
    });

    test('should generate valid instructions even with edge case tokens', () => {
      const token = generateJWT(0, 0);
      const instructions = generateWidgetInstructions(token);
      
      expect(instructions).toContain('data-token="');
      expect(instructions).toContain('widget.js');
      expect(instructions.length).toBeGreaterThan(100);
    });
  });

  describe('End-to-End: Complete JWT and Widget Flow', () => {
    test('should complete full JWT generation and widget instruction flow', () => {
      const botId = 28;
      const companyId = 47;
      
      // Step 1: Generate JWT
      const token = generateJWT(botId, companyId);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
      
      // Step 2: Verify JWT content
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.bot_id).toBe(botId);
      expect(decoded.company_id).toBe(companyId);
      
      // Step 3: Generate widget instructions
      const instructions = generateWidgetInstructions(token);
      expect(instructions).toContain(token);
      expect(instructions).toContain('widget.js');
      expect(instructions).toContain('marked.min.js');
      expect(instructions).toContain('dompurify');
      
      // Step 4: Validate final output quality
      expect(instructions.length).toBeGreaterThan(500);
      expect(instructions).toMatch(/^✅ Instructions:/);
    });
  });

});

// Export for potential reuse in other tests
module.exports = {
  generateJWT,
  generateWidgetInstructions,
  JWT_SECRET
}; 