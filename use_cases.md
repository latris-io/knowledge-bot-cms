# Knowledge Bot System - Use Cases & Implementation Guide

## 📋 **Document Overview**

This document outlines the use cases for the Knowledge Bot Strapi system, focusing on user management, validation, toast notifications, widget installation instructions with JWT token generation, and the AI Chat interface.

**Implementation Scope**: Strapi CMS with custom validation, toast notifications, JWT token generation, and AI Chat interface
**Related Files**: 
- `src/admin/extensions.js` - Toast notification system
- `src/admin/pages/AiChat/index.js` - AI Chat interface
- `src/admin/app.js` - Admin configuration with AI Chat menu
- `src/extensions/users-permissions/content-types/user/lifecycles.js` - User validation and JWT generation
- `src/extensions/users-permissions/strapi-server.js` - Extension registration
- `src/middlewares/assign-user-bot-to-upload.js` - File upload middleware

---

## 🎯 **Core Use Cases**

### **UC-001: User Validation and Management**

#### **Description**
System validates that users have both Bot and Company assigned before saving, and automatically generates widget installation instructions with JWT tokens when both fields are present.

#### **Actors**
- **Primary**: System Administrator
- **Secondary**: Strapi Admin Interface, Lifecycle Hooks

#### **Preconditions**
- User has access to Strapi admin interface
- Bot and Company entities exist in the system
- User record is being created or updated

#### **Main Flow**
1. Administrator opens user record in admin interface
2. Administrator fills in user details
3. **If Bot OR Company is missing**:
   - System shows validation error toast: "❌ Validation Error! Bot and Company are required before saving. Please select both fields."
   - User record is NOT saved
   - Administrator must select both fields to proceed
4. **If both Bot AND Company are selected**:
   - System validates final state after connect/disconnect operations
   - System generates JWT token with `{ company_id: X, bot_id: Y }`
   - System creates widget installation instructions with embedded JWT token
   - User record is saved successfully
   - No success toast is shown (silent success)

#### **Alternative Flows**
- **A1**: User exists with Bot but no Company → Validation fails on save
- **A2**: User exists with Company but no Bot → Validation fails on save  
- **A3**: User has both fields but removes one → Validation fails on save
- **A4**: Database error during save → Generic error handling

#### **Postconditions**
- User record is saved with both Bot and Company assigned
- JWT token is generated and stored in instructions field
- Widget installation instructions are available
- Validation state is enforced in database

#### **Business Rules**
- **BR-001**: Bot field is mandatory for all user saves
- **BR-002**: Company field is mandatory for all user saves
- **BR-003**: JWT token format: `{ company_id: number, bot_id: number }`
- **BR-004**: JWT secret: 'my-ultra-secure-signing-key'
- **BR-005**: Instructions include complete HTML widget code with CDN references

---

### **UC-002: Toast Notification System**

#### **Description**
System provides persistent toast notifications for file uploads and user validation errors, with manual close functionality and upload batching.

#### **Actors**
- **Primary**: System Administrator
- **Secondary**: File Upload System, User Validation System

#### **Preconditions**
- Administrator is logged into Strapi admin interface
- Toast system is initialized in admin extensions

#### **Main Flow - File Upload Notifications**
1. Administrator uploads file(s) via admin interface
2. System processes upload(s) with 1-second batching delay
3. System shows green success toast: "✅ Files uploaded successfully! [file names]"
4. Toast remains visible until manually closed
5. Administrator clicks X button to dismiss toast

#### **Main Flow - Validation Error Notifications**
1. Administrator attempts to save user without bot/company
2. System validates user data in lifecycle hooks
3. System shows red error toast: "❌ Validation Error! Bot and Company are required before saving. Please select both fields."
4. Toast remains visible until manually closed
5. User save is blocked until validation passes

#### **Alternative Flows**
- **A1**: Multiple files uploaded simultaneously → Single batched toast message
- **A2**: Network error during upload → Generic error toast
- **A3**: Server error during save → Specific validation error toast

