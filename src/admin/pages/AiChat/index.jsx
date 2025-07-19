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

// Initialize markdown-it with clean, simple configuration
const md = new MarkdownIt({
  html: false,         // Disable HTML tags in source for security
  xhtmlOut: false,     // Use HTML5
  breaks: true,        // Convert \n to <br>
  langPrefix: 'language-',
  linkify: true,       // Auto-convert URLs to links
  typographer: true    // Use smart quotes and other typographic improvements
});

// Simple markdown rendering - let CSS handle all the styling
function renderMarkdown(text) {
  if (!text) return '';
  return md.render(text);
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
      rawContent: '', // For streaming text before markdown formatting
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

      // Handle different response types
      if (contentType && contentType.includes('text/event-stream') && response.body) {
        console.log('[AI Chat] Processing streaming response');
        let chunkCount = 0;
        let allChunks = []; // Store all raw chunks

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log(`[AI Chat] Stream completed after ${chunkCount} chunks`);
              console.log(`[AI Chat] Total chunks received: ${allChunks.length}`);
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            chunkCount++;
            console.log(`[AI Chat] Chunk ${chunkCount}:`, JSON.stringify(chunk));

            // Store raw chunk for final processing
            allChunks.push(chunk);

            // Just extract and accumulate raw text content for real-time display
            // Don't try to process markdown structure during streaming
            const lines = chunk.split('\n');
            let chunkText = '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                if (!line.includes('[DONE]')) {
                  const data = line.substring(6); // Remove "data: " prefix
                  chunkText += data; // Just accumulate raw content
                }
              }
            }

            // Update raw content for real-time display during streaming
            setMessages(prevMessages => 
              prevMessages.map(msg => 
                msg.id === assistantMessage.id
                  ? { ...msg, rawContent: (msg.rawContent || '') + chunkText }
                  : msg
              )
            );
          }

          // Now apply markdown formatting to the complete streamed text
          console.log('[AI Chat] Stream complete, applying final markdown formatting');
          
          // Now process ALL chunks at once to get the complete text
          let finalText = '';
          
          for (const chunk of allChunks) {
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                if (!line.includes('[DONE]')) {
                  const data = line.substring(6); // Remove "data: " prefix
                  
                  if (data === '') {
                    // Empty data content represents a newline in the original text
                    finalText += '\n';
                  } else {
                    // Regular data content - concatenate as-is (spaces are already embedded)
                    finalText += data;
                  }
                }
              }
            }
          }
          
          console.log('[AI Chat] ✅ Final reconstructed text:');
          console.log(finalText);
          console.log('[AI Chat] ✅ Text length:', finalText.length);
          console.log('[AI Chat] ✅ Line count:', finalText.split('\n').length);

          // Now extract sources from the final complete text
          const sources = [];
          const sourceRegex = /\[source:\s*([^]]+)\]/g;
          let match;
          while ((match = sourceRegex.exec(finalText)) !== null) {
            if (!sources.includes(match[1])) {
              sources.push(match[1]);
            }
          }

          // Remove source references from content for display
          const contentWithoutSources = finalText.replace(sourceRegex, '').trim();
          
          console.log('[AI Chat] ✅ Content after source removal:');
          console.log(contentWithoutSources);
          
          // Verify markdown structure looks correct
          const lines = contentWithoutSources.split('\n');
          console.log('[AI Chat] 🔍 Markdown structure analysis:');
          lines.forEach((line, i) => {
            if (line.startsWith('#')) {
              console.log(`  Line ${i + 1}: HEADER -> "${line}"`);
            } else if (line.startsWith('-') || line.startsWith('*')) {
              console.log(`  Line ${i + 1}: LIST ITEM -> "${line}"`);
            } else if (line.trim() === '') {
              console.log(`  Line ${i + 1}: EMPTY LINE`);
            } else if (line.trim().length > 0) {
              console.log(`  Line ${i + 1}: TEXT -> "${line}"`);
            }
          });

          // Apply markdown formatting to the complete final text
          console.log('[AI Chat] 📝 Applying markdown-it processing...');
          const processedHtml = md.render(contentWithoutSources);
          
          console.log('[AI Chat] ✅ Final HTML output:');
          console.log(processedHtml);

          // Update the message with final processed content
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === assistantMessage.id
                ? { 
                    ...msg, 
                    rawContent: '', // Clear raw content
                    content: processedHtml, // Set formatted HTML
                    sources: sources.map((src, idx) => ({ 
                      id: idx + 1, 
                      text: src, 
                      title: src.length > 60 ? src.substring(0, 60) + '...' : src 
                    })),
                    isLoading: false 
                  }
                : msg
            )
          );
          
          // Refocus input field after streaming is complete
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          }, 100);

        } catch (streamError) {
          console.error('[AI Chat] Stream reading error:', streamError);
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, content: 'Error reading response stream', isLoading: false }
                : msg
            )
          );
        } finally {
          reader.releaseLock();
        }
      } else {
        // Handle non-streaming JSON response
        const data = await response.json();
        console.log('🔍 Raw API Response:', data.response);
        
        const sources = extractSources(data.response);
        let cleanedText = data.response.replace(/\[source: .+?\]/g, '');
        
        // Apply ONLY markdown-it processing - no regex manipulation
        const finalHtml = renderMarkdown(cleanedText.trim());
        
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === assistantMessage.id
              ? { 
                  ...msg, 
                  content: finalHtml,
                  sources: sources.map((src, idx) => ({ 
                    id: idx + 1, 
                    text: src, 
                    title: src.length > 60 ? src.substring(0, 60) + '...' : src 
                  })),
                  isLoading: false 
                }
              : msg
          )
        );

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
                        <div className="message-content" dangerouslySetInnerHTML={{ __html: message.content }} />
                      )}
                    </div>
                  )}
                
                {/* Sources - Glassmorphism Style */}
                {message.sources && message.sources.length > 0 && (
                  <details style={{
                    marginTop: '20px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(30px) saturate(1.2)',
                    padding: '16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 2px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}>
                    <summary style={{
                      cursor: 'pointer',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.8)',
                      marginBottom: '12px',
                      outline: 'none',
                      userSelect: 'none',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      transition: 'color 0.2s ease'
                    }}>
                      📚 Sources ({message.sources.length})
                    </summary>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                      {message.sources.map((source, idx) => (
                        <li key={idx} style={{ 
                          margin: '6px 0', 
                          lineHeight: '1.5', 
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '14px'
                        }}>
                          {typeof source === 'string' ? source : source.title || source.text || source}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginTop: '12px',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.02em'
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

          /* Message Content Glassmorphism Styling */
          .message-content h1, .message-content h2, .message-content h3, 
          .message-content h4, .message-content h5, .message-content h6 {
            color: rgba(255, 255, 255, 0.95) !important;
            font-weight: 600 !important;
            margin: 20px 0 12px 0 !important;
            line-height: 1.3 !important;
            letter-spacing: -0.02em !important;
          }
          
          /* More specific selectors for better override */
          div.message-content h1, div.message-content h2, div.message-content h3,
          div.message-content h4, div.message-content h5, div.message-content h6 {
            color: rgba(255, 255, 255, 0.95) !important;
            font-weight: 600 !important;
          }
          
          .message-content h1 { font-size: 24px !important; }
          .message-content h2 { font-size: 20px !important; }
          .message-content h3 { font-size: 18px !important; }
          .message-content h4 { font-size: 16px !important; }
          .message-content h5 { font-size: 15px !important; }
          .message-content h6 { font-size: 14px !important; }
          
          .message-content p, div.message-content p {
            color: rgba(255, 255, 255, 0.85) !important;
            line-height: 1.6 !important;
            margin: 12px 0 !important;
            font-size: 15px !important;
          }
          
          .message-content strong, .message-content b,
          div.message-content strong, div.message-content b {
            color: rgba(255, 255, 255, 0.95) !important;
            font-weight: 600 !important;
          }
          
          .message-content em, .message-content i,
          div.message-content em, div.message-content i {
            color: rgba(255, 255, 255, 0.8) !important;
            font-style: italic !important;
          }
          
          .message-content ul, .message-content ol,
          div.message-content ul, div.message-content ol {
            color: rgba(255, 255, 255, 0.85) !important;
            margin: 12px 0 !important;
            padding-left: 20px !important;
          }
          
          .message-content li, div.message-content li {
            color: rgba(255, 255, 255, 0.85) !important;
            margin: 6px 0 !important;
            line-height: 1.5 !important;
          }
          
          .message-content li::marker {
            color: rgba(255, 255, 255, 0.6) !important;
          }
          
          .message-content code {
            background: rgba(255, 255, 255, 0.1) !important;
            color: rgba(255, 255, 255, 0.9) !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
            font-family: 'Monaco', 'Consolas', monospace !important;
            font-size: 13px !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
          }
          
          .message-content pre {
            background: rgba(255, 255, 255, 0.08) !important;
            color: rgba(255, 255, 255, 0.9) !important;
            padding: 16px !important;
            border-radius: 8px !important;
            overflow-x: auto !important;
            margin: 16px 0 !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            font-family: 'Monaco', 'Consolas', monospace !important;
            font-size: 13px !important;
            line-height: 1.4 !important;
          }
          
          .message-content pre code {
            background: none !important;
            border: none !important;
            padding: 0 !important;
            color: inherit !important;
          }
          
          .message-content blockquote {
            border-left: 3px solid rgba(255, 255, 255, 0.3) !important;
            background: rgba(255, 255, 255, 0.05) !important;
            padding: 12px 16px !important;
            margin: 16px 0 !important;
            border-radius: 0 8px 8px 0 !important;
            color: rgba(255, 255, 255, 0.8) !important;
            font-style: italic !important;
          }
          
          .message-content a {
            color: rgba(120, 119, 198, 0.9) !important;
            text-decoration: underline !important;
            text-decoration-color: rgba(120, 119, 198, 0.5) !important;
            transition: color 0.2s ease !important;
          }
          
          .message-content a:hover {
            color: rgba(120, 119, 198, 1) !important;
            text-decoration-color: rgba(120, 119, 198, 0.8) !important;
          }
          
          .message-content table {
            border-collapse: collapse !important;
            width: 100% !important;
            margin: 16px 0 !important;
            background: rgba(255, 255, 255, 0.05) !important;
            border-radius: 8px !important;
            overflow: hidden !important;
          }
          
          .message-content th, .message-content td {
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            padding: 8px 12px !important;
            color: rgba(255, 255, 255, 0.85) !important;
            text-align: left !important;
          }
          
          .message-content th {
            background: rgba(255, 255, 255, 0.1) !important;
            font-weight: 600 !important;
            color: rgba(255, 255, 255, 0.95) !important;
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