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
    console.log('🚀 [ADMIN APP] Bootstrap function called');
    
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
                role.code === 'standard-user' ||
                role.name?.toLowerCase().includes('standard')
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
        
        return response;
      };
      
      // Initial check
      processRoleDetection().catch(error => {
        console.log('❌ [ADMIN APP] Error in initial role detection:', error);
      });
      
      console.log('👀 [ADMIN APP] Pure event-driven role detection set up - NO TIMERS');
    };
    
    // Start the pure event-driven system
    setupRoleDetection();
  }
}; 
