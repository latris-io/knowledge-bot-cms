# Media Library Bot-Specific Upload UX Guide

## Overview

The media library now provides an enhanced user experience for bot-specific uploads through intelligent folder organization and automatic file association.

## Folder Structure

The system automatically creates and maintains the following folder hierarchy:

```
/companies/
  /{company-id}/
    /bots/
      /{bot-id-1}/     ← Bot-specific folders
      /{bot-id-2}/
      /{bot-id-3}/
    /general/          ← Non-bot files
```

## Key Features

### 1. Automatic Folder Creation

- **On Company Creation**: A company folder structure is created
- **On Bot Creation**: A dedicated bot folder is automatically created
- **Bootstrap Process**: Existing companies and bots get folders on system startup

### 2. Smart File Association

Files are automatically associated with bots when:
- Uploaded directly to a bot's folder
- The folder path contains `/bots/{bot-id}`
- No manual bot selection needed!

### 3. User Experience Flow

#### For Users with Bots:

1. **Open Media Library**
   - System shows company folder structure
   - Bot folders are clearly visible

2. **Navigate to Bot Folder**
   - Click: Companies → Your Company → Bots → Specific Bot
   - Or use the folder tree navigation

3. **Upload Files**
   - Drag and drop files into the bot folder
   - Files are automatically:
     - Associated with the bot
     - Tagged with company
     - Linked to the uploading user

4. **Verification**
   - Files show bot association in their details
   - Bot relation is visible in file properties

#### For Users without Bots:

1. **Open Media Library**
   - Shows company folder with "General Files" subfolder

2. **Upload to General Folder**
   - Files are associated with company only
   - Ready for future bot assignment if needed

## Benefits

### 1. **Intuitive Organization**
- Visual folder structure matches mental model
- No need to remember bot IDs
- Clear separation between bots

### 2. **Automatic Association**
- No manual bot selection required
- Reduces user errors
- Faster upload process

### 3. **Scalability**
- Works with unlimited bots
- Maintains organization as you grow
- Easy to navigate even with many bots

### 4. **Flexibility**
- Can still upload general files
- Bot association is automatic but not mandatory
- Works with existing Strapi features

## Best Practices

### 1. **Folder Naming**
- Bot folders show as: "Bot: {Bot Name}"
- Company folders show as: "Company: {Company Name}"
- Clear, descriptive names

### 2. **File Organization**
- Upload bot-specific training data to bot folders
- Use general folder for company-wide resources
- Maintain consistent naming conventions

### 3. **Access Control**
- Users only see their company's folders
- Bot folders are restricted to company users
- Standard Strapi permissions apply

## Technical Details

### Automatic Bot Detection

The system detects bot association from folder paths:
- Pattern: `/companies/{company}/bots/{bot-id}`
- No additional metadata needed
- Works with drag-and-drop uploads

### Folder Creation Triggers

Folders are created:
1. On system bootstrap (for existing entities)
2. When new bots are created
3. When new companies are registered

### File Metadata

Each uploaded file automatically receives:
- `bot`: The associated bot (if in bot folder)
- `company`: The company association
- `user`: The uploading user
- `folder`: The folder location

## Migration

For existing systems:
1. Run the server to trigger bootstrap
2. Existing companies/bots get folders automatically
3. Move existing files to appropriate folders
4. Bot associations update automatically

## Troubleshooting

### Folder Not Created
- Check bot creation logs
- Ensure bot has company association
- Restart server to trigger bootstrap

### Files Not Associated
- Verify upload to correct folder
- Check folder path matches pattern
- Ensure user has company association

### Permission Issues
- Verify user role has upload permissions
- Check company association is valid
- Ensure bot belongs to user's company 