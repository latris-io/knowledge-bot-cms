# Media Library Company Isolation

This document explains how the Media Library folders are isolated by company to ensure data privacy.

## Overview

The Media Library implements company-based isolation to ensure users can only see and access folders belonging to their assigned company. This prevents data leakage between different companies using the same system.

## How It Works

### 1. Folder Structure
- Bot folders are created at the root level: `/bot-{id}`
- Each folder has a `company` relation that links it to a specific company
- Folder names follow the pattern: `{Company Name} - {Bot Name}`

### 2. Access Control

#### For Regular Users:
- Can only see folders where:
  - The folder has an explicit `company` relation matching their company
  - The folder is a bot folder (`/bot-{id}`) for a bot belonging to their company
  - The root folder (if no company is set)
- Cannot see folders from other companies
- Cannot access files in folders from other companies

#### For Admin Users:
- Can see all folders regardless of company
- Have full access to all files and folders
- Can manage folder structure across all companies

### 3. Implementation Details

The folder filtering is implemented in `src/extensions/upload/controllers/folder.js`:
- Intercepts folder queries
- Adds company-based filters
- Ensures data isolation at the API level

## Benefits

1. **Data Privacy**: Companies cannot see each other's files
2. **Clean Organization**: Each company sees only relevant folders
3. **Scalability**: Works efficiently with many companies
4. **Security**: Enforced at the API level, not just UI

## Folder Lifecycle

- **Creation**: Folders are automatically created when bots are created
- **Naming**: Folders are named `{Company Name} - {Bot Name}`
- **Updates**: Folder names update automatically when bot names change
- **Deletion**: Folders are deleted when bots are deleted (if empty)

## Important Notes

### Company Relation Requirement
**CRITICAL**: Bot folders MUST have the `company` relation set for proper isolation. Without this relation, folders may be visible to users from other companies.

### Strapi v5 Relation Workaround
Due to a limitation in Strapi v5, relations cannot be set directly during entity creation in lifecycle hooks. The bot lifecycle uses a two-step process:
1. Create the folder without the company relation
2. Update the folder using `strapi.db.query` to set the company relation

This ensures that the company relation is properly saved and folder isolation works correctly.

### Verifying Company Relations
To verify all bot folders have proper company relations:

1. Check folder company relations in the database
2. Look for folders with `company: null` or missing company field
3. Ensure the folder's company matches the bot's company

### Common Issues
- **Folder visible to wrong company**: Usually means the `company` relation is not set
- **New bot folders not isolated**: Check that the bot lifecycle is setting the company relation
- **Bootstrap folders not isolated**: Ensure the bootstrap function sets company relations

## Troubleshooting

### Issue: Folder Visible to Users from Other Companies

**Symptoms**:
- A bot folder is visible to users not in the bot's company
- Folder appears in Media Library for wrong users

**Cause**:
- The folder's `company` relation is not set (null or missing)

**Solution**:
1. Identify folders without company relation
2. Update the folder to set the correct company ID
3. Verify the bot lifecycle is setting company on new folders

### Issue: New Folders Not Properly Isolated

**Symptoms**:
- Newly created bot folders are visible to all users

**Cause**:
- Bot lifecycle not setting company relation on folder creation

**Solution**:
1. Check bot lifecycle `afterCreate` hook
2. Ensure `company: company.id` is in the folder creation data
3. Verify company ID is correctly retrieved from the bot

### Debugging Company Isolation

To debug folder visibility issues:

```javascript
// Check folder company relations
const folders = await strapi.entityService.findMany('plugin::upload.folder', {
  filters: { path: { $startsWith: '/bot-' } }
});

folders.forEach(folder => {
  console.log(`Folder: ${folder.name}, Company: ${folder.company || 'NOT SET'}`);
});
```

## Best Practices

1. Always verify company relations after creating bot folders
2. Include company ID in folder metadata for redundancy
3. Test folder visibility with users from different companies
4. Monitor for folders without company relations
5. Use lifecycle hooks to ensure consistency 