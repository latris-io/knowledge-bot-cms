# Bot-Specific Media Upload Guide

## Overview

The system now supports associating media uploads with specific bots. This allows users to organize their assets by bot and ensures proper access control.

## How It Works

### 1. Automatic Bot Folder Creation
When a file is uploaded with a bot association, the system automatically creates a folder structure:
```
/bots/
  /bot-id-1/
  /bot-id-2/
  ...
```

### 2. Bot Selection During Upload

#### Via API
When uploading files via the API, include the bot ID:

```javascript
// Example: Upload with bot association
const formData = new FormData();
formData.append('files', file);
formData.append('botId', 'bot-id-here'); // Add bot ID

const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

#### Via Query Parameter
```
POST /api/upload?botId=bot-id-here
```

### 3. Getting Available Bots

Before uploading, fetch the user's available bots:

```javascript
const response = await fetch('/api/bot-management/upload-bots', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();
// Returns:
// [
//   {
//     id: 123,
//     documentId: "abc123",
//     name: "Customer Support Bot",
//     bot_id: "customer-support",
//     folderPath: "/bots/customer-support"
//   },
//   ...
// ]
```

### 4. File Association

Files uploaded with a bot ID will have:
- Direct relation to the bot
- Association with the user's company
- Placement in the bot's dedicated folder

### 5. Access Control

- Users can only upload to bots belonging to their company
- The system verifies bot ownership before accepting uploads
- Files are filtered by user/company in the media library

## Implementation Example

Here's a simple React component for bot-aware uploads:

```jsx
import React, { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/admin/strapi-admin';

const BotAwareUpload = () => {
  const [bots, setBots] = useState([]);
  const [selectedBot, setSelectedBot] = useState('');
  const { get, post } = useFetchClient();

  useEffect(() => {
    // Fetch available bots
    const fetchBots = async () => {
      const { data } = await get('/api/bot-management/upload-bots');
      setBots(data.data);
    };
    fetchBots();
  }, []);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('files', file);
    
    if (selectedBot) {
      formData.append('botId', selectedBot);
    }

    const response = await post('/api/upload', formData);
    console.log('Upload complete:', response.data);
  };

  return (
    <div>
      <select 
        value={selectedBot} 
        onChange={(e) => setSelectedBot(e.target.value)}
      >
        <option value="">No specific bot</option>
        {bots.map(bot => (
          <option key={bot.id} value={bot.id}>
            {bot.name}
          </option>
        ))}
      </select>
      
      <input 
        type="file" 
        onChange={(e) => handleUpload(e.target.files[0])}
      />
    </div>
  );
};
```

## Benefits

1. **Organization**: Files are automatically organized by bot
2. **Access Control**: Built-in verification of bot ownership
3. **Filtering**: Easy to filter files by bot in the media library
4. **Scalability**: Each bot gets its own folder structure
5. **Flexibility**: Files can still be uploaded without bot association

## Notes

- Bot folders are created automatically on first upload
- The bot ID is verified against the user's company
- Files retain all standard Strapi media library features
- Bot association is optional - files can still be uploaded without specifying a bot 