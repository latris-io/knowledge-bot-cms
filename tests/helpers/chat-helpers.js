const jwt = require('jsonwebtoken');

const JWT_SECRET = 'my-ultra-secure-signing-key';

/**
 * Generate JWT token for AI chat
 * Note: user_id excluded for security reasons
 */
function generateChatToken(companyId, botId) {
  return jwt.sign(
    { 
      company_id: companyId, 
      bot_id: botId
    },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );
}

/**
 * Verify JWT token
 */
function verifyChatToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Generate session ID
 */
function generateSessionId() {
  return 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Mock streaming response
 */
function mockStreamingResponse(chunks) {
  return {
    body: {
      getReader: () => ({
        read: async () => {
          if (chunks.length === 0) {
            return { done: true };
          }
          const chunk = chunks.shift();
          return { 
            done: false, 
            value: new TextEncoder().encode(chunk) 
          };
        }
      })
    }
  };
}

/**
 * Parse markdown (fallback implementation)
 */
function parseMarkdown(text) {
  if (!text) return '';
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #2563eb; text-decoration: underline;">$1</a>')
    .replace(/\n/g, '<br>');
}

/**
 * Extract sources from text
 */
function extractSources(text) {
  const sourceMatches = [...text.matchAll(/\[source: (.+?)\]/g)];
  return [...new Set(sourceMatches.map(match => match[1]))];
}

/**
 * Clean text by removing source tags
 */
function cleanText(text) {
  return text.replace(/\[source: .+?\]/g, "").trim();
}

module.exports = {
  generateChatToken,
  verifyChatToken,
  generateSessionId,
  mockStreamingResponse,
  parseMarkdown,
  extractSources,
  cleanText
}; 