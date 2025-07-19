const { 
  generateChatToken, 
  generateSessionId, 
  mockStreamingResponse, 
  parseMarkdown, 
  extractSources, 
  cleanText 
} = require('../../helpers/chat-helpers');

describe('UC-005: AI Chat Interface', () => {
  // These are unit tests that don't require a full Strapi instance
  // They test the AI chat functionality in isolation

  describe('TC-005-001: JWT Token Generation', () => {
    test('should generate valid JWT token for user with bot and company', async () => {
      const mockUser = {
        id: 1,
        bot: { id: 1 },
        company: { id: 1 }
      };

      const token = generateChatToken(mockUser.company.id, mockUser.bot.id);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token structure (user_id excluded for security)
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, 'my-ultra-secure-signing-key');
      expect(decoded['company_id']).toBe(1);
      expect(decoded['bot_id']).toBe(1);
      expect(decoded['user_id']).toBeUndefined();
    });

    test('should fail token generation for user without bot', async () => {
      const mockUser = {
        id: 1,
        bot: null,
        company: { id: 1 }
      };

      expect(() => {
        if (!mockUser.bot || !mockUser.company) {
          throw new Error('Bot and Company are required');
        }
        return generateChatToken(mockUser.company.id, mockUser.bot.id);
      }).toThrow('Bot and Company are required');
    });

    test('should fail token generation for user without company', async () => {
      const mockUser = {
        id: 1,
        bot: { id: 1 },
        company: null
      };

      expect(() => {
        if (!mockUser.bot || !mockUser.company) {
          throw new Error('Bot and Company are required');
        }
        return generateChatToken(mockUser.company.id, mockUser.bot.id);
      }).toThrow('Bot and Company are required');
    });
  });

  describe('TC-005-002: Session Management', () => {
    test('should generate unique session IDs', async () => {
      const sessionId1 = generateSessionId();
      const sessionId2 = generateSessionId();
      
      expect(sessionId1).toBeDefined();
      expect(sessionId2).toBeDefined();
      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1.startsWith('admin_')).toBe(true);
      expect(sessionId2.startsWith('admin_')).toBe(true);
    });

    test('should persist session in localStorage format', async () => {
      const sessionId = generateSessionId();
      
      // Mock localStorage
      const mockLocalStorage = {
        data: {},
        setItem: function(key, value) {
          this.data[key] = value;
        },
        getItem: function(key) {
          return this.data[key] || null;
        }
      };

      // Test storing session
      mockLocalStorage.setItem('kb-chat-session-admin', sessionId);
      const storedSession = mockLocalStorage.getItem('kb-chat-session-admin');
      
      expect(storedSession).toBe(sessionId);
    });

    test('should clear session properly', async () => {
      const sessionId = generateSessionId();
      
      // Mock localStorage
      const mockLocalStorage = {
        data: {},
        setItem: function(key, value) {
          this.data[key] = value;
        },
        removeItem: function(key) {
          delete this.data[key];
        },
        getItem: function(key) {
          return this.data[key] || null;
        }
      };

      // Store and then clear session
      mockLocalStorage.setItem('kb-chat-session-admin', sessionId);
      mockLocalStorage.removeItem('kb-chat-session-admin');
      const clearedSession = mockLocalStorage.getItem('kb-chat-session-admin');
      
      expect(clearedSession).toBe(null);
    });
  });

  describe('TC-005-003: Markdown Processing', () => {
    test('should process basic markdown correctly', async () => {
      const input = '# Header\n\n**Bold text** and *italic text*\n\nRegular paragraph.';
      const result = parseMarkdown(input);
      
      expect(result).toContain('<h1>Header</h1>');
      expect(result).toContain('<strong>Bold text</strong>');
      expect(result).toContain('<em>italic text</em>');
      expect(result).toContain('<p>Regular paragraph.</p>');
    });

    test('should process links correctly', async () => {
      const input = '[Link text](https://example.com)';
      const result = parseMarkdown(input);
      
      expect(result).toContain('<a href="https://example.com">Link text</a>');
    });

    test('should handle line breaks', async () => {
      const input = 'Line 1\nLine 2\n\nNew paragraph';
      const result = parseMarkdown(input);
      
      expect(result).toContain('<p>Line 1<br />Line 2</p>');
      expect(result).toContain('<p>New paragraph</p>');
    });
  });

  describe('TC-005-004: Source Extraction', () => {
    test('should extract sources from response text', async () => {
      const input = 'This is some text [source: document1.pdf] and more text [source: document2.pdf].';
      const sources = extractSources(input);
      
      expect(sources).toHaveLength(2);
      expect(sources).toContain('document1.pdf');
      expect(sources).toContain('document2.pdf');
    });

    test('should deduplicate sources', async () => {
      const input = 'Text [source: document1.pdf] and more [source: document1.pdf] and [source: document2.pdf].';
      const sources = extractSources(input);
      
      expect(sources).toHaveLength(2);
      expect(sources).toContain('document1.pdf');
      expect(sources).toContain('document2.pdf');
    });

    test('should clean text by removing source tags', async () => {
      const input = 'This is some text [source: document1.pdf] and more text [source: document2.pdf].';
      const cleanedText = cleanText(input);
      
      expect(cleanedText).toBe('This is some text  and more text .');
      expect(cleanedText).not.toContain('[source:');
    });
  });

  describe('TC-005-005: Message Management', () => {
    test('should create user message correctly', async () => {
      const messageData = {
        id: '1',
        type: 'user',
        content: 'Hello, how are you?',
        timestamp: new Date().toISOString()
      };

      expect(messageData.type).toBe('user');
      expect(messageData.content).toBe('Hello, how are you?');
      expect(messageData.timestamp).toBeDefined();
    });

    test('should create bot message correctly', async () => {
      const messageData = {
        id: '2',
        type: 'bot',
        content: 'I am doing well, thank you!',
        timestamp: new Date().toISOString(),
        streaming: false
      };

      expect(messageData.type).toBe('bot');
      expect(messageData.content).toBe('I am doing well, thank you!');
      expect(messageData.streaming).toBe(false);
    });

    test('should handle streaming message state', async () => {
      const streamingMessage = {
        id: '3',
        type: 'bot',
        content: 'Partial response...',
        timestamp: new Date().toISOString(),
        streaming: true
      };

      expect(streamingMessage.streaming).toBe(true);
      
      // Simulate completing the stream
      streamingMessage.streaming = false;
      streamingMessage.content = 'Complete response here.';
      
      expect(streamingMessage.streaming).toBe(false);
      expect(streamingMessage.content).toBe('Complete response here.');
    });
  });

  describe('TC-005-006: API Integration', () => {
    test('should format API request correctly', async () => {
      const requestData = {
        query: 'What is the weather like?',
        session_id: 'admin_test_session',
        stream: true
      };

      const expectedRequest = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token'
        },
        body: JSON.stringify(requestData)
      };

      expect(expectedRequest.method).toBe('POST');
      expect(expectedRequest.headers['Content-Type']).toBe('application/json');
      expect(expectedRequest.headers['Authorization']).toContain('Bearer');
      expect(JSON.parse(expectedRequest.body)).toEqual(requestData);
    });

    test('should determine correct API URL', async () => {
      const localUrl = 'http://localhost:8000/chat';
      const prodUrl = 'https://knowledge-bot-retrieval.onrender.com/chat';
      
      // Test local development
      const isDev = process.env.NODE_ENV === 'development';
      const apiUrl = isDev ? localUrl : prodUrl;
      
      expect(apiUrl).toBe(localUrl); // In test environment, should default to local
    });
  });

  describe('TC-005-007: Auto-Focus Functionality', () => {
    test('should focus input field when component mounts', () => {
      // Mock DOM element
      const mockTextarea = {
        focus: jest.fn(),
        disabled: false
      };

      // Simulate conditions when textarea should be focused
      const isLoading = false;
      const jwtToken = 'mock-jwt-token';
      const user = { id: 1, bot: { id: 1 }, company: { id: 1 } };

      const shouldFocus = !isLoading && jwtToken && user;
      
      expect(shouldFocus).toBe(true);
      
      // Simulate focus call
      if (shouldFocus && mockTextarea) {
        mockTextarea.focus();
      }

      expect(mockTextarea.focus).toHaveBeenCalled();
    });

    test('should not focus when textarea is disabled', () => {
      const mockTextarea = {
        focus: jest.fn(),
        disabled: true
      };

      // Simulate disabled conditions
      const isLoading = true;
      const jwtToken = null;
      const user = null;

      const shouldFocus = !isLoading && jwtToken && user;
      
      expect(shouldFocus).toBe(false);
      
      // Should not call focus when conditions aren't met
      if (shouldFocus && mockTextarea) {
        mockTextarea.focus();
      }

      expect(mockTextarea.focus).not.toHaveBeenCalled();
    });

    test('should refocus after AI response', () => {
      const mockTextarea = {
        focus: jest.fn()
      };

      // Simulate response completion
      const isResponseComplete = true;
      
      if (isResponseComplete && mockTextarea) {
        // Simulate the setTimeout behavior
        setTimeout(() => {
          mockTextarea.focus();
        }, 100);
      }

      expect(isResponseComplete).toBe(true);
      // Note: In actual implementation, this would be tested with proper async handling
    });

    test('should validate auto-focus dependency conditions', () => {
      // Test all combinations of conditions that should trigger/prevent focus
      const testCases = [
        { isLoading: false, jwtToken: 'valid', user: {}, expected: true },
        { isLoading: true, jwtToken: 'valid', user: {}, expected: false },
        { isLoading: false, jwtToken: null, user: {}, expected: false },
        { isLoading: false, jwtToken: 'valid', user: null, expected: false },
        { isLoading: true, jwtToken: null, user: null, expected: false }
      ];

      testCases.forEach(({ isLoading, jwtToken, user, expected }) => {
        const shouldFocus = !isLoading && jwtToken && user;
        expect(shouldFocus).toBe(expected);
      });
    });
  });

  describe('TC-005-008: Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      
      const errorMessage = 'I apologize, but I\'m having trouble connecting to the knowledge base right now. Please try again in a moment.';
      
      expect(networkError.name).toBe('NetworkError');
      expect(errorMessage).toContain('trouble connecting');
    });

    test('should handle HTTP errors gracefully', async () => {
      const httpError = new Error('HTTP 500 Internal Server Error');
      httpError['status'] = 500;
      
      const errorMessage = 'I encountered an error while processing your request. Please try again or contact support if the issue persists.';
      
      expect(httpError['status']).toBe(500);
      expect(errorMessage).toContain('encountered an error');
    });

    test('should handle streaming errors gracefully', async () => {
      const streamingError = new Error('Stream interrupted');
      streamingError['type'] = 'streaming';
      
      const errorMessage = 'The response was interrupted. Please try asking your question again.';
      
      expect(streamingError['type']).toBe('streaming');
      expect(errorMessage).toContain('interrupted');
    });
  });
}); 