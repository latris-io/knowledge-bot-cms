# Company-Based Folder Isolation Guide

## Overview

The media library now implements company-based folder isolation, ensuring that users can only see and access folders belonging to their company. This provides secure, multi-tenant file organization.

## How It Works

### 1. Folder Company Association

Each folder in the media library can be associated with a specific company through:
- **Direct Association**: Folders have a `company` relation field
- **Path-Based Association**: Folders under `/companies/{company-id}/` are implicitly owned by that company

### 2. Automatic Filtering

When users access the media library:
- **Standard Users**: Only see folders belonging to their company
- **Admin Users**: Can see all folders (for system management)
- **No Company Users**: See only root-level public folders

### 3. Folder Creation Rules

When creating new folders:
- Folders are automatically assigned to the user's company
- Company association is inherited by subfolders
- Users cannot create folders outside their company's hierarchy

## Implementation Details

### Folder Schema Extension

```json
{
  "attributes": {
    // ... existing attributes ...
    "company": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::company.company"
    }
  }
}
```

### Access Control Logic

The folder controller implements three levels of filtering:

1. **Explicit Company Match**: `folder.company === user.company`
2. **Path-Based Match**: `folder.path.startsWith('/companies/{user.company.id}')`
3. **Public Folders**: Root folders without company association

### Folder Structure

```
/ (root - public)
├── companies/
│   ├── company-1/
│   │   ├── bots/
│   │   │   ├── bot-1/
│   │   │   └── bot-2/
│   │   └── general/
│   └── company-2/
│       ├── bots/
│       │   └── bot-3/
│       └── general/
└── public/
```

## User Experience

### For Company Users

1. **Media Library Access**
   - See only their company's folder structure
   - Cannot see other companies' folders
   - Can create folders within their company space

2. **Folder Navigation**
   - Start at their company root: `/companies/{company-id}/`
   - Full access to all subfolders
   - Can organize files as needed

3. **File Upload**
   - Files inherit folder's company association
   - Automatic organization by bot/purpose
   - Secure isolation from other companies

### For Administrators

1. **Full Visibility**
   - Can see all companies' folders
   - Useful for support and management
   - Can move files between companies if needed

2. **Company Management**
   - Create initial folder structures
   - Monitor storage usage per company
   - Troubleshoot access issues

## Security Benefits

### 1. **Data Isolation**
- Complete separation of company assets
- No accidental cross-company access
- Clear ownership boundaries

### 2. **Access Control**
- Automatic enforcement at API level
- No client-side filtering needed
- Consistent across all interfaces

### 3. **Audit Trail**
- Company association tracked on folders
- Clear ownership history
- Easy compliance reporting

## Best Practices

### 1. **Folder Naming**
```
/companies/acme-corp/          # Company root
/companies/acme-corp/bots/     # Bot assets
/companies/acme-corp/general/  # General files
/companies/acme-corp/training/ # Custom folders
```

### 2. **Permissions**
- Users automatically inherit company permissions
- No manual folder permission setup needed
- Role-based access within company

### 3. **Migration**
For existing systems:
1. Run bootstrap to create company folders
2. Move existing files to company folders
3. Update folder company associations
4. Verify access restrictions

## API Examples

### Creating a Folder (Auto-assigns Company)
```javascript
const folder = await strapi.entityService.create('plugin::upload.folder', {
  data: {
    name: 'Training Data',
    path: '/companies/my-company/training',
    parent: parentFolder.id
    // company is automatically assigned from user context
  }
});
```

### Querying Folders (Auto-filtered)
```javascript
// This automatically returns only folders the user can access
const { data } = await fetch('/upload/folders', {
  headers: { Authorization: `Bearer ${token}` }
});
```

## Troubleshooting

### User Can't See Folders
1. Check user has company association
2. Verify folder has correct company ID
3. Check folder path matches company structure

### Folder Creation Fails
1. Ensure user is authenticated
2. Verify user has company assigned
3. Check parent folder permissions

### Cross-Company Access Needed
1. Use admin account for management tasks
2. Consider shared public folders
3. Implement specific sharing mechanisms

## Future Enhancements

1. **Folder Sharing**: Allow controlled cross-company sharing
2. **Storage Quotas**: Per-company storage limits
3. **Folder Templates**: Pre-defined folder structures
4. **Access Logs**: Detailed folder access auditing 