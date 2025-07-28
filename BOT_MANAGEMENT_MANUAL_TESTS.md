# Bot Management and Media Library - Manual Test Guide

This document provides manual test steps for UC-006 (Bot Management) and UC-007 (Media Library Company Isolation).

## Prerequisites

1. Strapi server running (`npm run develop`)
2. Admin account with access to Strapi admin panel
3. At least two companies created in the system
4. At least two user accounts assigned to different companies

## UC-006: Bot Management and Folder Creation Tests

### Test 1: Bot Creation with Automatic Folder Creation
1. Navigate to Content Manager → Bot
2. Click "Create new entry"
3. Fill in:
   - Name: "Test Bot 1"
   - Description: "Test bot for UC006"
   - Company: Select any company
   - Processing Enabled: Yes
   - Auto Correction Enabled: No
   - Max Retry Attempts: 3
   - Retry Delay Minutes: 5
4. Click "Save"
5. **Verify:**
   - ✅ Bot is created successfully
   - ✅ JWT token is generated (visible in the form)
   - ✅ Widget installation instructions are generated
   - ✅ Navigate to Media Library
   - ✅ A folder named `{Company Name} - Test Bot 1` exists at the root level
   - ✅ The folder path is `/bot-{id}` where {id} is the bot's ID

### Test 2: JWT Token Validation
1. Copy the JWT token from the bot created in Test 1
2. Go to [jwt.io](https://jwt.io/)
3. Paste the token in the "Encoded" field
4. **Verify:**
   - ✅ The token is valid
   - ✅ The payload contains `company_id` matching the selected company's ID
   - ✅ The payload contains `bot_id` matching the bot's bot_id field
   - ✅ The algorithm is HS256

### Test 3: Bot Update and Folder Name Update
1. Edit the bot created in Test 1
2. Change the name to "Updated Bot Name"
3. Save the changes
4. Navigate to Media Library
5. **Verify:**
   - ✅ The folder name has been updated to `{Company Name} - Updated Bot Name`
   - ✅ The folder path remains `/bot-{id}`

### Test 4: Delete Protection
1. Navigate to Media Library
2. Open the bot's folder
3. Upload any file to the folder
4. Go back to Content Manager → Bot
5. Try to delete the bot
6. **Verify:**
   - ✅ Deletion is blocked
   - ✅ An error toast appears with message: "Cannot delete bot "{Bot Name}". The bot's folder contains X file(s). Please delete all files before deleting the bot."
7. Go to Media Library and delete the file
8. Try to delete the bot again
9. **Verify:**
   - ✅ Bot is deleted successfully
   - ✅ The folder is also deleted from Media Library

### Test 5: Concurrent Bot Creation
1. Quickly create 3 bots in succession (within a few seconds)
2. **Verify:**
   - ✅ All bots are created successfully
   - ✅ All corresponding folders are created
   - ✅ No database lock errors occur

## UC-007: Media Library Company Isolation Tests

### Test 6: Company-Based Folder Filtering
1. Log in as User A (assigned to Company A)
2. Navigate to Media Library
3. **Verify:**
   - ✅ Only see folders for bots belonging to Company A
   - ✅ Cannot see any folders for bots belonging to other companies
4. Log out and log in as User B (assigned to Company B)
5. Navigate to Media Library
6. **Verify:**
   - ✅ Only see folders for bots belonging to Company B
   - ✅ Cannot see any folders for bots belonging to Company A

### Test 7: Admin User Filtering
1. Log in as an admin user who has a regular user account assigned to Company A
2. Navigate to Media Library
3. **Verify:**
   - ✅ Only see folders for bots belonging to Company A
   - ✅ Admin users have the same company-based restrictions as regular users

### Test 8: Root Folder Visibility
1. Create a folder at the root level (/) without any company association
2. Log in as different users from different companies
3. **Verify:**
   - ✅ All users can see the root folder without company association
   - ✅ Users still cannot see bot folders from other companies

### Test 9: File Upload Company Association
1. Log in as a user assigned to Company A
2. Navigate to a bot folder for Company A
3. Upload a file
4. Check the file details in Content Manager → Media
5. **Verify:**
   - ✅ The file has the correct company relation set
   - ✅ The file has the correct bot relation set (based on folder)
   - ✅ The file has the correct user relation set

### Test 10: Cross-Company Isolation Verification
1. Create the following test data:
   - Company A with Bot A1 and Bot A2
   - Company B with Bot B1
   - User A assigned to Company A
   - User B assigned to Company B
2. Log in as User A
3. **Verify in Media Library:**
   - ✅ Can see folders for Bot A1 and Bot A2
   - ✅ Cannot see folder for Bot B1
4. Log in as User B
5. **Verify in Media Library:**
   - ✅ Can see folder for Bot B1
   - ✅ Cannot see folders for Bot A1 or Bot A2

## Expected Results Summary

### UC-006 (Bot Management):
- [x] Automatic folder creation on bot creation
- [x] Folder naming pattern: `{Company Name} - {Bot Name}`
- [x] Folder path pattern: `/bot-{id}`
- [x] JWT token generation with company_id and bot_id
- [x] Widget installation instructions generation
- [x] Folder name updates when bot name changes
- [x] Delete protection when folder contains files
- [x] Automatic folder deletion when bot is deleted (if empty)
- [x] No database lock issues with concurrent operations

### UC-007 (Media Library Isolation):
- [x] Users only see folders for their company's bots
- [x] Admin users have same company-based restrictions
- [x] Bot folder pattern matching works correctly
- [x] Company relations are set on folders
- [x] Files inherit company/bot relations from folders
- [x] No cross-company data leakage
- [x] Root folders without company are visible to all

## Troubleshooting

### If folders are not being created:
1. Check the browser console for errors
2. Check the Strapi server logs
3. Verify the bot lifecycle hooks are working in `src/api/bot/content-types/bot/lifecycles.js`

### If company isolation is not working:
1. Check that users have company assignments
2. Verify the folder filtering middleware in `src/extensions/upload/strapi-server.js`
3. Check browser console for middleware debug logs

### If file relations are not being set:
1. Check the upload middleware in `src/middlewares/assign-user-bot-to-upload.js`
2. Verify the file, folder, bot, and company relations are properly defined in schemas 