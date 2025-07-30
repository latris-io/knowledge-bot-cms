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
      
      const processRoleDetection = () => {
        if (isProcessing) return; // Prevent duplicate processing
        isProcessing = true;
        
        try {
          console.log('🔍 [ADMIN APP] Checking if menu items should be hidden...');
          
          // Immediate role detection logic
          const pageText = document.body.textContent || '';
          const pageHtml = document.body.innerHTML || '';
          
          // Comprehensive role detection for production environments
          const detectStandardUser = () => {
            let detectionMethod = 'none';
            let detectionDetails = {};
            
            // Method 1: Check Strapi admin context
            try {
              // @ts-ignore - Dynamic Strapi admin context
              if (window.strapi?.admin?.user) {
                // @ts-ignore - Dynamic Strapi admin context
                const user = window.strapi.admin.user;
                detectionDetails.strapiContext = user;
                if (user.roles && Array.isArray(user.roles)) {
                  const hasStandardRole = user.roles.some(role => 
                    role.name === 'Standard User' || 
                    role.code === 'standard-user' ||
                    role.type === 'standard-user' ||
                    role.name?.toLowerCase().includes('standard')
                  );
                  if (hasStandardRole) {
                    detectionMethod = 'strapi-context';
                    return { isStandardUser: true, detectionMethod, detectionDetails };
                  }
                }
              }
            } catch (e) {
              console.log('⚠️ [ADMIN APP] Strapi context check failed:', e);
            }
            
            // Method 2: Check localStorage for user/role data
            try {
              const storageKeys = ['strapi-user', 'strapi-jwt-token', 'user-role', 'currentUser'];
              for (const key of storageKeys) {
                const data = localStorage.getItem(key);
                if (data) {
                  detectionDetails[`localStorage_${key}`] = data.substring(0, 100);
                  if (data.toLowerCase().includes('standard')) {
                    detectionMethod = `localStorage-${key}`;
                    return { isStandardUser: true, detectionMethod, detectionDetails };
                  }
                }
              }
            } catch (e) {
              console.log('⚠️ [ADMIN APP] localStorage check failed:', e);
            }
            
            // Method 3: Check for API response patterns
            try {
              // Check if there are any script tags with role data
              const scripts = document.querySelectorAll('script');
              for (const script of scripts) {
                const content = script.textContent || '';
                if (content.includes('Standard User') || content.includes('standard-user')) {
                  detectionMethod = 'script-content';
                  detectionDetails.scriptContent = content.substring(0, 200);
                  return { isStandardUser: true, detectionMethod, detectionDetails };
                }
              }
            } catch (e) {
              console.log('⚠️ [ADMIN APP] Script content check failed:', e);
            }
            
            // Method 4: Check DOM patterns for role indicators
            try {
              // Look for user profile elements
              const roleSelectors = [
                '[data-testid*="profile"]', '[class*="profile"]',
                '[data-testid*="user"]', '[class*="user"]', 
                'header [class*="dropdown"]', '.navbar [role="button"]'
              ];
              
              for (const selector of roleSelectors) {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                  const text = element.textContent?.toLowerCase() || '';
                  const title = (element instanceof HTMLElement) ? element.title?.toLowerCase() || '' : '';
                  const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
                  
                  if (text.includes('standard') || title.includes('standard') || ariaLabel.includes('standard')) {
                    detectionMethod = `dom-${selector}`;
                    detectionDetails.elementText = element.textContent?.substring(0, 100);
                    return { isStandardUser: true, detectionMethod, detectionDetails };
                  }
                }
              }
            } catch (e) {
              console.log('⚠️ [ADMIN APP] DOM pattern check failed:', e);
            }
            
            // Method 5: Check permissions/menu restrictions as proxy
            try {
              // If user can't see certain admin features, they might be Standard User
              const adminLinks = document.querySelectorAll('a[href*="/admin/"]');
              const linkTexts = Array.from(adminLinks).map(link => link.textContent?.trim().toLowerCase()).filter(Boolean);
              
              detectionDetails.availableLinks = linkTexts;
              
              // Standard users typically have restricted access
              const hasContentManager = linkTexts.some(text => text.includes('content'));
              const hasSettings = linkTexts.some(text => text.includes('settings'));
              const hasUserManagement = linkTexts.some(text => text.includes('user'));
              
              // If they have very limited links, they might be Standard User
              if (adminLinks.length < 5 && !hasSettings) {
                detectionMethod = 'permission-restriction';
                return { isStandardUser: true, detectionMethod, detectionDetails };
              }
            } catch (e) {
              console.log('⚠️ [ADMIN APP] Permission check failed:', e);
            }
            
            // Method 6: Original text-based detection (fallback)
            const hasStandardText = pageText.includes('Standard User') || pageHtml.includes('Standard User');
            const hasStandardSlug = pageText.includes('standard-user') || pageHtml.includes('standard-user');
            
            if (hasStandardText || hasStandardSlug) {
              detectionMethod = 'text-pattern';
              detectionDetails.textMatch = hasStandardText ? 'Standard User' : 'standard-user';
              return { isStandardUser: true, detectionMethod, detectionDetails };
            }
            
            return { isStandardUser: false, detectionMethod, detectionDetails };
          };
          
          const { isStandardUser, detectionMethod, detectionDetails } = detectStandardUser();
          
          console.log('🎭 [ADMIN APP] Comprehensive role detection results:', {
            isStandardUser,
            detectionMethod,
            detectionDetails: Object.keys(detectionDetails).length > 0 ? detectionDetails : 'none',
            basicChecks: {
              hasStandardUserText: pageText.includes('Standard User'),
              hasStandardUserHtml: pageHtml.includes('Standard User'),
              // @ts-ignore - Dynamic Strapi admin context  
              strapiContextExists: !!window.strapi?.admin?.user,
              localStorageKeys: Object.keys(localStorage).filter(k => k.includes('strapi') || k.includes('user'))
            }
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
          } else {
            console.log('✅ [ADMIN APP] Not a Standard User - all menu items remain visible');
          }
        } catch (error) {
          console.error('❌ [ADMIN APP] Error in role detection:', error);
        } finally {
          isProcessing = false;
        }
      };
      
      // Set up MutationObserver to react to DOM changes
      const observer = new MutationObserver((mutations) => {
        let shouldProcess = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const text = node.textContent || '';
                // Only process if new content might contain user role info
                if (text.includes('Standard') || text.includes('User') || text.includes('role') || 
                    text.includes('Manager') || text.includes('Settings')) {
                  shouldProcess = true;
                  break;
                }
              }
            }
            if (shouldProcess) break;
          }
        }
        
        if (shouldProcess) {
          console.log('🔄 [ADMIN APP] DOM change detected, checking roles...');
          processRoleDetection();
        }
      });
      
      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Set up storage event listener for auth changes
      window.addEventListener('storage', (event) => {
        if (event.key === 'strapi-jwt-token' || event.key === null) {
          console.log('🔑 [ADMIN APP] Auth token change detected');
          processRoleDetection();
        }
      });
      
      // Set up window focus listener for tab changes
      window.addEventListener('focus', () => {
        console.log('🔍 [ADMIN APP] Window focus detected');
        processRoleDetection();
      });
      
      // Process immediately
      processRoleDetection();
      
      console.log('👀 [ADMIN APP] Pure event-driven role detection set up - NO TIMERS');
    };
    
    // Start the pure event-driven system
    setupRoleDetection();
  }
}; 
