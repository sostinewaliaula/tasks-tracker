# Blocker Management System

## Overview

The Blocker Management System provides comprehensive functionality for handling blocked tasks in the Tasks Tracker application. This system allows users to mark tasks as blocked, provide reasons, and manage the resolution process.

## Features

### 1. Task Blocking
- **Mark as Blocker**: Users can mark tasks as blocked when they cannot proceed
- **Required Reason**: Blocking a task requires a detailed reason explaining the blockage
- **Visual Indicators**: Blocked tasks are clearly marked with red indicators and warning icons
- **Status Tracking**: Blocked tasks maintain their blocker status until resolved

### 2. Blocker Resolution
- **Unblock**: Move blocked tasks back to "In Progress" status
- **Mark Resolved**: Directly mark blocked tasks as completed
- **Reason Management**: Update or modify blocker reasons as needed

### 3. Management Dashboard
- **Blocker Overview**: Dedicated dashboard for monitoring all blocked tasks
- **Filtering Options**: Filter by all blockers, department blockers, or personal blockers
- **Priority Indicators**: Visual priority indicators for blocked tasks
- **Deadline Tracking**: Show overdue and urgent blocked tasks
- **Age Tracking**: Display how long tasks have been blocked

### 4. Notifications
- **Blocker Alerts**: Notify managers when tasks are blocked
- **Resolution Notifications**: Alert when blockers are resolved
- **Escalation**: Automatic escalation for long-standing blockers

## Technical Implementation

### Database Schema
```sql
-- Task status includes blocker
enum TaskStatus {
  todo
  in_progress
  completed
  blocker
}

-- Blocker reason field
model Task {
  blockerReason String?
  status TaskStatus @default(todo)
  -- ... other fields
}
```

### Frontend Components

#### BlockerManagement Component
- **Purpose**: Inline blocker management for individual tasks
- **Features**: Block/unblock tasks, manage reasons, resolution actions
- **Permissions**: Role-based access control

#### BlockerDashboard Component
- **Purpose**: Overview dashboard for managers and admins
- **Features**: Filtering, priority indicators, deadline tracking
- **Usage**: Integrated into main dashboards

### API Endpoints

#### Update Task Status
```
PATCH /api/tasks/:id/status
Body: { status: "blocker", blockerReason?: "reason" }
```

#### Get Blocked Tasks
```
GET /api/tasks?status=blocker
Query: departmentId, createdById, priority
```

## User Workflows

### 1. Blocking a Task
1. User identifies a task that cannot proceed
2. Clicks "Block Task" button
3. Provides detailed reason for blocking
4. Task status changes to "blocker"
5. Notifications sent to relevant stakeholders

### 2. Managing Blockers (Managers/Admins)
1. Access Blocker Dashboard
2. Review all blocked tasks
3. Filter by department or priority
4. Take action: unblock, resolve, or escalate
5. Update blocker reasons as needed

### 3. Resolving Blockers
1. Identify resolution approach
2. Either unblock (back to in-progress) or mark resolved
3. Update task status and remove blocker reason
4. Notifications sent about resolution

## Visual Design

### Blocker Indicators
- **Red Color Scheme**: Red backgrounds, borders, and icons
- **Alert Icons**: AlertCircleIcon for visual emphasis
- **Warning Badges**: Clear "BLOCKED" status indicators
- **Priority Colors**: High priority blockers get additional visual emphasis

### Status Badges
```css
.blocker-badge {
  background: red-100;
  color: red-800;
  border: red-200;
}
```

### Dashboard Cards
- **Header**: Red gradient with blocker icon
- **Content**: Task details, reason, age, deadline
- **Actions**: Unblock, resolve, or escalate buttons

## Permissions & Access Control

### Employee Level
- Can block their own tasks
- Can unblock their own tasks
- Can provide/update blocker reasons
- Cannot see other users' blockers

### Manager Level
- Can block any task in their department
- Can unblock any task in their department
- Can view department blocker dashboard
- Can escalate blockers to admin

### Admin Level
- Full access to all blocker management
- Can view system-wide blocker dashboard
- Can manage all blocker resolutions
- Can access blocker analytics

## Best Practices

### 1. Blocker Reasons
- **Be Specific**: Provide detailed, actionable reasons
- **Include Context**: Explain what's preventing progress
- **Mention Dependencies**: List any external dependencies
- **Set Expectations**: Include estimated resolution time

### 2. Resolution Process
- **Regular Review**: Check blocker dashboard daily
- **Prioritize**: Focus on high-priority blockers first
- **Communicate**: Keep stakeholders informed of progress
- **Document**: Update reasons as situation changes

### 3. Prevention
- **Early Identification**: Catch potential blockers early
- **Dependency Management**: Track external dependencies
- **Resource Planning**: Ensure adequate resources
- **Communication**: Maintain clear communication channels

## Integration Points

### 1. Task Creation
- Blocker status available in task creation
- Blocker reason required when status is blocker
- Validation ensures reason is provided

### 2. Task Details
- BlockerManagement component integrated
- Visual indicators for blocked status
- Action buttons for resolution

### 3. Dashboards
- BlockerDashboard integrated into main dashboards
- Blocker counts in statistics
- Quick access to blocker management

### 4. Notifications
- Blocker creation notifications
- Resolution notifications
- Escalation alerts for long-standing blockers

## Future Enhancements

### 1. Advanced Analytics
- Blocker trend analysis
- Resolution time tracking
- Department comparison metrics

### 2. Automation
- Auto-escalation for long-standing blockers
- Automatic unblocking based on conditions
- Smart blocker reason suggestions

### 3. Integration
- External system integration
- API webhooks for blocker events
- Third-party tool notifications

## Troubleshooting

### Common Issues
1. **Missing Blocker Reason**: Ensure reason is provided when blocking
2. **Permission Errors**: Check user role and department access
3. **Status Sync Issues**: Verify API calls and state updates
4. **Notification Problems**: Check notification service configuration

### Debug Steps
1. Check browser console for errors
2. Verify API responses
3. Confirm user permissions
4. Test with different user roles
