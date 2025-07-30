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

    // Handle email confirmation
    if (ctx.request.url.startsWith('/api/auth/email-confirmation')) {
      const urlParams = new URLSearchParams(ctx.request.url.split('?')[1]);
      const confirmationToken = urlParams.get('confirmation');

      if (!confirmationToken) {
        ctx.status = 400;
        ctx.body = `
          <html>
            <head><title>Verification Failed</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: #d02b20;">❌ Email Verification Failed</h2>
              <p>Missing confirmation token.</p>
              <p><a href="/admin/auth/login">Return to Login</a></p>
            </body>
          </html>
        `;
        return;
      }

      try {
        // Find user with this confirmation token
        const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
          filters: {
            confirmationToken: confirmationToken,
            confirmed: false
          }
        });

        if (!users || users.length === 0) {
          ctx.status = 400;
          ctx.body = `
            <html>
              <head><title>Verification Failed</title></head>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #d02b20;">❌ Email Verification Failed</h2>
                <p>The verification link is invalid or has already been used.</p>
                <p><a href="/admin/auth/login">Return to Login</a></p>
              </body>
            </html>
          `;
          return;
        }

        // Update user to confirmed
        await strapi.entityService.update('plugin::users-permissions.user', users[0].id, {
          data: {
            confirmed: true,
            confirmationToken: null
          }
        });

        console.log(`✅ Email verified for user: ${users[0].email}`);

        // Also activate the corresponding admin user
        try {
          const userEmail = users[0].email;
          const baseEmail = userEmail.split('@')[0];
          const domain = userEmail.split('@')[1];
          
          // Find admin user - could be the exact email or with +admin suffix
          const adminUsers = await strapi.documents('admin::user').findMany({
            filters: { 
              $or: [
                { email: userEmail }, // Try exact match first
                { email: { $startsWith: `${baseEmail}+admin` } } // Try with +admin suffix
              ]
            }
          });

          if (adminUsers && adminUsers.length > 0) {
            await strapi.documents('admin::user').update({
              documentId: adminUsers[0].documentId,
              data: {
                isActive: true
              }
            });
            console.log(`✅ Admin user activated: ${adminUsers[0].email} (for user: ${userEmail})`);
          } else {
            console.log(`⚠️ No admin user found to activate for: ${userEmail}`);
          }
        } catch (adminActivationError) {
          console.error('⚠️ Failed to activate admin user:', adminActivationError.message);
          // Don't fail the email verification if admin activation fails
        }

        // Return success page
        ctx.status = 200;
        ctx.body = `
          <html>
            <head><title>Email Verified</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: #28a745;">✅ Email Verified Successfully!</h2>
              <p>Your email address has been verified. You can now log in to your account.</p>
              <div style="margin: 30px 0;">
                <a href="/admin/auth/login" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  Login to Admin Panel
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Use your email address and password to log in.
              </p>
            </body>
          </html>
        `;
        return;

      } catch (error) {
        console.error('Error during email confirmation:', error);
        ctx.status = 500;
        ctx.body = `
          <html>
            <head><title>Verification Error</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: #d02b20;">❌ Verification Error</h2>
              <p>An error occurred during email verification.</p>
              <p><a href="/admin/auth/login">Return to Login</a></p>
            </body>
          </html>
        `;
        return;
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
            isActive: false,  // Admin user is inactive until email verification
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
                // Generate confirmation token for email verification
                const crypto = require('crypto');
                const confirmationToken = crypto.randomBytes(32).toString('hex');
                
                // Using entityService for plugin content types
                const userData = {
                  username,
                  email,
                  password,
                  provider: 'local',  // Required field for users-permissions
                  confirmed: false,  // User must verify email first
                  blocked: false,
                  confirmationToken: confirmationToken,  // Store verification token
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
                
                // Send verification email (non-blocking)
                const sendVerificationEmail = async () => {
                  try {
                    console.log('📧 Sending verification email...');
                    const verificationUrl = `${strapi.config.get('server.url', 'http://localhost:1337')}/api/auth/email-confirmation`;
                    
                    // For development, just log the verification link instead of sending email
                    if (process.env.NODE_ENV !== 'production') {
                      console.log(`\n🎉 ========== ACCOUNT CREATED SUCCESSFULLY ==========`);
                      console.log(`📧 Email: ${email}`);
                      console.log(`🔐 Password: ${password}`);
                      console.log(`🏢 Company: ${company.name}`);
                      console.log(`🔗 VERIFICATION LINK: ${verificationUrl}?confirmation=${confirmationToken}`);
                      console.log(`\n🚀 NEXT STEPS:`);
                      console.log(`1. Click the verification link above`);
                      console.log(`2. Go to: http://localhost:1337/admin/auth/login`);
                      console.log(`3. Login with email: ${email}`);
                      console.log(`4. Enter password: ${password}`);
                      console.log(`⚠️  IMPORTANT: Use your EMAIL ADDRESS (not username) to log in!`);
                      console.log(`================================================\n`);
                      return;
                    }
                    
                    // Debug SMTP configuration
                    const emailConfig = strapi.config.get('plugins.email', {});
                    console.log('📧 [EMAIL DEBUG] Full email config:', JSON.stringify(emailConfig, null, 2));
                    console.log('📧 [EMAIL DEBUG] Environment variables:');
                    console.log('  - SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
                    console.log('  - SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');  
                    console.log('  - SMTP_USERNAME:', process.env.SMTP_USERNAME ? 'SET' : 'NOT SET');
                    console.log('  - SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'SET' : 'NOT SET');
                    console.log('  - NODE_ENV:', process.env.NODE_ENV);
                    
                    await strapi.plugins['email'].services.email.send({
                      to: email,
                      from: strapi.config.get('plugins.email.settings.defaultFrom', 'noreply@localhost'),
                      subject: 'Welcome to Knowledge Bot - Account Created & Email Verification',
                      html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                          <h2 style="color: #333;">🎉 Welcome to Knowledge Bot!</h2>
                          <p>Your account has been created successfully! Here are your account details:</p>
                          
                          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #495057; margin-top: 0;">📋 Your Account Information</h3>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Password:</strong> ${password}</p>
                            <p><strong>Company:</strong> ${company.name}</p>
                            <p style="color: #6c757d; font-size: 14px; margin-bottom: 0;">
                              ⚠️ <strong>Important:</strong> Use your <strong>EMAIL ADDRESS</strong> (not username) to log in!
                            </p>
                          </div>
                          
                          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
                            <h4 style="color: #856404; margin-top: 0;">🔐 Email Verification Required</h4>
                            <p style="color: #856404; margin-bottom: 0;">You must verify your email address before you can log in. Click the button below:</p>
                          </div>
                          
                          <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationUrl}?confirmation=${confirmationToken}" 
                               style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                              ✅ Verify Email & Activate Account
                            </a>
                          </div>
                          
                          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="color: #1976d2; margin-top: 0;">🚀 Next Steps</h4>
                            <ol style="color: #1976d2;">
                              <li>Click the verification button above</li>
                              <li>Go to <a href="http://localhost:1337/admin/auth/login" style="color: #1976d2;">http://localhost:1337/admin/auth/login</a></li>
                              <li>Login with your email: <strong>${email}</strong></li>
                              <li>Enter your password: <strong>${password}</strong></li>
                            </ol>
                          </div>
                          
                          <p style="color: #666; font-size: 14px;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <a href="${verificationUrl}?confirmation=${confirmationToken}">${verificationUrl}?confirmation=${confirmationToken}</a>
                          </p>
                          
                          <p style="color: #666; font-size: 12px;">
                            If you did not create this account, please ignore this email.
                          </p>
                          
                          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                          <p style="color: #999; font-size: 11px;">
                            © 2024 Knowledge Bot. All rights reserved.
                          </p>
                        </div>
                      `,
                      text: `🎉 Welcome to Knowledge Bot!

Your account has been created successfully!

📋 ACCOUNT INFORMATION:
Email: ${email}
Password: ${password}
Company: ${company.name}

⚠️ IMPORTANT: Use your EMAIL ADDRESS (not username) to log in!

🔐 EMAIL VERIFICATION REQUIRED:
You must verify your email before you can log in.
Click this link: ${verificationUrl}?confirmation=${confirmationToken}

🚀 NEXT STEPS:
1. Click the verification link above
2. Go to: http://localhost:1337/admin/auth/login
3. Login with email: ${email}
4. Enter password: ${password}

If you did not create this account, please ignore this email.

Best regards,
The Knowledge Bot Team`
                    });
                    
                    console.log('✅ Verification email sent successfully');
                  } catch (emailError) {
                    console.error('⚠️ Failed to send verification email:', emailError.message);
                    // Don't block registration if email fails
                  }
                };
                
                // Send email in background, don't wait for it
                sendVerificationEmail();
              }
            } catch (contentUserError) {
              console.error('⚠️ Error creating users-permissions user:', contentUserError);
              console.error('Error details:', contentUserError.message);
              console.error('Error stack:', contentUserError.stack);
              if (contentUserError.details) {
                console.error('Error details object:', JSON.stringify(contentUserError.details, null, 2));
                
                // Check for validation errors (like unique constraint violations)
                if (contentUserError.details.errors && Array.isArray(contentUserError.details.errors)) {
                  const errors = contentUserError.details.errors;
                  for (const error of errors) {
                    if (error.path && (error.path.includes('username') || error.path.includes('email')) && 
                        error.message && error.message.includes('unique')) {
                      return ctx.badRequest({
                        error: {
                          message: 'This email address is already registered. Please use a different email address or try logging in instead.',
                          type: 'ValidationError',
                          field: 'email'
                        }
                      });
                    }
                  }
                }
              }
              
              // For other types of user creation errors, also return an error
              return ctx.badRequest({
                error: {
                  message: 'Failed to create user account. Please try again or contact support if the problem persists.',
                  type: 'UserCreationError'
                }
              });
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

          // Return success response with email verification notice
          return ctx.send({
            user: {
              id: adminUser.id,
              firstname: adminUser.firstname,
              lastname: adminUser.lastname,
              username: adminUser.username,
              email: adminUser.email,
              company: company.name
            },
            message: 'Account created successfully! Please check your email to verify your account before logging in.',
            emailVerificationRequired: true
          });
        }
      } catch (error) {
        console.error('❌ Admin registration error:', error);
        
        // Provide more specific error messages based on error type
        if (error.message && error.message.includes('email')) {
          return ctx.badRequest({
            error: {
              message: 'Invalid email address provided. Please check your email and try again.',
              type: 'ValidationError',
              field: 'email'
            }
          });
        }
        
        if (error.message && error.message.includes('company')) {
          return ctx.badRequest({
            error: {
              message: 'Company information is invalid. Please check the company name and try again.',
              type: 'ValidationError',
              field: 'company'
            }
          });
        }
        
        if (error.message && error.message.includes('password')) {
          return ctx.badRequest({
            error: {
              message: 'Password requirements not met. Please ensure your password is at least 8 characters long.',
              type: 'ValidationError',
              field: 'password'
            }
          });
        }
        
        // Generic error for unexpected issues
        return ctx.internalServerError({
          error: {
            message: 'Registration failed due to an unexpected error. Please try again or contact support.',
            type: 'ServerError'
          }
        });
      }
    }

    // Continue with normal processing for other requests
    await next();
  };
}; 