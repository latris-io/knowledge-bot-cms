// Admin Registration Extension
// This script extends the default Strapi admin registration form with company and bot fields

(function() {
  console.log('🚀 Admin registration extension loaded');

  // Wait for the form to be available
  function waitForForm() {
    // Try multiple possible selectors for the registration form
    const form = document.querySelector('form[data-testid="strapi-sign-up"]') ||
                  document.querySelector('form[aria-labelledby="register-admin"]') ||
                  document.querySelector('form input[name="confirmPassword"]')?.closest('form') ||
                  document.querySelector('form input[name="email"]')?.closest('form');
    
    if (form) {
      console.log('📋 Registration form found, extending it');
      extendRegistrationForm(form);
    } else {
      console.log('⏳ Waiting for registration form...');
      setTimeout(waitForForm, 500);
    }
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

    // Email input change handler
    if (emailInput) {
      emailInput.addEventListener('blur', async function() {
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
      // If company was auto-filled from domain, use that
      if (domainCompany && companyInput.disabled) {
        data.companyName = domainCompany.name;
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
        // Show success message
        alert(`✅ Admin account created successfully!\\n\\n🔑 LOGIN INSTRUCTIONS:\\nEmail: ${result.user.email}\\nPassword: [your password]\\nCompany: ${result.user.company}\\n\\n⚠️ IMPORTANT: Use your EMAIL to login to the admin panel!`);

        // Redirect to login
        window.location.href = '/admin/auth/login';
      } else {
        console.error('❌ Registration failed:', result);
        
        // Show error message
        const errorMessage = result.error?.message || result.message || 'Registration failed';
        alert(`❌ Registration failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      alert(`❌ Registration failed: ${error.message}`);
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
  waitForForm();

  // Also set up a mutation observer to catch dynamically loaded forms
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if any new forms were added
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const form = node.querySelector ? 
              (node.querySelector('form input[name="confirmPassword"]')?.closest('form') || 
               (node.tagName === 'FORM' && node.querySelector('input[name="confirmPassword"]') ? node : null)) : 
              null;
            
            if (form && !document.getElementById('companyName')) {
              console.log('🔍 Found dynamically loaded form, extending...');
              extendRegistrationForm(form);
            }
          }
        });
      }
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('👀 Mutation observer set up for dynamic form detection');
})(); 