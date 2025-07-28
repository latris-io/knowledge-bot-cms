const Strapi = require('@strapi/strapi');

async function checkUserData() {
  try {
    const strapi = await Strapi().load();
    
    console.log('\n🔍 Checking user data for martybremer@icloud.com...\n');
    
    // Find user by email
    const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
      filters: { email: 'martybremer@icloud.com' },
      populate: ['company']
    });
    
    if (users.length > 0) {
      const user = users[0];
      console.log('User found:');
      console.log('  ID:', user.id);
      console.log('  Document ID:', user.documentId);
      console.log('  Email:', user.email);
      console.log('  Company:', user.company ? `${user.company.name} (ID: ${user.company.id})` : 'NOT ASSIGNED');
      
      // Try loading by ID
      console.log('\n🔍 Testing findOne with ID:', user.id);
      try {
        const byId = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
          populate: ['company']
        });
        console.log('  Found by ID:', byId ? 'YES' : 'NO');
      } catch (e) {
        console.log('  Error with ID:', e.message);
      }
      
      // Try loading by documentId
      console.log('\n🔍 Testing findOne with documentId:', user.documentId);
      try {
        const byDocId = await strapi.entityService.findOne('plugin::users-permissions.user', user.documentId, {
          populate: ['company']
        });
        console.log('  Found by documentId:', byDocId ? 'YES' : 'NO');
        if (byDocId) {
          console.log('  Company:', byDocId.company ? `${byDocId.company.name} (ID: ${byDocId.company.id})` : 'NOT ASSIGNED');
        }
      } catch (e) {
        console.log('  Error with documentId:', e.message);
      }
    } else {
      console.log('❌ User not found!');
    }
    
    await strapi.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUserData(); 