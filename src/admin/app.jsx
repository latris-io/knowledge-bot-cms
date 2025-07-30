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
    
    // Improved approach: hide Content Manager and Settings for Standard User role
    const hideMenuItemsForStandardUsers = () => {
      console.log('🔍 [ADMIN APP] Checking if menu items should be hidden...');
      
      // Wait a bit for the admin panel to fully load
      setTimeout(() => {
        try {
          // Try to access user role information from Strapi admin context
          let userRoleFromContext = null;
          try {
            // Check if Strapi admin app context is available (suppress TS errors for dynamic properties)
            // @ts-ignore
            const globalWindow = window;
            // @ts-ignore
            if (globalWindow.strapi && 
                globalWindow.strapi.admin && 
                globalWindow.strapi.admin.user) {
              // @ts-ignore
              const user = globalWindow.strapi.admin.user;
              console.log('🔍 [ADMIN APP] Found Strapi user context:', user);
              if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
                userRoleFromContext = user.roles[0].name;
                console.log('🔍 [ADMIN APP] User role from context:', userRoleFromContext);
              }
            }
            
            // Also check React context if available
            if (!userRoleFromContext && globalWindow.React) {
              console.log('🔍 [ADMIN APP] Attempting to find user role in React context...');
              // This would require more complex context inspection
            }
          } catch (contextError) {
            console.log('🔍 [ADMIN APP] Could not access user context:', contextError.message);
          }
          // Multiple detection methods for better reliability
          const pageText = document.body.textContent || '';
          const pageHtml = document.body.innerHTML || '';
          
          // Check for standard user indicators (role-based approach only)
          const isStandardUser = 
            // Primary: Role from context (most reliable)
            userRoleFromContext === 'Standard User' ||
            // Role-based detection (works for any user with Standard User role)
            pageText.includes('Standard User') ||
            pageHtml.includes('Standard User') ||
            // Look for role information in common Strapi admin locations
            pageText.includes('standard-user') ||
            pageHtml.includes('standard-user') ||
            // Check if user profile/settings show Standard User role
            document.querySelector('[data-testid*="role"]')?.textContent?.includes('Standard User') ||
            document.querySelector('[class*="role"]')?.textContent?.includes('Standard User');
          
          console.log('🎭 [ADMIN APP] Standard user detected:', isStandardUser);
          console.log('🔍 [ADMIN APP] Detection details:', {
            roleFromContext: userRoleFromContext,
            hasStandardUserText: pageText.includes('Standard User'),
            hasStandardUserHtml: pageHtml.includes('Standard User'),
            hasStandardUserLowercase: pageText.includes('standard-user'),
            hasRoleSelector: !!document.querySelector('[data-testid*="role"]')?.textContent?.includes('Standard User'),
            hasClassRoleSelector: !!document.querySelector('[class*="role"]')?.textContent?.includes('Standard User')
          });
          
          // Only hide if we detect the standard user
          if (isStandardUser) {
            console.log('🚫 [ADMIN APP] Hiding Content Manager, Settings, and Media Library for Standard User role');
            
            // Improved CSS to hide Content Manager, Settings, and Media Library
            const style = document.createElement('style');
            style.setAttribute('data-hide-menu-items', 'true');
            style.textContent = `
              /* Hide Content Manager - Multiple selector approaches */
              a[href="/admin/content-manager"],
              a[href*="/content-manager"],
              [href*="/content-manager"],
              nav a[href*="content-manager"],
              [data-testid*="content-manager"],
              a:has-text("Content Manager") { 
                display: none !important; 
                visibility: hidden !important;
              }
              
              /* Hide parent list items */
              li:has(a[href*="content-manager"]),
              nav li:has(a[href*="content-manager"]) { 
                display: none !important; 
                visibility: hidden !important;
              }
              
              /* Hide Settings - Multiple selector approaches */
              a[href="/admin/settings"],
              a[href*="/settings"],
              [href*="/settings"],
              nav a[href*="/settings"],
              [data-testid*="settings"],
              a:has-text("Settings") { 
                display: none !important; 
                visibility: hidden !important;
              }
              
              /* Hide parent list items */
              li:has(a[href*="/settings"]),
              nav li:has(a[href*="/settings"]) { 
                display: none !important; 
                visibility: hidden !important;
              }
              
              /* Hide Media Library - Multiple selector approaches */
              a[href="/admin/plugins/upload"],
              a[href*="/plugins/upload"],
              [href*="/plugins/upload"],
              nav a[href*="plugins/upload"],
              [data-testid*="media-library"],
              a:has-text("Media Library") { 
                display: none !important; 
                visibility: hidden !important;
              }
              
              /* Hide parent list items */
              li:has(a[href*="/plugins/upload"]),
              nav li:has(a[href*="/plugins/upload"]) { 
                display: none !important; 
                visibility: hidden !important;
              }
              
              /* More aggressive selectors */
              [class*="menu"] a[href*="content-manager"],
              [class*="nav"] a[href*="content-manager"],
              [class*="sidebar"] a[href*="content-manager"],
              [class*="menu"] a[href*="/settings"],
              [class*="nav"] a[href*="/settings"],
              [class*="sidebar"] a[href*="/settings"],
              [class*="menu"] a[href*="/plugins/upload"],
              [class*="nav"] a[href*="/plugins/upload"],
              [class*="sidebar"] a[href*="/plugins/upload"] {
                display: none !important; 
                visibility: hidden !important;
              }
            `;
            document.head.appendChild(style);
            console.log('💉 [ADMIN APP] CSS injected to hide Content Manager, Settings, and Media Library');
            
            // Enhanced JavaScript-based hiding function
            const hideMenuItemsJS = () => {
              console.log('🔧 [ADMIN APP] Running JavaScript menu hiding...');
              
              // Find all links and check them
              const allLinks = document.querySelectorAll('a, [href]');
              let hiddenCount = 0;
              
              allLinks.forEach(link => {
                // Type-safe property access
                const href = (link instanceof HTMLAnchorElement ? link.href : link.getAttribute('href')) || '';
                const text = link.textContent ? link.textContent.trim() : '';
                
                // Check if this is a Content Manager, Settings, or Media Library link
                const isContentManager = href.includes('content-manager') || text === 'Content Manager';
                const isSettings = href.includes('/settings') && !href.includes('subscription') && !href.includes('billing') || text === 'Settings';
                const isMediaLibrary = href.includes('/plugins/upload') || text === 'Media Library';
                
                if (isContentManager || isSettings || isMediaLibrary) {
                  // Hide the link (with type checking)
                  if (link instanceof HTMLElement) {
                    link.style.display = 'none';
                    link.style.visibility = 'hidden';
                  }
                  
                  // Hide parent elements
                  const parentLi = link.closest('li');
                  const parentNav = link.closest('nav');
                  const parentDiv = link.closest('div[role="menuitem"], div[class*="menu"]');
                  
                  if (parentLi instanceof HTMLElement) {
                    parentLi.style.display = 'none';
                    parentLi.style.visibility = 'hidden';
                  }
                  if (parentDiv instanceof HTMLElement) {
                    parentDiv.style.display = 'none';
                    parentDiv.style.visibility = 'hidden';
                  }
                  
                  hiddenCount++;
                  console.log(`🚫 [ADMIN APP] Hidden: ${text || href}`);
                }
              });
              
              console.log(`🔧 [ADMIN APP] Hidden ${hiddenCount} menu items`);
            };
            
            // Apply JavaScript hiding immediately
            hideMenuItemsJS();
            
            // Set up observer to catch dynamically added elements
            const observer = new MutationObserver((mutations) => {
              let shouldCheck = false;
              mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                  // Check if any added nodes contain links
                                     mutation.addedNodes.forEach(node => {
                     if (node.nodeType === Node.ELEMENT_NODE && node instanceof Element) {
                       const hasLinks = node.tagName === 'A' || node.querySelector('a, [href]');
                       if (hasLinks) shouldCheck = true;
                     }
                   });
                }
              });
              
              if (shouldCheck) {
                setTimeout(hideMenuItemsJS, 100);
              }
            });
            
            observer.observe(document.body, {
              childList: true,
              subtree: true
            });

            // Apply with multiple delays to catch different loading stages
            setTimeout(hideMenuItemsJS, 500);
            setTimeout(hideMenuItemsJS, 1000);
            setTimeout(hideMenuItemsJS, 2000);
            setTimeout(hideMenuItemsJS, 3000);
            setTimeout(hideMenuItemsJS, 5000);
        } else {
            console.log('✅ [ADMIN APP] Not Standard User role - Content Manager, Settings, and Media Library remain visible');
        }
      } catch (error) {
          console.error('❌ [ADMIN APP] Error in hideMenuItemsForStandardUsers:', error);
        }
      }, 1000);
    };
    
    // Call the function multiple times to ensure it catches the user info
    hideMenuItemsForStandardUsers();
    setTimeout(hideMenuItemsForStandardUsers, 2000);
    setTimeout(hideMenuItemsForStandardUsers, 3000);
  }
}; 
