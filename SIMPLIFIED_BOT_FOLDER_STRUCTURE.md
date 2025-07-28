# Simplified Bot Folder Structure

## Overview

The media library now uses a simplified, flat folder structure that makes it easy to find and upload files to specific bots. Each bot has its own folder at the root level, clearly labeled with both the company and bot names.

## Folder Structure

```
/
├── bot-1 (ClearlyClear - FAQ Bot)
├── bot-2 (ClearlyClear - Support Bot)
├── bot-3 (Acme Corp - Sales Bot)
└── bot-4 (Acme Corp - HR Bot)
```

## Key Features

### 1. **Flat Structure**
- All bot folders are at the root level
- No need to navigate through multiple folder levels
- Easy to find the right bot folder

### 2. **Clear Naming**
- Folders are named: `{Company Name} - {Bot Name}`
- Example: "ClearlyClear - FAQ Bot"
- Makes it obvious which company and bot the folder belongs to

### 3. **Automatic Bot Association**
- Files uploaded to a bot folder are automatically associated with that bot
- The system detects the bot ID from the folder path (`/bot-{id}`)
- No manual bot selection needed

### 4. **Folder Creation**
- Folders are created automatically when:
  - A new bot is created
  - The server starts up (for existing bots without folders)
- Folder names update automatically when bot names change

## How It Works

### For Users

1. **Open Media Library**
   - Click on Media Library in the admin panel
   - You'll see all bot folders at the root level

2. **Find Your Bot**
   - Look for folders named like "YourCompany - YourBot"
   - All folders are visible at the top level

3. **Upload Files**
   - Click on the bot folder
   - Upload files directly to that folder
   - Files are automatically associated with the bot

### For the System

1. **Folder Path Pattern**: `/bot-{botId}`
   - Example: `/bot-123` for bot with ID 123

2. **Metadata Storage**
   - Each folder stores metadata:
     ```json
     {
       "bot_id": 123,
       "company_id": 456,
       "bot_name": "FAQ Bot",
       "company_name": "ClearlyClear"
     }
     ```

3. **Automatic Updates**
   - When a bot name changes, the folder name updates
   - When a company name changes, all related bot folder names update

## Benefits

1. **User-Friendly**
   - No deep navigation required
   - Clear visibility of all available bots
   - Intuitive naming convention

2. **Efficient**
   - Quick access to any bot folder
   - Less clicking and navigation
   - Easier to manage files

3. **Scalable**
   - Works well with many bots
   - Easy to add new bots
   - Simple folder management

## Migration from Old Structure

If you had the old nested structure (`/companies/39/bots/123`), the system will:
1. Create new flat folders for all bots
2. Keep old folders intact (files remain accessible)
3. Use the new structure for all new uploads

## Technical Details

### Folder Creation Logic
- **Bootstrap**: Creates folders for all existing bots on server startup
- **Bot Creation**: Creates folder immediately when a new bot is created
- **Bot Update**: Updates folder name when bot or company name changes

### File Association
- The middleware detects uploads to `/bot-{id}` folders
- Automatically sets:
  - `bot_id`: From the folder path
  - `company_id`: From the bot's company relation
  - `user_id`: From the authenticated user

This simplified structure makes file management much more straightforward while maintaining all the automatic bot association features. 