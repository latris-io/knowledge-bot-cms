# Subscription Billing System - Use Cases & Requirements

## 📋 **Document Overview**

This document outlines the comprehensive use cases for the subscription billing system integrated into the Knowledge Bot Strapi application. The system provides subscription management, payment processing, usage tracking, and administrative oversight capabilities.

**Implementation Scope**: Strapi extension-based subscription billing with Stripe integration
**Related Files**: 
- `src/extensions/users-permissions/` - Core billing functionality
- `src/api/company/content-types/company/schema.json` - Extended company schema
- `src/admin/pages/SubscriptionUsage/` - Admin usage widget
- `tests/integration/subscription/` - Comprehensive test suite

---

## 🎯 **Core Use Cases**

### **UC-SB001: Subscription Validation API**

#### **Description**
External API system for validating subscription status with high-performance caching to reduce external API calls by 99.9%.

#### **Actors**
- **Primary**: External Knowledge Bot Applications
- **Secondary**: Caching System, Database

#### **Preconditions**
- Company exists with subscription data
- Bot ID is valid
- Caching system is operational

#### **Main Flow**
1. External application sends validation request with companyId and botId
2. System checks in-memory cache for existing validation (24-hour TTL)
3. **If cached data exists and valid**:
   - Return cached validation result with cache metadata
   - Log cache hit for performance metrics
4. **If no cached data or expired**:
   - Query database for company subscription status
   - Validate storage limits and plan features
   - Calculate usage statistics and remaining quotas
   - Cache result with timestamp for future requests
   - Return validation result with performance data

#### **Alternative Flows**
- **A1**: Company not found → Return 404 error
- **A2**: Database error → Return 500 with fallback message
- **A3**: Storage limit exceeded → Return invalid with reason
- **A4**: Subscription canceled/past_due → Return invalid with status

#### **Postconditions**
- Validation result cached for 24 hours
- Performance metrics logged
- External application receives definitive subscription status

#### **Business Rules**
- **BR-SB001**: Cache TTL is 24 hours (86400000ms)
- **BR-SB002**: Storage validation uses biginteger for large values
- **BR-SB003**: Plan features determined by subscription level
- **BR-SB004**: Cache hit rate target >90% under normal load

---

### **UC-SB002: Stripe Payment Integration**

#### **Description**
Complete Stripe integration for checkout sessions, webhook processing, and invoice management.

#### **Actors**
- **Primary**: Company Administrators
- **Secondary**: Stripe API, Webhook Processor

#### **Preconditions**
- User authenticated with company access
- Stripe configuration present
- Company exists in system

#### **Main Flow**
1. Administrator initiates plan upgrade/payment
2. System creates or retrieves Stripe customer for company
3. System creates Stripe checkout session with plan pricing
4. User completes payment on Stripe checkout page
5. Stripe sends webhook notification to system
6. System verifies webhook signature and processes event
7. System updates company subscription status and plan level
8. System invalidates relevant cache entries
9. Administrator sees updated subscription status

#### **Alternative Flows**
- **A1**: Payment fails → Webhook updates status to past_due
- **A2**: Subscription canceled → Status updated to canceled
- **A3**: Invoice payment succeeded → Status confirmed as active
- **A4**: Webhook signature invalid → Request rejected for security

#### **Postconditions**
- Company subscription status updated
- Cache invalidated for affected company
- Invoice history available for retrieval
- Audit trail created for payment event

#### **Business Rules**
- **BR-SB005**: All webhook signatures must be verified
- **BR-SB006**: Customer metadata includes companyId and businessUnit
- **BR-SB007**: Failed payments trigger grace period (past_due status)
- **BR-SB008**: Successful payments immediately activate subscription

---

### **UC-SB003: Storage Limit Enforcement** 

#### **Description**
Real-time storage usage tracking and limit enforcement across the system.

#### **Actors**
- **Primary**: File Upload System
- **Secondary**: Storage Calculator, Subscription Validator