#### **Postconditions**
- Toast messages are displayed persistently
- User can manually dismiss all toasts
- System provides clear feedback for all actions
- No success toasts for successful user saves (silent success)

#### **Business Rules**
- **BR-006**: Toast messages persist until manually closed
- **BR-007**: Upload batching uses 1-second delay
- **BR-008**: Error toasts are red, success toasts are green
- **BR-009**: Validation errors show specific error messages
- **BR-010**: User saves show no success toast (silent success)

---

### **UC-003: JWT Token Generation and Widget Instructions**

#### **Description**
System automatically generates JWT tokens and widget installation instructions when users have both Bot and Company assigned.

#### **Actors**
- **Primary**: Lifecycle Hook System
- **Secondary**: JWT Library, User Management System

#### **Preconditions**
- User has both Bot and Company assigned
- JWT secret is configured
- User record is being saved

#### **Main Flow**
1. User validation passes in lifecycle hooks
2. System extracts Bot ID and Company ID from final state
3. System generates JWT token using HS256 algorithm
4. System creates widget installation instructions with:
   - Complete HTML widget code
   - CDN references for required libraries
   - JWT token embedded in data-token attribute
   - Installation instructions for various platforms
5. System saves instructions to user's instructions field
6. User record is saved with generated instructions

#### **Alternative Flows**
- **A1**: JWT generation fails → Error logged, instructions set to null
- **A2**: Bot ID extraction fails → Validation error thrown
- **A3**: Company ID extraction fails → Validation error thrown

#### **Postconditions**
- JWT token is generated and stored
- Widget installation instructions are available
- Instructions include complete implementation code
- Token is ready for widget authentication

#### **Business Rules**
- **BR-011**: JWT token includes company_id and bot_id
- **BR-012**: Token uses HS256 algorithm
- **BR-013**: Instructions include full HTML implementation
- **BR-014**: Token is embedded in data-token attribute
- **BR-015**: Instructions support multiple CMS platforms

---

### **UC-004: File Upload Processing and User Assignment**

#### **Description**
System processes file uploads and automatically assigns them to users with bot and company information.

#### **Actors**
- **Primary**: File Upload System
- **Secondary**: User Assignment Middleware

#### **Preconditions**
- User is logged into admin interface
- File upload is initiated
- User has bot and company assigned

#### **Main Flow**
1. User uploads file via admin interface
2. Upload middleware processes file
3. System assigns user, bot, and company metadata to file
4. System creates file-event record for processing
5. System logs upload success
6. Toast notification confirms upload

#### **Alternative Flows**
- **A1**: User missing bot/company → File uploaded but no assignments made
- **A2**: File upload fails → Error toast shown
- **A3**: Metadata assignment fails → Logged but upload continues

#### **Postconditions**
- File is uploaded and stored
- User, bot, company metadata assigned
- File-event created for processing
- Upload confirmed via toast

#### **Business Rules**
- **BR-016**: Files require user, bot, company assignment
- **BR-017**: File-events track processing status
- **BR-018**: Upload success confirmed via toast
- **BR-019**: Metadata assignment is automatic

---

### **UC-005: AI Chat Interface**

#### **Description**
System provides a ChatGPT-like interface within the Strapi admin panel that allows users to interact with their knowledge base using natural language queries. The interface automatically generates JWT tokens based on the user's assigned bot and company, maintains conversation sessions, and supports real-time streaming responses.

#### **Actors**
- **Primary**: System Administrator
- **Secondary**: AI Retrieval Service, JWT Token System, Session Manager

#### **Preconditions**
- User is logged into Strapi admin interface
- User has both Bot and Company assigned to their profile
- AI retrieval service is accessible
- JWT token system is configured

#### **Main Flow**
1. Administrator clicks "AI Chat" menu item in admin navigation
2. System loads AI Chat interface with empty conversation
3. System automatically generates JWT token using user's bot and company IDs
4. System creates or retrieves session ID for conversation continuity
5. **If JWT token generation succeeds**:
   - Chat interface is enabled
   - Administrator can type questions in the input field
   - System displays "How can I help you today?" welcome message
