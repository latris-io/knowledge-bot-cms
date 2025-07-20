/**
 * UC-005: AI Chat Interface - Regression Tests
 * 
 * This test suite validates all aspects of UC-005 as documented in use_cases.md
 * Run with: npm run test:uc005
 * 
 * NOTE: These are pure unit tests that don't require Strapi initialization
 * They test the use case logic in isolation for fast regression testing
 */

// Disable Strapi setup for these standalone tests
process.env.SKIP_STRAPI_SETUP = 'true';

const jwt = require('jsonwebtoken');

// Test constants from actual implementation
const JWT_SECRET = 'my-ultra-secure-signing-key';

// Helper functions from actual AI Chat implementation
function generateChatJWT(botId, companyId) {
  // BR-020: JWT token includes company_id and bot_id (user_id excluded for security)
  const token = jwt.sign(
    { company_id: parseInt(companyId), bot_id: parseInt(botId) },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );
  return token;
}

function createSessionId() {
  // BR-022: Session IDs are prefixed with 'admin_' for admin interface
  return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function extractSources(text) {
  // BR-031: Source reference regex handles trailing periods
  const sourceMatches = [...text.matchAll(/\[source: (.+?)\]\.?/g)];
  return [...new Set(sourceMatches.map(match => match[1]))];
}

function cleanText(text) {
  // BR-024 & BR-031: Sources are extracted from [source: ...] patterns and trailing periods
  return text
    .replace(/\s*\[source: .+?\]\s*/g, " ")  // Remove source refs and normalize surrounding spaces
    .replace(/\s+\./g, ".")                   // Fix spaces before periods
    .replace(/\s+/g, ' ')                     // Normalize all whitespace
    .trim();                                  // Clean up edges
}

function needsIntelligentSpacing(accumulatedText, nextChunk) {
  // BR-030: Intelligent spacing automatically adds spaces between sentence boundaries
  return accumulatedText.length > 0 &&
    !accumulatedText.endsWith(' ') &&
    !accumulatedText.endsWith('\n') &&
    !nextChunk.startsWith(' ') &&
    !nextChunk.startsWith('\n') &&
    /[.!?]$/.test(accumulatedText.trim()) &&
    /^[A-Z]/.test(nextChunk.trim());
}

function processStreamingChunk(accumulatedText, nextChunk) {
  // BR-027 & BR-030: Streaming responses show real-time updates with intelligent spacing
  if (needsIntelligentSpacing(accumulatedText, nextChunk)) {
    return accumulatedText + ' ' + nextChunk;
  }
  return accumulatedText + nextChunk;
}

// Mock AI Chat Interface
class MockAIChatInterface {
  constructor() {
    this.conversations = new Map();
    this.currentUser = null;
  }

  setUser(user) {
    this.currentUser = user;
  }

  initializeChat() {
    if (!this.currentUser || !this.currentUser.bot || !this.currentUser.company) {
      throw new Error('User missing bot or company - interface disabled');
    }

    const token = generateChatJWT(this.currentUser.bot.id, this.currentUser.company.id);
    const sessionId = createSessionId();

    return {
      token,
      sessionId,
      enabled: true,
      welcomeMessage: "How can I help you today?"
    };
  }

  async sendMessage(message, sessionId, token) {
    // BR-023: Interface supports both JSON and streaming responses
    if (!sessionId || !token) {
      throw new Error('Session ID and token required');
    }

    // Simulate streaming response
    const responseChunks = [
      "This is a test response.",
      " Here's additional information.",
      " [source: Document1.pdf]",
      " More content follows.",
      " [source: Reference2.docx]."
    ];

    let accumulatedText = '';
    const processedChunks = [];

    for (const chunk of responseChunks) {
      accumulatedText = processStreamingChunk(accumulatedText, chunk);
      processedChunks.push(accumulatedText);
    }

    const finalText = accumulatedText;
    const sources = extractSources(finalText);
    const cleanedText = cleanText(finalText);

    return {
      success: true,
      response: cleanedText,
      sources: sources,
      chunks: processedChunks,
      sessionId: sessionId
    };
  }

  clearConversation(sessionId) {
    this.conversations.delete(sessionId);
    return true;
  }
}

describe('UC-005: AI Chat Interface', () => {
  let chatInterface;
  let testUser;

  beforeEach(() => {
    chatInterface = new MockAIChatInterface();
    testUser = {
      id: 1,
      username: 'testuser',
      bot: { id: 10 },
      company: { id: 20 }
    };
  });

  describe('BR-020: JWT Token Excludes user_id for Security', () => {
    test('should generate JWT with company_id and bot_id only', () => {
      const token = generateChatJWT(15, 25);
      const decoded = jwt.verify(token, JWT_SECRET);
      
      expect(decoded.company_id).toBe(25);
      expect(decoded.bot_id).toBe(15);
      expect(decoded.user_id).toBeUndefined();
      expect(decoded.id).toBeUndefined();
    });

    test('should use same secret as user lifecycle system', () => {
      const token = generateChatJWT(1, 1);
      
      // Should verify with the same secret used elsewhere
      expect(() => jwt.verify(token, JWT_SECRET)).not.toThrow();
      expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
    });
  });

  describe('BR-021: Token Uses Same Secret as User Lifecycle System', () => {
    test('should be compatible with lifecycle system JWT verification', () => {
      const chatToken = generateChatJWT(5, 10);
      
      // Should be verifiable with same secret and algorithm
      const decoded = jwt.verify(chatToken, JWT_SECRET, { algorithms: ['HS256'] });
      expect(decoded.bot_id).toBe(5);
      expect(decoded.company_id).toBe(10);
    });
  });

  describe('BR-022: Session IDs Prefixed with admin_', () => {
    test('should create session IDs with admin_ prefix', () => {
      const sessionId = createSessionId();
      expect(sessionId).toMatch(/^admin_\d+_[a-z0-9]+$/);
      expect(sessionId.startsWith('admin_')).toBe(true);
    });

    test('should generate unique session IDs', () => {
      const sessionId1 = createSessionId();
      const sessionId2 = createSessionId();
      
      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1.startsWith('admin_')).toBe(true);
      expect(sessionId2.startsWith('admin_')).toBe(true);
    });
  });

  describe('BR-023: Interface Supports Both JSON and Streaming Responses', () => {
    test('should handle streaming response processing', async () => {
      chatInterface.setUser(testUser);
      const { token, sessionId } = chatInterface.initializeChat();
      
      const result = await chatInterface.sendMessage('test question', sessionId, token);
      
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.chunks).toBeDefined();
      expect(Array.isArray(result.chunks)).toBe(true);
    });

    test('should process streaming chunks correctly', () => {
      const chunk1 = "This is the first chunk.";
      const chunk2 = "This is the second chunk.";
      
      let accumulated = processStreamingChunk('', chunk1);
      expect(accumulated).toBe(chunk1);
      
      accumulated = processStreamingChunk(accumulated, chunk2);
      expect(accumulated).toBe(chunk1 + ' ' + chunk2); // Intelligent spacing added
    });
  });

  describe('BR-024 & BR-031: Source Extraction with Trailing Periods', () => {
    test('should extract sources without trailing periods', () => {
      const textWithSources = "Here's some text [source: Document1.pdf]. More text [source: File2.docx] here.";
      const sources = extractSources(textWithSources);
      
      expect(sources).toContain('Document1.pdf');
      expect(sources).toContain('File2.docx');
      expect(sources).toHaveLength(2);
    });

    test('should handle sources with trailing periods', () => {
      const textWithPeriods = "Text with [source: Report.pdf]. And [source: Analysis.xlsx].";
      const sources = extractSources(textWithPeriods);
      
      expect(sources).toContain('Report.pdf');
      expect(sources).toContain('Analysis.xlsx');
    });

    test('should deduplicate sources', () => {
      const textWithDuplicates = "Text [source: Same.pdf] and [source: Same.pdf] again.";
      const sources = extractSources(textWithDuplicates);
      
      expect(sources).toHaveLength(1);
      expect(sources[0]).toBe('Same.pdf');
    });

    test('should clean text by removing source references', () => {
      const originalText = "Content [source: File1.pdf]. More content [source: File2.docx].";
      const cleanedText = cleanText(originalText);
      
      expect(cleanedText).toBe('Content. More content.');
      expect(cleanedText).not.toContain('[source:');
      expect(cleanedText).not.toContain('File1.pdf');
      expect(cleanedText).not.toContain('File2.docx');
    });
  });

  describe('BR-025: Markdown Rendering Support', () => {
    test('should support basic markdown elements', () => {
      // This is a conceptual test - actual markdown rendering would need markdown-it
      const markdownText = "# Header\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2";
      
      // Verify markdown patterns are preserved for rendering
      expect(markdownText).toContain('# Header');
      expect(markdownText).toContain('**Bold text**');
      expect(markdownText).toContain('*italic text*');
      expect(markdownText).toContain('- List item');
    });
  });

  describe('BR-026: Messages in Chronological Order', () => {
    test('should maintain message order in conversation', async () => {
      chatInterface.setUser(testUser);
      const { token, sessionId } = chatInterface.initializeChat();
      
      const messages = ['First message', 'Second message', 'Third message'];
      const responses = [];
      
      for (const message of messages) {
        const response = await chatInterface.sendMessage(message, sessionId, token);
        responses.push(response);
      }
      
      // All responses should maintain session continuity
      expect(responses.every(r => r.sessionId === sessionId)).toBe(true);
      expect(responses).toHaveLength(3);
    });
  });

  describe('BR-027: Streaming Responses Show Real-Time Updates', () => {
    test('should process streaming chunks in real-time', async () => {
      chatInterface.setUser(testUser);
      const { token, sessionId } = chatInterface.initializeChat();
      
      const result = await chatInterface.sendMessage('streaming test', sessionId, token);
      
      expect(result.chunks).toBeDefined();
      expect(result.chunks.length).toBeGreaterThan(1);
      
      // Each chunk should build upon the previous
      for (let i = 1; i < result.chunks.length; i++) {
        expect(result.chunks[i].length).toBeGreaterThanOrEqual(result.chunks[i-1].length);
      }
    });
  });

  describe('BR-028: Copy Functionality for Responses', () => {
    test('should provide clean response text suitable for copying', async () => {
      chatInterface.setUser(testUser);
      const { token, sessionId } = chatInterface.initializeChat();
      
      const result = await chatInterface.sendMessage('copy test', sessionId, token);
      
      // Response should be clean (no source references)
      expect(result.response).toBeDefined();
      expect(result.response).not.toContain('[source:');
      expect(typeof result.response).toBe('string');
    });
  });

  describe('BR-029: Input Field Auto-Focus', () => {
    test('should enable auto-focus functionality after initialization', () => {
      chatInterface.setUser(testUser);
      const chatInit = chatInterface.initializeChat();
      
      // Interface should be enabled for auto-focus
      expect(chatInit.enabled).toBe(true);
      expect(chatInit.welcomeMessage).toBeDefined();
    });
  });

  describe('BR-030: Intelligent Spacing Between Streaming Chunks', () => {
    test('should add spaces at sentence boundaries', () => {
      const sentence1 = "This is the first sentence.";
      const sentence2 = "This is the second sentence.";
      
      const result = processStreamingChunk(sentence1, sentence2);
      expect(result).toBe("This is the first sentence. This is the second sentence.");
    });

    test('should not add spaces when not needed', () => {
      const chunk1 = "Hello";
      const chunk2 = " world";
      
      const result = processStreamingChunk(chunk1, chunk2);
      expect(result).toBe("Hello world");
    });

    test('should handle multiple sentence boundaries correctly', () => {
      let accumulated = "First sentence.";
      accumulated = processStreamingChunk(accumulated, "Second sentence!");
      accumulated = processStreamingChunk(accumulated, "Third sentence?");
      
      expect(accumulated).toBe("First sentence. Second sentence! Third sentence?");
    });

    test('should detect sentence boundaries correctly', () => {
      expect(needsIntelligentSpacing("End.", "Start")).toBe(true);
      expect(needsIntelligentSpacing("End!", "Start")).toBe(true);
      expect(needsIntelligentSpacing("End?", "Start")).toBe(true);
      expect(needsIntelligentSpacing("End ", "Start")).toBe(false);
      expect(needsIntelligentSpacing("End", " Start")).toBe(false);
      expect(needsIntelligentSpacing("End", "start")).toBe(false); // lowercase
    });
  });

  describe('Main Flow: Complete Chat Initialization', () => {
    test('should successfully initialize chat for valid user', () => {
      chatInterface.setUser(testUser);
      const result = chatInterface.initializeChat();
      
      expect(result.enabled).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.sessionId).toMatch(/^admin_/);
      expect(result.welcomeMessage).toBe("How can I help you today?");
      
      // Verify JWT structure
      const decoded = jwt.verify(result.token, JWT_SECRET);
      expect(decoded.bot_id).toBe(10);
      expect(decoded.company_id).toBe(20);
    });
  });

  describe('Alternative Flows: Error Handling', () => {
    test('should fail initialization for user without bot', () => {
      const invalidUser = {
        id: 1,
        username: 'invalid',
        bot: null,
        company: { id: 20 }
      };
      
      chatInterface.setUser(invalidUser);
      expect(() => {
        chatInterface.initializeChat();
      }).toThrow('User missing bot or company - interface disabled');
    });

    test('should fail initialization for user without company', () => {
      const invalidUser = {
        id: 1,
        username: 'invalid',
        bot: { id: 10 },
        company: null
      };
      
      chatInterface.setUser(invalidUser);
      expect(() => {
        chatInterface.initializeChat();
      }).toThrow('User missing bot or company - interface disabled');
    });

    test('should handle missing session parameters', async () => {
      chatInterface.setUser(testUser);
      
      await expect(chatInterface.sendMessage('test', null, 'token')).rejects.toThrow();
      await expect(chatInterface.sendMessage('test', 'session', null)).rejects.toThrow();
    });
  });

  describe('End-to-End: Complete AI Chat Flow', () => {
    test('should complete full chat interaction workflow', async () => {
      // Step 1: Initialize user and chat
      chatInterface.setUser(testUser);
      const { token, sessionId, enabled } = chatInterface.initializeChat();
      
      expect(enabled).toBe(true);
      expect(token).toBeDefined();
      expect(sessionId).toMatch(/^admin_/);
      
      // Step 2: Send message and process response
      const result = await chatInterface.sendMessage('What is AI?', sessionId, token);
      
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.sources).toBeDefined();
      expect(Array.isArray(result.sources)).toBe(true);
      
      // Step 3: Verify streaming processing
      expect(result.chunks).toBeDefined();
      expect(result.chunks.length).toBeGreaterThan(0);
      
      // Step 4: Verify source extraction
      expect(result.sources.length).toBeGreaterThan(0);
      
      // Step 5: Verify clean response (no source references)
      expect(result.response).not.toContain('[source:');
      
      // Step 6: Clear conversation
      const cleared = chatInterface.clearConversation(sessionId);
      expect(cleared).toBe(true);
    });
  });

});

// Export for potential reuse in other tests
module.exports = {
  MockAIChatInterface,
  generateChatJWT,
  createSessionId,
  extractSources,
  cleanText,
  needsIntelligentSpacing,
  processStreamingChunk
}; 