#### **Preconditions**
- Company has defined storage limits
- File upload request initiated
- Storage usage tracking active

#### **Main Flow**
1. User attempts to upload file(s)
2. System calculates current storage usage for company
3. System checks if new upload would exceed plan limits
4. **If within limits**:
   - Upload proceeds normally
   - Storage usage updated in real-time
   - File metadata includes company association
5. **If would exceed limits**:
   - Upload rejected with clear error message
   - User informed of current usage and limits
   - Upgrade suggestions provided

#### **Alternative Flows**
- **A1**: Plan upgraded during upload → Recalculate limits and allow
- **A2**: Storage calculation error → Allow upload with warning
- **A3**: Multiple simultaneous uploads → Handle race conditions

#### **Postconditions**
- Storage usage accurately tracked
- Plan limits enforced consistently
- User receives clear feedback on storage status

#### **Business Rules**
- **BR-SB009**: Storage calculated from sum of all company files
- **BR-SB010**: Plan limits: Starter 2GB, Professional 20GB, Enterprise 100GB
- **BR-SB011**: Storage usage updated within 5 minutes of upload
- **BR-SB012**: Grace period of 7 days for limit exceeded scenarios

---

### **UC-SB004: Administrative Oversight**

#### **Description**
Comprehensive administrative interface for subscription management and analytics.

#### **Actors**
- **Primary**: System Administrators
- **Secondary**: Analytics Engine, Reporting System

#### **Preconditions**
- Administrator authenticated with appropriate permissions
- Company and subscription data available
- Analytics system operational

#### **Main Flow**
1. Administrator accesses billing management interface
2. System displays company subscription overview
3. Administrator can view detailed usage analytics
4. System provides subscription lifecycle management
5. Administrator can generate usage reports
6. System tracks all administrative actions for audit

#### **Alternative Flows**
- **A1**: Bulk operations on multiple companies
- **A2**: Export data for external analysis
- **A3**: Emergency subscription overrides

#### **Postconditions**
- Administrative actions logged
- Company data updated as requested
- Audit trail maintained for compliance

#### **Business Rules**
- **BR-SB013**: Only authenticated admins can access billing data
- **BR-SB014**: All administrative actions must be logged
- **BR-SB015**: Data export includes privacy compliance measures
- **BR-SB016**: Emergency overrides require justification

---

### **UC-SB005: Performance Optimization**

#### **Description**
High-performance caching and database optimization to handle thousands of validation requests.

#### **Actors**
- **Primary**: Caching System
- **Secondary**: Database Optimizer, Performance Monitor

#### **Preconditions**
- Caching system initialized
- Database properly indexed
- Performance monitoring active

#### **Main Flow**
1. System receives high volume of validation requests
2. Caching system handles majority with in-memory responses
3. Database queries optimized with proper indexes
4. Performance metrics collected continuously
5. System scales automatically under load
6. Cache management prevents memory overflow

#### **Alternative Flows**
- **A1**: Cache miss rate too high → Optimize cache strategy
- **A2**: Database performance degraded → Scale resources
- **A3**: Memory usage excessive → Implement cache eviction

#### **Postconditions**
- >90% cache hit rate maintained
- <5ms response time for cached requests
- <100ms response time for database queries
- System handles 1000+ concurrent requests

#### **Business Rules**
- **BR-SB017**: Cache TTL optimized for performance vs freshness
- **BR-SB018**: Database indexes on subscription_status and plan_level
- **BR-SB019**: Memory usage limited to prevent system impact
- **BR-SB020**: Performance degradation triggers automatic scaling

---

### **UC-SB006: Admin Dashboard Usage Widget**

#### **Description**
Real-time subscription usage widget displayed on the Strapi admin dashboard home page, providing immediate visibility into current plan utilization alongside existing "Last Edited Entries" and "Last Published Entries" widgets.

