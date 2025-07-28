# Bot Folder-Based Media Organization System

## Overview

This system implements an intuitive folder-based approach for organizing media files by bot within each company. When files are uploaded to a bot's folder, they are automatically associated with that bot for ChromaDB ingestion.

## Architecture

### Folder Structure
```
/companies/{companyId}/
├── bots/
│   ├── {botId}/ (folder name = bot name)
│   │   ├── file1.pdf
│   │   ├── file2.docx
│   │   └── ...
│   └── {anotherBotId}/
│       └── ...
└── general/ (optional - for non-bot files)
```

### Key Components

1. **Bot Lifecycle Hooks** (`src/api/bot/content-types/bot/lifecycles.js`)
   - Creates a folder for each bot when created
   - Updates folder name when bot name changes
   - Preserves folder when bot is deleted (to keep files)

2. **Upload Middleware** (`src/middlewares/assign-user-bot-to-upload.js`)
   - Automatically detects bot from folder path
   - Assigns bot_id and company_id to file metadata
   - Falls back to user's default bot if needed

3. **Media Library Filter** (`src/policies/media-library-filter.js`)
   - Restricts folder visibility to user's company
   - Ensures users only see their company's files

4. **Company Folder Creation** (`src/index.js`)
   - Creates company folder structure on bootstrap
   - Ensures /companies/{companyId}/bots/ exists

## How It Works

### 1. Bot Creation Flow
When a new bot is created:
1. Bot lifecycle hook triggers
2. Creates folder at `/companies/{companyId}/bots/{botId}`
3. Folder name matches bot name
4. Stores bot metadata in folder for reference

### 2. File Upload Flow
When a user uploads a file:
1. User navigates to their bot's folder in Media Library
2. Uploads file to that folder
3. Middleware detects folder path pattern
4. Automatically assigns:
   - `bot_id` from folder path
   - `company_id` from folder path
   - `user_id` from authenticated user
5. File is ready for ChromaDB ingestion with proper metadata

### 3. Access Control
- Users only see folders within their company
- Folder structure enforces proper organization
- No manual bot selection needed

## Benefits

1. **Intuitive UX**: Users understand folder = bot association
2. **Automatic Metadata**: No manual bot selection required
3. **Visual Organization**: Easy to see which files belong to which bot
4. **ChromaDB Ready**: Files have correct metadata for tenancy
5. **Access Control**: Natural boundary enforcement

## ChromaDB Integration

Files uploaded through this system are automatically tagged with:
```json
{
  "bot_id": 123,
  "company_id": 456,
  "user_id": 789,
  "bot_name": "Customer Service Bot",
  "uploaded_at": "2024-01-27T12:00:00Z"
}
```

This metadata enables proper tenancy in ChromaDB:
- Filter by `company_id` for company isolation
- Filter by `bot_id` for bot-specific queries
- Track upload history with `user_id` and `uploaded_at`

## User Experience

1. **Creating a Bot**:
   - User creates bot in Bot Management
   - Folder automatically appears in Media Library

2. **Uploading Files**:
   - User navigates to Media Library
   - Sees company folder with bot subfolders
   - Clicks on bot folder
   - Uploads files directly
   - Files automatically associated with that bot

3. **Managing Files**:
   - Files organized by bot
   - Easy to move files between bots
   - Clear visual hierarchy

## Technical Details

### Bot Schema Extensions
```json
{
  "folder_id": {
    "type": "integer"
  },
  "folder_path": {
    "type": "string"
  }
}
```

### Folder Metadata Structure
```javascript
{
  "bot_id": 123,
  "company_id": 456,
  "bot_name": "Customer Service Bot"
}
```

### Path Pattern Recognition
- Bot folder: `/companies/{companyId}/bots/{botId}`
- Company folder: `/companies/{companyId}`
- Pattern matching via regex in middleware

## Maintenance

### Folder Cleanup
- Bot deletion preserves folders to maintain file history
- Manual cleanup can be done if needed
- Consider archiving old bot folders

### Name Synchronization
- Bot name changes automatically update folder names
- Maintains consistency between Bot Management and Media Library

### Error Handling
- Graceful fallback if folder detection fails
- Uses user's default bot as backup
- Logs all operations for debugging

## Future Enhancements

1. **Bulk Operations**: Select multiple files to reassign to different bot
2. **Folder Templates**: Pre-create common subfolder structures
3. **Usage Analytics**: Track which bots have most content
4. **Archival System**: Auto-archive inactive bot folders
5. **Folder Permissions**: More granular access control per bot

This system provides a clean, intuitive way for users to organize their knowledge base content while ensuring proper metadata assignment for ChromaDB integration. 