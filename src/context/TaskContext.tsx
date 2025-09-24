import React, { useEffect, useState, createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'blocker';
export type Task = {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  priority: TaskPriority;
  status: TaskStatus;
  blockerReason?: string;
  createdBy: string;
  department: string;
  createdAt: Date;
  parentId?: string | null;
  subtasks?: Task[];
  // carryover fields
  isCarriedOver?: boolean;
  carryOverReason?: string | null;
  carriedOverFromDeadline?: Date | null;
  carriedOverAt?: Date | null;
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
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'subtasks'>) => Promise<string>;
  addSubtask: (parentId: string, task: Omit<Task, 'id' | 'createdAt' | 'parentId' | 'subtasks'>) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus, blockerReason?: string) => void;
  carryOverTask: (id: string, newDeadline: Date, reason: string) => Promise<void>;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
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
const mockNotifications: Notification[] = [];
export function TaskProvider({
  children
}: {
  children: ReactNode;
}) {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'subtasks'>) => {
    const resp = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        priority: task.priority,
        status: task.status,
        departmentId: task.department ? undefined : undefined,
        createdById: Number.isNaN(Number(task.createdBy)) ? undefined : Number(task.createdBy),
        parentId: task.parentId ?? null
      })
    });
    if (!resp.ok) throw new Error('Failed to create task');
    const data = await resp.json();
    const newId = String(data?.data?.id ?? '');
    await reloadTasks();
    return newId;
  };
  const addSubtask = async (parentId: string, task: Omit<Task, 'id' | 'createdAt' | 'parentId' | 'subtasks'>) => {
    const resp = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        priority: task.priority,
        status: task.status,
        blockerReason: task.blockerReason,
        parentId: Number(parentId)
      })
    });
    if (!resp.ok) throw new Error('Failed to create subtask');
    await reloadTasks();
  };
  const updateTaskStatus = async (id: string, status: TaskStatus, blockerReason?: string) => {
    const resp = await fetch(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ status, blockerReason })
    });
    if (!resp.ok) throw new Error('Failed to update status');
    await reloadTasks();
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
  const carryOverTask = async (id: string, newDeadline: Date, reason: string) => {
    const resp = await fetch(`/api/tasks/${id}/carryover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ newDeadline, reason })
    });
    if (!resp.ok) throw new Error('Failed to carry over task');
    await reloadTasks();
  };
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification => notification.id === id ? {
      ...notification,
      read: true
    } : notification));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
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
  // Fetch tasks from API
  const reloadTasks = async () => {
    const resp = await fetch('/api/tasks?parentId=null', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!resp.ok) return;
    const data = await resp.json();
    const apiTasks = (data?.data ?? []) as any[];
    const mapTask = (t: any): Task => ({
      id: String(t.id),
      title: t.title,
      description: t.description,
      deadline: new Date(t.deadline),
      priority: t.priority,
      status: String(t.status).replace('_', '-') as TaskStatus,
      blockerReason: t.blockerReason || undefined,
      createdBy: String(t.createdById ?? t.createdBy?.id ?? ''),
      department: t.department?.name ?? '',
      createdAt: new Date(t.createdAt),
      parentId: t.parentId ? String(t.parentId) : null,
      subtasks: Array.isArray(t.subtasks) ? t.subtasks.map(mapTask) : [],
      isCarriedOver: Boolean(t.isCarriedOver),
      carryOverReason: t.carryOverReason ?? null,
      carriedOverFromDeadline: t.carriedOverFromDeadline ? new Date(t.carriedOverFromDeadline) : null,
      carriedOverAt: t.carriedOverAt ? new Date(t.carriedOverAt) : null
    });
    const mapped: Task[] = apiTasks.map(mapTask);
    setTasks(mapped);
  };

  useEffect(() => {
    if (token) {
      reloadTasks();
    } else {
      setTasks([]);
    }
  }, [token]);

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
    checkForDeadlines();
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 9 && now.getMinutes() === 0) {
        checkForDeadlines();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [tasks, notifications]);

  // Automatically update main task status based on subtasks
  useEffect(() => {
    tasks.forEach(task => {
      if (task.subtasks && task.subtasks.length > 0) {
        const completed = task.subtasks.filter(st => st.status === 'completed').length;
        let newStatus: TaskStatus = task.status;
        if (completed === task.subtasks.length) {
          newStatus = 'completed';
        } else if (completed > 0) {
          newStatus = 'in-progress';
        } else {
          newStatus = 'todo';
        }
        if (task.status !== newStatus) {
          updateTaskStatus(task.id, newStatus);
        }
      }
    });
  }, [tasks]);
  return <TaskContext.Provider value={{
    tasks,
    addTask,
    addSubtask,
    updateTaskStatus,
    carryOverTask,
    notifications,
    markNotificationAsRead,
    deleteNotification,
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