6. **When Administrator sends a message**:
   - System adds user message to conversation
   - System creates placeholder bot message with streaming indicator
   - System calls retrieval service with JWT token and session ID
   - System processes streaming response or JSON response
   - System extracts sources from response and displays them
   - System renders markdown-formatted response
   - System updates conversation with final response
7. **Session Management**:
   - Session ID is stored in localStorage
   - Conversation history is maintained within session
   - Administrator can clear session to start new conversation

#### **Alternative Flows**
- **A1**: User missing bot or company → Interface shows error message and disables input
- **A2**: JWT token generation fails → Interface shows error and disables functionality
- **A3**: Network error during API call → System shows error message in chat
- **A4**: Streaming response fails → System falls back to error message
- **A5**: API returns error response → System displays formatted error message

#### **Postconditions**
- Conversation is displayed in ChatGPT-like interface
- Sources are extracted and displayed separately
- Session is maintained for conversation continuity
- Responses are formatted with markdown rendering
- User can copy responses and start new conversations

#### **Business Rules**
- **BR-020**: JWT token must include company_id, bot_id, and user_id
- **BR-021**: Token uses same secret as user lifecycle system
- **BR-022**: Session IDs are prefixed with 'admin_' for admin interface
- **BR-023**: Interface supports both JSON and streaming responses
- **BR-024**: Sources are extracted from [source: ...] patterns
- **BR-025**: Markdown rendering supports headers, lists, bold, italic, code, and links
- **BR-026**: Messages are displayed in chronological order
- **BR-027**: Streaming responses show real-time updates
- **BR-028**: Interface provides copy functionality for responses

---

## 🔧 **Technical Implementation Details**

### **Admin Extensions (`src/admin/extensions.js`)**
- **Toast System**: Persistent notifications with manual close
- **Upload Batching**: 1-second delay for multiple uploads
- **Error Handling**: Specific validation error detection
- **Silent Success**: No toast for successful user saves

### **User Lifecycle Hooks (`src/extensions/users-permissions/content-types/user/lifecycles.js`)**
- **Validation Logic**: Checks final state after connect/disconnect operations
- **JWT Generation**: HS256 algorithm with company_id and bot_id
- **Instructions Generation**: Complete HTML widget implementation
- **Error Handling**: ValidationError exceptions for missing fields

### **Extension Registration (`src/extensions/users-permissions/strapi-server.js`)**
- **Lifecycle Registration**: Properly registers user lifecycle hooks
- **Plugin Extension**: Extends users-permissions plugin

### **Upload Middleware (`src/middlewares/assign-user-bot-to-upload.js`)**
- **User Assignment**: Assigns user, bot, company to uploads
- **File-Event Creation**: Creates processing events
- **Metadata Management**: Handles file metadata assignment

### **AI Chat Interface (`src/admin/pages/AiChat/index.js`)**
- **JWT Token Generation**: Uses same secret and structure as user lifecycle hooks
- **Session Management**: Maintains conversation state with localStorage
- **Streaming Support**: Handles Server-Sent Events and JSON responses
- **Markdown Rendering**: Uses markdown-it library with preprocessing
- **Source Extraction**: Parses and deduplicates source references
- **Error Handling**: Graceful fallbacks for network and API errors

### **Admin Menu Integration (`src/admin/app.js`)**
- **Menu Item**: Adds "AI Chat" to admin navigation
- **Route Registration**: Registers /ai-chat route
- **Component Loading**: Lazy loads AI Chat component
- **Permissions**: Configurable access control

---

## 📊 **System Architecture**

### **Data Flow**
1. **User Management**: Admin → Validation → JWT Generation → Instructions
2. **File Upload**: Upload → Middleware → Assignment → Event Creation → Toast
3. **Validation**: Input → Lifecycle → Database State → Final Validation
4. **Toast System**: Event → Batch → Display → Manual Close
5. **AI Chat**: User Input → API Call → Streaming Response → UI Update
6. **Session Management**: Session Creation → Storage → Retrieval → Clearing

