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
        widgetScript.setAttribute('data-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55X2lkIjo3LCJib3RfaWQiOiJib3RfMTc1Mzc0MTczNTQyM193a21qcjl5cGsiLCJpYXQiOjE3NTM3NDE3MzV9.pPxibBgF3X_WmohuDCBj3XHbNripy0gfFPaTkIgX1KE');
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
    
    // Simple approach: hide Content Manager and Settings for non-admin users
    const hideMenuItemsForStandardUsers = () => {
      console.log('🔍 [ADMIN APP] Checking if menu items should be hidden...');
      
      // Wait a bit for the admin panel to fully load
      setTimeout(() => {
        try {
          // Check if we can find any indication this is a standard user
          // Look for user info in the DOM or check the current user's email
          const userInfoElements = document.querySelectorAll('[data-testid*="user"], [class*="user-info"], [aria-label*="user"]');
          console.log('👤 [ADMIN APP] Found user elements:', userInfoElements.length);
          
          // Get all text content from the page to look for email addresses
          const pageText = document.body.textContent || '';
          
          // Check if this is the standard user
          const isStandardUser = pageText.includes('martybremer@icloud.com');
          console.log('🎭 [ADMIN APP] Standard user detected:', isStandardUser);
          
          // Only hide if we specifically detect the standard user
          if (isStandardUser) {
            console.log('🚫 [ADMIN APP] Hiding Content Manager and Settings for standard user');
            
            // Inject CSS to hide Content Manager and Settings
            const style = document.createElement('style');
            style.setAttribute('data-hide-menu-items', 'true');
            style.textContent = `
              /* Hide Content Manager menu for standard users */
              a[href="/admin/content-manager"] { display: none !important; }
              a[href*="/content-manager"] { display: none !important; }
              li:has(a[href*="content-manager"]) { display: none !important; }
              
              /* Hide Settings menu for standard users */
              a[href="/admin/settings"] { display: none !important; }
              a[href*="/settings"] { display: none !important; }
              li:has(a[href*="/settings"]) { display: none !important; }
              
              /* More specific selectors */
              nav a[href*="content-manager"] { display: none !important; }
              nav li:has(a[href*="content-manager"]) { display: none !important; }
              nav a[href*="/settings"] { display: none !important; }
              nav li:has(a[href*="/settings"]) { display: none !important; }
              [data-testid*="content-manager"] { display: none !important; }
              [data-testid*="settings"] { display: none !important; }
              
              /* Hide by text content */
              a:has-text("Content Manager") { display: none !important; }
              a:has-text("Settings") { display: none !important; }
            `;
            document.head.appendChild(style);
            console.log('💉 [ADMIN APP] CSS injected to hide Content Manager and Settings');
            
            // JavaScript-based hiding function
            const hideMenuItemsJS = () => {
              const allLinks = document.querySelectorAll('a');
              allLinks.forEach(link => {
                // Hide Content Manager
                if (link.href && link.href.includes('content-manager')) {
                  link.style.display = 'none';
                  const parentLi = link.closest('li');
                  if (parentLi) {
                    parentLi.style.display = 'none';
                  }
                }
                // Hide Settings
                if (link.href && link.href.includes('/settings')) {
                  link.style.display = 'none';
                  const parentLi = link.closest('li');
                  if (parentLi) {
                    parentLi.style.display = 'none';
                  }
                }
                // Also check text content
                if (link.textContent) {
                  const text = link.textContent.trim();
                  if (text === 'Content Manager' || text === 'Settings') {
                    link.style.display = 'none';
                    const parentLi = link.closest('li');
                    if (parentLi) {
                      parentLi.style.display = 'none';
                    }
                  }
                }
              });
            };
            
            // Apply JavaScript hiding
            hideMenuItemsJS();
            
            // Set up observer to catch dynamically added elements
            const observer = new MutationObserver(() => {
              hideMenuItemsJS();
            });
            
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });

            // Also apply after delays to catch late-loading elements
            setTimeout(hideMenuItemsJS, 500);
            setTimeout(hideMenuItemsJS, 1000);
            setTimeout(hideMenuItemsJS, 2000);
        } else {
            console.log('✅ [ADMIN APP] Not standard user - Content Manager and Settings remain visible');
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