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
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 25%, #f1f3f4 50%, #ffffff 75%, #f8f9fa 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #007aff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <div style={{ color: '#86868b', fontSize: '14px' }}>
          Loading your AI assistant...
        </div>
      </div>
    );
  }

  // Show error state if authentication failed
  if (error) {
    return (
      <div style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 25%, #f1f3f4 50%, #ffffff 75%, #f8f9fa 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '20px'
      }}>
        <div style={{
          background: '#ff3b30',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          marginBottom: '16px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          ⚠️ {error}
        </div>
        <div style={{ 
          color: '#86868b', 
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
      background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 25%, #f1f3f4 50%, #ffffff 75%, #f8f9fa 100%)',
      minHeight: '100vh',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Ambient Background */}
      <div style={{
        position: 'fixed',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: `
          radial-gradient(circle at 30% 20%, rgba(120, 119, 198, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 70% 80%, rgba(255, 99, 99, 0.02) 0%, transparent 50%)
        `,
        animation: 'ambientGlow 20s ease-in-out infinite alternate',
        zIndex: 0
      }} />

      {/* Floating Elements */}
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
          width: '120px',
          height: '120px',
          top: '10%',
          right: '15%',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.03) 0%, rgba(88, 86, 214, 0.02) 100%)',
          animation: 'float 20s infinite ease-in-out'
        }} />
        <div style={{
          position: 'absolute',
          width: '80px',
          height: '80px',
          bottom: '20%',
          left: '10%',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.03) 0%, rgba(88, 86, 214, 0.02) 100%)',
          animation: 'float 20s infinite ease-in-out',
          animationDelay: '-7s'
        }} />
        <div style={{
          position: 'absolute',
          width: '60px',
          height: '60px',
          top: '60%',
          right: '8%',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.03) 0%, rgba(88, 86, 214, 0.02) 100%)',
          animation: 'float 20s infinite ease-in-out',
          animationDelay: '-14s'
        }} />
      </div>

      {/* Main Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        zIndex: 1
      }}>
                  {/* Header */}
          <div style={{
            padding: '20px 32px',
            borderBottom: '0.5px solid rgba(0, 0, 0, 0.06)',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#1d1d1f',
                letterSpacing: '-0.02em',
                textAlign: 'center',
                margin: 0
              }}>
                AI Assistant
              </h1>
              <div style={{
                fontSize: '13px',
                fontWeight: '400',
                color: '#86868b',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textAlign: 'center',
                marginTop: '4px'
              }}>
                Knowledge Explorer
              </div>
            </div>
            
            {/* Debug Toggle */}
            <button
              onClick={() => setDebugMode(!debugMode)}
              style={{
                background: debugMode ? '#007aff' : 'rgba(0, 0, 0, 0.06)',
                color: debugMode ? 'white' : '#86868b',
                border: 'none',
                borderRadius: '12px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {debugMode ? '🔍 RAW' : '🎨 FORMATTED'}
            </button>
          </div>

        {/* Chat Area */}
        <div style={{
          flex: 1,
          padding: '32px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
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
              {/* Avatar */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '18px',
                background: message.role === 'user' 
                  ? 'linear-gradient(135deg, #34c759 0%, #30d158 100%)'
                  : 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                flexShrink: 0,
                boxShadow: message.role === 'user'
                  ? '0 2px 12px rgba(52, 199, 89, 0.2)'
                  : '0 2px 12px rgba(0, 122, 255, 0.2)'
              }}>
                {message.role === 'user' ? 'U' : 'AI'}
              </div>

              {/* Message Content */}
              <div style={{
                background: message.role === 'user'
                  ? 'linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(88, 86, 214, 0.1) 100%)'
                  : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: message.role === 'user'
                  ? '0.5px solid rgba(0, 122, 255, 0.2)'
                  : '0.5px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '16px',
                padding: '20px 24px',
                maxWidth: '70%',
                boxShadow: '0 1px 8px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.3s ease'
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
                      fontSize: '15px',
                      lineHeight: '1.5',
                      color: '#1d1d1f',
                      fontWeight: '400'
                    }}>
                      {debugMode && message.rawContent ? (
                        <div>
                          <div style={{
                            fontSize: '11px',
                            color: '#86868b',
                            marginBottom: '8px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Raw Response:
                          </div>
                          <pre style={{
                            background: 'rgba(0, 0, 0, 0.06)',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontFamily: 'Monaco, monospace',
                            whiteSpace: 'pre-wrap',
                            overflow: 'auto',
                            maxHeight: '300px'
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

        {/* Input Area */}
        <div style={{
          padding: '24px 32px 32px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(30px)',
          borderTop: '0.5px solid rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.9)',
            border: input ? '0.5px solid #007aff' : '0.5px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '20px',
            padding: '16px 56px 16px 20px',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: input ? '0 0 0 3px rgba(0, 122, 255, 0.1), 0 4px 20px rgba(0, 0, 0, 0.08)' : '0 2px 16px rgba(0, 0, 0, 0.04)'
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message AI Assistant..."
              disabled={isLoading || !jwtToken || !user}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '15px',
                fontFamily: 'inherit',
                color: '#1d1d1f',
                resize: 'none',
                minHeight: '20px',
                maxHeight: '120px'
              }}
              rows={1}
            />
            
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: isLoading || !input.trim() || !jwtToken || !user ? '#86868b' : '#007aff',
                border: 'none',
                borderRadius: '16px',
                width: '32px',
                height: '32px',
                cursor: isLoading || !input.trim() || !jwtToken || !user ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                if (!isLoading && input.trim() && jwtToken && user) {
                  e.currentTarget.style.background = '#0056d6';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && input.trim() && jwtToken && user) {
                  e.currentTarget.style.background = '#007aff';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }
              }}
            >
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

      {/* Sophisticated CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes ambientGlow {
            0% { transform: rotate(0deg) scale(1); }
            100% { transform: rotate(1deg) scale(1.02); }
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