### **Key Components**
- **Validation Engine**: Lifecycle hooks with final state calculation
- **JWT Service**: Token generation with configurable secret
- **Toast Manager**: Persistent notification system
- **Upload Handler**: File processing with user assignment
- **AI Chat Interface**: React component with real-time messaging
- **Session Manager**: Conversation state management
- **Markdown Parser**: Rich text formatting with preprocessing
- **Source Extractor**: Reference parsing and deduplication
- **Streaming Handler**: Real-time response processing

---

## 🧪 **Testing Coverage**

### **Unit Tests**
- **User Validation**: Tests for lifecycle hooks and validation logic
- **JWT Generation**: Tests for token creation and verification
- **Toast Notifications**: Tests for message display and batching
- **File Upload**: Tests for middleware and assignment logic
- **AI Chat Components**: Tests for interface functionality
- **Session Management**: Tests for conversation state
- **Markdown Processing**: Tests for text formatting
- **Source Extraction**: Tests for reference parsing

### **Integration Tests**
- **API Integration**: Tests for retrieval service communication
- **Database Operations**: Tests for CRUD operations
- **User Workflow**: Tests for complete user management flow
- **File Processing**: Tests for upload and assignment workflow
- **Chat Workflow**: Tests for conversation flow
- **Token Authentication**: Tests for JWT-based access

### **Test Files**
- `tests/integration/api/test_preference_creation.test.js` - User notification preferences
- `tests/integration/api/test_preference_lookup_existing.test.js` - Preference lookup
- `tests/integration/api/test_ai_chat.test.js` - AI Chat functionality
- `tests/helpers/strapi-helpers.js` - Test utilities and setup
- `tests/helpers/chat-helpers.js` - Chat-specific test utilities
- `tests/helpers/test-setup.js` - Global test configuration

### **Test Coverage by Use Case**
- **UC-001**: 12+ test cases covering user validation scenarios
- **UC-002**: 8+ test cases covering toast notification functionality
- **UC-003**: 6+ test cases covering JWT token generation
- **UC-004**: 4+ test cases covering file upload processing
- **UC-005**: 20+ test cases covering AI chat interface functionality

---

## 🎯 **Success Criteria**

### **Functional Requirements**
- ✅ Users cannot be saved without both Bot and Company
- ✅ JWT tokens are generated automatically when both fields present
- ✅ Widget installation instructions are complete and functional
- ✅ Toast notifications provide clear feedback
- ✅ File uploads are assigned to users with metadata
- ✅ Validation works with connect/disconnect operations
- ✅ AI Chat interface provides real-time responses
- ✅ Sessions maintain conversation continuity
- ✅ Markdown content is properly formatted
- ✅ Sources are extracted and displayed

### **Non-Functional Requirements**
- ✅ Toast messages persist until manually closed
- ✅ Validation prevents database inconsistencies
- ✅ JWT tokens use secure HS256 algorithm
- ✅ Instructions include complete implementation code
- ✅ System provides silent success for user saves
- ✅ Error messages are specific and actionable
- ✅ AI Chat interface provides ChatGPT-like experience
- ✅ Real-time streaming responses
- ✅ Session persistence across page reloads
- ✅ Responsive design within admin panel

### **User Experience Requirements**
- ✅ Clear error messages for validation failures
- ✅ No interrupting success messages
- ✅ Batched notifications for multiple uploads
- ✅ Easy manual dismissal of notifications
- ✅ Immediate feedback for all actions
- ✅ Intuitive chat interface with avatars
- ✅ Real-time typing indicators
- ✅ Clear source attribution
- ✅ Easy conversation management
- ✅ Consistent design with Strapi admin theme

---

**This document reflects the current implementation of the Knowledge Bot system including the AI Chat interface as of the latest development session. All features described are implemented and tested.** 