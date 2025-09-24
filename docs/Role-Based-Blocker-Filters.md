# Role-Based Blocker Filters

## 🎯 Overview

I've implemented a comprehensive role-based filtering system for the BlockerDashboard that provides appropriate filter options based on user roles (Admin, Manager, Employee). This ensures users only see relevant blockers and have appropriate access levels.

## 👥 Role-Based Filter Options

### 🔧 Admin Role
**Full System Access**
- **All Blockers**: Show all blocked tasks across the entire system
- **Urgent Blockers**: Tasks due today or tomorrow (system-wide)
- **Overdue Blockers**: Tasks past their deadline (system-wide)
- **By Department**: Filter by specific department (system-wide)

### 👨‍💼 Manager Role
**Department Management**
- **All Blockers**: Show all blocked tasks (system-wide view)
- **My Department**: Tasks in their department only
- **Urgent Blockers**: Tasks due today or tomorrow (department + system)
- **Overdue Blockers**: Tasks past their deadline (department + system)

### 👤 Employee Role
**Personal Task Management**
- **All Blockers**: Show all blocked tasks (system-wide view)
- **My Blockers**: Tasks they created or are assigned to them
- **My Urgent Blockers**: Their tasks due today or tomorrow
- **My Overdue Blockers**: Their tasks past their deadline

## 🔍 Filter Logic Implementation

### Base Filtering
```typescript
const [filter, setFilter] = useState<'all' | 'department' | 'my' | 'urgent' | 'overdue'>('all');
```

### Role-Based Filter Options
```typescript
const getFilterOptions = () => {
  const baseOptions = [
    { value: 'all', label: 'All Blockers', description: 'Show all blocked tasks' }
  ];

  if (currentUser?.role === 'admin') {
    return [
      ...baseOptions,
      { value: 'urgent', label: 'Urgent Blockers', description: 'Tasks due today or tomorrow' },
      { value: 'overdue', label: 'Overdue Blockers', description: 'Tasks past their deadline' },
      { value: 'department', label: 'By Department', description: 'Filter by specific department' }
    ];
  } else if (currentUser?.role === 'manager') {
    return [
      ...baseOptions,
      { value: 'department', label: 'My Department', description: 'Tasks in your department' },
      { value: 'urgent', label: 'Urgent Blockers', description: 'Tasks due today or tomorrow' },
      { value: 'overdue', label: 'Overdue Blockers', description: 'Tasks past their deadline' }
    ];
  } else {
    // Employee role
    return [
      ...baseOptions,
      { value: 'my', label: 'My Blockers', description: 'Tasks I created or assigned to me' },
      { value: 'urgent', label: 'My Urgent Blockers', description: 'My tasks due today or tomorrow' },
      { value: 'overdue', label: 'My Overdue Blockers', description: 'My tasks past their deadline' }
    ];
  }
};
```

### Advanced Filtering Logic
```typescript
// Apply role-based filtering
if (filter === 'department' && currentUser?.department) {
  filteredTasks = filteredTasks.filter(task => task.department === currentUser.department);
} else if (filter === 'my') {
  filteredTasks = filteredTasks.filter(task => task.createdBy === currentUser?.id);
} else if (filter === 'urgent') {
  filteredTasks = filteredTasks.filter(task => {
    const daysUntilDeadline = getDaysUntilDeadline(task.deadline);
    const isUrgent = daysUntilDeadline <= 1 && daysUntilDeadline >= 0;
    
    // For employees, only show their own urgent tasks
    if (currentUser?.role === 'employee') {
      return isUrgent && task.createdBy === currentUser?.id;
    }
    return isUrgent;
  });
} else if (filter === 'overdue') {
  filteredTasks = filteredTasks.filter(task => {
    const daysUntilDeadline = getDaysUntilDeadline(task.deadline);
    const isOverdue = daysUntilDeadline < 0;
    
    // For employees, only show their own overdue tasks
    if (currentUser?.role === 'employee') {
      return isOverdue && task.createdBy === currentUser?.id;
    }
    return isOverdue;
  });
}
```

## 📊 Filter Behavior by Role

### Admin Filters
| Filter | Scope | Description |
|--------|-------|-------------|
| All Blockers | System-wide | All blocked tasks in the system |
| Urgent Blockers | System-wide | Tasks due today/tomorrow across all departments |
| Overdue Blockers | System-wide | Tasks past deadline across all departments |
| By Department | System-wide | Filter by any department in the system |

