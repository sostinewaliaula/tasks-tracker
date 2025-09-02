import React, { useEffect, useState, createContext, useContext } from 'react';
import { MOCK_USERS } from '../constants/mockUsers';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type Task = {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  priority: TaskPriority;
  status: TaskStatus;
  createdBy: string;
  department: string;
  createdAt: Date;
};
type Notification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: Date;
  relatedTaskId?: string;
};
type TaskContextType = {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  getTasksByDepartment: (department: string) => Task[];
  getTasksByUser: (userId: string) => Task[];
  getTasksForCurrentWeek: () => Task[];
  getTasksCountByStatus: (department?: string) => Record<TaskStatus, number>;
  getTasksCountByPriority: (department?: string) => Record<TaskPriority, number>;
};
const TaskContext = createContext<TaskContextType | undefined>(undefined);
// Generate 20 tasks per user across the current week
const startOfWeek = (() => { const d = new Date(); const day = d.getDay(); const s = new Date(d); s.setDate(d.getDate() - day); s.setHours(0,0,0,0); return s; })();
const addDays = (date: Date, days: number) => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };
const priorities: TaskPriority[] = ['high', 'medium', 'low'];
const statuses: TaskStatus[] = ['todo', 'in-progress', 'completed'];

const mockTasks: Task[] = MOCK_USERS.flatMap((user, uIdx) => {
  const tasks: Task[] = [];
  for (let i = 0; i < 20; i++) {
    const dayOffset = (i % 5); // Mon-Fri
    const createdOffset = Math.max(0, dayOffset - 2);
    const deadline = addDays(startOfWeek, 1 + dayOffset); // ensure within week Tue-Sat-ish
    const createdAt = addDays(startOfWeek, createdOffset);
    const status = statuses[(uIdx + i) % statuses.length];
    const priority = priorities[(uIdx + i) % priorities.length];
    tasks.push({
      id: `${uIdx + 1}-${i + 1}`,
      title: `${user.department} Task ${i + 1}`,
      description: `Auto-generated task ${i + 1} for ${user.name}`,
      deadline,
      priority,
      status,
      createdBy: user.id,
      department: user.department,
      createdAt
    });
  }
  return tasks;
});
const mockNotifications: Notification[] = [{
  id: '1',
  message: "New task 'Client Presentation' has been created",
  read: false,
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  relatedTaskId: '3'
}, {
  id: '2',
  message: "Task 'Website Update' has been completed",
  read: true,
  createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  relatedTaskId: '4'
}, {
  id: '3',
  message: "Reminder: 'Client Presentation' is due tomorrow",
  read: false,
  createdAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000),
  relatedTaskId: '3'
}];
export function TaskProvider({
  children
}: {
  children: ReactNode;
}) {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setTasks(prev => [...prev, newTask]);
    // Add notification for task creation
    const newNotification: Notification = {
      id: Date.now().toString(),
      message: `New task '${newTask.title}' has been created`,
      read: false,
      createdAt: new Date(),
      relatedTaskId: newTask.id
    };
    setNotifications(prev => [...prev, newNotification]);
  };
  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(task => task.id === id ? {
      ...task,
      status
    } : task));
    // If task is completed, add notification
    if (status === 'completed') {
      const task = tasks.find(t => t.id === id);
      if (task) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          message: `Task '${task.title}' has been completed`,
          read: false,
          createdAt: new Date(),
          relatedTaskId: id
        };
        setNotifications(prev => [...prev, newNotification]);
      }
    }
  };
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification => notification.id === id ? {
      ...notification,
      read: true
    } : notification));
  };
  const getTasksByDepartment = (department: string) => {
    return tasks.filter(task => task.department === department);
  };
  const getTasksByUser = (userId: string) => {
    return tasks.filter(task => task.createdBy === userId);
  };
  const getTasksForCurrentWeek = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    return tasks.filter(task => {
      const taskDate = new Date(task.deadline);
      return taskDate >= startOfWeek && taskDate <= endOfWeek;
    });
  };
  const getTasksCountByStatus = (department?: string) => {
    const filteredTasks = department ? tasks.filter(task => task.department === department) : tasks;
    return {
      todo: filteredTasks.filter(task => task.status === 'todo').length,
      'in-progress': filteredTasks.filter(task => task.status === 'in-progress').length,
      completed: filteredTasks.filter(task => task.status === 'completed').length
    };
  };
  const getTasksCountByPriority = (department?: string) => {
    const filteredTasks = department ? tasks.filter(task => task.department === department) : tasks;
    return {
      high: filteredTasks.filter(task => task.priority === 'high').length,
      medium: filteredTasks.filter(task => task.priority === 'medium').length,
      low: filteredTasks.filter(task => task.priority === 'low').length
    };
  };
  // Add deadline reminder notifications
  useEffect(() => {
    const checkForDeadlines = () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(tomorrow.getDate() + 1);
      tasks.forEach(task => {
        if (task.status !== 'completed') {
          const taskDeadline = new Date(task.deadline);
          taskDeadline.setHours(0, 0, 0, 0);
          if (taskDeadline.getTime() === tomorrow.getTime()) {
            // Check if we already have a notification for this task deadline
            const hasNotification = notifications.some(n => n.relatedTaskId === task.id && n.message.includes('due tomorrow'));
            if (!hasNotification) {
              const newNotification: Notification = {
                id: Date.now().toString() + task.id,
                message: `Reminder: '${task.title}' is due tomorrow`,
                read: false,
                createdAt: new Date(),
                relatedTaskId: task.id
              };
              setNotifications(prev => [...prev, newNotification]);
            }
          }
        }
      });
    };
    // Check once when component mounts
    checkForDeadlines();
    // Then check every day at 9 AM
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 9 && now.getMinutes() === 0) {
        checkForDeadlines();
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [tasks, notifications]);
  return <TaskContext.Provider value={{
    tasks,
    addTask,
    updateTaskStatus,
    notifications,
    markNotificationAsRead,
    getTasksByDepartment,
    getTasksByUser,
    getTasksForCurrentWeek,
    getTasksCountByStatus,
    getTasksCountByPriority
  }}>
      {children}
    </TaskContext.Provider>;
}
export function useTask() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
}