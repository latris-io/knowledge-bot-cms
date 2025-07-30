// Admin Registration Extension - SECURE MULTI-TENANT VERSION
// This script extends the default Strapi admin registration form with secure company assignment

(function() {
  console.log('🚀 Admin registration extension loaded - SECURE MULTI-TENANT VERSION');
  
  // 🛡️ COMPREHENSIVE GENERIC EMAIL DOMAINS LIST
  // These domains require manual company entry with uniqueness validation
  const GENERIC_EMAIL_DOMAINS = [
    // Major providers
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
    'icloud.com', 'me.com', 'mac.com', 'aol.com', 'msn.com',
    
    // International major providers
    'yandex.com', 'yandex.ru', 'mail.ru', 'qq.com', '163.com', '126.com',
    'sina.com', 'sohu.com', 'naver.com', 'daum.net', 'hanmail.net',
    
    // Privacy-focused providers
    'protonmail.com', 'proton.me', 'tutanota.com', 'securemail.pro',
    'privatemail.com', 'guerrillamail.com', 'temp-mail.org',
    
    // Business-oriented but generic
    'zoho.com', 'mail.com', 'gmx.com', 'gmx.net', 'web.de',
    'fastmail.com', 'runbox.com', 'hushmail.com',
    
    // Educational institutions - .edu domains not allowed
    'student.com', 'alumni.com', 'education.com',
    
    // All .edu domains (educational institutions)
    // Note: We'll also check for .edu suffix dynamically
    
    // Mobile/Telecom providers
    'verizon.net', 'att.net', 'comcast.net', 'charter.net', 'cox.net',
    'roadrunner.com', 'earthlink.net', 'sbcglobal.net',
    
    // Legacy/Other
    'rediffmail.com', 'lycos.com', 'excite.com', 'juno.com',
    'netscape.net', 'aim.com', 'inbox.com', 'mail2world.com'
  ];

  // Check if we're on the registration page
  function isRegistrationPage() {
    const url = window.location.href;
    const path = window.location.pathname;
    return url.includes('/auth/register') || 
           path.includes('/auth/register') || 
           path.endsWith('/register') ||
           document.title.includes('Register') ||
           document.querySelector('h1')?.textContent?.includes('Welcome');
  }

  // Check if email domain is generic (consumer email provider) or .edu
  function isGenericEmailDomain(domain) {
    const lowerDomain = domain.toLowerCase();
    
    // Check if it's in our generic domains list
    if (GENERIC_EMAIL_DOMAINS.includes(lowerDomain)) {
      return true;
    }
    
    // Check if it's a .edu domain (educational institutions not allowed)
    if (lowerDomain.endsWith('.edu')) {
      console.log(`🚫 [SECURITY] .edu domain detected: ${domain} - educational institutions not allowed`);
      return true;
    }
    
    return false;
  }

  // Promise-based form detection - no timers!
  function waitForRegistrationForm() {
    return new Promise((resolve, reject) => {
      // First check if form is already in DOM
      const existingForm = findRegistrationForm(document);
      if (existingForm) {
        console.log('📋 Registration form found immediately');
        resolve(existingForm);
        return;
      }

      // Set up MutationObserver to watch for form
      const observer = new MutationObserver((mutations) => {
        // Double-check we're still on registration page
        if (!isRegistrationPage()) {
          observer.disconnect();
          console.log('📍 Left registration page, stopping form detection');
          reject(new Error('Left registration page'));
          return;
        }

        // Check all mutations for new forms
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const form = findRegistrationForm(node);
                if (form) {
                  console.log('📋 Registration form found via MutationObserver');
                  observer.disconnect();
                  resolve(form);
                  return;
                }
              }
            }
          }
        }
      });

      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      console.log('👀 MutationObserver watching for registration form');

      // Optional timeout as safety net (but no polling!)
      setTimeout(() => {
        observer.disconnect();
        reject(new Error('Form detection timeout after 10 seconds'));
      }, 10000);
    });
  }

  // Helper function to find registration form in any element
  function findRegistrationForm(element) {
    // Handle document vs element
    const searchIn = element.querySelector ? element : document;
    
    return searchIn.querySelector('form[data-testid="strapi-sign-up"]') ||
           searchIn.querySelector('form[aria-labelledby="register-admin"]') ||
           searchIn.querySelector('form input[name="confirmPassword"]')?.closest('form') ||
           searchIn.querySelector('form input[name="email"]')?.closest('form');
  }

  function extendRegistrationForm(form) {
    console.log('🔧 Extending registration form with SECURE MULTI-TENANT logic...', form);
    
    // Find the password confirmation field
    const confirmPasswordField = form.querySelector('input[name="confirmPassword"]');
    if (!confirmPasswordField) {
      console.log('❌ Could not find confirm password field');
      console.log('Available inputs:', form.querySelectorAll('input'));
      return;
    }

    console.log('✅ Found confirm password field:', confirmPasswordField);

    // Try multiple ways to find a good insertion point
    const confirmPasswordContainer = confirmPasswordField.closest('div[class*="Field"]') ||
                                    confirmPasswordField.closest('div') ||
                                    confirmPasswordField.parentElement;
    
    if (!confirmPasswordContainer) {
      console.log('❌ Could not find confirm password container');
      return;
    }

    console.log('✅ Found insertion point:', confirmPasswordContainer);

    // Check if company field already exists
    if (document.getElementById('companyName')) {
      console.log('✅ Company field already exists, skipping extension');
      return;
    }

    // 🛡️ SECURE COMPANY FIELD - NO SEARCH CAPABILITY
    const companyFieldHTML = `
      <div style="margin-bottom: 16px; position: relative;">
        <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #32324d; font-size: 14px;">
          Company Name *
        </label>
        <input 
          type="text" 
          name="companyName" 
          id="companyName"
          required
          autocomplete="organization"
          placeholder="Enter your company name"
          style="
            width: 100%; 
            padding: 12px 16px; 
            border: 1px solid #dcdce4; 
            border-radius: 4px; 
            font-size: 14px;
            background: #ffffff;
            transition: border-color 0.2s;
          "
        />
        <div id="company-info" style="color: #0c75de; font-size: 12px; margin-top: 4px; display: none;"></div>
        <div id="company-error" style="color: #d02b20; font-size: 12px; margin-top: 4px; display: none;"></div>
      </div>
    `;

    // Insert company field after confirm password
    confirmPasswordContainer.insertAdjacentHTML('afterend', companyFieldHTML);

    // Get references to new elements
    const companyInput = document.getElementById('companyName');
    const companyInfo = document.getElementById('company-info');
    const companyError = document.getElementById('company-error');
    const emailInput = form.querySelector('input[name="email"]');

    // Debug: Ensure email field is not disabled
    console.log('📧 Email input found:', emailInput);
    console.log('📧 Email input disabled state:', emailInput?.disabled);
    console.log('📧 Email input readonly state:', emailInput?.readOnly);
    console.log('📧 Email input aria-disabled:', emailInput?.getAttribute('aria-disabled'));
    console.log('📧 Email input data-disabled:', emailInput?.hasAttribute('data-disabled'));
    
    // SIMPLE FIX: Replace the broken React input with a working HTML input
    if (emailInput) {
      console.log('🔄 REPLACING broken React input with clean HTML input...');
      
      // Get the current container and styling
      const container = emailInput.parentNode;
      const currentClasses = emailInput.className;
      const currentId = emailInput.id;
      
      // Create a completely new, clean HTML input
      const newEmailInput = document.createElement('input');
      newEmailInput.type = 'email';
      newEmailInput.name = 'email';
      newEmailInput.id = currentId;
      newEmailInput.required = true;
      newEmailInput.autocomplete = 'email';
      newEmailInput.placeholder = 'Enter your email address';
      newEmailInput.className = currentClasses;
      
      // Apply clean, working styles
      newEmailInput.style.cssText = `
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #dcdce4;
        border-radius: 4px;
        font-size: 14px;
        background: #ffffff;
        color: #000000;
        font-family: inherit;
        line-height: normal;
        transition: border-color 0.2s;
        box-sizing: border-box;
      `;
      
      // Replace the broken input with our working one
      container.replaceChild(newEmailInput, emailInput);
      
      console.log('✅ Replaced broken React input with clean HTML input');
      console.log('✅ Email field is now fully functional - try typing in it!');
    }

    let selectedCompany = null;
    let domainCompany = null; // Company from domain check
    let companyAssignmentMode = null; // 'auto', 'manual-generic', 'manual-business'

    // 🛡️ SECURE EMAIL DOMAIN CHECKING
    async function checkEmailDomain(email) {
      const domain = email.split('@')[1];
      if (!domain) return { type: 'invalid', company: null };

      console.log(`🔍 [SECURITY] Checking domain: ${domain}`);

      // Check if it's a generic domain first
      if (isGenericEmailDomain(domain)) {
        console.log(`🔒 [SECURITY] Generic domain detected: ${domain} - manual company entry required`);
        return { type: 'generic', company: null };
      }

      // Check if business domain has existing company
      try {
        const response = await fetch(`/api/check-email-domain?domain=${encodeURIComponent(domain)}`);
        const data = await response.json();
        
        if (data.company) {
          console.log(`🏢 [SECURITY] Business domain with existing company: ${domain} -> ${data.company.name}`);
          return { type: 'business-existing', company: data.company };
        } else {
          console.log(`🏢 [SECURITY] Business domain with no existing company: ${domain} - manual entry required`);
          return { type: 'business-new', company: null };
        }
      } catch (error) {
        console.error('❌ [SECURITY] Domain check error:', error);
        return { type: 'error', company: null };
      }
    }

    // 🛡️ SECURE COMPANY UNIQUENESS VALIDATION
    async function validateCompanyUniqueness(companyName) {
      if (!companyName || !companyName.trim()) {
        return { isUnique: false, error: 'Company name is required' };
      }

      const trimmedName = companyName.trim();
      
      try {
        console.log(`🔍 [SECURITY] Validating company uniqueness: "${trimmedName}"`);
        
        const response = await fetch(`/api/companies/validate-unique?name=${encodeURIComponent(trimmedName)}`);
        const data = await response.json();
        
        if (data.isUnique) {
          console.log(`✅ [SECURITY] Company name "${trimmedName}" is unique`);
          return { isUnique: true, error: null };
        } else {
          console.log(`❌ [SECURITY] Company name "${trimmedName}" already exists`);
          return { isUnique: false, error: 'A company with this name already exists. Please choose a different name.' };
        }
      } catch (error) {
        console.error('❌ [SECURITY] Company uniqueness validation error:', error);
        return { isUnique: false, error: 'Unable to validate company name. Please try again.' };
      }
    }

    // Email input change handler - get the new email input
    const newEmailField = form.querySelector('input[name="email"]');
    if (newEmailField) {
      newEmailField.addEventListener('blur', async function() {
        const email = this.value.trim();
        if (!email || !email.includes('@')) return;

        // Clear previous states
        clearCompanyMessages();
        companyInput.disabled = false;
        companyInput.style.backgroundColor = '#ffffff';
        companyInput.style.cursor = 'text';
        selectedCompany = null;
        domainCompany = null;

        // Check domain
        const domainResult = await checkEmailDomain(email);
        
        switch (domainResult.type) {
          case 'business-existing':
            // Auto-assign to existing company
            companyAssignmentMode = 'auto';
            domainCompany = domainResult.company;
            companyInput.value = domainResult.company.name;
            companyInput.setAttribute('disabled', 'true');
            companyInput.style.backgroundColor = '#f6f6f9';
            companyInput.style.cursor = 'not-allowed';
            selectedCompany = domainResult.company;
            
            showCompanyInfo('Company auto-assigned based on your email domain', 'info');
            break;
            
          case 'generic':
            // Generic domain - manual entry required
            companyAssignmentMode = 'manual-generic';
            companyInput.value = '';
            companyInput.setAttribute('placeholder', 'Enter your company name (must be unique)');
            
            showCompanyInfo('Generic email domain detected. Please enter your company name.', 'warning');
            break;
            
          case 'business-new':
            // Business domain with no existing company - manual entry
            companyAssignmentMode = 'manual-business';
            companyInput.value = '';
            companyInput.setAttribute('placeholder', 'Enter your company name (must be unique)');
            
            showCompanyInfo('New business domain. Please enter your company name.', 'info');
            break;
            
          default:
            // Error or invalid - manual entry
            companyAssignmentMode = 'manual-generic';
            companyInput.value = '';
            companyInput.setAttribute('placeholder', 'Enter your company name');
            break;
        }
      });
    }

    // 🛡️ SECURE COMPANY INPUT HANDLER - NO SEARCH, ONLY UNIQUENESS VALIDATION
    let validationTimeout;
    companyInput.addEventListener('input', function() {
      // Don't allow editing if company is locked from domain
      if (this.disabled || domainCompany) {
        return;
      }
      
      const query = this.value.trim();
      
      // Clear previous timeout
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }

      // Clear previous validation results
      clearCompanyMessages();
      
      if (query.length === 0) {
        return;
      }

      // Debounce uniqueness validation
      validationTimeout = setTimeout(async () => {
        const validation = await validateCompanyUniqueness(query);
        
        if (!validation.isUnique) {
          showCompanyError(validation.error);
        } else {
          showCompanyInfo('✓ Company name is available', 'success');
        }
      }, 500);
    });

    // Helper functions for messaging
    function showCompanyInfo(message, type = 'info') {
      clearCompanyMessages();
      companyInfo.textContent = message;
      companyInfo.style.display = 'block';
      
      switch (type) {
        case 'success':
          companyInfo.style.color = '#27ae60';
          break;
        case 'warning':
          companyInfo.style.color = '#f39c12';
          break;
        case 'info':
        default:
          companyInfo.style.color = '#0c75de';
          break;
      }
    }

    function showCompanyError(message) {
      clearCompanyMessages();
      companyError.textContent = message;
      companyError.style.display = 'block';
      companyInput.style.borderColor = '#d02b20';
    }

    function clearCompanyMessages() {
      companyInfo.style.display = 'none';
      companyError.style.display = 'none';
      companyInput.style.borderColor = '#dcdce4';
    }

    function clearFieldError(field) {
      // Remove red border
      field.style.borderColor = '#dcdce4';
      
      // Remove error message
      const existingError = field.parentNode.querySelector('.field-error');
      if (existingError) {
        existingError.remove();
      }
    }

    // Form submission handling
    form.addEventListener('submit', handleFormSubmission);
  }

  async function handleFormSubmission(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Clear previous errors
    clearAllErrors();
    
    // Get form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    console.log('📝 [SECURITY] Form data:', data);
    
    // 🛡️ ENHANCED VALIDATION WITH SECURITY CHECKS
    let hasErrors = false;
    
    // Validate first name (cast to string)
    const firstName = String(data.firstname || '');
    if (!firstName.trim()) {
      showFieldError('firstname', 'This value is required.');
      hasErrors = true;
    }
    
    // Validate email (cast to string)
    const email = String(data.email || '');
    if (!email.trim()) {
      showFieldError('email', 'This value is required.');
      hasErrors = true;
    }
    
    // Validate confirm password (cast to string)
    const confirmPassword = String(data.confirmPassword || '');
    if (!confirmPassword.trim()) {
      showFieldError('confirmPassword', 'Confirm password is required.');
      hasErrors = true;
    }
    
    // 🛡️ SECURE COMPANY VALIDATION
    const companyField = document.getElementById('companyName');
    const companyName = String(data.companyName || '');
    if (!companyName.trim()) {
      // Check if company field is disabled (meaning it was auto-filled)
      if (companyField && companyField.hasAttribute('disabled') && companyField.value) {
        data.companyName = companyField.value;
        console.log('✅ [SECURITY] Using auto-assigned company:', data.companyName);
      } else {
        showFieldError('companyName', 'Company name is required.');
        hasErrors = true;
      }
    } else {
      // For manual entry, validate uniqueness one final time
      if (!companyField.hasAttribute('disabled')) {
        console.log('🔍 [SECURITY] Final company uniqueness validation...');
        
        // Disable submit button during validation
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = 'Validating...';
        }
        
        const validation = await validateCompanyUniqueness(companyName);
        
        if (!validation.isUnique) {
          showFieldError('companyName', validation.error);
          hasErrors = true;
        } else {
          console.log('✅ [SECURITY] Final company validation passed');
        }
        
        // Re-enable submit button
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Let's start";
        }
      }
    }
    
    if (hasErrors) {
      console.log('❌ [SECURITY] Form validation failed');
      return;
    }
    
    // Additional validation for password match
    if (data.password !== data.confirmPassword) {
      showFieldError('confirmPassword', 'Passwords do not match.');
      return;
    }
    
    console.log('✅ [SECURITY] Form validation passed, submitting...');
    
    // Disable submit button during processing
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Creating Account...';
    }

    // Submit to our custom endpoint
    submitRegistration(data, submitButton);
  }

  async function submitRegistration(data, submitButton) {
    try {
      const response = await fetch('/admin/register-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        // Show simple success message
        if (result.emailVerificationRequired) {
          alert(`✅ Account created successfully!\n\n📧 We've sent you an email with your account details and verification link.\n\n🔍 DEVELOPMENT MODE: Check the server console for full account information.\n\n⚠️ You must verify your email before you can log in.`);
        } else {
          alert(`✅ Admin account created successfully!\n\nCheck your email for login instructions.`);
        }

        // Redirect to login after a brief delay
        setTimeout(() => {
          window.location.href = '/admin/auth/login';
        }, 1000);
      } else {
        console.error('❌ Registration failed:', result);
        
        // Extract and show detailed error message
        let errorMessage = '❌ Registration failed. Please try again.';
        
        try {
          if (result.error) {
            if (result.error.message) {
              errorMessage = `❌ Registration Error: ${result.error.message}`;
            } else if (typeof result.error === 'string') {
              errorMessage = `❌ Registration Error: ${result.error}`;
            }
          } else if (result.message) {
            errorMessage = `❌ Registration Error: ${result.message}`;
          } else if (result.details && result.details.errors) {
            // Handle validation errors (like unique constraint violations)
            const errors = result.details.errors;
            if (Array.isArray(errors) && errors.length > 0) {
              const errorMessages = errors.map(err => {
                if (err.message) {
                  if (err.path && err.path.length > 0) {
                    const field = err.path[0];
                    if (field === 'username' || field === 'email') {
                      return `Email address is already registered. Please use a different email or try logging in.`;
                    }
                    return `${field}: ${err.message}`;
                  }
                  return err.message;
                }
                return 'Validation error';
              });
              errorMessage = `❌ Registration Issues:\n\n${errorMessages.join('\n')}`;
            }
          }
          
          // Handle specific common server errors
          if (errorMessage.includes('must be unique')) {
            errorMessage = '❌ Registration Error:\n\nThis email address is already registered.\n\nPlease try:\n• Using a different email address\n• Logging in if you already have an account';
          }
          
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `❌ Registration failed: ${JSON.stringify(result)}`;
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      // Handle network and other errors
      let errorMessage = '❌ Registration failed';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = '❌ Network Error\n\nCannot connect to the server. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = `❌ Registration Error: ${error.message}`;
      } else {
        errorMessage = '❌ Registration failed due to an unexpected error. Please try again.';
      }
      
      alert(errorMessage);
    } finally {
      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Let's start";
      }
    }
  }

  function clearAllErrors() {
    // Clear all custom error states
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('input[style*="border-color: rgb(208, 43, 32)"]').forEach(input => {
      input.style.borderColor = '#dcdce4';
    });
    
    // Clear company-specific error
    const companyError = document.getElementById('company-error');
    if (companyError) {
      companyError.style.display = 'none';
    }
  }

  function showFieldError(fieldName, message) {
    const field = document.querySelector(`input[name="${fieldName}"], #${fieldName}`);
    if (!field) return;
    
    // Add red border
    field.style.borderColor = '#d02b20';
    field.style.borderWidth = '1px';
    
    // Add error message below field
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.cssText = 'color: #d02b20; font-size: 12px; margin-top: 4px; display: block;';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
  }

  // Start the process
  // Only start if we're on a registration page
  if (isRegistrationPage()) {
    console.log('📍 On registration page, starting SECURE MULTI-TENANT form detection');
    console.log(`🛡️ [SECURITY] Loaded ${GENERIC_EMAIL_DOMAINS.length} generic email domains for validation`);
    
    waitForRegistrationForm()
      .then(form => {
        console.log('✅ Form detected, extending with SECURE MULTI-TENANT logic');
        extendRegistrationForm(form);
      })
      .catch(error => {
        console.log('❌ Form detection failed:', error.message);
      });
  } else {
    console.log('📍 Not on registration page, skipping form detection');
  }
})(); 