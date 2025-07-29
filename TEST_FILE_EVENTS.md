# File Event Tracking Test Guide

This guide helps you verify that file events are being properly tracked for create, update (replacement), and delete operations.

## Prerequisites

1. Strapi server must be running (`npm run develop`)
2. You must be logged in to the Strapi Admin Panel
3. You need at least one bot with a folder (e.g., `/bot-79`)

## Testing Steps

### 1. Test CREATE Event

1. Go to Media Library in the admin panel
2. Navigate to any bot folder (e.g., "ClearlyClear Bot (ClearlyClear)")
3. Click "Add new assets" and upload a file
4. Run `node test-file-events-simple.js` to verify a "created" event was added

### 2. Test UPDATE Event (File Replacement)

1. In Media Library, click on any existing file in a bot folder
2. In the file details panel, click "Replace media"
3. Select a new file to replace the existing one
4. Run `node test-file-events-simple.js` to verify an "updated" event was added

### 3. Test DELETE Event

1. In Media Library, select a file in a bot folder
2. Click the delete button (trash icon)
3. Confirm the deletion
4. Run `node test-file-events-simple.js` to verify a "deleted" event was added

## Verification Script

Run the verification script to see the latest file events:

```bash
node test-file-events-simple.js
```

This script will show:
- Recent event counts by type
- The latest 10 file events with details
- Troubleshooting information

## Expected Results

For each operation, you should see:

1. **CREATE**: 
   - event_type: "created"
   - processing_status: "pending"
   - All relations (bot_id, company_id, user_id) should be set

2. **UPDATE** (Replacement):
   - event_type: "updated"
   - processing_status: "pending"
   - Same file_document_id as the original file

3. **DELETE**:
   - event_type: "deleted"
   - processing_status: "completed"
   - Relations may be set depending on the file's associations

## Troubleshooting

If events are not being created:

1. Check the server console for errors
2. Restart the Strapi server after code changes
3. Make sure you're uploading to bot folders (not the root folder)
4. Check that the upload service overrides are loaded (look for "🚨🚨🚨 UPLOAD EXTENSION FILE IS BEING LOADED" in server logs)

## Server Logs

When file operations occur, you should see logs like:

- `🎯 Custom upload method called` - For new uploads
- `🔄 File replacement detected for ID: xxx` - For replacements
- `🗑️ [UPLOAD SERVICE] Custom remove called for file:` - For deletions
- `✅ File event (created/updated/deleted) created for file xxx` 