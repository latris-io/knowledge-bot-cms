module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    console.log('🔍 Admin registration middleware called for:', ctx.request.method, ctx.request.url);
    
    // Handle email domain check
    if (ctx.request.url.includes('/api/check-email-domain')) {
      console.log('🔍 Email domain check request detected');
      try {
        const domain = ctx.query.domain;
        
        if (!domain) {
          return ctx.send({ company: null });
        }

        // Find users with the same email domain
        const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
          filters: {
            email: {
              $endsWith: `@${domain}`
            }
          },
          populate: ['company'],
          limit: 1
        });

        if (users && users.length > 0 && users[0].company) {
          // Return the company information
          const company = await strapi.documents('api::company.company').findOne({
            documentId: users[0].company.documentId || users[0].company.id
          });
          
          return ctx.send({ company });
        }

        return ctx.send({ company: null });
      } catch (error) {
        console.error('Domain check error:', error);
        return ctx.send({ company: null });
      }
    }

    // Handle company search for registration
    if (ctx.request.url.includes('/api/companies') && ctx.request.url.includes('register-search=true')) {
      console.log('🔍 Company search request detected');
      try {
        // Access the query parameter (Strapi parses URL-encoded parameters automatically)
        const query = ctx.query.filters?.name?.$containsi;
        
        if (!query || query.length < 1) {
          return ctx.send({ data: [] });
        }

        // Search companies by name (case-insensitive partial match)
        const companies = await strapi.documents('api::company.company').findMany({
          filters: {
            name: {
              $containsi: query
            }
          },
          limit: 10,
          sort: 'name:asc'
        });

        return ctx.send({ data: companies });
      } catch (error) {
        console.error('Company search error:', error);
        return ctx.send({ data: [] });
      }
    }

    // Only intercept POST requests to /admin/register-admin
    if (ctx.request.method === 'POST' && ctx.request.url === '/admin/register-admin') {
      console.log('🚀 Intercepting admin registration request');
      try {
        const originalBody = ctx.request.body;
        
        // Check if this is our custom registration with company field
        if (originalBody.companyName) {
          console.log('🚀 Processing custom admin registration...');
          
          const {
            firstname,
            lastname,
            email,
            password,
            companyName
          } = originalBody;

          // Validate required fields (no bot required now)
          if (!firstname || !lastname || !email || !password || !companyName) {
            return ctx.badRequest('All fields are required including company information');
          }

          // Use email as username for normal login experience
          const username = email;
          
          console.log(`📧 Email: ${email}`);
          console.log(`🏢 Company: ${companyName}`);
          console.log(`👤 Username: ${username}`);

          // Search for existing company or create new one
          let company;
          const existingCompanies = await strapi.documents('api::company.company').findMany({
            filters: {
              name: {
                $eqi: companyName
              }
            }
          });

          if (existingCompanies.length > 0) {
            company = existingCompanies[0];
            console.log(`📝 Using existing company: ${company.name}`);
            console.log('Existing company object:', JSON.stringify(company, null, 2));
          } else {
            console.log(`🏢 Creating new company: ${companyName}`);
            try {
              // Create new company with all required fields
              company = await strapi.documents('api::company.company').create({
                data: {
                  name: companyName,
                  company_id: companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
                  subscription_status: 'trial',
                  plan_level: 'starter',  
                  storage_used_bytes: 0,
                  storage_limit_bytes: 2 * 1024 * 1024 * 1024, // 2GB default
                  default_notifications_enabled: true,
                  default_batch_size_threshold: 10,
                  default_notification_delay_minutes: 5,
                  notification_quota_daily: 100,
                  notification_quota_monthly: 1000
                },
                status: 'published'
              });
              console.log(`✅ Created new company successfully: ${company.name}`);
              console.log('Created company object:', JSON.stringify(company, null, 2));
            } catch (companyError) {
              console.error(`❌ Failed to create company "${companyName}":`, companyError);
              return ctx.internalServerError('Failed to create company');
            }
          }

          // Get Standard User role for admin user creation
          let adminRole;
          try {
            // Look ONLY for existing Standard User role
            adminRole = await strapi.documents('admin::role').findMany({
              filters: { 
                $or: [
                  { name: { $eqi: 'Standard User' } },
                  { code: { $eqi: 'standard-user' } }
                ]
              }
            });

            console.log(`🔍 Looking for existing Standard User role...`);

            // If Standard User role doesn't exist, fail with clear error
            if (!adminRole || adminRole.length === 0) {
              console.error(`❌ Standard User role not found! Please create it in Settings > Administration Panel > Roles`);
              return ctx.internalServerError('Standard User role not found. Please create the "Standard User" role in the admin panel before registering users.');
            } else {
              console.log(`✅ Found existing Standard User role:`, adminRole[0]);
            }

          } catch (roleError) {
            console.error('❌ Error finding Standard User role:', roleError);
            return ctx.internalServerError('Failed to find Standard User role');
          }

          console.log(`👤 Creating admin user for company: ${company.name}`);
          
          // Create Admin User (for admin panel access)
          // Note: Strapi automatically hashes the password, so we pass it as plain text
          const adminUserData = {
            username,
            email,
            password: password, // Pass plain text password - Strapi will hash it
            firstname,
            lastname,
            isActive: true,
            roles: [adminRole[0].documentId]
          };

          // Remove these lines - admin users don't support custom fields
          // adminUserData.customCompanyId = company.id;
          // adminUserData.customCompanyName = company.name;
          
          let adminUser;
          
          // Always create a new admin user with unique email (no reusing existing users)
          // This ensures password is always set correctly
          let adminEmail = email;
          let emailSuffix = 1;
          
          // Keep checking until we find a unique email for admin user
          while (true) {
            const existingWithThisEmail = await strapi.documents('admin::user').findMany({
              filters: { email: adminEmail }
            });
            
            if (!existingWithThisEmail || existingWithThisEmail.length === 0) {
              break; // Found unique email
            }
            
            // Try next suffix
            adminEmail = `${email.split('@')[0]}+admin${emailSuffix}@${email.split('@')[1]}`;
            emailSuffix++;
            
            if (emailSuffix > 100) {
              throw new Error('Could not generate unique admin email after 100 attempts');
            }
          }
          
          // Update admin user data with unique email
          adminUserData.email = adminEmail;
          console.log(`🔧 Using unique admin email: ${adminEmail}`);
          
          // Create Admin User
          try {
            console.log('📝 Creating admin user with data:', JSON.stringify(adminUserData, null, 2));
            
            adminUser = await strapi.documents('admin::user').create({
              data: adminUserData
            });
            console.log(`✅ Admin user created with ID: ${adminUser.id}, documentId: ${adminUser.documentId}, email: ${adminUser.email}, username: ${adminUser.username}`);
            console.log(`🔐 Password saved for user: ${adminUser.email} (Strapi handles hashing automatically)`);
            
            // Also create a users-permissions user for content management with company association
            try {
              console.log('🔍 Attempting to create users-permissions user...');
              console.log('Company data:', { id: company.id, documentId: company.documentId, name: company.name });
              console.log('Full company object:', JSON.stringify(company, null, 2));
              
              // Get the authenticated role
              const authenticatedRole = await strapi.entityService.findMany('plugin::users-permissions.role', {
                filters: {
                  type: 'authenticated'
                }
              });

              console.log('🔍 Found authenticated roles:', authenticatedRole?.length || 0);
              if (authenticatedRole?.length > 0) {
                console.log('Role details:', JSON.stringify(authenticatedRole[0], null, 2));
              }

              if (!authenticatedRole || authenticatedRole.length === 0) {
                console.warn('⚠️ Authenticated role not found for users-permissions user. Skipping content user creation.');
              } else {
                // First, we need to get the actual database ID of the company
                // The documents API returns documentId, but entityService needs the database id
                let companyDbId;
                try {
                  // Fetch the company using entityService to get the database ID
                  const companyEntity = await strapi.entityService.findMany('api::company.company', {
                    filters: {
                      documentId: company.documentId
                    },
                    limit: 1
                  });
                  
                  if (companyEntity && companyEntity.length > 0) {
                    companyDbId = companyEntity[0].id;
                    console.log(`🔍 Found company database ID: ${companyDbId} for documentId: ${company.documentId}`);
                  } else {
                    console.error('❌ Could not find company entity with documentId:', company.documentId);
                    throw new Error('Company entity not found');
                  }
                } catch (error) {
                  console.error('❌ Error fetching company entity:', error);
                  throw error;
                }
                
                // Create the users-permissions user with company
                // Using entityService for plugin content types
                const userData = {
                  username,
                  email,
                  password,
                  provider: 'local',  // Required field for users-permissions
                  confirmed: true,
                  blocked: false,
                  role: authenticatedRole[0].id,  // Use id for entityService
                  company: companyDbId,  // Use the database ID
                  // Add required notification fields with default values
                  billing_notifications: true,
                  subscription_reminders: true,
                  trial_ending_alerts: true,
                  storage_limit_warnings: true,
                  usage_analytics_reports: true,
                  security_notifications: true,
                  feature_announcements: false,
                  marketing_communications: false,
                  weekly_digest: true,
                  system_maintenance_alerts: true
                };
                
                console.log('📝 Creating users-permissions user with data:', JSON.stringify(userData, null, 2));
                
                const contentUser = await strapi.entityService.create('plugin::users-permissions.user', {
                  data: userData
                });

                console.log(`✅ Created users-permissions user:`, JSON.stringify(contentUser, null, 2));
              }
            } catch (contentUserError) {
              console.error('⚠️ Error creating users-permissions user:', contentUserError);
              console.error('Error details:', contentUserError.message);
              console.error('Error stack:', contentUserError.stack);
              if (contentUserError.details) {
                console.error('Error details object:', JSON.stringify(contentUserError.details, null, 2));
              }
              // Continue even if content user creation fails
            }
            
            console.log(`✅ Admin registration completed: ${email} -> ${username} @ ${company.name}`);
            
          } catch (adminUserError) {
            console.error(`❌ Admin user creation failed:`, adminUserError);
            throw adminUserError;
          }

          // Log the registration
          try {
            await strapi.documents('api::admin-action-log.admin-action-log').create({
              data: {
                action: 'admin_registration',
                details: `New admin registered: ${email} (${username}) for company ${company.name}`,
                ip_address: ctx.request.ip || 'unknown',
                user_agent: ctx.request.headers['user-agent'] || 'unknown',
                user: adminUser.id
              }
            });
          } catch (logError) {
            console.warn('Failed to log admin registration:', logError);
          }

          // Return success response
          return ctx.send({
            user: {
              id: adminUser.id,
              firstname: adminUser.firstname,
              lastname: adminUser.lastname,
              username: adminUser.username,
              email: adminUser.email,
              company: company.name
            }
          });
        }
      } catch (error) {
        console.error('❌ Admin registration error:', error);
        return ctx.internalServerError('Registration failed');
      }
    }

    // Continue with normal processing for other requests
    await next();
  };
}; 