import { prisma } from './prisma';
import { sendEmailNotification } from './emailNotifications';

// Daily Progress Email (Mon–Fri, 8pm Nairobi)
export async function sendDailyProgressEmails() {
  try {
    console.log('Starting daily progress email job...');
    
    // Get all users with email notifications enabled
    const users = await prisma.user.findMany({
      where: {
        emailNotifications: true,
        weeklyReport: true, // Daily progress is part of weekly report preference
        email: { not: null }
      },
      include: {
        department: {
          select: { name: true }
        }
      }
    });

    console.log(`Found ${users.length} users for daily progress emails`);

    for (const user of users) {
      try {
        // Get user's tasks for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const tasks = await prisma.task.findMany({
          where: {
            createdById: user.id,
            createdAt: {
              gte: today,
              lt: tomorrow
            }
          },
          include: {
            subtasks: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                deadline: true,
                blockerReason: true
              }
            }
          }
        });

        // Calculate progress
        const completed = tasks.filter(task => task.status === 'completed').length;
        const pending = tasks.filter(task => task.status === 'todo' || task.status === 'in_progress').length;
        const blockers = tasks.filter(task => task.status === 'blocker').length;

        // Prepare task data for email
        const taskData = tasks.map(task => ({
          title: task.title,
          deadline: task.deadline,
          status: task.status,
          subtasks: task.subtasks.map(subtask => ({
            title: subtask.title,
            status: subtask.status,
            priority: subtask.priority,
            deadline: subtask.deadline,
            blockerReason: subtask.blockerReason
          }))
        }));

        await sendEmailNotification({
          userId: user.id,
          type: 'daily_progress',
          progressData: {
            completed,
            pending,
            blockers,
            tasks: taskData
          }
        });

        console.log(`Daily progress email sent to ${user.name} (${user.email})`);
      } catch (error) {
        console.error(`Error sending daily progress email to ${user.name}:`, error);
      }
    }

    console.log('Daily progress email job completed');
  } catch (error) {
    console.error('Error in daily progress email job:', error);
  }
}

