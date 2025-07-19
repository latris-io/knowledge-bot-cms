import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import MarkdownIt from 'markdown-it';

// Session Management - matches the widget exactly
class SessionManager {
  constructor() {
    this.sessionKey = 'kb-chat-session-admin';
    this.sessionId = this.getOrCreateSession();
  }

  getOrCreateSession() {
    let sessionId = localStorage.getItem(this.sessionKey);
    if (!sessionId) {
      sessionId = this.generateSessionId();
      localStorage.setItem(this.sessionKey, sessionId);
    }
    return sessionId;
  }

  generateSessionId() {
    return 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getSessionId() {
    return this.sessionId;
  }

  clearSession() {
    localStorage.removeItem(this.sessionKey);
    this.sessionId = this.generateSessionId();
    localStorage.setItem(this.sessionKey, this.sessionId);
  }
}

// Initialize markdown-it with same configuration as the working widget
const md = new MarkdownIt({
  html: false,         // Disable HTML tags in source
  xhtmlOut: false,     // Use HTML5
  breaks: false,       // Don't convert \n to <br>
  langPrefix: 'language-',
  linkify: false,      // Don't auto-convert URLs
  typographer: false   // Don't use smart quotes
});

// Industry-standard markdown parsing using markdown-it (matching widget approach)
function parseMarkdown(text) {
  if (!text) return '';
  
  console.log('🔍 Raw API Response:', text);
  
  // Preprocessing: Fix markdown structure issues (from working widget)
  let processedText = text;
  
  // Pattern: Ensure proper header separation (headers need double line breaks)
  processedText = processedText.replace(
    /([^\n])\n(### )/g,
    '$1\n\n$2'
  );
  
  // Pattern: Fix header directly followed by dashes (no line break)
  processedText = processedText.replace(
    /(### [^\n]+)-\s*\*\*/g,
    '$1\n\n- **'
  );
  
  // Pattern: Fix run-together list items (dash followed by bold item)
  processedText = processedText.replace(
    /(\*\*[^*]+\*\*[^-\n]*)-\s*\*\*/g,
    '$1\n- **'
  );
  
  // Pattern: Fix headers immediately following content (no line break)
  processedText = processedText.replace(
    /([^.\n])(### )/g,
    '$1\n\n$2'
  );
  
  // Pattern: Fix the specific issue from user's example
  // "### Bell Meade Office Hours- **Monday**" → "### Bell Meade Office Hours\n\n- **Monday**"
  processedText = processedText.replace(
    /(### [^-\n]+)-\s*(\*\*[^*]+\*\*)/g,
    '$1\n\n- $2'
  );
  
  // Pattern: Fix time followed by header (e.g., "4:30pm### Additional")
  processedText = processedText.replace(
    /(\d+:\d+\w+)(### )/g,
    '$1\n\n$2'
  );
  
  // Pattern: Fix general run-together content with headers
  processedText = processedText.replace(
    /([a-zA-Z0-9.!?])(### )/g,
    '$1\n\n$2'
  );
  
  // Pattern: Ensure proper line breaks between list items
  // Handle cases where list items are separated by periods, spaces, or insufficient breaks
  processedText = processedText.replace(
    /(\n- [^\n]+[.!?])\s*(\n- )/g,
    '$1\n$2'
  );
  
  // Pattern: Fix missing line breaks between list items when they run together
  processedText = processedText.replace(
    /(\n- [^-\n]*[.!?])\s*- \*\*/g,
    '$1\n- **'
  );
  
  // Pattern: More aggressive list item separation - handle periods followed by dashes
  processedText = processedText.replace(
    /([.!?])-\s*\*\*/g,
    '$1\n- **'
  );
  
  // Pattern: Handle periods followed by text followed by dashes  
  processedText = processedText.replace(
    /([.!?])\s*([A-Z][^.!?]*[.!?])\s*-\s*\*\*/g,
    '$1\n\n$2\n- **'
  );
  
  // Pattern: List ending followed by bold text (common in our LLM output)
  // This adds extra blank lines to ensure proper list termination
  processedText = processedText.replace(
    /(\n- [^\n]+\n+)(\*\*[^*]+\*\*:)/g,
    '$1\n$2'
  );
  
  // Pattern: Consecutive bold items need separation
  // This ensures proper spacing between bold items like "**Tricky Word**:" and "**Test Date**:"
  processedText = processedText.replace(
    /(\*\*[^*]+\*\*:[^\n]*\n+)(\*\*[^*]+\*\*:)/g,
    '$1\n$2'
  );
  
  // Pattern: Text followed by header needs proper separation
  processedText = processedText.replace(
    /([.!?])\s*(###)/g,
    '$1\n\n$2'
  );
  
  console.log('[Widget-Style Parser] Processed text:', processedText);
  
  // Use markdown-it with the same configuration as the working widget
  let html = md.render(processedText);
  
  // Apply custom styling to match the design system
  html = html
    .replace(/<h1>/g, '<h1 style="margin: 1.5rem 0 1rem 0; font-size: 1.375rem; font-weight: 600; color: #1d1d1f; letter-spacing: -0.01em;">')
    .replace(/<h2>/g, '<h2 style="margin: 1.5rem 0 1rem 0; font-size: 1.25rem; font-weight: 600; color: #1d1d1f; letter-spacing: -0.01em;">')
    .replace(/<h3>/g, '<h3 style="margin: 1.5rem 0 1rem 0; font-size: 1.125rem; font-weight: 600; color: #1d1d1f; letter-spacing: -0.01em;">')
    .replace(/<strong>/g, '<strong style="font-weight: 600; color: #1d1d1f;">')
    .replace(/<ul>/g, '<ul style="margin: 1rem 0; padding-left: 1.5rem;">')
    .replace(/<ol>/g, '<ol style="margin: 1rem 0; padding-left: 1.5rem;">')
    .replace(/<li>/g, '<li style="margin: 0.5rem 0; line-height: 1.6;">')
    .replace(/<p>/g, '<p style="margin: 1rem 0; line-height: 1.6; color: #1d1d1f;">')
    .replace(/<pre>/g, '<pre style="background: rgba(0, 0, 0, 0.06); padding: 1rem; border-radius: 8px; margin: 1rem 0; overflow-x: auto; font-family: Monaco, monospace; font-size: 0.9em; color: #1d1d1f; line-height: 1.4;">')
    .replace(/<code>/g, '<code style="background: rgba(0, 0, 0, 0.06); padding: 0.2rem 0.4rem; border-radius: 4px; font-family: Monaco, monospace; font-size: 0.9em; color: #1d1d1f;">')
    .replace(/<blockquote>/g, '<blockquote style="border-left: 4px solid #007aff; padding-left: 1rem; margin: 1rem 0; font-style: italic; color: #666;">')
    .replace(/<a/g, '<a style="color: #007aff; text-decoration: none;" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'"');
  
  console.log('[Widget-Style Parser] Output HTML:', html);
  
  return html;
}

// Extract sources from response text (same logic as widget)
function extractSources(text) {
  const sourceMatches = [...text.matchAll(/\[source: (.+?)\]/g)];
  const allSources = sourceMatches.map(match => match[1]);
  return [...new Set(allSources)]; // Deduplicate
}

// Proper JWT implementation using Web Crypto API
async function createJWT(payload, secret) {
  // Create header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  // Base64URL encode header and payload
  const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  // Create signature using HMAC-SHA256
  const encoder = new TextEncoder();
  const data = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  const secretKey = encoder.encode(secret);

  // Import secret key for HMAC
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    secretKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the data
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

const AiChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [jwtToken, setJwtToken] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [debugMode, setDebugMode] = useState(false); // Add debug mode toggle
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const sessionManager = new SessionManager();

  // Real user data state
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Back to JWT approach that was working before
  const fetchUserData = async () => {
    try {
      setUserLoading(true);
      console.log('🔄 Reverting to JWT approach that was working...');
      
      // Extract JWT token from cookies (this was working before)
      const getCookieValue = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
      };
      
      const jwtToken = getCookieValue('jwtToken');
      console.log('🔑 JWT Token found:', !!jwtToken);
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
        console.log('✅ Added Authorization header with JWT token');
      } else {
        console.log('⚠️ No JWT token found in cookies');
      }
      
      console.log('📡 Making request to /admin/users/me with JWT auth...');
      const userResponse = await fetch('/admin/users/me', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      console.log('📡 Response:', userResponse.status, userResponse.statusText);

      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user: ${userResponse.status} ${userResponse.statusText}`);
      }

      const userData = await userResponse.json();
      console.log('📋 User data received:', userData);
      console.log('📋 User keys:', Object.keys(userData));
      
      // For now, use mock bot/company data while we figure out the real source
      setUser({
        id: userData.id,
        email: userData.email,
        firstname: userData.firstname, 
        lastname: userData.lastname,
        // Mock data temporarily
        bot: { id: 1, name: 'Knowledge Bot' },
        company: { id: 1, name: 'Test Company' }
      });
      
      console.log('✅ User set with first name:', userData.firstname, 'last name:', userData.lastname);
      
    } catch (error) {
      console.error('❌ JWT fetch failed:', error);
      setError(`Auth failed: ${error.message}. Please ensure you're logged into Strapi admin.`);
    } finally {
      setUserLoading(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // Auto-focus textarea when it becomes enabled
  useEffect(() => {
    const isTextareaEnabled = !isLoading && jwtToken && user;
    if (isTextareaEnabled && textareaRef.current) {
      // Small delay to ensure DOM is ready and other elements aren't stealing focus
      const focusTimer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          console.log('🎯 Textarea focused - enabled state:', { isLoading, jwtToken: !!jwtToken, user: !!user });
        }
      }, 50);
      
      return () => clearTimeout(focusTimer);
    }
  }, [isLoading, jwtToken, user]);

  useEffect(() => {
    // Initialize chat and generate JWT token
    const initializeChat = async () => {
      try {
        console.log('🚀 [AI Chat] Initializing...');
        console.log('[Enhanced Parser] Ready for use');
        
        // First fetch user data
        console.log('🔄 [AI Chat] Calling fetchUserData...');
        await fetchUserData();
        console.log('✅ [AI Chat] fetchUserData completed');
      } catch (err) {
        console.error('❌ [AI Chat] Failed to initialize chat:', err);
        setError(`Initialization failed: ${err.message}`);
      }
    };

    console.log('🎬 [AI Chat] useEffect triggered, calling initializeChat...');
    initializeChat();
  }, []);

  // Generate JWT token when user data is available
  useEffect(() => {
    const generateJWTAndWelcome = async () => {
      if (!user || !user.bot || !user.company) return;
      
      try {
        // Generate JWT token with real user data
        const payload = {
          company_id: user.company.id,
          bot_id: user.bot.id
          // Note: Only company_id and bot_id needed - user_id removed per spec
        };

        console.log('🔑 Generating JWT with payload:', payload);
        const token = await createJWT(payload, 'my-ultra-secure-signing-key');
        console.log('🎯 Generated JWT Token:', token);
        console.log('🎯 Token length:', token?.length);
        setJwtToken(token);

        // Add welcome message
        setMessages([
          {
            id: 1,
            role: 'assistant',
            content: 'Hello! I\'m your AI assistant, ready to help you explore and understand your knowledge base. What would you like to discover today?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        // Clear any previous errors
        setError('');
      } catch (err) {
        console.error('Failed to generate JWT token:', err);
        setError(`JWT generation failed: ${err.message}`);
      }
    };

    generateJWTAndWelcome();
  }, [user]); // Run when user data changes

  const handleSend = async () => {
            if (!input.trim() || isLoading || !jwtToken || !user) return;
    
    const question = input.trim();
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    // Create assistant message with loading state
    const assistantMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: [],
      isLoading: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('https://knowledge-bot-retrieval.onrender.com/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          question: question,
          session_id: sessionManager.getSessionId(),
          k: 12,
          similarity_threshold: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');

      // Handle Server-Sent Events (SSE) response - SAME APPROACH AS WIDGET
      if (contentType && contentType.includes('text/event-stream')) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        let buffer = '';
        let accumulatedText = '';
        let responseStarted = false;
        let chunkCount = 0;
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log(`[AI Chat] Stream completed after ${chunkCount} chunks`);
              console.log(`[AI Chat] Final accumulated text length: ${accumulatedText.length}`);
              
              // Stream complete - now parse final markdown (EXACT SAME AS WIDGET)
              if (accumulatedText) {
                console.log('[AI Chat] Stream complete, parsing final markdown');
                const uniqueSources = extractSources(accumulatedText);
                // Fix: Remove sources but preserve line breaks - don't trim!
                const cleanText = accumulatedText.replace(/\[source: .+?\]/g, "");
                // Fix: Remove loading message but preserve line breaks - don't trim!
                const contentText = cleanText.replace(/^Getting your response\.\.\.?\s*/, "");
              
                console.log('[AI Chat] Content for markdown parsing:', contentText);
                
                // Now parse the complete markdown
                const mainHtml = parseMarkdown(contentText);
                
                console.log('[AI Chat] Final HTML after parsing:', mainHtml);
                
                // Update final message with parsed HTML
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { 
                        ...msg, 
                        content: mainHtml,
                        rawContent: accumulatedText,
                        sources: uniqueSources.map((src, idx) => ({ id: idx + 1, text: src, title: src.length > 60 ? src.substring(0, 60) + '...' : src })),
                        isLoading: false
                      }
                    : msg
                ));
                
                // Refocus input field after streaming response is complete
                setTimeout(() => {
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                  }
                }, 100);
              }
              
              break;
            }

            chunkCount++;
            const chunk = decoder.decode(value, { stream: true });
            console.log(`[AI Chat] Chunk ${chunkCount}: "${chunk}"`);
            
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6); // Remove 'data: ' prefix
                if (data === '[DONE]') continue;
                
                if (data.startsWith('[ERROR]')) {
                  throw new Error(data.replace('[ERROR] ', ''));
                }
                
                // Preserve empty chunks as line breaks, regular chunks as content (SAME AS WIDGET)
                // Fix: Handle empty or whitespace-only chunks as line breaks
                accumulatedText += (data === '' || data.trim() === '') ? '\n' : data;
                
                // Check if we have actual response content (not just loading message)
                // Fix: Don't use .trim() here as it destroys line breaks
                const cleanForCheck = accumulatedText.replace(/\[source: .+?\]/g, "");
                const hasActualContent = cleanForCheck.length > 0 && !cleanForCheck.startsWith("Getting your response");
                
                if (!responseStarted && hasActualContent) {
                  responseStarted = true;
                  console.log(`[AI Chat] Response content detected, hiding loading spinner`);
                }
                
                // Extract sources for display
                const uniqueSources = extractSources(accumulatedText);
                // Fix: Remove .trim() to preserve line breaks crucial for markdown
                const cleanText = accumulatedText.replace(/\[source: .+?\]/g, "");
                
                if (responseStarted) {
                  // Show actual content as RAW TEXT during streaming (NO MARKDOWN PARSING YET)
                  const contentText = cleanText.replace(/^Getting your response\.\.\.?\s*/, "");
                  
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { 
                          ...msg, 
                          content: `<pre style="white-space: pre-wrap; font-family: inherit; margin: 0; line-height: 1.6;">${contentText}</pre>`,
                          rawContent: accumulatedText,
                          sources: uniqueSources.map((src, idx) => ({ id: idx + 1, text: src, title: src.length > 60 ? src.substring(0, 60) + '...' : src })),
                          isLoading: false
                        }
                      : msg
                  ));
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
        
              } else {
        // Handle regular JSON response - SAME APPROACH AS WIDGET
        console.log(`[AI Chat] Handling as JSON response`);
        const data = await response.json();
        let raw = data.answer || data.error || "No response.";
        
        // Extract and deduplicate sources (SAME AS WIDGET)
        const uniqueSources = extractSources(raw);
        
        // Fix: Remove [source: ...] from main text but preserve line breaks
        const cleanText = raw.replace(/\[source: .+?\]/g, "");
        
        // Parse markdown to HTML
        const mainHtml = parseMarkdown(cleanText);
        
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { 
                ...msg, 
                content: mainHtml,
                rawContent: raw,
                sources: uniqueSources.map((src, idx) => ({ id: idx + 1, text: src, title: src.length > 60 ? src.substring(0, 60) + '...' : src })),
                isLoading: false
              }
            : msg
        ));
        
        // Refocus input field after JSON response is complete
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('[AI Chat] Error calling retrieval service:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { 
              ...msg, 
              content: `<div style="color: #dc2626; background: rgba(220, 38, 38, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid rgba(220, 38, 38, 0.2); font-size: 15px;">⚠️ Unable to connect to the knowledge base. Please check your connection and try again.</div>`,
              isLoading: false
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      
      // Always refocus input field when request is complete (success or error)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    sessionManager.clearSession();
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content: 'Ready for a fresh conversation! What would you like to explore today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Show loading state while fetching user data
  if (userLoading) {
    return (
      <div style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 25%, #1a1a1a 50%, #2d2d30 75%, #1a1a1a 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#ffffff'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255, 255, 255, 0.2)',
          borderTop: '3px solid #7877c6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px',
          boxShadow: '0 0 20px rgba(120, 119, 198, 0.5)'
        }} />
        <div style={{ 
          color: 'rgba(255, 255, 255, 0.7)', 
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Initializing AI Assistant...
        </div>
      </div>
    );
  }

  // Show error state if authentication failed
  if (error) {
    return (
      <div style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 25%, #1a1a1a 50%, #2d2d30 75%, #1a1a1a 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '20px',
        color: '#ffffff'
      }}>
        <div style={{
          background: 'rgba(255, 69, 58, 0.2)',
          border: '1px solid rgba(255, 69, 58, 0.3)',
          color: '#ff453a',
          padding: '16px 24px',
          borderRadius: '12px',
          marginBottom: '16px',
          textAlign: 'center',
          maxWidth: '400px',
          backdropFilter: 'blur(20px)'
        }}>
          ⚠️ {error}
        </div>
        <div style={{ 
          color: 'rgba(255, 255, 255, 0.6)', 
          fontSize: '14px',
          textAlign: 'center',
          maxWidth: '400px',
          lineHeight: '1.5'
        }}>
          Please ensure your user account has both a Bot and Company assigned, or contact your administrator for assistance.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 25%, #1a1a1a 50%, #2d2d30 75%, #1a1a1a 100%)',
      minHeight: '100vh',
      overflow: 'hidden',
      position: 'relative',
      color: '#ffffff'
    }}>
      {/* Holographic Background Effect */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(600px circle at 50% 50%, rgba(120, 119, 198, 0.05) 0%, rgba(255, 45, 85, 0.03) 40%, transparent 100%)',
        pointerEvents: 'none',
        transition: 'all 0.3s ease',
        animation: 'ambientPulse 12s ease-in-out infinite alternate',
        zIndex: 0
      }} />

      {/* Floating Glass Orbs */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <div style={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          top: '15%',
          right: '20%',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'orbFloat 25s infinite ease-in-out',
          animationDelay: '0s'
        }} />
        <div style={{
          position: 'absolute',
          width: '150px',
          height: '150px',
          bottom: '25%',
          left: '15%',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'orbFloat 25s infinite ease-in-out',
          animationDelay: '-8s'
        }} />
        <div style={{
          position: 'absolute',
          width: '100px',
          height: '100px',
          top: '65%',
          right: '10%',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'orbFloat 25s infinite ease-in-out',
          animationDelay: '-16s'
        }} />
      </div>


      {/* Main Container - Glassmorphism */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(80px) saturate(2) brightness(1.1)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '24px',
        margin: '20px',
        overflow: 'hidden',
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.2),
          0 0 0 1px rgba(255, 255, 255, 0.05)`,
        position: 'relative',
        zIndex: 1,
        height: 'calc(100vh - 40px)'
      }}>
        {/* Holographic Top Border */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, 
            transparent 0%, 
            rgba(120, 119, 198, 0.6) 20%, 
            rgba(255, 45, 85, 0.6) 40%, 
            rgba(52, 199, 89, 0.6) 60%, 
            rgba(255, 149, 0, 0.6) 80%, 
            transparent 100%)`,
          animation: 'holographicFlow 4s ease-in-out infinite alternate'
        }} />
        
        {/* Holographic Bottom Border */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, 
            transparent 0%, 
            rgba(255, 149, 0, 0.4) 25%, 
            rgba(52, 199, 89, 0.4) 50%, 
            rgba(255, 45, 85, 0.4) 75%, 
            transparent 100%)`,
          animation: 'holographicFlow 4s ease-in-out infinite alternate-reverse'
        }} />

        {/* Glassmorphism Header */}
        <div style={{
          padding: '32px 48px',
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(60px) brightness(1.2)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>


          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '700',
              background: `linear-gradient(135deg, 
                #ffffff 0%, 
                #e6e6e6 25%, 
                #7877c6 50%, 
                #ff2d55 75%, 
                #ffffff 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textAlign: 'center',
              letterSpacing: '-0.03em',
              animation: 'textShimmer 4s ease-in-out infinite alternate',
              position: 'relative',
              zIndex: 1,
              margin: 0
            }}>
              AI Assistant
            </h1>
                        
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              marginTop: '16px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: jwtToken ? '#34c759' : '#ff453a',
                boxShadow: jwtToken ? '0 0 12px rgba(52, 199, 89, 0.8)' : '0 0 12px rgba(255, 69, 58, 0.8)',
                animation: 'statusPulse 2s ease-in-out infinite'
              }} />
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '500'
              }}>
                {jwtToken ? 'Connected' : 'Connecting...'}
              </div>
            </div>
          </div>
            
          {/* Debug Toggle - Glassmorphism Style */}
          <button
            onClick={() => setDebugMode(!debugMode)}
            style={{
              background: debugMode ? 'linear-gradient(135deg, #7877c6 0%, #ff2d55 100%)' : 'rgba(255, 255, 255, 0.1)',
              color: debugMode ? 'white' : 'rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              zIndex: 1
            }}
          >
            {debugMode ? '🔍 RAW' : '🎨 FORMATTED'}
          </button>
          </div>

        {/* Chat Area - Glassmorphism */}
        <div style={{
          flex: 1,
          padding: '48px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(40px) saturate(1.2)',
        }}>
          {messages.map((message, index) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                gap: '16px',
                opacity: 0,
                animation: `messageSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                animationDelay: `${(index % 10) * 0.1}s`,
                ...(message.role === 'user' ? { flexDirection: 'row-reverse' } : {})
              }}
            >
              {/* Avatar - Glassmorphism */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '24px',
                background: message.role === 'user' 
                  ? 'linear-gradient(135deg, #34c759 0%, #30d158 100%)'
                  : 'linear-gradient(135deg, #7877c6 0%, #ff2d55 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                fontWeight: '700',
                flexShrink: 0,
                boxShadow: message.role === 'user'
                  ? '0 4px 16px rgba(52, 199, 89, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  : '0 4px 16px rgba(120, 119, 198, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                animation: 'avatarGlow 4s ease-in-out infinite alternate',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Avatar Shine Effect */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.15) 50%, transparent 70%)',
                  animation: 'avatarShine 3s linear infinite'
                }} />
                {message.role === 'user' ? 'U' : 'AI'}
              </div>

              {/* Message Content - Glassmorphism */}
              <div style={{
                background: message.role === 'user'
                  ? 'rgba(120, 119, 198, 0.12)'
                  : 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(60px) saturate(1.8) brightness(1.1)',
                border: message.role === 'user'
                  ? '1px solid rgba(120, 119, 198, 0.25)'
                  : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                padding: '24px 28px',
                maxWidth: '70%',
                boxShadow: `
                  0 4px 24px rgba(0, 0, 0, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2),
                  0 0 0 1px rgba(255, 255, 255, 0.05)`,
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}>

                {message.isLoading ? (
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    padding: '16px 0',
                    opacity: 0,
                    animation: 'fadeIn 0.3s ease forwards'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#86868b',
                      animation: 'typingPulse 1.4s infinite'
                    }} />
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#86868b',
                      animation: 'typingPulse 1.4s infinite',
                      animationDelay: '0.2s'
                    }} />
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#86868b',
                      animation: 'typingPulse 1.4s infinite',
                      animationDelay: '0.4s'
                    }} />
                  </div>
                                  ) : (
                    <div style={{
                      fontSize: '16px',
                      lineHeight: '1.6',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '400',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      {debugMode && message.rawContent ? (
                        <div>
                          <div style={{
                            fontSize: '11px',
                            color: 'rgba(255, 255, 255, 0.6)',
                            marginBottom: '8px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Raw Response:
                          </div>
                          <pre style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontFamily: 'Monaco, monospace',
                            whiteSpace: 'pre-wrap',
                            overflow: 'auto',
                            maxHeight: '300px',
                            color: 'rgba(255, 255, 255, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(20px)'
                          }}>
                            {message.rawContent}
                          </pre>
                        </div>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: message.content }} />
                      )}
                    </div>
                  )}
                
                {/* Sources - Collapsible */}
                {message.sources && message.sources.length > 0 && (
                  <details style={{
                    marginTop: '16px',
                    background: 'rgba(0, 122, 255, 0.08)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    border: '1px solid rgba(0, 122, 255, 0.2)'
                  }}>
                    <summary style={{
                      cursor: 'pointer',
                      fontWeight: '600',
                      color: '#007aff',
                      marginBottom: '8px',
                      outline: 'none',
                      userSelect: 'none',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      📚 Sources ({message.sources.length})
                    </summary>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                      {message.sources.map((source, idx) => (
                        <li key={idx} style={{ 
                          margin: '4px 0', 
                          lineHeight: '1.4', 
                          color: '#666',
                          fontSize: '13px'
                        }}>
                          {typeof source === 'string' ? source : source.title || source.text || source}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                
                <div style={{
                  fontSize: '11px',
                  color: '#86868b',
                  marginTop: '8px',
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {message.timestamp}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Glassmorphism */}
        <div style={{
          padding: '32px 48px 48px',
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(60px) brightness(1.2)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative'
        }}>
          {/* Input Glow Effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, 
              transparent 0%, 
              rgba(120, 119, 198, 0.4) 25%, 
              rgba(255, 45, 85, 0.4) 50%, 
              rgba(52, 199, 89, 0.4) 75%, 
              transparent 100%)`,
            animation: 'inputGlow 5s ease-in-out infinite alternate'
          }} />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.08)',
            border: input ? '1px solid rgba(120, 119, 198, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
            padding: '20px 24px',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: input 
              ? '0 0 0 4px rgba(120, 119, 198, 0.1), 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
              : '0 4px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(60px) saturate(1.5) brightness(1.1)',
            overflow: 'hidden',
            ...(input ? {
              background: 'rgba(255, 255, 255, 0.12)',
              transform: 'translateY(-2px)'
            } : {})
          }}>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message AI Assistant..."
              disabled={isLoading || !jwtToken || !user}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '16px',
                fontFamily: 'inherit',
                color: 'rgba(255, 255, 255, 0.9)',
                resize: 'none',
                minHeight: '24px',
                maxHeight: '150px'
              }}
              rows={1}
            />
            
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{
                background: isLoading || !input.trim() || !jwtToken || !user 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'linear-gradient(135deg, #7877c6 0%, #ff2d55 100%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                width: '40px',
                height: '40px',
                cursor: isLoading || !input.trim() || !jwtToken || !user ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                color: 'white',
                boxShadow: isLoading || !input.trim() || !jwtToken || !user
                  ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                  : '0 4px 12px rgba(120, 119, 198, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                if (!isLoading && input.trim() && jwtToken && user) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #8a89d0 0%, #ff4569 100%)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(120, 119, 198, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && input.trim() && jwtToken && user) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #7877c6 0%, #ff2d55 100%)';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(120, 119, 198, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }
              }}
            >
              {/* Button Shine Effect */}
              {!isLoading && input.trim() && jwtToken && user && (
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                  animation: 'buttonShine 2s linear infinite'
                }} />
              )}
              {isLoading ? (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m22 2-7 20-4-9-9-4z"/>
                  <path d="M22 2 11 13"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Glassmorphism CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Glassmorphism Animations */
          @keyframes ambientPulse {
            0% { opacity: 0.4; }
            100% { opacity: 0.8; }
          }
          
          @keyframes holographicFlow {
            0% { opacity: 0.6; transform: translateX(-50%); }
            100% { opacity: 1; transform: translateX(50%); }
          }
          
          @keyframes headerSweep {
            0% { left: -100%; }
            50% { left: 100%; }
            100% { left: -100%; }
          }
          
          @keyframes textShimmer {
            0% { filter: brightness(1) contrast(1); }
            100% { filter: brightness(1.3) contrast(1.2); }
          }
          
          @keyframes statusPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.3); }
          }
          
          @keyframes orbFloat {
            0%, 100% { 
              transform: translateY(0px) translateX(0px) scale(1);
              opacity: 0.6;
            }
            25% { 
              transform: translateY(-20px) translateX(15px) scale(1.05);
              opacity: 0.8;
            }
            50% { 
              transform: translateY(-10px) translateX(-10px) scale(0.95);
              opacity: 0.7;
            }
            75% { 
              transform: translateY(-15px) translateX(-15px) scale(1.02);
              opacity: 0.9;
            }
          }
          
          @keyframes avatarGlow {
            0% { 
              box-shadow: 0 4px 16px rgba(120, 119, 198, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
              transform: scale(1);
            }
            100% { 
              box-shadow: 0 8px 24px rgba(120, 119, 198, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4);
              transform: scale(1.02);
            }
          }
          
          @keyframes avatarShine {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
          }
          
          @keyframes contentShimmer {
            0% { left: -100%; }
            50% { left: 100%; }
            100% { left: -100%; }
          }
          
          @keyframes borderGlow {
            0% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          
          @keyframes inputGlow {
            0% { opacity: 0.6; }
            100% { opacity: 1; }
          }
          
          
          @keyframes buttonShine {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
          }
          
          @keyframes messageSlideIn {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes fadeIn {
            to { opacity: 1; }
          }
          
          @keyframes typingPulse {
            0%, 60%, 100% { opacity: 0.3; }
            30% { opacity: 1; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(-20px) rotate(2deg); }
            50% { transform: translateY(-10px) rotate(1deg); }
            75% { transform: translateY(-15px) rotate(-1deg); }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          /* Clean scrollbars */
          ::-webkit-scrollbar {
            width: 6px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.02);
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 3px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.15);
          }
          
          /* Clean placeholder styling */
          ::placeholder {
            color: #86868b !important;
          }
          
          /* Hover effects for message cards */
          .message-content:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          }
        `
      }} />
    </div>
  );
};

export default AiChat; 