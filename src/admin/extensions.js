const extensions = {};

// Add upload notification functionality
if (typeof window !== 'undefined') {
  // Upload batching variables
  let uploadBatch = [];
  let uploadBatchTimer = null;
  const BATCH_DELAY = 1000; // Wait 1 second to collect uploads

  // Create toast container
  function createToastContainer() {
    let container = document.getElementById('upload-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'upload-toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  // Create and show toast message
  function showToast(message, type = 'success') {
    const container = createToastContainer();
    const toast = document.createElement('div');
    
    toast.style.cssText = `
      background: ${type === 'success' ? '#4caf50' : '#f44336'};
      color: white;
      padding: 16px 20px;
      margin-bottom: 10px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      pointer-events: auto;
      position: relative;
      animation: slideIn 0.3s ease-out;
      max-width: 100%;
      word-wrap: break-word;
    `;
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      margin-left: 8px;
      opacity: 0.8;
      line-height: 1;
    `;
    
    // Add click handler to close button
    closeButton.addEventListener('click', function() {
      try {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => { 
          if (toast.parentNode) { 
            toast.remove(); 
          } 
        }, 300);
      } catch (e) {
        // Fallback: remove immediately
        toast.remove();
      }
    });
    
    toast.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="font-size: 16px; margin-top: 1px;">
          ${type === 'success' ? '✅' : '❌'}
        </div>
        <div style="flex: 1;">
          ${message}
        </div>
      </div>
    `;
    
    // Append close button to the flex container
    toast.firstElementChild.appendChild(closeButton);
    
    // Add animation keyframes if not already added
    if (!document.getElementById('toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    container.appendChild(toast);
    
    // No auto-remove - persistent until user closes manually
  }

  // Process batched uploads and show single toast
  function processBatchedUploads() {
    if (uploadBatch.length === 0) return;
    
    const totalFiles = uploadBatch.reduce((sum, batch) => sum + batch.length, 0);
    const fileWord = totalFiles === 1 ? 'file' : 'files';
    
    const message = `
      <strong>Upload Complete!</strong><br>
      ${totalFiles} ${fileWord} uploaded successfully.<br><br>
      📧 You will receive an email notification once your ${fileWord} ${totalFiles === 1 ? 'has' : 'have'} been processed and ${totalFiles === 1 ? 'is' : 'are'} ready for use by your AI bot.
    `;
    
    showToast(message, 'success');
    
    // Clear the batch
    uploadBatch = [];
    uploadBatchTimer = null;
  }

  // Override fetch to intercept upload and user save requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args).then(response => {
      // Check if this is a successful upload request
      if (response.ok && args[0] && args[0].toString().includes('/upload')) {
        // Clone the response to read the data
        response.clone().json().then(data => {
          if (data && Array.isArray(data)) {
            // Add this upload to the batch
            uploadBatch.push(data);
            
            // Clear any existing timer
            if (uploadBatchTimer) {
              clearTimeout(uploadBatchTimer);
            }
            
            // Set a new timer to process the batch
            uploadBatchTimer = setTimeout(() => {
              processBatchedUploads();
            }, BATCH_DELAY);
          }
        }).catch(() => {
          // Ignore JSON parsing errors
        });
      }
      
      // Check if this is a user save request
      if (args[0] && args[0].toString().includes('/content-manager/collection-types/plugin::users-permissions.user/')) {
        const method = args[1]?.method || 'GET';
        
        if (method === 'PUT' || method === 'POST') {
          if (response.ok) {
            // Success - no toast notification needed
            // User will see the updated data in the UI
          } else {
            // Error - simplified handling for user saves
            console.log('User save failed with status:', response.status);
            
            // For user save operations, we know that:
            // 1. Our lifecycle hooks only throw ValidationError for missing bot/company
            // 2. 500 errors are most likely our validation errors
            // 3. We control the lifecycle hooks so we can assume 500 = validation error
            
            if (response.status === 500) {
              // Assume this is our validation error from lifecycle hooks
              console.log('Treating 500 error as validation error for user save');
              showToast(`
                <strong>❌ Validation Error!</strong><br>
                Bot and Company are required before saving. Please select both fields.
              `, 'error');
            } else {
              // Other HTTP errors
              response.clone().json().then(data => {
                const errorMessage = data?.error?.message || data?.message || 'Failed to save user';
                showToast(`
                  <strong>❌ Save Failed!</strong><br>
                  ${errorMessage}
                `, 'error');
              }).catch(() => {
                showToast(`
                  <strong>❌ Save Failed!</strong><br>
                  Please try again.
                `, 'error');
              });
            }
          }
        }
      }
      
      return response;
    }).catch(error => {
      // Handle network errors for user save requests
      if (args[0] && args[0].toString().includes('/content-manager/collection-types/plugin::users-permissions.user/')) {
        const method = args[1]?.method || 'GET';
        if (method === 'PUT' || method === 'POST') {
          showToast(`
            <strong>❌ Network Error!</strong><br>
            Failed to save user. Please check your connection and try again.
          `, 'error');
        }
      }
      throw error;
    });
  };
}

export default extensions;
