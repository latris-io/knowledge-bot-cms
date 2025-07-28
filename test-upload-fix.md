# Testing File Upload Relations Fix

## Quick Test Steps

1. **Check Server Console**
   - When you upload a file, you should see logs like:
   ```
   🔍 Upload middleware called for: POST /upload
   👤 Admin panel upload detected
   ✅ Found user account for admin: marty@latris.io
   📤 Upload successful - processing 1 file(s)
   ```

2. **Verify in Strapi Admin Panel**
   - Go to **Content Manager → Media**
   - Find "Developer Ticket - Slack Lead Notification.docx"
   - Click on it to view details
   - Check if these fields are populated:
     - User (should show your user)
     - Company (should show your company)
     - Bot (should show the bot if uploaded to a bot folder)

3. **Check File Event (if exists)**
   - Go to **Content Manager → File Event**
   - Look for a recent entry with the file name
   - Check if user, bot, and company relations are set

## Troubleshooting

If relations are still not being set:

1. **Verify Middleware is Loading**
   - Server startup should show: `🔍 Upload middleware called for:`
   - If not, check that `config/middlewares.js` includes `global::assign-user-bot-to-upload`

2. **Check for Errors**
   - Look for error messages in server console during upload
   - Common issues:
     - "No user found" - Admin email might not match a user account
     - "Error updating file" - Permission or database issues

3. **Manual Fix for Existing Files**
   - For files already uploaded without relations, you can manually set them in Content Manager → Media

## Expected Behavior

When uploading to a bot folder (e.g., "ClearlyClear - FAQ"):
- User: Should be set to the uploading user
- Company: Should be set to the user's company
- Bot: Should be set based on the folder (extracted from `/bot-{id}` path)

When uploading to a non-bot folder:
- User: Should be set to the uploading user  
- Company: Should be set to the user's company
- Bot: Should remain empty 