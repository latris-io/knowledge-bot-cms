# Knowledge Bot CMS - Standard User Setup Guide

Welcome to the Knowledge Bot CMS! This guide will help you get started as a standard user of the system.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Access](#initial-access)
3. [First-Time Login](#first-time-login)
4. [User Profile Setup](#user-profile-setup)
5. [Understanding Your Dashboard](#understanding-your-dashboard)
6. [Using AI Chat](#using-ai-chat)
7. [Managing Media Files](#managing-media-files)
8. [Bot Management](#bot-management)
9. [Billing & Usage](#billing--usage)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you can access the system, an administrator must:

1. **Create your user account** with your email address
2. **Assign you to a Company** - You can only belong to one company
3. **Create Bots for your Company** - These are the AI assistants you'll interact with

> **Note**: If you don't have access yet, contact your system administrator.

## Initial Access

### Step 1: Receive Your Credentials
You'll receive an email with:
- **Login URL**: Usually `https://your-domain.com/admin`
- **Email**: Your registered email address
- **Temporary Password**: You'll be asked to change this on first login

### Step 2: Access the Admin Panel
1. Open your web browser (Chrome, Firefox, Safari, or Edge recommended)
2. Navigate to the provided login URL
3. You'll see the Strapi login screen

## First-Time Login

### Step 1: Enter Credentials
1. Enter your email address
2. Enter the temporary password provided
3. Click "Login"

### Step 2: Change Your Password (if required)
1. Enter your temporary password
2. Create a new strong password
3. Confirm your new password
4. Click "Save"

> **Password Requirements**:
> - At least 8 characters
> - Mix of uppercase and lowercase letters
> - Include numbers and special characters

## User Profile Setup

### Step 1: Access Your Profile
1. Click on your user icon in the top-right corner
2. Select "Profile" from the dropdown

### Step 2: Configure Notification Preferences
Your profile includes several notification settings:

#### Email Notifications
- **Notification Channel**: Choose how you receive notifications
  - `email` - Receive via email (default)
  - `none` - No notifications

- **Notification Frequency**: How often to receive notifications
  - `immediate` - Get notified right away
  - `daily` - Daily digest
  - `weekly` - Weekly summary

- **Email Format**: Choose your preferred email style
  - `html` - Rich formatted emails
  - `text` - Plain text emails

#### Success/Failure Notifications
- **Include Successes**: Toggle to receive notifications for successful operations
- **Include Failures**: Toggle to receive notifications for failed operations
- **Include Processing**: Toggle to receive notifications while files are being processed

#### Additional Settings
- **CC Email**: Add one email address to receive copies of notifications
- **Notification Grouping Window**: Set time window (in minutes) for grouping similar notifications

### Step 3: Save Your Settings
Click "Save" to apply your preferences.

## Understanding Your Dashboard

As a standard user, you'll see these main menu items:

### 1. AI Chat 💬
- Interactive chat interface with your company's bots
- Ask questions and get AI-powered responses
- Switch between different bots assigned to your company

### 2. Bot Management 🤖
- View all bots assigned to your company
- See bot details and configurations
- Monitor bot status and availability

### 3. Billing Management 💳
- View your company's subscription details
- Check usage statistics
- Monitor billing cycles

### 4. Subscription Usage 📊
- Track API usage
- Monitor storage consumption
- View usage trends and limits

### 5. Media Library 📁
- Upload and manage files
- Organize content by bot
- Access company-specific media

> **Note**: You won't see "Content Manager" or "Settings" - these are admin-only features.

## Using AI Chat

### Step 1: Access AI Chat
1. Click "AI Chat" in the main menu
2. Wait for the interface to load

### Step 2: Select a Bot
1. Use the dropdown at the top to select from available bots
2. The system defaults to the first bot for your company
3. Each bot may have different capabilities

### Step 3: Start Chatting
1. Type your question in the message box
2. Press Enter or click Send
3. Wait for the AI response
4. Continue the conversation as needed

### Features:
- **Formatted/Raw Toggle**: Switch between formatted and raw text views
- **Session History**: Your chat history is saved per session
- **New Session**: Start fresh conversations as needed

## Managing Media Files

### Step 1: Access Media Library
1. Click "Media Library" in the main menu
2. You'll see folders organized by bot

### Step 2: Understanding Folder Structure
- Folders are named: `{Bot Name} ({Company Name})`
- You can only see folders for bots in your company
- Example: `Customer Support Bot (Acme Corporation)`

### Step 3: Upload Files
1. Navigate to the appropriate bot folder
2. Click "Upload" or drag files into the window
3. Supported formats include:
   - Images: JPG, PNG, GIF, SVG
   - Documents: PDF, DOC, DOCX, TXT
   - Data: CSV, JSON, XML

### Step 4: Organize Files
1. Create subfolders within bot folders
2. Move files between folders (within your company's bots only)
3. Rename files as needed
4. Delete unnecessary files

> **Important**: Files uploaded to a bot folder are automatically associated with that bot.

## Bot Management

### Viewing Bot Information
1. Click "Bot Management" in the menu
2. See all bots assigned to your company
3. Each bot card shows:
   - Bot name
   - Description
   - Status (Active/Inactive)
   - Associated folder

### Understanding Bot Limitations
- You cannot create or delete bots (admin only)
- You cannot modify bot settings
- You can only interact with bots assigned to your company

## Billing & Usage

### Viewing Subscription Details
1. Click "Billing Management" to see:
   - Current plan details
   - Billing cycle
   - Payment status
   - Usage limits

### Monitoring Usage
1. Click "Subscription Usage" to track:
   - API calls made
   - Storage used
   - Remaining quotas
   - Usage trends

### Usage Alerts
- Yellow warning when approaching limits (75%)
- Red alert when exceeding limits (90%+)
- Email notifications based on your preferences

## Troubleshooting

### Common Issues and Solutions

#### Can't Log In
- Verify your email is correct
- Check caps lock is off
- Try resetting your password
- Contact your administrator

#### Don't See Any Bots
- Confirm you're assigned to a company
- Ask admin to assign bots to your company
- Refresh the page

#### Can't Upload Files
- Check file size limits
- Verify file format is supported
- Ensure you have upload permissions
- Check available storage quota

#### AI Chat Not Working
- Verify bot is active
- Check your internet connection
- Try selecting a different bot
- Clear browser cache

#### Missing Menu Items
- This is normal - standard users have limited menu access
- Contact admin if you need additional permissions

### Getting Help

1. **Check Documentation**: Review this guide first
2. **Contact Administrator**: For account or permission issues
3. **Technical Support**: For system errors or bugs

## Best Practices

### Security
- Never share your login credentials
- Log out when finished
- Use strong, unique passwords
- Report suspicious activity

### File Management
- Organize files in appropriate bot folders
- Use descriptive file names
- Delete outdated files regularly
- Keep within storage limits

### AI Chat Usage
- Be specific in your questions
- Select the appropriate bot for your query
- Start new sessions for different topics
- Save important responses

### Monitoring Usage
- Check usage weekly
- Plan uploads around quota limits
- Request limit increases before hitting caps
- Archive old files to free space

## Quick Reference

### Keyboard Shortcuts
- `Enter` - Send message in AI Chat
- `Ctrl/Cmd + K` - Quick search (where available)
- `Esc` - Close modals

### File Size Limits
- Images: 10MB per file
- Documents: 25MB per file
- Total storage: Based on subscription

### Session Timeouts
- Auto-logout after 24 hours of inactivity
- Chat sessions persist between logins
- File uploads may timeout after 5 minutes

---

## Need More Help?

If you encounter issues not covered in this guide:

1. Take a screenshot of any error messages
2. Note the steps that led to the issue
3. Contact your system administrator with details

Remember: As a standard user, you have access to all the tools needed to interact with bots, manage media, and monitor usage. The system is designed to be intuitive and user-friendly.

**Welcome to Knowledge Bot CMS!** 🚀 