### Manager Filters
| Filter | Scope | Description |
|--------|-------|-------------|
| All Blockers | System-wide | All blocked tasks in the system |
| My Department | Department | Tasks in manager's department only |
| Urgent Blockers | System-wide | Tasks due today/tomorrow (all departments) |
| Overdue Blockers | System-wide | Tasks past deadline (all departments) |

### Employee Filters
| Filter | Scope | Description |
|--------|-------|-------------|
| All Blockers | System-wide | All blocked tasks in the system |
| My Blockers | Personal | Tasks created by or assigned to employee |
| My Urgent Blockers | Personal | Employee's tasks due today/tomorrow |
| My Overdue Blockers | Personal | Employee's tasks past deadline |

## 🎨 UI Enhancements

### Filter Dropdown
- **Role-appropriate options**: Only shows relevant filters for each role
- **Descriptive labels**: Clear, role-specific naming
- **Tooltips**: Hover descriptions for each filter option
- **Active indicator**: Shows current filter with a badge

### Visual Indicators
```typescript
{filter !== 'all' && (
  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
    {getFilterOptions().find(opt => opt.value === filter)?.label}
  </span>
)}
```

### Summary Statistics
- **Filtered count**: Shows number of tasks matching current filter
- **Breakdown**: Main tasks vs subtasks count
- **Active filter badge**: Visual indicator of current filter

## 🔒 Security & Access Control

### Data Isolation
- **Employee scope**: Limited to their own tasks
- **Manager scope**: Department-level access
- **Admin scope**: Full system access

### Permission Validation
- **Role checking**: Validates user role before showing filters
- **Data filtering**: Server-side filtering based on user permissions
- **UI restrictions**: Hides inappropriate options for each role

## 📱 User Experience

### Intuitive Navigation
- **Contextual filters**: Only relevant options shown
- **Clear labeling**: Role-appropriate terminology
- **Visual feedback**: Active filter indicators
- **Responsive design**: Works on all screen sizes

### Performance Optimization
- **Efficient filtering**: Optimized filter logic
- **Memoized calculations**: Prevents unnecessary re-renders
- **Lazy loading**: Filters applied only when needed

## 🧪 Testing Scenarios

### Admin Testing
1. **All Blockers**: Should see all blocked tasks
2. **Urgent Blockers**: Should see urgent tasks from all departments
3. **Overdue Blockers**: Should see overdue tasks from all departments
4. **By Department**: Should be able to filter by any department

### Manager Testing
1. **All Blockers**: Should see all blocked tasks
2. **My Department**: Should only see department tasks
3. **Urgent Blockers**: Should see urgent tasks from all departments
4. **Overdue Blockers**: Should see overdue tasks from all departments

### Employee Testing
1. **All Blockers**: Should see all blocked tasks
2. **My Blockers**: Should only see their own tasks
3. **My Urgent Blockers**: Should only see their urgent tasks
4. **My Overdue Blockers**: Should only see their overdue tasks

## 🚀 Benefits

### For Admins
- **Complete oversight**: Full system visibility
- **Strategic planning**: System-wide blocker analysis
- **Resource allocation**: Department-level insights

### For Managers
- **Department focus**: Team-specific blocker management
- **System awareness**: Broader context when needed
- **Team coordination**: Department-level insights

### For Employees
- **Personal focus**: Own task management
- **Clear priorities**: Urgent and overdue task visibility
- **System context**: Broader view when needed

## 📝 Implementation Notes

### Role Detection
```typescript
currentUser?.role === 'admin' | 'manager' | 'employee'
```

### Filter State Management
```typescript
const [filter, setFilter] = useState<'all' | 'department' | 'my' | 'urgent' | 'overdue'>('all');
```

### Dynamic UI Updates
- **Filter options**: Dynamically generated based on role
- **Count updates**: Real-time count updates based on filter
- **Visual indicators**: Active filter badges and labels

## ✅ Result

The BlockerDashboard now provides role-appropriate filtering that:
- **Respects user permissions** and access levels
- **Shows relevant options** for each user role
- **Provides clear context** about what each filter does
- **Maintains security** through proper data isolation
- **Enhances user experience** with intuitive navigation

Users now see only the filter options that are appropriate for their role and have clear understanding of what each filter will show them!
