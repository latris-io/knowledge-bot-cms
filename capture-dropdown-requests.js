// Paste this into the browser console before clicking Move or Location dropdown

(function() {
  console.log('🎯 Starting request capture...');
  
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override fetch
  window.fetch = function(...args) {
    const url = args[0];
    const method = args[1]?.method || 'GET';
    
    console.log('🌐 FETCH REQUEST:', method, url);
    if (args[1]) {
      console.log('   Headers:', args[1].headers);
      console.log('   Body:', args[1].body);
    }
    
    // Call original fetch and log response
    return originalFetch.apply(this, args).then(response => {
      const clonedResponse = response.clone();
      
      if (url.includes('folder') || url.includes('relation')) {
        clonedResponse.json().then(data => {
          console.log('📦 RESPONSE for', url);
          console.log('   Data:', data);
        }).catch(() => {
          console.log('📦 RESPONSE for', url, '(non-JSON)');
        });
      }
      
      return response;
    });
  };
  
  // Also intercept XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url;
    this._method = method;
    console.log('🌐 XHR REQUEST:', method, url);
    return originalOpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.send = function(body) {
    if (body) {
      console.log('   XHR Body:', body);
    }
    
    this.addEventListener('load', function() {
      if (this._url && (this._url.includes('folder') || this._url.includes('relation'))) {
        try {
          const data = JSON.parse(this.responseText);
          console.log('📦 XHR RESPONSE for', this._url);
          console.log('   Data:', data);
        } catch (e) {
          console.log('📦 XHR RESPONSE for', this._url, '(non-JSON)');
        }
      }
    });
    
    return originalSend.apply(this, arguments);
  };
  
  console.log('✅ Request capture enabled. Now click the Move button or Location dropdown.');
})(); 