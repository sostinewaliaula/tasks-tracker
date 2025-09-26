import '../loadEnv';
import { PrismaClient } from '../generated/prisma2';
import { sendEmailNotification } from '../lib/emailNotifications';

const prisma = new PrismaClient();

async function testAllUsersWithRealData() {
  console.log('🧪 Testing Email Notifications with Word Attachments for All Users...\n');

  // Test 1: Get all users with their roles and departments
  console.log('👥 Test 1: Fetching all users with roles and departments...');
  const users = await prisma.user.findMany({
    include: {
      department: {
        select: { name: true }
      }
    },
    where: {
      email: { not: null }
    }
  });

  if (users.length === 0) {
    console.log('❌ No users with email found in the database. Cannot test email notifications.\n');
    return;
  }

  console.log(`✅ Found ${users.length} users:`);
  users.forEach(user => {
    console.log(`  - ${user.name} (${user.email}) - Role: ${user.role} - Department: ${user.department?.name || 'None'}`);
  });
  console.log('');

  // Test 2: Get real tasks for each user
  console.log('📋 Test 2: Fetching real tasks for each user...');
  const userTasks = new Map();
  
  for (const user of users) {
    const tasks = await prisma.task.findMany({
      where: { createdById: user.id },
      include: {
        subtasks: true,
        createdBy: {
          select: { name: true, email: true }
        }
      },
      take: 5 // Limit to 5 tasks per user for testing
    });
    
    userTasks.set(user.id, tasks);
    console.log(`  - ${user.name}: ${tasks.length} tasks found`);
  }
  console.log('');

  // Test 3: Send role-specific notifications
  console.log('📧 Test 3: Sending role-specific notifications with real data...\n');

  for (const user of users) {
    const tasks = userTasks.get(user.id) || [];
    
    try {
      if (user.role === 'admin') {
        // Admin gets a general notification
        console.log(`👑 Sending admin notification to ${user.name}...`);
        await sendEmailNotification({
          userId: user.id,
          type: 'general',
          userData: {
            name: user.name,
            email: user.email,
            department: user.department?.name
          }
        });
        console.log(`✅ Admin notification sent to ${user.name}`);

      } else if (user.role === 'manager') {
        // Manager gets team summary
        console.log(`👥 Sending manager summary to ${user.name}...`);
        
        // Get team members for this manager
        const teamMembers = await prisma.user.findMany({
          where: { 
            department: { managerId: user.id }
          },
          include: {
            department: {
              select: { name: true }
            }
          }
        });

        const teamData = [];
        for (const member of teamMembers) {
          const memberTasks = await prisma.task.findMany({
            where: { 
              createdById: member.id,
              status: 'completed',
              updatedAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            },
            include: {
              subtasks: true
            },
            take: 3
          });

          teamData.push({
            name: member.name,
            completedTasks: memberTasks.length,
            tasks: memberTasks.map(task => ({
              title: task.title,
              deadline: task.deadline,
              subtasks: task.subtasks.map(subtask => ({
                title: subtask.title,
                status: subtask.status,
                priority: subtask.priority,
                deadline: subtask.deadline
              }))
            }))
          });
        }

        await sendEmailNotification({
          userId: user.id,
          type: 'manager_summary',
          teamData
        });
        console.log(`✅ Manager summary sent to ${user.name} (${teamData.length} team members)`);

      } else {
        // Employee gets daily progress report
        console.log(`👤 Sending daily progress to ${user.name}...`);
        
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        
        const completedTasks = await prisma.task.count({
          where: {
            createdById: user.id,
            status: 'completed',
            updatedAt: {
              gte: yesterday,
              lte: today
            }
          }
        });

        const pendingTasks = await prisma.task.count({
          where: {
            createdById: user.id,
            status: { in: ['todo', 'in-progress'] }
          }
        });

        const blockedTasks = await prisma.task.count({
          where: {
            createdById: user.id,
            status: 'blocker'
          }
        });

        const recentTasks = await prisma.task.findMany({
          where: {
            createdById: user.id,
            createdAt: {
              gte: yesterday
            }
          },
          include: {
            subtasks: true
          },
          take: 5
        });

        await sendEmailNotification({
          userId: user.id,
          type: 'daily_progress',
          progressData: {
            completed: completedTasks,
            pending: pendingTasks,
            blockers: blockedTasks,
            tasks: recentTasks.map(task => ({
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
            }))
          }
        });
        console.log(`✅ Daily progress sent to ${user.name} (${completedTasks} completed, ${pendingTasks} pending, ${blockedTasks} blocked)`);
      }

    } catch (error: any) {
      console.log(`❌ Failed to send notification to ${user.name}: ${error.message}`);
    }
    
    console.log(''); // Add spacing between users
  }

  // Test 4: Send task-specific notifications for users with tasks
  console.log('📧 Test 4: Sending task-specific notifications...\n');

  for (const user of users) {
    const tasks = userTasks.get(user.id) || [];
    
    if (tasks.length > 0) {
      try {
        // Send task assignment notification for the first task
        const firstTask = tasks[0];
        console.log(`📝 Sending task assignment notification to ${user.name} for task: ${firstTask.title}...`);
        
        await sendEmailNotification({
          userId: user.id,
          type: 'task_assigned',
          taskData: {
            id: firstTask.id,
            title: firstTask.title,
            description: firstTask.description,
            deadline: firstTask.deadline,
            priority: firstTask.priority,
            status: firstTask.status,
            createdBy: firstTask.createdBy?.name || 'System',
            subtasks: firstTask.subtasks.map(subtask => ({
              id: subtask.id,
              title: subtask.title,
              status: subtask.status,
              priority: subtask.priority,
              deadline: subtask.deadline,
              blockerReason: subtask.blockerReason
            }))
          }
        });
        console.log(`✅ Task assignment notification sent to ${user.name}`);

        // If there are completed tasks, send completion notification
        const completedTask = tasks.find(task => task.status === 'completed');
        if (completedTask) {
          console.log(`✅ Sending task completion notification to ${user.name} for task: ${completedTask.title}...`);
          
          await sendEmailNotification({
            userId: user.id,
            type: 'task_completed',
            taskData: {
              id: completedTask.id,
              title: completedTask.title,
              description: completedTask.description,
              deadline: completedTask.deadline,
              priority: completedTask.priority,
              status: completedTask.status,
              createdBy: completedTask.createdBy?.name || 'System'
            }
          });
          console.log(`✅ Task completion notification sent to ${user.name}`);
        }

      } catch (error: any) {
        console.log(`❌ Failed to send task notification to ${user.name}: ${error.message}`);
      }
    }
    
    console.log(''); // Add spacing between users
  }

  // Test 5: Send overdue task alerts
  console.log('📧 Test 5: Sending overdue task alerts...\n');

  for (const user of users) {
    try {
      const overdueTasks = await prisma.task.findMany({
        where: {
          createdById: user.id,
          deadline: { lt: new Date() },
          status: { not: 'completed' }
        },
        include: {
          subtasks: true
        },
        take: 3
      });

      if (overdueTasks.length > 0) {
        console.log(`⚠️ Sending overdue alert to ${user.name} (${overdueTasks.length} overdue tasks)...`);
        
        await sendEmailNotification({
          userId: user.id,
          type: 'task_overdue',
          overdueData: overdueTasks.map(task => ({
            title: task.title,
            deadline: task.deadline,
            status: task.status,
            subtasks: task.subtasks.map(subtask => ({
              title: subtask.title,
              status: subtask.status,
              priority: subtask.priority,
              deadline: subtask.deadline
            }))
          }))
        });
        console.log(`✅ Overdue alert sent to ${user.name}`);
      } else {
        console.log(`✅ No overdue tasks for ${user.name}`);
      }

    } catch (error: any) {
      console.log(`❌ Failed to send overdue alert to ${user.name}: ${error.message}`);
    }
    
    console.log(''); // Add spacing between users
  }

  console.log('🎉 Comprehensive Email Test Completed!');
  console.log('\n📋 Summary:');
  console.log(`- Tested ${users.length} users with real data`);
  console.log('- Sent role-specific notifications (Admin, Manager, Employee)');
  console.log('- Sent task-specific notifications with actual task data');
  console.log('- Sent overdue alerts for users with overdue tasks');
  console.log('- All emails include professional Word document attachments');
  console.log('\n💡 Check all user email inboxes to verify the Word document attachments!');
  console.log('\n📊 Email Types Sent:');
  console.log('- General notifications (Admins)');
  console.log('- Manager team summaries (Managers)');
  console.log('- Daily progress reports (Employees)');
  console.log('- Task assignment notifications');
  console.log('- Task completion notifications');
  console.log('- Overdue task alerts');
}

testAllUsersWithRealData()
  .catch(e => {
    console.error('Unhandled error during comprehensive email test:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
