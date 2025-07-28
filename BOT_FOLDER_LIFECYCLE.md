# Bot Folder Lifecycle Management

This document describes how bot folders are automatically created, updated, and managed in the Media Library.

## Overview

Bot folders are automatically managed through Strapi lifecycle hooks to ensure consistency between bots and their associated storage folders.

## Folder Structure

- **Pattern**: `/bot-{id}`
- **Naming**: `{Company Name} - {Bot Name}`
- **Location**: Root level of Media Library
- **Company Association**: Each folder has a `company` relation for access control

## Automatic Folder Management

### 1. Bot Creation (afterCreate)
When a new bot is created:
- A folder is automatically created at `/bot-{id}`
- Folder name follows the pattern: `{Company Name} - {Bot Name}`
- The folder is associated with the bot's company for access control
- Bot's `folder_id` and `folder_path` are updated

### 2. Bot Update (afterUpdate)
When a bot is updated:
- If the bot name changes, the folder is automatically renamed
- New folder name: `{Company Name} - {New Bot Name}`
- Path remains the same (`/bot-{id}`)
- Only the display name changes

### 3. Bot Deletion (beforeDelete)
Smart protection for bot deletion:
- **If folder contains files**: 
  - Deletion is blocked
  - User sees a toast notification: "Cannot delete bot '{Bot Name}'. The bot's folder contains X file(s). Please delete all files before deleting the bot."
- **If folder is empty**:
  - Bot deletion proceeds
  - Empty folder is automatically deleted

## How It Works

The lifecycle hooks are implemented in `src/api/bot/content-types/bot/lifecycles.js`:

1. **beforeCreate**: Generates JWT token for widget integration
2. **afterCreate**: Creates the Media Library folder
3. **afterUpdate**: Handles folder renaming when bot name changes
4. **beforeDelete**: Implements smart deletion protection

## Troubleshooting

### Issue: System crashes when creating a bot

**Cause**: Database lock issues can occur when multiple operations happen too quickly.

**Solution**: The system now includes:
- Error handling to prevent crashes
- Small delays between database operations
- Graceful failure handling if folder creation fails

**If crashes persist**:
1. Check server logs for specific error messages
2. Ensure SQLite database isn't being accessed by other processes
3. Consider increasing the delay in the afterCreate hook
4. Verify that the database file has proper write permissions

### Issue: Folder not created after bot creation

**Cause**: The folder creation might fail silently to prevent system crashes.

**Solution**: 
1. Check server logs for folder creation errors
2. Manually trigger folder creation by updating the bot name
3. Verify the company has proper ID assignment

## Benefits

- **Automatic Organization**: Folders are created and managed automatically
- **Company Isolation**: Each company's bot folders are properly isolated
- **Data Protection**: Prevents accidental deletion of bot data
- **Clean Naming**: Consistent folder naming across the system
- **Error Recovery**: System remains stable even if folder operations fail 