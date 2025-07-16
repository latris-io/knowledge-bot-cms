# Knowledge Bot System - Use Cases & Implementation Guide

## 📋 **Document Overview**

This document outlines the use cases for the Knowledge Bot Strapi system, focusing on user management, validation, toast notifications, and widget installation instructions with JWT token generation.

**Implementation Scope**: Strapi CMS with custom validation, toast notifications, and JWT token generation
**Related Files**: 
- `src/admin/extensions.js` - Toast notification system
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

---

## 📊 **System Architecture**

### **Data Flow**
1. **User Management**: Admin → Validation → JWT Generation → Instructions
2. **File Upload**: Upload → Middleware → Assignment → Event Creation → Toast
3. **Validation**: Input → Lifecycle → Database State → Final Validation
4. **Toast System**: Event → Batch → Display → Manual Close

### **Key Components**
- **Validation Engine**: Lifecycle hooks with final state calculation
- **JWT Service**: Token generation with configurable secret
- **Toast Manager**: Persistent notification system
- **Upload Handler**: File processing with user assignment

---

## 🎯 **Success Criteria**

### **Functional Requirements**
- ✅ Users cannot be saved without both Bot and Company
- ✅ JWT tokens are generated automatically when both fields present
- ✅ Widget installation instructions are complete and functional
- ✅ Toast notifications provide clear feedback
- ✅ File uploads are assigned to users with metadata
- ✅ Validation works with connect/disconnect operations

### **Non-Functional Requirements**
- ✅ Toast messages persist until manually closed
- ✅ Validation prevents database inconsistencies
- ✅ JWT tokens use secure HS256 algorithm
- ✅ Instructions include complete implementation code
- ✅ System provides silent success for user saves
- ✅ Error messages are specific and actionable

### **User Experience Requirements**
- ✅ Clear error messages for validation failures
- ✅ No interrupting success messages
- ✅ Batched notifications for multiple uploads
- ✅ Easy manual dismissal of notifications
- ✅ Immediate feedback for all actions

---

**This document reflects the current implementation of the Knowledge Bot system as of the latest development session. All features described are implemented and tested.** 