#### **Actors**
- **Primary**: System Administrators
- **Secondary**: Company Users, Subscription System

#### **Preconditions**
- User logged into Strapi admin interface
- User has company and subscription data
- Subscription billing system operational

#### **Main Flow**
1. Administrator logs into Strapi admin dashboard
2. System loads home page with existing widgets
3. **Subscription Usage Widget loads automatically**:
   - Fetches current user's company subscription data
   - Calculates real-time storage usage from database
   - Determines plan limits and features
   - Calculates usage percentages for visual display
4. **Widget displays comprehensive usage information**:
   - Current plan level (Starter/Professional/Enterprise)
   - Subscription status with color-coded indicators
   - Storage usage with progress bar and percentages
   - User count vs plan limits
   - Next billing period information
5. **Interactive features**:
   - Click to view detailed billing information
   - Upgrade plan button if approaching limits
   - Refresh button for real-time updates
6. **Widget updates automatically**:
   - Refreshes every 30 seconds for current data
   - Updates immediately after file uploads
   - Shows warning states when approaching limits

#### **Alternative Flows**
- **A1**: User has no company assigned → Show setup message
- **A2**: Subscription data unavailable → Show fallback message with retry
- **A3**: Storage limit exceeded → Show critical warning with upgrade options
- **A4**: Subscription expired → Show renewal required message
- **A5**: Multiple companies → Show dropdown to select company view

#### **Postconditions**
- Widget displays current subscription status
- Administrator has immediate visibility into plan usage
- Warning indicators alert to approaching limits
- Quick access to billing management provided

#### **Business Rules**
- **BR-SB021**: Widget refreshes every 30 seconds automatically
- **BR-SB022**: Storage usage calculated in real-time from database
- **BR-SB023**: Color coding: Green (0-70%), Yellow (70-90%), Red (90-100%)
- **BR-SB024**: Widget shows next billing date for active subscriptions
- **BR-SB025**: Upgrade buttons link to Stripe checkout when applicable
- **BR-SB026**: Widget works for all subscription statuses (trial, active, past_due, canceled)
- **BR-SB027**: Data cached for 60 seconds to balance freshness with performance
- **BR-SB028**: Widget handles error states gracefully with user-friendly messages
- **BR-SB029**: Widget responsive design works on all admin panel screen sizes
- **BR-SB030**: Click actions require appropriate permissions (company admin or owner)

---

### **UC-SB007: Billing Management Interface**

#### **Description**
Comprehensive billing management interface accessible to standard users through the admin panel menu, providing self-service subscription management including trial status, plan upgrades, payment processing, billing history, and subscription lifecycle management.

#### **Actors**
- **Primary**: Standard Users (Company Members)
- **Secondary**: Company Administrators, Stripe Payment System, Subscription Service

#### **Preconditions**
- User logged into Strapi admin interface
- User has company assignment with subscription data
- Stripe integration configured and operational
- Billing management system accessible

#### **Main Flow**
1. **Standard user accesses billing menu**:
   - User clicks "Billing & Subscription" menu item in admin navigation
   - System verifies user has company assignment
   - System loads comprehensive billing management interface
2. **Subscription Overview Display**:
   - Current subscription status (Trial, Active, Past Due, Canceled)
   - Plan level with features and limits clearly shown
   - Trial expiration date or next billing date
   - Storage usage and user count with visual progress indicators
   - Remaining trial days or time until next billing cycle
3. **Plan Management Section**:
   - Available plan options (Starter, Professional, Enterprise)
   - Feature comparison table with current plan highlighted
   - Pricing information with monthly/annual options
   - Upgrade/downgrade buttons with immediate effect
4. **Payment Processing**:
   - Stripe checkout integration for plan upgrades
   - Secure payment form for new subscriptions
   - Payment method management (cards, bank accounts)
   - Invoice generation and download capability
5. **Billing History**:
   - Complete transaction history with dates and amounts
   - Invoice downloads in PDF format
   - Payment status tracking (successful, failed, pending)
   - Usage-based billing calculations when applicable
