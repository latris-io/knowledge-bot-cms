// Admin Registration Extension
// This script extends the default Strapi admin registration form with company and bot fields

(function() {
  console.log('🚀 Admin registration extension loaded');
  
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
    console.log('🔧 Extending registration form...', form);
    
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

    // Create company name field with autocomplete
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
          placeholder="Enter or search for your company"
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
        <div id="company-dropdown" style="
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #dcdce4;
          border-top: none;
          border-radius: 0 0 4px 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          z-index: 1000;
          display: none;
          max-height: 200px;
          overflow-y: auto;
        "></div>
        <div id="company-error" style="color: #d02b20; font-size: 12px; margin-top: 4px; display: none;"></div>
      </div>
    `;

    // Insert company field after confirm password
    confirmPasswordContainer.insertAdjacentHTML('afterend', companyFieldHTML);

    // Get references to new elements
    const companyInput = document.getElementById('companyName');
    const companyDropdown = document.getElementById('company-dropdown');
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

    // Email domain checking functionality
    async function checkEmailDomain(email) {
      const domain = email.split('@')[1];
      if (!domain) return null;

      try {
        const response = await fetch(`/api/check-email-domain?domain=${encodeURIComponent(domain)}`);
        const data = await response.json();
        
        if (data.company) {
          return data.company;
        }
      } catch (error) {
        console.error('Domain check error:', error);
      }
      return null;
    }

    // Email input change handler - get the new email input
    const newEmailField = form.querySelector('input[name="email"]');
    if (newEmailField) {
      newEmailField.addEventListener('blur', async function() {
        const email = this.value.trim();
        if (!email || !email.includes('@')) return;

        // Check if domain has existing users
        const company = await checkEmailDomain(email);
        
        if (company) {
          // Found a company with the same domain
          domainCompany = company;
          companyInput.value = company.name;
          companyInput.disabled = true;
          companyInput.style.backgroundColor = '#f6f6f9';
          companyInput.style.cursor = 'not-allowed';
          selectedCompany = company;
          
          // Add info message
          const infoMessage = document.createElement('div');
          infoMessage.id = 'domain-company-info';
          infoMessage.style.cssText = 'color: #0c75de; font-size: 12px; margin-top: 4px;';
          infoMessage.textContent = 'Company auto-filled based on your email domain';
          
          const existingInfo = document.getElementById('domain-company-info');
          if (existingInfo) existingInfo.remove();
          
          companyInput.parentNode.appendChild(infoMessage);
        } else {
          // No company found, enable the field
          domainCompany = null;
          if (companyInput.disabled) {
            companyInput.value = '';
            companyInput.disabled = false;
            companyInput.style.backgroundColor = '#ffffff';
            companyInput.style.cursor = 'text';
            selectedCompany = null;
            
            const existingInfo = document.getElementById('domain-company-info');
            if (existingInfo) existingInfo.remove();
          }
        }
      });
    }

    // Company search functionality
    let searchTimeout;
    companyInput.addEventListener('input', function() {
      // Don't allow editing if company is locked from domain
      if (this.disabled || domainCompany) {
        return;
      }
      
      const query = this.value.trim();
      
      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Clear selection when user types
      selectedCompany = null;
      
      if (query.length === 0) {
        companyDropdown.style.display = 'none';
        return;
      }

      // Debounce search
      searchTimeout = setTimeout(() => {
        searchCompanies(query);
      }, 300);
    });

    async function searchCompanies(query) {
      try {
        const response = await fetch(`/api/companies?register-search=true&filters[name][$containsi]=${encodeURIComponent(query)}&pagination[limit]=10`);
        const data = await response.json();
        
        displayCompanyResults(data.data || []);
      } catch (error) {
        console.error('Company search error:', error);
        companyDropdown.style.display = 'none';
      }
    }

    function displayCompanyResults(companies) {
      if (companies.length === 0) {
        companyDropdown.style.display = 'none';
        return;
      }

      const html = companies.map(company => `
        <div class="company-option" data-company='${JSON.stringify(company)}' style="
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid #f6f6f9;
          transition: background-color 0.2s;
        " onmouseover="this.style.backgroundColor='#f6f6f9'" onmouseout="this.style.backgroundColor='white'">
          <div style="font-weight: 500; color: #32324d;">${company.name}</div>
        </div>
      `).join('');

      companyDropdown.innerHTML = html;
      companyDropdown.style.display = 'block';

      // Add click handlers
      companyDropdown.querySelectorAll('.company-option').forEach(option => {
        option.addEventListener('click', function() {
          const company = JSON.parse(this.dataset.company);
          selectCompany(company);
        });
      });
    }

    function selectCompany(company) {
      selectedCompany = company;
      companyInput.value = company.name;
      companyDropdown.style.display = 'none';
      clearFieldError(companyInput);
    }

    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!companyInput.contains(e.target) && !companyDropdown.contains(e.target)) {
        companyDropdown.style.display = 'none';
      }
    });

    // Form submission handling
    form.addEventListener('submit', handleFormSubmission);
  }

  function handleFormSubmission(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Clear previous errors
    clearAllErrors();
    
    // Get form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    console.log('📝 Form data:', data);
    
    // Validate required fields
    let hasErrors = false;
    
    // Validate first name
    if (!data.firstname?.trim()) {
      showFieldError('firstname', 'This value is required.');
      hasErrors = true;
    }
    
    // Validate email
    if (!data.email?.trim()) {
      showFieldError('email', 'This value is required.');
      hasErrors = true;
    }
    
    // Validate confirm password
    if (!data.confirmPassword?.trim()) {
      showFieldError('confirmPassword', 'Confirm password is required.');
      hasErrors = true;
    }
    
    // Custom validation for company name
    if (!data.companyName?.trim()) {
      // Check if company field is disabled (meaning it was auto-filled)
      const companyField = document.getElementById('companyName');
      if (companyField && companyField.disabled && companyField.value) {
        data.companyName = companyField.value;
      } else {
        showFieldError('companyName', 'This value is required.');
        hasErrors = true;
      }
    }
    
    if (hasErrors) {
      console.log('❌ Form validation failed');
      return;
    }
    
    // Additional validation for password match
    if (data.password !== data.confirmPassword) {
      showFieldError('confirmPassword', 'Passwords do not match.');
      return;
    }
    
    console.log('✅ Form validation passed, submitting...');
    
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
          alert(`✅ Account created successfully!\\n\\n📧 We've sent you an email with your account details and verification link.\\n\\n🔍 DEVELOPMENT MODE: Check the server console for full account information.\\n\\n⚠️ You must verify your email before you can log in.`);
        } else {
          alert(`✅ Admin account created successfully!\\n\\nCheck your email for login instructions.`);
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
              errorMessage = `❌ Registration Issues:\\n\\n${errorMessages.join('\\n')}`;
            }
          }
          
          // Handle specific common server errors
          if (errorMessage.includes('must be unique')) {
            errorMessage = '❌ Registration Error:\\n\\nThis email address is already registered.\\n\\nPlease try:\\n• Using a different email address\\n• Logging in if you already have an account';
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
        errorMessage = '❌ Network Error\\n\\nCannot connect to the server. Please check your internet connection and try again.';
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

  function clearFieldError(field) {
    // Remove red border
    field.style.borderColor = '#dcdce4';
    
    // Remove error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  }

  // Start the process
  // Only start if we're on a registration page
  if (isRegistrationPage()) {
    console.log('📍 On registration page, starting event-driven form detection');
    
    waitForRegistrationForm()
      .then(form => {
        console.log('✅ Form detected, extending registration form');
        extendRegistrationForm(form);
      })
      .catch(error => {
        console.log('❌ Form detection failed:', error.message);
      });
  } else {
    console.log('📍 Not on registration page, skipping form detection');
  }
})(); 