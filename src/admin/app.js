import extensions from './extensions.js';
import React from 'react';

export default {
  config: {
    extensions,
  },
  bootstrap(app) {
    // Add the AI Chat menu item accessible to all admin users
    app.addMenuLink({
      to: '/ai-chat',
      icon: () => React.createElement('span', { style: { fontSize: '18px' } }, '💬'),
      intlLabel: {
        id: 'ai-chat.menu.label',
        defaultMessage: 'AI Chat',
      },
      permissions: [], // Empty permissions - accessible to all authenticated admin users
      Component: async () => {
        const { default: AiChat } = await import('./pages/AiChat/index.jsx');
        return AiChat;
      },
    });

    // Run menu visibility logic when admin panel loads
    const hideContentManagerForStandardUsers = async () => {
      try {
        
        // Get JWT token from localStorage/sessionStorage instead of cookies
        const getJWTToken = () => {
          return localStorage.getItem('jwtToken') || 
                 sessionStorage.getItem('jwtToken') ||
                 document.cookie.split('; ').find(row => row.startsWith('jwtToken='))?.split('=')[1];
        };
        
        const jwtToken = getJWTToken();
        
        if (!jwtToken) {
          return;
        }
        
        // Get current user from the API  
        const response = await fetch('/admin/users/me', {
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          return;
        }
        
        const userData = await response.json();
        
        const isStandardUser = (userData.data?.roles || userData.roles)?.some(role => role.code === 'standard-user');
        
        if (isStandardUser) {
          // Inject comprehensive CSS to hide Content Manager
          const existingStyle = document.getElementById('hide-content-manager-style');
          if (!existingStyle) {
            const style = document.createElement('style');
            style.id = 'hide-content-manager-style';
            style.textContent = `
              /* Hide Content Manager menu items with multiple selectors */
              a[href*="content-manager"],
              a[href="/admin/content-manager"],
              a[href="/content-manager"],
              [data-strapi*="content-manager"],
              li:has(a[href*="content-manager"]),
              nav li:has(a[href*="content-manager"]),
              [aria-label*="Content Manager"],
              [title*="Content Manager"],
              
              /* Hide Settings menu items with multiple selectors */
              a[href*="settings"],
              a[href="/admin/settings"],
              a[href="/settings"],
              [data-strapi*="settings"],
              li:has(a[href*="settings"]),
              nav li:has(a[href*="settings"]),
              [aria-label*="Settings"],
              [title*="Settings"] {
                display: none !important;
              }
              
              /* Hide by text content - this targets menu items with "Content Manager" or "Settings" text */
              nav a:contains("Content Manager"),
              li:contains("Content Manager") a,
              [role="menuitem"]:contains("Content Manager"),
              nav a:contains("Settings"),
              li:contains("Settings") a,
              [role="menuitem"]:contains("Settings") {
                display: none !important;
              }
              
              /* Target Strapi-specific menu structures */
              [data-testid*="content-manager"],
              [data-cy*="content-manager"],
              .strapi-left-menu a[href*="content-manager"],
              [data-testid*="settings"],
              [data-cy*="settings"],
              .strapi-left-menu a[href*="settings"] {
                display: none !important;
              }
              
              /* Hide parent containers */
              li:has(a[href*="content-manager"]),
              .menu-item:has(a[href*="content-manager"]),
              li:has(a[href*="settings"]),
              .menu-item:has(a[href*="settings"]) {
                display: none !important;
              }
            `;
            document.head.appendChild(style);
          }
          
          // Set up mutation observer to handle dynamically loaded content
          const observer = new MutationObserver(() => {
            // Re-check and hide any newly loaded Content Manager or Settings elements
            const contentManagerElements = document.querySelectorAll('a[href*="content-manager"]');
            const settingsElements = document.querySelectorAll('a[href*="settings"]');
          });
          
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
        }
      } catch (error) {
        // Silently handle menu customization errors during initial load
      }
    };

    // Run with multiple timing strategies
    setTimeout(hideContentManagerForStandardUsers, 1000);   // 1 second
    setTimeout(hideContentManagerForStandardUsers, 3000);   // 3 seconds  
    setTimeout(hideContentManagerForStandardUsers, 5000);   // 5 seconds
  },
};
