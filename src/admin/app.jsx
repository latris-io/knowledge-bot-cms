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
    const hideMenuItemsForStandardUsers = () => {
      console.log('🔍 [ADMIN APP] Checking if menu items should be hidden...');
      
      // Wait a bit for the admin panel to fully load
      setTimeout(() => {
        try {
          // Enhanced user role detection with multiple methods
          let userRoleFromContext = null;
          let userEmailFromContext = null;
          let detectionMethod = 'none';
          
          try {
            // Method 1: Check Strapi admin global context
            const globalWindow = window;
            // @ts-ignore - Dynamic Strapi admin context
            if (globalWindow.strapi && 
                globalWindow.strapi.admin && 
                globalWindow.strapi.admin.user) {
              // @ts-ignore - Dynamic Strapi admin context  
              const user = globalWindow.strapi.admin.user;
              console.log('🔍 [ADMIN APP] Found Strapi user context:', user);
              // @ts-ignore - Dynamic user object properties
              userEmailFromContext = user['email'];
              // @ts-ignore - Dynamic user object properties
              if (user['roles'] && Array.isArray(user['roles']) && user['roles'].length > 0) {
                // @ts-ignore - Dynamic user object properties
                userRoleFromContext = user['roles'][0]['name'];
                detectionMethod = 'strapi_global_context';
                console.log('✅ [ADMIN APP] User role from Strapi context:', userRoleFromContext);
              }
            }
            
            // Method 2: Check if we can find role in Redux store (common in Strapi admin)
            // @ts-ignore - Redux DevTools extension
            if (!userRoleFromContext && globalWindow.__REDUX_DEVTOOLS_EXTENSION__) {
              console.log('🔍 [ADMIN APP] Attempting Redux store inspection...');
              // This would require more complex store inspection
            }
            
            // Method 3: Check for role in localStorage or sessionStorage
            if (!userRoleFromContext) {
              const strapiAuth = localStorage.getItem('strapi-jwt-token') || sessionStorage.getItem('strapi-jwt-token');
              if (strapiAuth) {
                console.log('🔍 [ADMIN APP] Found auth token, checking for role info...');
                // JWT decode might reveal role info (though it's not typical)
              }
            }
            
          } catch (contextError) {
            console.log('⚠️ [ADMIN APP] Could not access user context:', contextError.message);
          }
          
          // Enhanced DOM-based detection methods
          const pageText = document.body.textContent || '';
          const pageHtml = document.body.innerHTML || '';
          
          // Look for user role in various UI locations
          const roleSelectors = [
            '[data-testid*="role"]',
            '[class*="role"]', 
            '[class*="user-role"]',
            '.user-role',
            '[aria-label*="role"]',
            // Strapi-specific selectors
            '[class*="UserInfo"]',
            '[class*="Profile"]',
            '[data-strapi*="role"]',
            // Look in dropdowns and user menus
            '[class*="dropdown"] [class*="role"]',
            '[class*="menu"] [class*="role"]',
            '[class*="user"] [class*="role"]'
          ];
          
          let domRoleText = null;
          for (const selector of roleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent) {
              domRoleText = element.textContent.trim();
              if (domRoleText.includes('Standard User')) {
                detectionMethod = `dom_selector_${selector}`;
                console.log('✅ [ADMIN APP] Found Standard User role via DOM selector:', selector, domRoleText);
                break;
              }
            }
          }
          
          // Look for role information in the user profile/settings area
          const profileSelectors = [
            'header [class*="user"]',
            '[class*="topbar"] [class*="user"]',
            '[class*="navbar"] [class*="user"]',
            '[data-testid*="user"]',
            '[aria-label*="user"]'
          ];
          
          for (const selector of profileSelectors) {
            const profileArea = document.querySelector(selector);
            if (profileArea && profileArea.textContent && profileArea.textContent.includes('Standard User')) {
              detectionMethod = `profile_${selector}`;
              console.log('✅ [ADMIN APP] Found Standard User role in profile area:', selector);
              break;
            }
          }
          
          // Check for standard user indicators (role-based approach only)
          const isStandardUser = 
            // Primary: Role from context (most reliable)
            userRoleFromContext === 'Standard User' ||
            // DOM-based detection
            domRoleText?.includes('Standard User') ||
            // Fallback: text-based detection
            pageText.includes('Standard User') ||
            pageHtml.includes('Standard User') ||
            pageText.includes('standard-user') ||
            pageHtml.includes('standard-user');
          
          console.log('🎭 [ADMIN APP] User role detection results:', {
            isStandardUser,
            detectionMethod,
            userRoleFromContext,
            userEmailFromContext,
            domRoleText,
            hasStandardUserText: pageText.includes('Standard User'),
            hasStandardUserHtml: pageHtml.includes('Standard User'),
            hasStandardUserLowercase: pageText.includes('standard-user'),
            foundRoleSelectors: roleSelectors.filter(sel => document.querySelector(sel)).length
          });
          
          // Only hide if we detect the standard user
          if (isStandardUser) {
            console.log('🚫 [ADMIN APP] Hiding Content Manager, Settings, and Media Library for Standard User role');
            console.log('🔧 [ADMIN APP] Detection method used:', detectionMethod);
            
            // Remove any existing style to avoid duplicates
            const existingStyle = document.querySelector('style[data-hide-menu-items="true"]');
            if (existingStyle) {
              existingStyle.remove();
            }
            
            // Enhanced CSS with more specific Strapi admin selectors
            const style = document.createElement('style');
            style.setAttribute('data-hide-menu-items', 'true');
            style.textContent = `
              /* CONTENT MANAGER HIDING - Enhanced Strapi-specific selectors */
              /* Direct href matches */
              a[href="/admin/content-manager"],
              a[href*="/content-manager"],
              nav a[href*="content-manager"],
              
              /* Menu structure matches */
              [data-strapi*="content-manager"],
              [class*="MenuItem"] a[href*="content-manager"],
              [class*="MenuLink"] a[href*="content-manager"],
              
              /* Parent containers */
              li:has(a[href*="content-manager"]),
              [class*="MenuItem"]:has(a[href*="content-manager"]),
              [class*="MenuLink"]:has(a[href*="content-manager"]),
              
              /* Text-based matching for robust coverage */
              a:has-text("Content Manager"),
              li:has(a:has-text("Content Manager")),
              [role="menuitem"]:has(a:has-text("Content Manager")) {
                display: none !important; 
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                overflow: hidden !important;
              }
              
              /* SETTINGS HIDING - Enhanced Strapi-specific selectors */
              /* Direct href matches - be specific to avoid hiding custom settings */
              a[href="/admin/settings"],
              a[href="/admin/settings/"]:not([href*="billing"]):not([href*="subscription"]):not([href*="bot"]),
              nav a[href="/admin/settings"],
              
              /* Menu structure matches */
              [data-strapi*="settings"],
              [class*="MenuItem"] a[href="/admin/settings"],
              [class*="MenuLink"] a[href="/admin/settings"],
              
              /* Parent containers */
              li:has(a[href="/admin/settings"]),
              [class*="MenuItem"]:has(a[href="/admin/settings"]),
              [class*="MenuLink"]:has(a[href="/admin/settings"]),
              
              /* Text-based but specific to avoid custom settings */
              a:has-text("Settings"):not(:has-text("Billing")):not(:has-text("Bot")):not(:has-text("Subscription")),
              li:has(a:has-text("Settings"):not(:has-text("Billing")):not(:has-text("Bot"))),
              [role="menuitem"]:has(a:has-text("Settings"):not(:has-text("Billing"))) {
                display: none !important; 
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                overflow: hidden !important;
              }
              
              /* MEDIA LIBRARY HIDING - Enhanced Strapi-specific selectors */
              /* Direct href matches */
              a[href="/admin/plugins/upload"],
              a[href*="/plugins/upload"],
              nav a[href*="plugins/upload"],
              
              /* Menu structure matches */
              [data-strapi*="media"],
              [data-strapi*="upload"],
              [class*="MenuItem"] a[href*="/plugins/upload"],
              [class*="MenuLink"] a[href*="/plugins/upload"],
              
              /* Parent containers */
              li:has(a[href*="/plugins/upload"]),
              [class*="MenuItem"]:has(a[href*="/plugins/upload"]),
              [class*="MenuLink"]:has(a[href*="/plugins/upload"]),
              
              /* Text-based matching */
              a:has-text("Media Library"),
              li:has(a:has-text("Media Library")),
              [role="menuitem"]:has(a:has-text("Media Library")) {
                display: none !important; 
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                overflow: hidden !important;
              }
              
              /* AGGRESSIVE FALLBACK SELECTORS */
              /* Catch any remaining instances with generic class/structure patterns */
              [class*="menu"] a[href*="content-manager"],
              [class*="nav"] a[href*="content-manager"],
              [class*="sidebar"] a[href*="content-manager"],
              [class*="menu"] a[href="/admin/settings"],
              [class*="nav"] a[href="/admin/settings"], 
              [class*="sidebar"] a[href="/admin/settings"],
              [class*="menu"] a[href*="/plugins/upload"],
              [class*="nav"] a[href*="/plugins/upload"],
              [class*="sidebar"] a[href*="/plugins/upload"] {
                display: none !important; 
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                overflow: hidden !important;
              }
            `;
            document.head.appendChild(style);
            console.log('💉 [ADMIN APP] Enhanced CSS injected to hide Content Manager, Settings, and Media Library');
            
            // Enhanced JavaScript-based hiding function with better Strapi detection
            const hideMenuItemsJS = () => {
              console.log('🔧 [ADMIN APP] Running enhanced JavaScript menu hiding...');
              
              // Get all navigation elements more specifically
              const navSelectors = [
                'nav a', 
                '[role="navigation"] a',
                '[class*="Menu"] a',
                '[class*="Nav"] a',
                '[class*="Sidebar"] a',
                'aside a',
                '[data-strapi] a'
              ];
              
              let hiddenCount = 0;
              
              navSelectors.forEach(selector => {
                const links = document.querySelectorAll(selector);
                links.forEach(link => {
                  if (!(link instanceof HTMLElement)) return;
                  
                  const href = link.getAttribute('href') || '';
                  const text = link.textContent ? link.textContent.trim() : '';
                  
                  // More specific matching logic
                  const isContentManager = 
                    href.includes('content-manager') || 
                    text === 'Content Manager' ||
                    link.getAttribute('data-strapi') === 'content-manager';
                    
                  const isSettings = 
                    (href === '/admin/settings' || href === '/admin/settings/') &&
                    !href.includes('billing') && 
                    !href.includes('subscription') && 
                    !href.includes('bot') ||
                    (text === 'Settings' && 
                     !text.includes('Billing') && 
                     !text.includes('Bot') && 
                     !text.includes('Subscription'));
                    
                  const isMediaLibrary = 
                    href.includes('/plugins/upload') || 
                    text === 'Media Library' ||
                    link.getAttribute('data-strapi') === 'media-library';
                  
                  if (isContentManager || isSettings || isMediaLibrary) {
                    // Hide the link itself
                    link.style.display = 'none';
                    link.style.visibility = 'hidden';
                    link.style.opacity = '0';
                    
                    // Hide parent elements more aggressively
                    const parents = [
                      link.closest('li'),
                      link.closest('[role="menuitem"]'),
                      link.closest('[class*="MenuItem"]'),
                      link.closest('[class*="MenuLink"]'),
                      link.closest('div[role="menuitem"]'), 
                      link.closest('div[class*="menu"]')
                    ];
                    
                    parents.forEach(parent => {
                      if (parent instanceof HTMLElement) {
                        parent.style.display = 'none';
                        parent.style.visibility = 'hidden';
                        parent.style.opacity = '0';
                        parent.style.height = '0';
                        parent.style.overflow = 'hidden';
                      }
                    });
                    
                    hiddenCount++;
                    console.log(`🚫 [ADMIN APP] Hidden menu item: "${text}" (${href})`);
                  }
                });
              });
              
              console.log(`🔧 [ADMIN APP] JavaScript hiding completed - ${hiddenCount} items hidden`);
              return hiddenCount;
            };
            
            // Apply JavaScript hiding immediately and track results
            const immediateHiddenCount = hideMenuItemsJS();
            
            // Enhanced MutationObserver to catch dynamic content
            const observer = new MutationObserver((mutations) => {
              let shouldRecheck = false;
              
              mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                  mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE && node instanceof Element) {
                      // Check if the added node contains navigation elements
                      const hasNavElements = 
                        node.tagName === 'A' || 
                        node.tagName === 'NAV' ||
                        node.querySelector('a, nav, [role="navigation"], [class*="Menu"], [class*="Nav"]');
                      if (hasNavElements) {
                        shouldRecheck = true;
                        console.log('🔄 [ADMIN APP] Navigation elements added, will recheck menu hiding');
                      }
                    }
                  });
                }
              });
              
              if (shouldRecheck) {
                setTimeout(() => {
                  const newHiddenCount = hideMenuItemsJS();
                  if (newHiddenCount > 0) {
                    console.log(`🔄 [ADMIN APP] Mutation observer hid ${newHiddenCount} additional items`);
                  }
                }, 100);
              }
            });
            
            observer.observe(document.body, {
              childList: true,
              subtree: true,
              attributes: false // Don't watch attributes to reduce noise
            });
            
            // Apply with staggered delays to catch different loading stages
            const delays = [500, 1000, 2000, 3000, 5000];
            delays.forEach(delay => {
              setTimeout(() => {
                const delayedHiddenCount = hideMenuItemsJS();
                if (delayedHiddenCount > 0) {
                  console.log(`🔄 [ADMIN APP] Delayed hiding (${delay}ms) caught ${delayedHiddenCount} additional items`);
                }
              }, delay);
            });
            
            console.log('✅ [ADMIN APP] Standard User menu hiding fully configured');
            
          } else {
            console.log('✅ [ADMIN APP] Not a Standard User - Content Manager, Settings, and Media Library remain visible');
            console.log('🔍 [ADMIN APP] Current role detection:', {
              userRoleFromContext,
              userEmailFromContext,
              detectionMethod,
              pageContainsStandardUser: pageText.includes('Standard User')
            });
          }
        } catch (error) {
          console.error('❌ [ADMIN APP] Error in hideMenuItemsForStandardUsers:', error);
          console.error('❌ [ADMIN APP] Error stack:', error.stack);
        }
      }, 1000);
    };
    
    // Call the function multiple times to ensure it catches the user info
    hideMenuItemsForStandardUsers();
    setTimeout(hideMenuItemsForStandardUsers, 2000);
    setTimeout(hideMenuItemsForStandardUsers, 3000);
  }
}; 
