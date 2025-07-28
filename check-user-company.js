const Strapi = require('@strapi/strapi');

async function checkAndFixUserCompany() {
  try {
    const appContext = await Strapi.compile();
    const app = await Strapi(appContext).load();
    
    console.log('\n🔍 Checking user company assignment...\n');
    
    // Find the user
    const users = await app.entityService.findMany('plugin::users-permissions.user', {
      filters: { email: 'martybremer@icloud.com' },
      populate: ['company']
    });
    
    if (users.length > 0) {
      const user = users[0];
      console.log('User found:');
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Company:', user.company ? `${user.company.name} (ID: ${user.company.id})` : 'NOT ASSIGNED');
      
      if (!user.company) {
        console.log('\n❌ User has no company assigned!');
        
        // Find Acme Corporation
        const companies = await app.entityService.findMany('api::company.company', {
          filters: { name: 'Acme Corporation' },
          limit: 1
        });
        
        if (companies.length > 0) {
          const company = companies[0];
          console.log(`\n✅ Found company: ${company.name} (ID: ${company.id})`);
          
          // Update user with company
          console.log('\n🔧 Assigning company to user...');
          await app.entityService.update('plugin::users-permissions.user', user.id, {
            data: {
              company: company.id
            }
          });
          
          // Verify the update
          const updatedUser = await app.entityService.findOne('plugin::users-permissions.user', user.documentId, {
            populate: ['company']
          });
          
          if (updatedUser && updatedUser.company) {
            console.log(`✅ Successfully assigned ${updatedUser.company.name} to ${updatedUser.email}`);
          } else {
            console.log('❌ Failed to assign company');
          }
        } else {
          console.log('❌ Acme Corporation not found!');
        }
      } else {
        console.log('\n✅ User already has company assigned');
      }
    } else {
      console.log('❌ User not found!');
    }
    
    await app.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndFixUserCompany(); 