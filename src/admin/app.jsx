import React from 'react';

// Create better icon components with proper sizing and design
const AiChatIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 11.5C21 16.75 16.75 21 11.5 21C10.03 21 8.64 20.66 7.4 20.06L3 21L3.94 16.6C3.34 15.36 3 13.97 3 11.5C3 6.25 7.25 2 12.5 2C17.75 2 22 6.25 22 11.5C22 11.67 21.99 11.84 21.98 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8.5" cy="11.5" r="1.5" fill="currentColor"/>
    <circle cx="12.5" cy="11.5" r="1.5" fill="currentColor"/>
    <circle cx="16.5" cy="11.5" r="1.5" fill="currentColor"/>
  </svg>
);

const BillingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M2 10H22" stroke="currentColor" strokeWidth="2"/>
    <path d="M6 15H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 15H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const BotIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="8" y="7" width="8" height="4" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="9" cy="15" r="1" fill="currentColor"/>
    <circle cx="15" cy="15" r="1" fill="currentColor"/>
    <path d="M9 18H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="3" r="1" fill="currentColor"/>
  </svg>
);

const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="12" width="6" height="9" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="9" y="8" width="6" height="13" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="15" y="3" width="6" height="18" rx="1" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export default {
  register(app) {
    console.log('🎯 [ADMIN APP] Register function called');
    
    // Register custom pages
    app.addMenuLink({
      to: '/ai-chat',
      icon: AiChatIcon,
      intlLabel: {
        id: 'ai-chat.menu.label',
        defaultMessage: 'AI Chat',
      },
        Component: async () => {
          const component = await import('./pages/AiChat/index.jsx');
          return component.default;
        },
      permissions: [],
    });

      // Add Billing Management menu item
    app.addMenuLink({
      to: '/billing-management',
      icon: BillingIcon,
      intlLabel: {
        id: 'billing-management.menu.label',
        defaultMessage: 'Billing Management',
      },
        Component: async () => {
          const component = await import('./pages/BillingManagement/index.jsx');
          return component.default;
        },
      permissions: [],
    });

      // Add Bot Management menu item
    app.addMenuLink({
      to: '/bot-management',
      icon: BotIcon,
      intlLabel: {
        id: 'bot-management.menu.label',
        defaultMessage: 'Bot Management',
      },
        Component: async () => {
          const component = await import('./pages/BotManagement/index.jsx');
          return component.default;
        },
      permissions: [],
    });
      
    // Add Subscription Usage menu item
      app.addMenuLink({
      to: '/subscription-usage',
      icon: ChartIcon,
        intlLabel: {
        id: 'subscription-usage.menu.label',
        defaultMessage: 'Subscription Usage',
        },
      Component: async () => {
        const component = await import('./pages/SubscriptionUsage/index.jsx');
        return component.default;
      },
      permissions: [],
    });
  },
  
  bootstrap(app) {
    console.log('🚀 [ADMIN APP] Bootstrap starting...');
    
    // Change browser tab title to match "Hello Maggie" theme and maintain it
    const enforceCustomTitle = () => {
      const customTitle = 'Hello Maggie!';
      
      // Set initial title
      document.title = customTitle;
      console.log('🎯 [ADMIN APP] Browser tab title set to:', customTitle);
      
      // Monitor for title changes using MutationObserver (event-driven, no timers)
      const titleObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && document.title !== customTitle) {
            console.log('🔄 [ADMIN APP] Title changed from:', document.title, 'back to:', customTitle);
            document.title = customTitle;
          }
        });
      });
      
      // Start observing the document head for title changes
      const head = document.querySelector('head');
      if (head) {
        titleObserver.observe(head, {
          childList: true,
          subtree: true
        });
        console.log('✅ [ADMIN APP] Title enforcement system active');
      }
    };
    
    // Apply title enforcement
    enforceCustomTitle();
    
    // Inject registration extension script
    const injectRegistrationExtension = () => {
      console.log('📝 [ADMIN APP] Injecting registration extension script...');
      
      try {
        // Check if script is already injected
        if (document.querySelector('[data-registration-extension="true"]')) {
          console.log('⚠️ [ADMIN APP] Registration extension already injected, skipping');
          return;
        }
        
        // Create and inject the registration extension script
        const registrationScript = document.createElement('script');
        registrationScript.src = '/admin-registration-extension.js';
        registrationScript.setAttribute('data-registration-extension', 'true');
        registrationScript.async = true;
        document.head.appendChild(registrationScript);
        console.log('✅ [ADMIN APP] Registration extension script injected');
        
      } catch (error) {
        console.error('❌ [ADMIN APP] Error injecting registration extension script:', error);
      }
    };
    
    // Inject registration extension immediately
    injectRegistrationExtension();
    
    // Inject AI bot widget scripts
    const injectAiBotWidget = () => {
      console.log('🤖 [ADMIN APP] Injecting AI bot widget scripts...');
      
      try {
        // Check if scripts are already injected to avoid duplicates
        if (document.querySelector('[data-ai-widget-injected="true"]')) {
          console.log('⚠️ [ADMIN APP] AI widget scripts already injected, skipping');
          return;
        }
        
        // Create a marker to track injection
        const marker = document.createElement('meta');
        marker.setAttribute('data-ai-widget-injected', 'true');
        document.head.appendChild(marker);
        
        // 1. Markdown renderer
        const markedScript = document.createElement('script');
        markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        markedScript.async = true;
        document.head.appendChild(markedScript);
        console.log('✅ [ADMIN APP] Marked.js script injected');
        
        // 2. DOMPurify sanitizer (optional but recommended)
        const domPurifyScript = document.createElement('script');
        domPurifyScript.src = 'https://cdn.jsdelivr.net/npm/dompurify@3.0.2/dist/purify.min.js';
        domPurifyScript.async = true;
        document.head.appendChild(domPurifyScript);
        console.log('✅ [ADMIN APP] DOMPurify script injected');
        
        // 3. AI Bot widget loader (with defer to wait for dependencies)
        const widgetScript = document.createElement('script');
        widgetScript.src = 'https://knowledge-bot-retrieval.onrender.com/static/widget.js';
        widgetScript.setAttribute('data-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55X2lkIjo3LCJib3RfaWQiOjgsImlhdCI6MTc1MzgxNzc3NX0.fH4fXOboUiFOVMCCuzayE_Zd4b4tjZ8M-aguDu40--g');
        widgetScript.defer = true;
        document.head.appendChild(widgetScript);
        console.log('✅ [ADMIN APP] AI Bot widget script injected');
        
        console.log('🎉 [ADMIN APP] All AI bot widget scripts successfully injected');
        
      } catch (error) {
        console.error('❌ [ADMIN APP] Error injecting AI bot widget scripts:', error);
      }
    };
    
    // Inject widget scripts immediately
    injectAiBotWidget();
    
    // Enhanced approach: hide Content Manager and Settings for Standard User role
    // Pure event-driven role detection - NO TIMERS
    const setupRoleDetection = () => {
      console.log('🔍 [ADMIN APP] Setting up pure event-driven role detection...');
      
      let isProcessing = false;
      
      // Function to hide dashboard widgets for Standard Users
      const hideDashboardWidgets = () => {
        console.log('🏠 [ADMIN APP] Hiding dashboard widgets for Standard User...');
        
        let widgetHiddenCount = 0;
        
        // Debug: Log all headings to see what's actually available
        const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        console.log('🔍 [ADMIN APP] DEBUG: All headings found:', Array.from(allHeadings).map(h => h.textContent?.trim()));
        
                // Search for widgets by EXACT heading text only (much more precise)
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
          const text = heading.textContent?.trim() || '';
          
          // Only match EXACT widget titles, not content that contains them
          const isExactLastEditedWidget = text === 'Last edited entries' || text === 'Last Edited Entries';
          const isExactLastPublishedWidget = text === 'Last published entries' || text === 'Last Published Entries';
          
          if (isExactLastEditedWidget || isExactLastPublishedWidget) {
            console.log(`🔍 [ADMIN APP] DEBUG: Found exact widget heading: "${text}"`);
            
            // Find the closest widget container, but be very specific and safe
            let container = heading.closest('[class*="Widget"]') || 
                           heading.closest('[class*="Card"]') ||
                           heading.closest('[data-testid*="widget"]') ||
                           heading.closest('[data-testid*="recent"]');
            
            // If no specific widget container, try parent but with safety checks
            if (!container) {
              let parent = heading.parentElement;
              // Go up max 3 levels and avoid body/html
              for (let i = 0; i < 3 && parent && parent.tagName !== 'BODY' && parent.tagName !== 'HTML'; i++) {
                if (parent.tagName === 'DIV' || parent.tagName === 'SECTION' || parent.tagName === 'ARTICLE') {
                  container = parent;
                  break;
                }
                parent = parent.parentElement;
              }
            }
            
            if (container instanceof HTMLElement && 
                container.tagName !== 'BODY' && 
                container.tagName !== 'HTML' &&
                container.tagName !== 'MAIN') {
              // Add CSS class instead of inline styles for better debugging
              container.classList.add('strapi-standard-user-hidden-widget');
              
              widgetHiddenCount++;
              console.log(`🚫 [ADMIN APP] Hidden dashboard widget: "${text}" (container: ${container.tagName}${container.className ? '.' + container.className.split(' ').join('.') : ''})`);
            } else {
              console.log(`⚠️ [ADMIN APP] Skipped hiding widget "${text}" - container too broad or unsafe`);
            }
          }
        });

        
        console.log(`✅ [ADMIN APP] Dashboard widget hiding complete - ${widgetHiddenCount} widgets hidden`);
      };

      const processRoleDetection = async () => {
        if (isProcessing) {
          return; // Prevent duplicate processing only
        }
        
        isProcessing = true;
        
        try {
          console.log('🔍 [ADMIN APP] Checking if menu items should be hidden...');
          
          // Simple API call to get current user's role - using same pattern as AI Chat component
          const getCurrentUserRole = async () => {
            try {
              console.log('🔍 [ADMIN APP] Fetching current user from /admin/users/me...');
              
              // Get JWT token from cookies (same as AI Chat component)
              const getCookieValue = (name) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop().split(';').shift();
                return null;
              };
              
              const jwtToken = getCookieValue('jwtToken');
              
              const headers = {
                'Content-Type': 'application/json',
              };
              
              if (jwtToken) {
                headers['Authorization'] = `Bearer ${jwtToken}`;
              }
              
              const response = await fetch('/admin/users/me', {
                method: 'GET',
                headers,
                credentials: 'include', // Include cookies for authentication
              });
              
              if (!response.ok) {
                console.log(`⚠️ [ADMIN APP] Failed to fetch current user: ${response.status} (auth may not be ready yet)`);
                return { isStandardUser: false, method: 'api-error', error: response.status };
              }
              
              const userData = await response.json();
              console.log('👤 [ADMIN APP] Current user data:', userData);
              
              // Access nested data structure - Strapi admin API returns {data: {...}}
              const userInfo = userData.data || userData;
              
              // Check if user has roles and if any role is "Standard User"
              const userRoles = userInfo.roles || [];
              console.log('🎭 [ADMIN APP] User roles:', userRoles);
              
              const isStandardUser = userRoles.some(role => 
                role.name === 'Standard User' || 
                role.code === 'standard-user'
              );
              
              console.log(`🎯 [ADMIN APP] Is Standard User: ${isStandardUser}`);
              
              return {
                isStandardUser,
                method: 'api-roles',
                userRoles: userRoles.map(r => r.name),
                userId: userInfo.id
              };
              
            } catch (error) {
              console.log('❌ [ADMIN APP] Error fetching user role:', error);
              return { isStandardUser: false, method: 'api-error', error: error.message };
            }
          };
          
          const { isStandardUser, method, userRoles, userId, error } = await getCurrentUserRole();
          
          console.log('🎭 [ADMIN APP] User role check results:', {
            isStandardUser,
            method,
            userRoles,
            userId,
            error
          });
          
          if (isStandardUser) {
            console.log('🚫 [ADMIN APP] Hiding Content Manager and Settings for Standard User role');
            
            // Apply CSS hiding immediately
            let style = document.querySelector('style[data-hide-menu-items="true"]');
            if (!style) {
              style = document.createElement('style');
            style.setAttribute('data-hide-menu-items', 'true');
            style.textContent = `
                /* Hide Content Manager and Settings for Standard Users */
                a[href="/admin/content-manager"],
                a[href*="/content-manager"],
                a[href="/admin/settings"],
                a[href="/admin/settings/"],
                li:has(a[href*="content-manager"]),
                li:has(a[href="/admin/settings"]) {
                  display: none !important;
                  visibility: hidden !important;
                  opacity: 0 !important;
                  height: 0 !important;
                  overflow: hidden !important;
                }

                /* Hide Dashboard Widgets for Standard Users */
                /* Class-based hiding applied by JavaScript */
                .strapi-standard-user-hidden-widget {
                  display: none !important;
                  visibility: hidden !important;
                  opacity: 0 !important;
                  height: 0 !important;
                  overflow: hidden !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
              `;
              document.head.appendChild(style);
            }
            
            // Apply JavaScript hiding immediately
            const links = document.querySelectorAll('a[href*="/admin/"]');
            let hiddenCount = 0;
            
            links.forEach(link => {
              if (!(link instanceof HTMLElement)) return;
              
              const href = link.getAttribute('href') || '';
              const text = link.textContent?.trim() || '';
              
              const isContentManager = href.includes('/content-manager') || text === 'Content Manager';
              const isSettings = (href === '/admin/settings' || href === '/admin/settings/') && 
                                !href.includes('billing') && !href.includes('subscription') && !href.includes('bot');
              
              if (isContentManager || isSettings) {
                link.style.display = 'none';
                link.style.visibility = 'hidden';
                link.style.opacity = '0';
                
                // Hide parent containers
                const parent = link.closest('li') || link.closest('[role="menuitem"]');
                if (parent instanceof HTMLElement) {
                  parent.style.display = 'none';
                  parent.style.visibility = 'hidden';
                  parent.style.opacity = '0';
                  parent.style.height = '0';
                  parent.style.overflow = 'hidden';
                }
                
                hiddenCount++;
                console.log(`🚫 [ADMIN APP] Hidden menu item: "${text}" (${href})`);
              }
            });
            
            console.log(`✅ [ADMIN APP] Standard User menu hiding complete - ${hiddenCount} items hidden`);
            
            // Also hide dashboard widgets for Standard Users
            hideDashboardWidgets();
            
            // Apply additional Standard User customizations
            // 🎯 DASHBOARD-ONLY: Only add 3-step instructions on dashboard
            const currentPath = window.location.pathname;
            if (currentPath === '/admin' || currentPath === '/admin/' || currentPath.endsWith('/admin')) {
              console.log('📍 [ADMIN APP] On dashboard page - adding Standard User instructions');
              replaceGettingStartedForStandardUsers();
            } else {
              console.log('📍 [ADMIN APP] Not on dashboard - skipping Standard User instructions');
            }
            
            // 🎯 MEDIA LIBRARY ONLY: Only add media library controls on upload pages
            if (currentPath.includes('/admin/plugins/upload')) {
              console.log('📍 [ADMIN APP] On media library page - setting up controls');
              setupMediaLibraryControls();
            }
          } else {
            console.log('✅ [ADMIN APP] Not a Standard User - all menu items remain visible');
          }
        } catch (error) {
          console.error('❌ [ADMIN APP] Error in role detection:', error);
        } finally {
          isProcessing = false;
        }
      };
      
      // Set up MutationObserver for DOM changes
      const observer = new MutationObserver((mutations) => {
        // Check if any significant changes occurred
        const hasSignificantChanges = mutations.some(mutation => 
          mutation.type === 'childList' && mutation.addedNodes.length > 0
        );
        
        if (hasSignificantChanges) {
          console.log('🔄 [ADMIN APP] DOM change detected, checking roles...');
          processRoleDetection().catch(error => {
            console.log('❌ [ADMIN APP] Error in role detection:', error);
          });
        }
            });
            
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });

      // Set up storage event listener for auth changes
      window.addEventListener('storage', (event) => {
        // Check if any JWT-like token was set (contains dots like JWT tokens)
        if (event.newValue && event.newValue.includes('.') && event.newValue.split('.').length === 3) {
          console.log(`🔑 [ADMIN APP] JWT-like token detected in storage key "${event.key}", checking roles...`);
          processRoleDetection().catch(error => {
            console.log('❌ [ADMIN APP] Error in role detection:', error);
          });
        }
      });
      
      // Intercept the /admin/users/me response to detect when authentication completes
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        
        // Check if this is a successful /admin/users/me call
        let url = '';
        if (typeof args[0] === 'string') {
          url = args[0];
        } else if (args[0] instanceof URL) {
          url = args[0].href;
        } else if (args[0] instanceof Request) {
          url = args[0].url;
        }
        
        if (url.includes('/admin/users/me') && response.status === 200) {
          console.log('🔑 [ADMIN APP] User authentication detected via API call, checking roles...');
          processRoleDetection().catch(error => {
            console.log('❌ [ADMIN APP] Error in role detection:', error);
          });
        }
        
        // Handle upload responses with toast notifications
        if (url.includes('/upload') && response.status === 201) {
          console.log('📤 [ADMIN APP] Upload success detected, checking for notification message...');
          
          // Clone the response to read it without consuming it
          const clonedResponse = response.clone();
          clonedResponse.json().then(data => {
            if (data && data.message) {
              console.log('📢 [ADMIN APP] Found upload message:', data.message);
              
              // Display persistent toast notification using Strapi's notification system
              // This targets the global notification container
              setTimeout(() => {
                const event = new CustomEvent('strapi-notification', {
                  detail: {
                    type: 'success',
                    message: data.message,
                    timeout: 0  // Make persistent - requires manual dismissal
                  }
                });
                window.dispatchEvent(event);
                
                // Fallback: Try to find and use Strapi's notification API if available
                if (window.strapi && window.strapi['notification']) {
                  window.strapi['notification'].success(data.message);
                } else if (window.dispatchEvent) {
                  // Create a persistent toast element as final fallback
                  const toast = document.createElement('div');
                  toast.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #28a745;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 4px;
                    z-index: 9999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    max-width: 400px;
                    word-wrap: break-word;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                  `;
                  
                  // Create message and close button
                  const messageSpan = document.createElement('span');
                  messageSpan.textContent = data.message;
                  messageSpan.style.marginRight = '10px';
                  
                  const closeButton = document.createElement('span');
                  closeButton.innerHTML = '×';
                  closeButton.style.cssText = `
                    font-size: 18px;
                    font-weight: bold;
                    line-height: 1;
                    cursor: pointer;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                  `;
                  closeButton.onmouseover = () => closeButton.style.opacity = '1';
                  closeButton.onmouseout = () => closeButton.style.opacity = '0.8';
                  closeButton.onclick = () => {
                    if (toast.parentNode) {
                      toast.parentNode.removeChild(toast);
                    }
                  };
                  
                  toast.appendChild(messageSpan);
                  toast.appendChild(closeButton);
                  document.body.appendChild(toast);
                  
                  // Also allow clicking the entire toast to dismiss
                  toast.onclick = (e) => {
                    if (e.target === toast || e.target === messageSpan) {
                      if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                      }
                    }
                  };
                }
              }, 100); // Small delay to ensure DOM is ready
            }
          }).catch(error => {
            console.log('⚠️ [ADMIN APP] Could not parse upload response for notification:', error);
          });
        }
        
        // Handle failed login attempts (blocked/unverified accounts)
        if (url.includes('/admin/login') && response.status === 400) {
          console.log('🚫 [ADMIN APP] Failed login detected, redirecting to custom oops page...');
          // Small delay to ensure any pending navigation is complete
          setTimeout(() => {
            window.location.href = '/admin/auth/oops';
          }, 100);
        }
        
        return response;
      };
      
      // Initial check
      processRoleDetection().catch(error => {
        console.log('❌ [ADMIN APP] Error in initial role detection:', error);
      });
      
      console.log('👀 [ADMIN APP] Pure event-driven role detection set up - NO TIMERS');
    };
    
    // 🎯 REPLACE GETTING STARTED SECTION FOR STANDARD USERS
    // Replaces the default "3 steps to get started" with Knowledge Bot-specific steps
    const replaceGettingStartedForStandardUsers = () => {
      console.log('🎯 [ADMIN APP] Replacing getting started section for Standard Users...');
      
      // 🎯 ONLY RUN ON DASHBOARD: Check if we're on the dashboard/home page
      const isDashboardPage = () => {
        const url = window.location.pathname;
        return url === '/admin' || url === '/admin/' || url.endsWith('/admin');
      };
      
      if (!isDashboardPage()) {
        console.log('⏭️ [ADMIN APP] Not on dashboard page, skipping 3-step instructions');
        return;
      }
      
      console.log('✅ [ADMIN APP] On dashboard page, proceeding with 3-step instructions');
      
      // Add a processing flag to prevent multiple simultaneous executions
      let isGettingStartedProcessing = false;
      
      const safelyAddInstructions = () => {
        // Check if already added
        if (document.getElementById('knowledge-bot-instructions')) {
          console.log('⚠️ [DEBUG] Knowledge Bot instructions already exist, skipping');
          return;
        }
        
        if (isGettingStartedProcessing) {
          console.log('⚠️ [DEBUG] Getting started processing already in progress, skipping');
          return;
        }
        
        isGettingStartedProcessing = true;

        // 🎯 ZERO HARD-CODING: Find existing widgets and replicate their structure
        const findWidgetContainer = () => {
          // Look for existing dashboard widgets by their semantic content
          const existingWidgets = document.querySelectorAll('section');
          
          for (const section of existingWidgets) {
            const header = section.querySelector('header h2');
            if (header && (
              header.textContent?.includes('Last edited entries') || 
              header.textContent?.includes('Last published entries')
            )) {
              console.log(`✅ [ADMIN APP] Found existing widget: "${header.textContent}"`);
              // Get the parent container of this widget
              const widgetContainer = section.parentElement;
              const widgetGroupContainer = widgetContainer?.parentElement;
              
              if (widgetGroupContainer) {
                console.log('✅ [ADMIN APP] Found widget group container by following existing widget structure');
                return {
                  container: widgetGroupContainer,
                  referenceWidget: widgetContainer
                };
              }
            }
          }
          
          console.log('❌ [ADMIN APP] Could not find existing widgets to replicate structure');
          return null;
        };

        const widgetInfo = findWidgetContainer();

        if (widgetInfo) {
          console.log('✅ [ADMIN APP] Found widget container, adding Knowledge Bot instructions');

          // 🎯 REPLICATE EXACT STRUCTURE: Copy the classes from the reference widget
          const referenceClasses = widgetInfo.referenceWidget.className;
          
          // Create our widget with the EXACT same structure as existing widgets
          const knowledgeBotWidget = document.createElement('div');
          knowledgeBotWidget.className = referenceClasses; // Use exact same classes as existing widgets
          knowledgeBotWidget.style.gridColumn = '1 / -1'; // Override to span full width (100%)
          knowledgeBotWidget.style.height = 'auto'; // Make height dynamic based on content
          knowledgeBotWidget.style.minHeight = 'auto'; // Remove any inherited min-height constraints
          knowledgeBotWidget.innerHTML = `
            <section aria-labelledby="knowledge-bot-section" class="sc-Qotzb jIPnju sc-fYsHOw hikkEh" id="knowledge-bot-instructions" style="height: auto; min-height: auto;">
              <header class="sc-Qotzb bNXmCQ sc-fYsHOw bfLXnz">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="#8e8ea9" aria-hidden="true">
                  <path d="M16 2C8.269 2 2 8.269 2 16s6.269 14 14 14 14-6.269 14-14S23.731 2 16 2zm0 25c-6.065 0-11-4.935-11-11S9.935 5 16 5s11 4.935 11 11-4.935 11-11 11z"></path>
                  <path d="M16 8c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1s1-.448 1-1V9c0-.552-.448-1-1-1z"></path>
                  <circle cx="16" cy="21" r="1"></circle>
                </svg>
                <h2 id="knowledge-bot-section" class="sc-Qotzb bNXmCQ sc-dKREkF cCcMBD">🤖 Your Knowledge Bot Journey</h2>
              </header>
              <main class="sc-Qotzb dwIKpS" style="overflow: visible; max-height: none; height: auto;">
                <div style="padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; overflow: visible; max-height: none;">
                  <h3 style="color: white; margin: 0 0 32px 0; font-size: 28px; font-weight: bold; text-align: center;">
                    Hello Maggie! Let's get started in 3 easy steps:
                  </h3>
                  
                  <div style="display: grid; gap: 32px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
                    
                    <!-- Step 1: Create a Bot -->
                    <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 10px; padding: 32px; border: 1px solid rgba(255,255,255,0.2);">
                      <div style="display: flex; align-items: center; margin-bottom: 20px;">
                        <div style="background: rgba(255,255,255,0.2); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px; font-weight: bold; font-size: 18px;">1</div>
                        <h4 style="color: white; margin: 0; font-size: 20px; font-weight: bold;">🤖 Create Your Bot</h4>
                      </div>
                      <p style="color: rgba(255,255,255,0.9); margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                        Start by creating your first Knowledge Bot with a descriptive name. Your bot will be the foundation for organizing and accessing your information.
                      </p>
                      <a href="/admin/bot-management" style="display: inline-flex; align-items: center; background: rgba(255,255,255,0.2); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; border: 1px solid rgba(255,255,255,0.3); font-size: 16px; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        Create Bot →
                      </a>
                    </div>

                    <!-- Step 2: Upload Your Files -->
                    <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 10px; padding: 32px; border: 1px solid rgba(255,255,255,0.2);">
                      <div style="display: flex; align-items: center; margin-bottom: 20px;">
                        <div style="background: rgba(255,255,255,0.2); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px; font-weight: bold; font-size: 18px;">2</div>
                        <h4 style="color: white; margin: 0; font-size: 20px; font-weight: bold;">📁 Upload Your Files</h4>
                      </div>
                      <p style="color: rgba(255,255,255,0.9); margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                        Feed your bot knowledge! Upload documents, images, or other files to the Media Library and assign them to your bot's folder.
                      </p>
                      <a href="/admin/plugins/upload" style="display: inline-flex; align-items: center; background: rgba(255,255,255,0.2); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; border: 1px solid rgba(255,255,255,0.3); font-size: 16px; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        Upload Files →
                      </a>
                    </div>

                    <!-- Step 3: Start AI Chat -->
                    <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 10px; padding: 32px; border: 1px solid rgba(255,255,255,0.2);">
                      <div style="display: flex; align-items: center; margin-bottom: 20px;">
                        <div style="background: rgba(255,255,255,0.2); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px; font-weight: bold; font-size: 18px;">3</div>
                        <h4 style="color: white; margin: 0; font-size: 20px; font-weight: bold;">💬 Start AI Chat</h4>
                      </div>
                      <p style="color: rgba(255,255,255,0.9); margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                        Engage with your bot! Head to the AI Chat and start asking questions based on the files you've uploaded.
                      </p>
                      <a href="/admin/ai-chat" style="display: inline-flex; align-items: center; background: rgba(255,255,255,0.2); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; border: 1px solid rgba(255,255,255,0.3); font-size: 16px; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        Start Chatting →
                      </a>
                    </div>
                  </div>

                  <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.3);">
                    <h4 style="color: white; margin: 0 0 12px 0; font-size: 18px;">💡 Pro Tip: Organize Your Bots!</h4>
                    <p style="color: rgba(255,255,255,0.8); font-size: 15px; line-height: 1.6;">
                      You can create multiple bots for different topics or projects. Each bot can have its own set of uploaded files, keeping your knowledge base neatly organized.
                    </p>
                  </div>
                </div>
              </main>
            </section>
          `;
          
          // Insert as a sibling to existing widgets (which are now hidden for Standard Users)
          widgetInfo.container.appendChild(knowledgeBotWidget);
          console.log('✅ [ADMIN APP] Knowledge Bot instructions added as sibling to existing widgets using their exact structure');
          
        } else {
          console.log('❌ [ADMIN APP] Could not find existing widgets to replicate structure');
        }
        
        isGettingStartedProcessing = false;
      };

      // Use MutationObserver to catch when the content loads or changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            safelyAddInstructions();
          }
        });
      });

      // Start observing the document body for changes
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Initial check
      safelyAddInstructions();

      console.log('✅ [ADMIN APP] MutationObserver for getting started section active');
    };

    // 🎯 SETUP MEDIA LIBRARY CONTROLS FOR STANDARD USERS
    // Simple and safe implementation
    const setupMediaLibraryControls = () => {
      console.log('📁 [ADMIN APP] Setting up Media Library controls...');
      
      // 🎯 ONLY RUN ON MEDIA LIBRARY: Double-check we're on the media library page
      if (!window.location.pathname.includes('/admin/plugins/upload')) {
        console.log('⏭️ [ADMIN APP] Not on media library page, skipping controls setup');
        return;
      }
      
      console.log('✅ [ADMIN APP] On media library page, proceeding with controls setup');
      
      const applyMediaLibraryControls = () => {
        // Only apply on Media Library pages
        if (!window.location.pathname.includes('/admin/plugins/upload')) {
          return;
        }
        
        const currentUrl = window.location.href;
        const hasFolder = currentUrl.includes('folder');
        
        console.log(`📁 [ADMIN APP] Media Library URL check - Has folder: ${hasFolder}`);
        console.log(`📁 [ADMIN APP] Current URL: ${currentUrl}`);
        
        // Find all buttons on the page
        const buttons = document.querySelectorAll('button');
        
        buttons.forEach(button => {
          const buttonText = button.textContent || '';
          
          // Hide "Add new folder" button always
          if (buttonText.includes('Add new folder')) {
            button.style.display = 'none';
            console.log('📁 [ADMIN APP] Hidden "Add new folder" button');
          }
          
          // Control "Add new assets" button based on folder presence
          if (buttonText.includes('Add new assets')) {
            if (hasFolder) {
              // URL has folder - ENABLE the button (inside folder, allow uploads)
              button.disabled = false;
              button.style.opacity = '1';
              button.title = '';
              console.log('📁 [ADMIN APP] Enabled "Add new assets" button (inside folder)');
            } else {
              // URL doesn't have folder - DISABLE the button (in root, don't allow uploads)
              button.disabled = true;
              button.style.opacity = '0.5';
              button.title = 'Please select a folder first';
              console.log('📁 [ADMIN APP] Disabled "Add new assets" button (in root)');
            }
          }
        });
      };
      
      // Apply on URL changes
      const handleUrlChange = () => {
        setTimeout(applyMediaLibraryControls, 100); // Small delay for DOM to update
      };
      
      // Listen for navigation
      window.addEventListener('popstate', handleUrlChange);
      
      // Override history methods to catch programmatic navigation  
      const originalPushState = history.pushState;
      history.pushState = function(...args) {
        const result = originalPushState.apply(this, args);
        handleUrlChange();
        return result;
      };
      
      // Use MutationObserver for dynamic content
      const observer = new MutationObserver(() => {
        if (window.location.pathname.includes('/admin/plugins/upload')) {
          applyMediaLibraryControls();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Initial application
      applyMediaLibraryControls();
      
      console.log('✅ [ADMIN APP] Media Library controls active');
    };

    // Start the pure event-driven system
    setupRoleDetection();

  },
  
  config: {
    translations: {
      en: {
        'Auth.form.welcome.title': 'Hello Maggie!',
        'Auth.form.welcome.subtitle': 'Welcome to your knowledge bot dashboard'
      }
    }
  }
}; 
