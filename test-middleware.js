const axios = require('axios');

async function testMiddleware() {
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:1337/admin/login', {
      email: 'martybremer@icloud.com',
      password: 'Newpassword1!'
    });
    
    const token = loginResponse.data.data.token;
    
    console.log('✅ Logged in successfully');
    
    // Test folder endpoint
    console.log('\n📁 Testing /upload/folders endpoint...');
    const foldersResponse = await axios.get('http://localhost:1337/upload/folders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Folders response status:', foldersResponse.status);
    console.log('Number of folders:', foldersResponse.data.data ? foldersResponse.data.data.length : 'N/A');
    
    // Test folder-structure endpoint
    console.log('\n🌳 Testing /upload/folder-structure endpoint...');
    const structureResponse = await axios.get('http://localhost:1337/upload/folder-structure', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Folder-structure response status:', structureResponse.status);
    console.log('Response type:', typeof structureResponse.data);
    console.log('Has data property:', structureResponse.data.data ? 'Yes' : 'No');
    
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

testMiddleware(); 