6. **Account Management**:
   - Cancel subscription with immediate or end-of-period options
   - Reactivate canceled subscriptions
   - Update billing contact information
   - Manage notification preferences for billing events

#### **Alternative Flows**
- **A1**: User not assigned to company → Redirect to setup flow
- **A2**: Trial expired → Show renewal required with payment options
- **A3**: Payment method expired → Show update payment method flow
- **A4**: Subscription suspended → Show reactivation options
- **A5**: Company has multiple users → Show role-based access controls
- **A6**: Stripe service unavailable → Show graceful error with retry options
- **A7**: Plan upgrade while at usage limits → Show immediate access to new limits

#### **Postconditions**
- User has complete visibility into subscription status
- Payment processing completed successfully when initiated
- Subscription changes reflected in real-time across system
- Billing events logged for audit and support purposes
- User notifications sent for successful transactions

#### **Business Rules**
- **BR-SB031**: All users with company assignment can view billing information
- **BR-SB032**: Only company admins and owners can modify subscription plans
- **BR-SB033**: Trial period is exactly 15 days from company creation
- **BR-SB034**: Payment processing requires Stripe customer validation
- **BR-SB035**: Plan upgrades take effect immediately with prorated billing
- **BR-SB036**: Plan downgrades take effect at end of current billing period
- **BR-SB037**: Canceled subscriptions maintain access until period end
- **BR-SB038**: Failed payments trigger 7-day grace period before suspension
- **BR-SB039**: Billing interface updates in real-time without page refresh
- **BR-SB040**: All billing events generate system notifications
- **BR-SB041**: Invoice downloads require authentication and company membership
- **BR-SB042**: Payment method updates trigger immediate validation
- **BR-SB043**: Subscription reactivation requires valid payment method
- **BR-SB044**: Usage limits enforced immediately upon plan changes
- **BR-SB045**: Billing contact information synced with Stripe customer data

---

## 🔧 **Technical Implementation Requirements**

### **Widget Architecture**
- **React Component**: `src/admin/pages/SubscriptionUsage/index.jsx`
- **API Integration**: Uses existing subscription validation endpoints
- **Styling**: Matches existing Strapi admin panel widgets
- **Performance**: Cached data with automatic refresh
- **Responsive**: Works on desktop, tablet, and mobile admin views

### **Data Requirements**
- Real-time storage usage calculation
- Plan limits and feature availability
- Subscription status and next billing date
- User count vs plan maximums
- Payment history summary

### **Visual Design**
- Progress bars for storage and user utilization
- Color-coded status indicators
- Clean typography matching admin panel
- Icon-based feature indicators
- Responsive grid layout

### **Performance Requirements**
- <200ms initial load time
- <100ms refresh update time
- Minimal impact on admin dashboard load
- Efficient caching to reduce API calls

---

## 📊 **Success Criteria**

### **Functional Requirements**
- ✅ Widget displays on admin dashboard home page
- ✅ Real-time storage usage with progress visualization
- ✅ Plan level and subscription status clearly shown
- ✅ Interactive elements for billing management access
- ✅ Automatic refresh and real-time updates
- ✅ Error handling with user-friendly messages

### **Non-Functional Requirements**
- ✅ <200ms widget load time
- ✅ <100ms refresh time
- ✅ Responsive design across all screen sizes
- ✅ Accessible design meeting WCAG standards
- ✅ Integration with existing admin panel styling

### **User Experience Requirements**
- ✅ Intuitive visual indicators for usage levels
- ✅ Clear call-to-action buttons for plan management
- ✅ Contextual information without overwhelming detail
- ✅ Consistent with existing widget behavior and styling
- ✅ Smooth animations and transitions

This comprehensive use case framework ensures the subscription billing system meets all business requirements while providing excellent user experience and technical performance. 
 
 
 
 
 