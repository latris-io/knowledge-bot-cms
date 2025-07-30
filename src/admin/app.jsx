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
            console.log('🔍 [ADMIN APP] Debugging global context:', {
              hasStrapi: !!globalWindow.strapi,
              strapiKeys: globalWindow.strapi ? Object.keys(globalWindow.strapi) : [],
              hasAdmin: !!(globalWindow.strapi && globalWindow.strapi.admin),
              adminKeys: (globalWindow.strapi && globalWindow.strapi.admin) ? Object.keys(globalWindow.strapi.admin) : [],
              // @ts-ignore - Dynamic Strapi admin context
              hasUser: !!(globalWindow.strapi && globalWindow.strapi.admin && globalWindow.strapi.admin.user),
            });
            
            // DEEP DEBUGGING: Inspect the actual Strapi object structure
            if (globalWindow.strapi) {
              console.log('🔍 [ADMIN APP] Full Strapi object structure:', globalWindow.strapi);
              
              // Check all possible locations for user/admin context
              const possibleUserLocations = [
                'strapi.admin.user',
                'strapi.user', 
                'strapi.currentUser',
                'strapi.auth.user',
                'strapi.store.user',
                'strapi.plugins.users-permissions.user'
              ];
              
              possibleUserLocations.forEach(path => {
                try {
                  const pathParts = path.split('.');
                  let current = globalWindow;
                  for (const part of pathParts) {
                    current = current[part];
                    if (!current) break;
                  }
                  if (current) {
                    console.log(`✅ [ADMIN APP] Found user context at ${path}:`, current);
                  }
                } catch (e) {
                  // Silent fail for dynamic property access
                }
              });
            }
            
            // Check alternative global locations for user context
            const alternativeLocations = [
              'window.__STRAPI_USER__',
              'window.__ADMIN_USER__', 
              'window.__AUTH_USER__',
              'window.APP_STATE',
              'window.INITIAL_STATE'
            ];
            
            alternativeLocations.forEach(path => {
              try {
                // @ts-ignore - Dynamic property access
                const value = eval(path);
                if (value) {
                  console.log(`✅ [ADMIN APP] Found user context at ${path}:`, value);
                }
              } catch (e) {
                // Silent fail
              }
            });
            
            // Check localStorage and sessionStorage for user/auth info
            const storageKeys = [
              'strapi-jwt-token',
              'strapi-user',
              'strapi-admin-user',
              'admin-user',
              'user',
              'auth-user',
              'currentUser'
            ];
            
            console.log('🔍 [ADMIN APP] Storage debugging:');
            storageKeys.forEach(key => {
              const localValue = localStorage.getItem(key);
              const sessionValue = sessionStorage.getItem(key);
              if (localValue) {
                console.log(`📦 localStorage['${key}']:`, localValue.substring(0, 100) + '...');
              }
              if (sessionValue) {
                console.log(`📦 sessionStorage['${key}']:`, sessionValue.substring(0, 100) + '...');
              }
            });
            
            // @ts-ignore - Dynamic Strapi admin context
            if (globalWindow.strapi && 
                globalWindow.strapi.admin && 
                // @ts-ignore - Dynamic Strapi admin context property
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
          
          // DEBUG: Log what we find in the page
          console.log('🔍 [ADMIN APP] DOM debugging:', {
            bodyTextLength: pageText.length,
            bodyHtmlLength: pageHtml.length,
            containsUser: pageText.includes('user') || pageText.includes('User'),
            containsRole: pageText.includes('role') || pageText.includes('Role'),
            containsStandard: pageText.includes('standard') || pageText.includes('Standard'),
            containsAdmin: pageText.includes('admin') || pageText.includes('Admin'),
            allUserText: pageText.toLowerCase().split(' ').filter(word => word.includes('user')).slice(0, 10),
            allRoleText: pageText.toLowerCase().split(' ').filter(word => word.includes('role')).slice(0, 10),
            allStandardText: pageText.toLowerCase().split(' ').filter(word => word.includes('standard')).slice(0, 10)
          });
          
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
            '[class*="user"] [class*="role"]',
            // Try broader selectors
            '[class*="User"]',
            '[class*="Profile"]',
            '[data-testid*="user"]',
            'header',
            'nav',
            '.user',
            '.profile',
            // Strapi v5 specific selectors that might contain user info
            '[class*="MainNav"]',
            '[class*="LeftMenu"]',
            '[class*="Header"]'
          ];
          
          let domRoleText = null;
          const foundElements = [];
          let foundStandardUser = false;
          
          for (const selector of roleSelectors) {
            if (foundStandardUser) break;
            
            const elements = document.querySelectorAll(selector);
            for (let index = 0; index < elements.length; index++) {
              const element = elements[index];
              if (element && element.textContent) {
                const text = element.textContent.trim();
                foundElements.push({
                  selector,
                  index,
                  text: text.substring(0, 100), // Limit text length for logging
                  hasStandardUser: text.includes('Standard User'),
                  hasRole: text.toLowerCase().includes('role'),
                  hasUser: text.toLowerCase().includes('user')
                });
                
                if (text.includes('Standard User')) {
                  domRoleText = text;
                  detectionMethod = `dom_selector_${selector}`;
                  console.log('✅ [ADMIN APP] Found Standard User role via DOM selector:', selector, text);
                  foundStandardUser = true;
                  break;
                }
              }
            }
          }
          
          console.log('🔍 [ADMIN APP] DOM element scan results:', {
            totalElementsFound: foundElements.length,
            elementsWithRole: foundElements.filter(el => el.hasRole).length,
            elementsWithUser: foundElements.filter(el => el.hasUser).length,
            elementsWithStandardUser: foundElements.filter(el => el.hasStandardUser).length,
            sampleElements: foundElements.slice(0, 5) // Show first 5 elements found
          });
          
          // Look for role information in the user profile/settings area
          const profileSelectors = [
            'header [class*="user"]',
            '[class*="topbar"] [class*="user"]',
            '[class*="navbar"] [class*="user"]',
            '[data-testid*="user"]',
            '[aria-label*="user"]',
            // Try more specific Strapi selectors
            'header',
            'nav',
            '[role="banner"]',
            '[role="navigation"]'
          ];
          
          const profileElements = [];
          for (const selector of profileSelectors) {
            const profileArea = document.querySelector(selector);
            if (profileArea && profileArea.textContent) {
              const text = profileArea.textContent.trim();
              profileElements.push({
                selector,
                text: text.substring(0, 200),
                hasStandardUser: text.includes('Standard User'),
                hasRole: text.toLowerCase().includes('role'),
                hasUser: text.toLowerCase().includes('user')
              });
              
              if (text.includes('Standard User')) {
                detectionMethod = `profile_${selector}`;
                console.log('✅ [ADMIN APP] Found Standard User role in profile area:', selector);
                break;
              }
            }
          }
          
          console.log('🔍 [ADMIN APP] Profile area scan results:', {
            totalProfileElements: profileElements.length,
            profileElementsWithUser: profileElements.filter(el => el.hasUser).length,
            profileElementsWithRole: profileElements.filter(el => el.hasRole).length,
            sampleProfileElements: profileElements.slice(0, 3)
          });
          
          console.log('�� [ADMIN APP] === ENHANCED ROLE DEBUGGING ===');
          
          // Check JWT token payload for role info
          const jwtToken = localStorage.getItem('strapi-jwt-token');
          let jwtPayload = null;
          if (jwtToken) {
            try {
              const base64Url = jwtToken.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              jwtPayload = JSON.parse(window.atob(base64));
              console.log('🎫 [ADMIN APP] JWT Token Payload:', jwtPayload);
            } catch (e) {
              console.log('❌ [ADMIN APP] Failed to decode JWT token:', e);
            }
          }
          
          // Check all storage keys for user data
          const userStorageKeys = Object.keys(localStorage).filter(key => 
            key.includes('strapi') || key.includes('user') || key.includes('jwt') || key.includes('auth')
          );
          console.log('🔑 [ADMIN APP] User-related storage keys:', userStorageKeys.map(key => ({
            key,
            value: localStorage.getItem(key)?.substring(0, 100) + '...'
          })));
          
          // More comprehensive role pattern search
          const rolePatterns = [
            'Standard User', 'Standard', 'Author', 'Editor', 'Contributor', 'Administrator', 'Super Admin',
            'standard user', 'standard', 'author', 'editor', 'contributor', 'administrator', 'super admin',
            'role', 'Role', 'permission', 'Permission'
          ];
          
          const patternResults = {};
          rolePatterns.forEach(pattern => {
            const textMatches = (pageText.match(new RegExp(pattern, 'gi')) || []).length;
            const htmlMatches = (pageHtml.match(new RegExp(pattern, 'gi')) || []).length;
            if (textMatches > 0 || htmlMatches > 0) {
              patternResults[pattern] = { textMatches, htmlMatches };
            }
          });
          
          console.log('🔤 [ADMIN APP] Role patterns found in page:', patternResults);
          
          // Check profile/user dropdown elements
          const userElementSelectors = [
            '[class*="profile" i]', '[data-testid*="profile" i]',
            '[class*="dropdown" i]', '[aria-expanded]',
            'header [class*="user" i]', '.navbar [class*="user" i]'
          ];
          
          const profileInfo = [];
          userElementSelectors.forEach(selector => {
            try {
              const elements = document.querySelectorAll(selector);
              elements.forEach(el => {
                if (el.textContent?.trim() && el.textContent.trim().length < 100) {
                  profileInfo.push({
                    selector,
                    text: el.textContent.trim(),
                    classes: el.className,
                    attributes: Object.fromEntries(Array.from(el.attributes).map(attr => [attr.name, attr.value]))
                  });
                }
              });
            } catch (e) {
              // Skip invalid selectors
            }
          });
          
          console.log('👤 [ADMIN APP] Profile/user elements found:', profileInfo);
          
          console.log('🔍 [ADMIN APP] === END ENHANCED DEBUGGING ===');
          
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
            console.log('🚫 [ADMIN APP] Hiding Content Manager and Settings for Standard User role');
            console.log('🔧 [ADMIN APP] Detection method used:', detectionMethod);
            
            // Remove any existing style to avoid duplicates
            const existingStyle = document.querySelector('style[data-hide-menu-items="true"]');
            if (existingStyle) {
              existingStyle.remove();
            }
            
            // Enhanced CSS with more specific Strapi admin selectors - ONLY Content Manager and Settings
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
              
              /* AGGRESSIVE FALLBACK SELECTORS - ONLY Content Manager and Settings */
              /* Catch any remaining instances with generic class/structure patterns */
              [class*="menu"] a[href*="content-manager"],
              [class*="nav"] a[href*="content-manager"],
              [class*="sidebar"] a[href*="content-manager"],
              [class*="menu"] a[href="/admin/settings"],
              [class*="nav"] a[href="/admin/settings"],
              [class*="sidebar"] a[href="/admin/settings"] {
                display: none !important; 
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                overflow: hidden !important;
              }
            `;
            document.head.appendChild(style);
            console.log('💉 [ADMIN APP] Enhanced CSS injected to hide Content Manager and Settings');
            
            // Enhanced JavaScript-based hiding function with better Strapi detection
            const hideMenuItemsJS = () => {
              let hiddenCount = 0;
              
              // Find all potential menu links
              const selectors = [
                'a[href*="/admin/"]',
                'nav a',
                '[role="menuitem"] a',
                '[class*="menu"] a',
                '[class*="MenuItem"] a',
                '[class*="MenuLink"] a'
              ];
              
              selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(link => {
                  if (!(link instanceof HTMLElement)) return;
                  
                  const href = link.getAttribute('href') || '';
                  const text = link.textContent?.trim() || '';
                  
                  // Only hide Content Manager and Settings
                  const isContentManager = 
                    href.includes('/content-manager') || 
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
                  
                  if (isContentManager || isSettings) {
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
    setTimeout(hideMenuItemsForStandardUsers, 5000);
    setTimeout(hideMenuItemsForStandardUsers, 10000);
    
    // Event-driven approach: Listen for authentication state changes
    const waitForUserContextEventDriven = () => {
      return new Promise((resolve) => {
        console.log('🔍 [ADMIN APP] Setting up event-driven user context detection...');
        
        // Check immediately first
        const checkUserContext = () => {
          const hasUserContext = !!(
            // @ts-ignore - Dynamic Strapi admin context
            (window.strapi && window.strapi.admin && window.strapi.admin.user) ||
            document.body.textContent?.includes('Standard User') ||
            document.body.textContent?.includes('user') ||
            localStorage.getItem('strapi-jwt-token')
          );
          
          if (hasUserContext) {
            console.log('✅ [ADMIN APP] User context found via event-driven detection');
            resolve(true);
            return true;
          }
          return false;
        };
        
        // Check immediately
        if (checkUserContext()) return;
        
        // Listen for storage changes (JWT token updates)
        const handleStorageChange = (event) => {
          if (event.key === 'strapi-jwt-token' || event.key === null) {
            console.log('🔑 [ADMIN APP] JWT token change detected');
            if (checkUserContext()) {
              cleanup();
            }
          }
        };
        
        // Listen for DOM mutations that might indicate user context loading
        const observer = new MutationObserver((mutations) => {
          let shouldCheck = false;
          
          for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              // Check if any added nodes might contain user context
              for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const text = node.textContent || '';
                  if (text.includes('user') || text.includes('User') || text.includes('profile')) {
                    shouldCheck = true;
                    break;
                  }
                }
              }
            }
            if (shouldCheck) break;
          }
          
          if (shouldCheck && checkUserContext()) {
            cleanup();
          }
        });
        
        // Listen for window events that might indicate authentication completion
        const handleAuthEvent = () => {
          console.log('🔐 [ADMIN APP] Authentication event detected');
          setTimeout(() => { // Small delay to let auth complete
            if (checkUserContext()) {
              cleanup();
            }
          }, 100);
        };
        
        // Listen for React state updates (focus/blur can indicate state changes)
        const handleFocusChange = () => {
          if (document.hasFocus() && checkUserContext()) {
            cleanup();
          }
        };
        
        // Cleanup function
        const cleanup = () => {
          window.removeEventListener('storage', handleStorageChange);
          window.removeEventListener('focus', handleAuthEvent);
          window.removeEventListener('beforeunload', handleAuthEvent);
          window.removeEventListener('pageshow', handleAuthEvent);
          window.removeEventListener('focus', handleFocusChange);
          observer.disconnect();
          resolve(true);
        };
        
        // Set up event listeners
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('focus', handleAuthEvent);
        window.addEventListener('beforeunload', handleAuthEvent);
        window.addEventListener('pageshow', handleAuthEvent);
        window.addEventListener('focus', handleFocusChange);
        
        // Set up DOM observer
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributeFilter: ['class', 'data-user', 'data-role']
        });
        
        console.log('👀 [ADMIN APP] Event listeners and DOM observer set up for user context detection');
        
        // Safety timeout (but no polling!)
        setTimeout(() => {
          console.log('⏰ [ADMIN APP] User context detection timeout after 30 seconds');
          cleanup();
          resolve(false);
        }, 30000);
      });
    };
    
    // Additional approach: Wait for window load event  
    window.addEventListener('load', () => {
      setTimeout(hideMenuItemsForStandardUsers, 2000);
      setTimeout(hideMenuItemsForStandardUsers, 5000);
    });
    
    // Start event-driven user context detection
    waitForUserContextEventDriven().then((found) => {
      if (found) {
        console.log('✅ [ADMIN APP] Running menu hiding after event-driven detection');
        hideMenuItemsForStandardUsers();
      } else {
        console.log('⚠️ [ADMIN APP] User context detection completed without finding context');
      }
    });

    // Enhanced user context search with comprehensive debugging
    const findUserRoleContext = () => {
      console.log('🔍 [ADMIN APP] === COMPREHENSIVE USER ROLE DEBUGGING ===');
      
      // 1. Check all localStorage keys
      const allStorageKeys = Object.keys(localStorage);
      const storageData = {};
      allStorageKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          storageData[key] = value;
          if (key.includes('strapi') || key.includes('jwt') || key.includes('token') || key.includes('user')) {
            console.log(`🔑 [ADMIN APP] Storage key "${key}":`, value?.substring(0, 100) + '...');
          }
        } catch (e) {
          storageData[key] = 'ERROR_READING';
        }
      });
      
      // 2. Check JWT token payload
      const jwtToken = localStorage.getItem('strapi-jwt-token') || localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
      let jwtPayload = null;
      if (jwtToken) {
        try {
          const base64Url = jwtToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          jwtPayload = JSON.parse(window.atob(base64));
          console.log('🎫 [ADMIN APP] JWT Token Payload:', jwtPayload);
        } catch (e) {
          console.log('❌ [ADMIN APP] Failed to decode JWT token:', e);
        }
      }
      
      // 3. Check window.strapi admin context more thoroughly
      let strapiContext = null;
      if (window.strapi) {
        console.log('🌐 [ADMIN APP] Window.strapi structure:', window.strapi);
        if (window.strapi.admin) {
          console.log('👤 [ADMIN APP] Window.strapi.admin:', window.strapi.admin);
          if (window.strapi.admin.user) {
            console.log('👤 [ADMIN APP] Window.strapi.admin.user:', window.strapi.admin.user);
            strapiContext = window.strapi.admin.user;
          }
        }
      }
      
      // 4. Look for user data in React components (via global React DevTools)
      let reactUserData = null;
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__ && window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers) {
        console.log('⚛️ [ADMIN APP] React DevTools available, searching for user context...');
        // This is complex to search through React fiber tree, so we'll skip for now
      }
      
      // 5. Comprehensive DOM text search
      const bodyText = document.body.textContent || '';
      const bodyHtml = document.body.innerHTML || '';
      
      // Search for various role patterns
      const rolePatterns = [
        'Standard User', 'standard user', 'Standard', 'standard',
        'Author', 'author', 'Editor', 'editor', 'Contributor', 'contributor',
        'User', 'user', 'Role', 'role', 'Permission', 'permission'
      ];
      
      const foundPatterns = {};
      rolePatterns.forEach(pattern => {
        foundPatterns[pattern] = {
          inText: bodyText.includes(pattern),
          inHtml: bodyHtml.includes(pattern),
          textCount: (bodyText.match(new RegExp(pattern, 'gi')) || []).length,
          htmlCount: (bodyHtml.match(new RegExp(pattern, 'gi')) || []).length
        };
      });
      
      console.log('🔤 [ADMIN APP] Role pattern search results:', foundPatterns);
      
      // 6. Search for specific DOM elements that might contain role info
      const roleSelectors = [
        '[data-user-role]', '[data-role]', '[role]',
        '.user-role', '.role', '.permission',
        '[aria-label*="user" i]', '[aria-label*="role" i]',
        '[title*="user" i]', '[title*="role" i]',
        'span:contains("Standard")', 'div:contains("User")',
        '.profile', '.user-profile', '.account',
        '[class*="profile" i]', '[class*="user" i]', '[class*="role" i]'
      ];
      
      const foundElements = [];
      roleSelectors.forEach(selector => {
        try {
          const element = document.querySelector(selector);
          if (element) {
            foundElements.push({
              selector,
              element,
              text: element.textContent,
              html: element.innerHTML,
              attributes: Array.from(element.attributes).map(attr => ({name: attr.name, value: attr.value}))
            });
          }
        } catch (e) {
          // Some selectors might not be valid, skip them
        }
      });
      
      console.log('🎯 [ADMIN APP] Found DOM elements with potential role info:', foundElements);
      
      // 7. Check for API request/response data in network tab (via performance API)
      const performanceEntries = performance.getEntriesByType('navigation').concat(
        performance.getEntriesByType('resource')
      );
      
      const apiRequests = performanceEntries.filter(entry => 
        entry.name.includes('/admin/users/me') || 
        entry.name.includes('/admin/users') ||
        entry.name.includes('/api/users') ||
        entry.name.includes('user') ||
        entry.name.includes('auth')
      );
      
      console.log('🌐 [ADMIN APP] User-related API requests found:', apiRequests);
      
      // 8. Try to find user profile elements
      const profileSelectors = [
        '[data-testid*="profile" i]',
        '[class*="profile" i]',
        '[class*="header" i] [class*="user" i]',
        'header [class*="dropdown" i]',
        '.navbar .user', '.header .user',
        '[aria-expanded="false"]', '[aria-expanded="true"]'
      ];
      
      const profileElements = [];
      profileSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            if (element.textContent && element.textContent.trim()) {
              profileElements.push({
                selector,
                text: element.textContent.trim(),
                html: element.innerHTML,
                classes: element.className
              });
            }
          });
        } catch (e) {
          // Skip invalid selectors
        }
      });
      
      console.log('👤 [ADMIN APP] Profile elements found:', profileElements);
      
      // Return comprehensive data
      return {
        localStorage: storageData,
        jwtPayload,
        strapiContext,
        foundPatterns,
        foundElements,
        profileElements,
        apiRequests: apiRequests.map(req => req.name)
      };
    };

    const comprehensiveDebugData = findUserRoleContext();
  }
}; 