// Manager Daily Completed Tasks Summary (Mon–Fri, 8pm Nairobi)
export async function sendManagerSummaryEmails() {
  try {
    console.log('Starting manager summary email job...');
    
    // Get all managers with email notifications enabled
    const managers = await prisma.user.findMany({
      where: {
        role: 'manager',
        emailNotifications: true,
        email: { not: null }
      },
      include: {
        managingDepartments: {
          include: {
            users: {
              include: {
                tasksCreated: {
                  where: {
                    status: 'completed',
                    createdAt: {
                      gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                  },
                  include: {
                    subtasks: {
                      select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                        deadline: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`Found ${managers.length} managers for summary emails`);

    for (const manager of managers) {
      try {
        for (const department of manager.managingDepartments) {
          const teamData = department.users.map(user => ({
            name: user.name,
            completedTasks: user.tasksCreated.length,
            tasks: user.tasksCreated.map(task => ({
              title: task.title,
              deadline: task.deadline,
              subtasks: task.subtasks.map(subtask => ({
                title: subtask.title,
                status: subtask.status,
                priority: subtask.priority,
                deadline: subtask.deadline
              }))
            }))
          }));

          await sendEmailNotification({
            userId: manager.id,
            type: 'manager_summary',
            teamData
          });

          console.log(`Manager summary email sent to ${manager.name} for department ${department.name}`);
        }
      } catch (error) {
        console.error(`Error sending manager summary email to ${manager.name}:`, error);
      }
    }

    console.log('Manager summary email job completed');
  } catch (error) {
    console.error('Error in manager summary email job:', error);
  }
}

// Weekly Report (Wed, 9am Nairobi)
export async function sendWeeklyReports() {
  try {
    console.log('Starting weekly report email job...');
    
    // Get all users with weekly report enabled
    const users = await prisma.user.findMany({
      where: {
        weeklyReport: true,
        emailNotifications: true,
        email: { not: null }
      },
      include: {
        department: {
          select: { name: true }
        }
      }
    });

    console.log(`Found ${users.length} users for weekly reports`);

    for (const user of users) {
      try {
        // Get user's tasks for the current week
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const tasks = await prisma.task.findMany({
          where: {
            createdById: user.id,
            createdAt: {
              gte: startOfWeek,
              lt: endOfWeek
            }
          },
          include: {
            subtasks: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                deadline: true,
                blockerReason: true
              }
            }
          }
        });

        // Calculate weekly progress
        const completed = tasks.filter(task => task.status === 'completed').length;
        const pending = tasks.filter(task => task.status === 'todo' || task.status === 'in_progress').length;
        const blockers = tasks.filter(task => task.status === 'blocker').length;

        // Prepare task data for email
        const taskData = tasks.map(task => ({
          title: task.title,
          deadline: task.deadline,
          status: task.status,
          subtasks: task.subtasks.map(subtask => ({
            title: subtask.title,
            status: subtask.status,
            priority: subtask.priority,
            deadline: subtask.deadline,
            blockerReason: subtask.blockerReason
          }))
        }));

        await sendEmailNotification({
          userId: user.id,
          type: 'weekly_report',
          progressData: {
            completed,
            pending,
            blockers,
            tasks: taskData
          }
        });

        console.log(`Weekly report email sent to ${user.name} (${user.email})`);
      } catch (error) {
        console.error(`Error sending weekly report email to ${user.name}:`, error);
      }
    }

    console.log('Weekly report email job completed');
  } catch (error) {
    console.error('Error in weekly report email job:', error);
  }
}

// Thursday Overdue Tasks Report (Thu, 4:30pm Nairobi)
export async function sendOverdueTasksReports() {
  try {
    console.log('Starting overdue tasks report job...');
    
    // Get all users with overdue notifications enabled
    const users = await prisma.user.findMany({
      where: {
        taskOverdue: true,
        emailNotifications: true,
        email: { not: null }
      },
      include: {
        department: {
          select: { name: true }
        }
      }
    });

    console.log(`Found ${users.length} users for overdue reports`);

    for (const user of users) {
      try {
        // Get overdue tasks
        const now = new Date();
        const overdueTasks = await prisma.task.findMany({
          where: {
            createdById: user.id,
            deadline: { lt: now },
            status: { not: 'completed' }
          },
          include: {
            subtasks: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                deadline: true
              }
            }
          }
        });

        if (overdueTasks.length > 0) {
          const overdueData = overdueTasks.map(task => ({
            title: task.title,
            deadline: task.deadline,
            status: task.status,
            subtasks: task.subtasks.map(subtask => ({
              title: subtask.title,
              status: subtask.status,
              priority: subtask.priority,
              deadline: subtask.deadline
            }))
          }));

          await sendEmailNotification({
            userId: user.id,
            type: 'task_overdue',
            overdueData
          });

          console.log(`Overdue tasks report sent to ${user.name} (${user.email})`);
        }
      } catch (error) {
        console.error(`Error sending overdue tasks report to ${user.name}:`, error);
      }
    }

    console.log('Overdue tasks report job completed');
  } catch (error) {
    console.error('Error in overdue tasks report job:', error);
  }
}

// Deadline Reminders (Daily check for tasks due tomorrow)
export async function sendDeadlineReminders() {
  try {
    console.log('Starting deadline reminders job...');
    
    // Get all users with deadline notifications enabled
    const users = await prisma.user.findMany({
      where: {
        taskDeadline: true,
        emailNotifications: true,
        email: { not: null }
      }
    });

    console.log(`Found ${users.length} users for deadline reminders`);

    for (const user of users) {
      try {
        // Get tasks due tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(tomorrow.getDate() + 1);

        const tasksDueTomorrow = await prisma.task.findMany({
          where: {
            createdById: user.id,
            deadline: {
              gte: tomorrow,
              lt: dayAfterTomorrow
            },
            status: { not: 'completed' }
          },
          include: {
            subtasks: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                deadline: true,
                blockerReason: true
              }
            }
          }
        });

        for (const task of tasksDueTomorrow) {
          await sendEmailNotification({
            userId: user.id,
            type: 'task_deadline',
            taskData: {
              id: task.id,
              title: task.title,
              description: task.description,
              deadline: task.deadline,
              priority: task.priority,
              status: task.status,
              subtasks: task.subtasks.map(subtask => ({
                id: subtask.id,
                title: subtask.title,
                status: subtask.status,
                priority: subtask.priority,
                deadline: subtask.deadline,
                blockerReason: subtask.blockerReason
              }))
            }
          });

          console.log(`Deadline reminder sent to ${user.name} for task: ${task.title}`);
        }
      } catch (error) {
        console.error(`Error sending deadline reminders to ${user.name}:`, error);
      }
    }

    console.log('Deadline reminders job completed');
  } catch (error) {
    console.error('Error in deadline reminders job:', error);
  }
}
