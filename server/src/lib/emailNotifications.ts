import { sendMail } from './mailer';
import { prisma } from './prisma';

export interface EmailNotificationData {
  userId: number;
  type: 'task_completed' | 'task_assigned' | 'task_overdue' | 'task_deadline' | 'general' | 'daily_progress' | 'weekly_report' | 'manager_summary';
  taskData?: {
    id: number;
    title: string;
    description?: string;
    deadline?: Date;
    priority?: string;
    status?: string;
    blockerReason?: string;
    createdBy?: string;
    subtasks?: Array<{
      id: number;
      title: string;
      status: string;
      priority: string;
      deadline: Date;
      blockerReason?: string;
    }>;
  };
  userData?: {
    name: string;
    email: string;
    department?: string;
  };
  managerData?: {
    name: string;
    email: string;
    department: string;
  };
  teamData?: Array<{
    name: string;
    completedTasks: number;
    tasks: Array<{
      title: string;
      deadline: Date;
      subtasks?: Array<{
        title: string;
        status: string;
        priority: string;
        deadline: Date;
      }>;
    }>;
  }>;
  progressData?: {
    completed: number;
    pending: number;
    blockers: number;
    tasks: Array<{
      title: string;
      deadline: Date;
      status: string;
      subtasks?: Array<{
        title: string;
        status: string;
        priority: string;
        deadline: Date;
        blockerReason?: string;
      }>;
    }>;
  };
  overdueData?: Array<{
    title: string;
    deadline: Date;
    status: string;
    subtasks?: Array<{
      title: string;
      status: string;
      priority: string;
      deadline: Date;
    }>;
  }>;
}

export async function sendEmailNotification(data: EmailNotificationData): Promise<boolean> {
  try {
    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        email: true,
        name: true,
        emailNotifications: true,
        taskAssigned: true,
        taskCompleted: true,
        taskOverdue: true,
        taskDeadline: true,
        weeklyReport: true,
        department: {
          select: { name: true }
        }
      }
    });

    if (!user || !user.email || !user.emailNotifications) {
      return false;
    }

    // Check specific notification preferences
    let shouldSend = false;
    switch (data.type) {
      case 'task_assigned':
        shouldSend = user.taskAssigned;
        break;
      case 'task_completed':
        shouldSend = user.taskCompleted;
        break;
      case 'task_overdue':
        shouldSend = user.taskOverdue;
        break;
      case 'task_deadline':
        shouldSend = user.taskDeadline;
        break;
      case 'daily_progress':
      case 'weekly_report':
        shouldSend = user.weeklyReport;
        break;
      default:
        shouldSend = true;
    }

    if (!shouldSend) {
      return false;
    }

    const emailContent = generateEmailContent(data, user);
    
    await sendMail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });

    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}

function generateEmailContent(data: EmailNotificationData, user: any) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const companyName = 'Caava Group';
  
  switch (data.type) {
    case 'task_assigned':
      return generateTaskAssignedEmail(data, user, baseUrl, companyName);
    case 'task_completed':
      return generateTaskCompletedEmail(data, user, baseUrl, companyName);
    case 'task_overdue':
      return generateTaskOverdueEmail(data, user, baseUrl, companyName);
    case 'task_deadline':
      return generateTaskDeadlineEmail(data, user, baseUrl, companyName);
    case 'daily_progress':
      return generateDailyProgressEmail(data, user, baseUrl, companyName);
    case 'weekly_report':
      return generateWeeklyReportEmail(data, user, baseUrl, companyName);
    case 'manager_summary':
      return generateManagerSummaryEmail(data, user, baseUrl, companyName);
    default:
      return generateGeneralEmail(data, user, baseUrl, companyName);
  }
}

function generateTaskAssignedEmail(data: EmailNotificationData, user: any, baseUrl: string, companyName: string) {
  const task = data.taskData!;
  const subject = `New Task Assigned: ${task.title}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #8b5cf6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .task-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .priority-high { border-left: 4px solid #ef4444; }
        .priority-medium { border-left: 4px solid #f59e0b; }
        .priority-low { border-left: 4px solid #10b981; }
        .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 New Task Assigned</h1>
          <p>Hello ${user.name}, you have been assigned a new task!</p>
        </div>
        <div class="content">
          <div class="task-card priority-${task.priority}">
            <h2>${task.title}</h2>
            ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
            <p><strong>Priority:</strong> <span style="text-transform: capitalize;">${task.priority}</span></p>
            <p><strong>Deadline:</strong> ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Not set'}</p>
            <p><strong>Created by:</strong> ${task.createdBy || 'System'}</p>
          </div>
          
          ${task.subtasks && task.subtasks.length > 0 ? `
            <h3>Subtasks:</h3>
            ${task.subtasks.map(subtask => `
              <div class="task-card">
                <h4>${subtask.title}</h4>
                <p><strong>Status:</strong> <span style="text-transform: capitalize;">${subtask.status}</span></p>
                <p><strong>Priority:</strong> <span style="text-transform: capitalize;">${subtask.priority}</span></p>
                <p><strong>Deadline:</strong> ${new Date(subtask.deadline).toLocaleDateString()}</p>
                ${subtask.blockerReason ? `<p><strong>Blocker Reason:</strong> ${subtask.blockerReason}</p>` : ''}
              </div>
            `).join('')}
          ` : ''}
          
          <a href="${baseUrl}/tasks" class="btn">View Task Details</a>
          
          <div class="footer">
            <p>This email was sent from ${companyName} Task Management System</p>
            <p>You can manage your notification preferences in your profile settings.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
New Task Assigned: ${task.title}

Hello ${user.name},

You have been assigned a new task:

Task: ${task.title}
${task.description ? `Description: ${task.description}` : ''}
Priority: ${task.priority}
Deadline: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Not set'}
Created by: ${task.createdBy || 'System'}

${task.subtasks && task.subtasks.length > 0 ? `
Subtasks:
${task.subtasks.map(subtask => `
- ${subtask.title}
  Status: ${subtask.status}
  Priority: ${subtask.priority}
  Deadline: ${new Date(subtask.deadline).toLocaleDateString()}
  ${subtask.blockerReason ? `Blocker Reason: ${subtask.blockerReason}` : ''}
`).join('')}
` : ''}

View task details: ${baseUrl}/tasks

This email was sent from ${companyName} Task Management System.
You can manage your notification preferences in your profile settings.
  `;
  
  return { subject, html, text };
}

function generateTaskCompletedEmail(data: EmailNotificationData, user: any, baseUrl: string, companyName: string) {
  const task = data.taskData!;
  const subject = `Task Completed: ${task.title}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #8b5cf6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .task-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .completed { border-left: 4px solid #10b981; }
        .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Task Completed</h1>
          <p>Great job ${user.name}! A task has been completed.</p>
        </div>
        <div class="content">
          <div class="task-card completed">
            <h2>${task.title}</h2>
            ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
            <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">Completed</span></p>
            <p><strong>Priority:</strong> <span style="text-transform: capitalize;">${task.priority}</span></p>
            <p><strong>Deadline:</strong> ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Not set'}</p>
          </div>
          
          <a href="${baseUrl}/tasks" class="btn">View All Tasks</a>
          
          <div class="footer">
            <p>This email was sent from ${companyName} Task Management System</p>
            <p>You can manage your notification preferences in your profile settings.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Task Completed: ${task.title}

Great job ${user.name}! A task has been completed.

Task: ${task.title}
${task.description ? `Description: ${task.description}` : ''}
Status: Completed
Priority: ${task.priority}
Deadline: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Not set'}

View all tasks: ${baseUrl}/tasks

This email was sent from ${companyName} Task Management System.
You can manage your notification preferences in your profile settings.
  `;
  
  return { subject, html, text };
}

function generateDailyProgressEmail(data: EmailNotificationData, user: any, baseUrl: string, companyName: string) {
  const progress = data.progressData!;
  const subject = `Your Daily Task Progress Report - ${new Date().toLocaleDateString()}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #8b5cf6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat-card { background: white; border-radius: 8px; padding: 16px; text-align: center; flex: 1; margin: 0 8px; }
        .stat-number { font-size: 24px; font-weight: bold; }
        .completed { color: #10b981; }
        .pending { color: #f59e0b; }
        .blockers { color: #ef4444; }
        .task-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Daily Progress Report</h1>
          <p>Hello ${user.name}, here's your task progress for today!</p>
        </div>
        <div class="content">
          <div class="stats">
            <div class="stat-card">
              <div class="stat-number completed">${progress.completed}</div>
              <div>Completed</div>
            </div>
            <div class="stat-card">
              <div class="stat-number pending">${progress.pending}</div>
              <div>Pending</div>
            </div>
            <div class="stat-card">
              <div class="stat-number blockers">${progress.blockers}</div>
              <div>Blockers</div>
            </div>
          </div>
          
          ${progress.tasks.length > 0 ? `
            <h3>Your Tasks:</h3>
            ${progress.tasks.map(task => `
              <div class="task-card">
                <h4>${task.title}</h4>
                <p><strong>Status:</strong> <span style="text-transform: capitalize;">${task.status}</span></p>
                <p><strong>Deadline:</strong> ${new Date(task.deadline).toLocaleDateString()}</p>
                ${task.subtasks && task.subtasks.length > 0 ? `
                  <p><strong>Subtasks:</strong></p>
                  <ul>
                    ${task.subtasks.map(subtask => `
                      <li>${subtask.title} - ${subtask.status} (${subtask.priority} priority)
                        ${subtask.blockerReason ? `<br><em>Blocker: ${subtask.blockerReason}</em>` : ''}
                      </li>
                    `).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          ` : '<p>No tasks found for today.</p>'}
          
          <a href="${baseUrl}/dashboard" class="btn">View Dashboard</a>
          
          <div class="footer">
            <p>This email was sent from ${companyName} Task Management System</p>
            <p>You can manage your notification preferences in your profile settings.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Daily Progress Report - ${new Date().toLocaleDateString()}

Hello ${user.name}, here's your task progress for today!

Summary:
- Completed: ${progress.completed}
- Pending: ${progress.pending}
- Blockers: ${progress.blockers}

${progress.tasks.length > 0 ? `
Your Tasks:
${progress.tasks.map(task => `
- ${task.title}
  Status: ${task.status}
  Deadline: ${new Date(task.deadline).toLocaleDateString()}
  ${task.subtasks && task.subtasks.length > 0 ? `
  Subtasks:
  ${task.subtasks.map(subtask => `
    - ${subtask.title} - ${subtask.status} (${subtask.priority} priority)
      ${subtask.blockerReason ? `Blocker: ${subtask.blockerReason}` : ''}
  `).join('')}
  ` : ''}
`).join('')}
` : 'No tasks found for today.'}

View dashboard: ${baseUrl}/dashboard

This email was sent from ${companyName} Task Management System.
You can manage your notification preferences in your profile settings.
  `;
  
  return { subject, html, text };
}

function generateTaskOverdueEmail(data: EmailNotificationData, user: any, baseUrl: string, companyName: string) {
  const overdue = data.overdueData!;
  const subject = `Overdue Tasks Alert - ${overdue.length} task${overdue.length > 1 ? 's' : ''} need attention`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .task-card { background: white; border: 1px solid #e5e7eb; border-left: 4px solid #ef4444; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Overdue Tasks Alert</h1>
          <p>Hello ${user.name}, you have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} that need attention.</p>
        </div>
        <div class="content">
          ${overdue.map(task => `
            <div class="task-card">
              <h3>${task.title}</h3>
              <p><strong>Status:</strong> <span style="text-transform: capitalize;">${task.status}</span></p>
              <p><strong>Original Deadline:</strong> <span style="color: #ef4444; font-weight: bold;">${new Date(task.deadline).toLocaleDateString()}</span></p>
              ${task.subtasks && task.subtasks.length > 0 ? `
                <p><strong>Subtasks:</strong></p>
                <ul>
                  ${task.subtasks.map(subtask => `
                    <li>${subtask.title} - ${subtask.status} (${subtask.priority} priority)</li>
                  `).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
          
          <a href="${baseUrl}/tasks" class="btn">Update Task Status</a>
          
          <div class="footer">
            <p>This email was sent from ${companyName} Task Management System</p>
            <p>You can manage your notification preferences in your profile settings.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Overdue Tasks Alert

Hello ${user.name}, you have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} that need attention.

${overdue.map(task => `
- ${task.title}
  Status: ${task.status}
  Original Deadline: ${new Date(task.deadline).toLocaleDateString()}
  ${task.subtasks && task.subtasks.length > 0 ? `
  Subtasks:
  ${task.subtasks.map(subtask => `
    - ${subtask.title} - ${subtask.status} (${subtask.priority} priority)
  `).join('')}
  ` : ''}
`).join('')}

Update task status: ${baseUrl}/tasks

This email was sent from ${companyName} Task Management System.
You can manage your notification preferences in your profile settings.
  `;
  
  return { subject, html, text };
}

function generateTaskDeadlineEmail(data: EmailNotificationData, user: any, baseUrl: string, companyName: string) {
  const task = data.taskData!;
  const subject = `Upcoming Deadline: ${task.title}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .task-card { background: white; border: 1px solid #e5e7eb; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Deadline Reminder</h1>
          <p>Hello ${user.name}, you have a task deadline approaching!</p>
        </div>
        <div class="content">
          <div class="task-card">
            <h2>${task.title}</h2>
            ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
            <p><strong>Priority:</strong> <span style="text-transform: capitalize;">${task.priority}</span></p>
            <p><strong>Deadline:</strong> <span style="color: #f59e0b; font-weight: bold;">${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Not set'}</span></p>
            <p><strong>Status:</strong> <span style="text-transform: capitalize;">${task.status}</span></p>
          </div>
          
          <a href="${baseUrl}/tasks" class="btn">View Task Details</a>
          
          <div class="footer">
            <p>This email was sent from ${companyName} Task Management System</p>
            <p>You can manage your notification preferences in your profile settings.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Deadline Reminder: ${task.title}

Hello ${user.name}, you have a task deadline approaching!

Task: ${task.title}
${task.description ? `Description: ${task.description}` : ''}
Priority: ${task.priority}
Deadline: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Not set'}
Status: ${task.status}

View task details: ${baseUrl}/tasks

This email was sent from ${companyName} Task Management System.
You can manage your notification preferences in your profile settings.
  `;
  
  return { subject, html, text };
}

function generateWeeklyReportEmail(data: EmailNotificationData, user: any, baseUrl: string, companyName: string) {
  const progress = data.progressData!;
  const subject = `Weekly Progress Report - Week of ${new Date().toLocaleDateString()}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #8b5cf6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat-card { background: white; border-radius: 8px; padding: 16px; text-align: center; flex: 1; margin: 0 8px; }
        .stat-number { font-size: 24px; font-weight: bold; }
        .completed { color: #10b981; }
        .pending { color: #f59e0b; }
        .blockers { color: #ef4444; }
        .task-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📈 Weekly Progress Report</h1>
          <p>Hello ${user.name}, here's your weekly task summary!</p>
        </div>
        <div class="content">
          <div class="stats">
            <div class="stat-card">
              <div class="stat-number completed">${progress.completed}</div>
              <div>Completed</div>
            </div>
            <div class="stat-card">
              <div class="stat-number pending">${progress.pending}</div>
              <div>Pending</div>
            </div>
            <div class="stat-card">
              <div class="stat-number blockers">${progress.blockers}</div>
              <div>Blockers</div>
            </div>
          </div>
          
          ${progress.tasks.length > 0 ? `
            <h3>This Week's Tasks:</h3>
            ${progress.tasks.map(task => `
              <div class="task-card">
                <h4>${task.title}</h4>
                <p><strong>Status:</strong> <span style="text-transform: capitalize;">${task.status}</span></p>
                <p><strong>Deadline:</strong> ${new Date(task.deadline).toLocaleDateString()}</p>
                ${task.subtasks && task.subtasks.length > 0 ? `
                  <p><strong>Subtasks:</strong></p>
                  <ul>
                    ${task.subtasks.map(subtask => `
                      <li>${subtask.title} - ${subtask.status} (${subtask.priority} priority)
                        ${subtask.blockerReason ? `<br><em>Blocker: ${subtask.blockerReason}</em>` : ''}
                      </li>
                    `).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          ` : '<p>No tasks found for this week.</p>'}
          
          <a href="${baseUrl}/dashboard" class="btn">View Dashboard</a>
          
          <div class="footer">
            <p>This email was sent from ${companyName} Task Management System</p>
            <p>You can manage your notification preferences in your profile settings.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Weekly Progress Report - Week of ${new Date().toLocaleDateString()}

Hello ${user.name}, here's your weekly task summary!

Summary:
- Completed: ${progress.completed}
- Pending: ${progress.pending}
- Blockers: ${progress.blockers}

${progress.tasks.length > 0 ? `
This Week's Tasks:
${progress.tasks.map(task => `
- ${task.title}
  Status: ${task.status}
  Deadline: ${new Date(task.deadline).toLocaleDateString()}
  ${task.subtasks && task.subtasks.length > 0 ? `
  Subtasks:
  ${task.subtasks.map(subtask => `
    - ${subtask.title} - ${subtask.status} (${subtask.priority} priority)
      ${subtask.blockerReason ? `Blocker: ${subtask.blockerReason}` : ''}
  `).join('')}
  ` : ''}
`).join('')}
` : 'No tasks found for this week.'}

View dashboard: ${baseUrl}/dashboard

This email was sent from ${companyName} Task Management System.
You can manage your notification preferences in your profile settings.
  `;
  
  return { subject, html, text };
}

function generateManagerSummaryEmail(data: EmailNotificationData, user: any, baseUrl: string, companyName: string) {
  const team = data.teamData!;
  const subject = `Daily Completed Tasks Summary for Your Team`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #8b5cf6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .team-member { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .task-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin: 8px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👥 Team Summary</h1>
          <p>Hello ${user.name}, here's your team's completed tasks for today!</p>
        </div>
        <div class="content">
          ${team.map(member => `
            <div class="team-member">
              <h3>${member.name}</h3>
              <p><strong>Completed Tasks:</strong> ${member.completedTasks}</p>
              ${member.tasks.length > 0 ? `
                <h4>Completed Tasks:</h4>
                ${member.tasks.map(task => `
                  <div class="task-card">
                    <h5>${task.title}</h5>
                    <p><strong>Deadline:</strong> ${new Date(task.deadline).toLocaleDateString()}</p>
                    ${task.subtasks && task.subtasks.length > 0 ? `
                      <p><strong>Subtasks:</strong></p>
                      <ul>
                        ${task.subtasks.map(subtask => `
                          <li>${subtask.title} - ${subtask.status} (${subtask.priority} priority)</li>
                        `).join('')}
                      </ul>
                    ` : ''}
                  </div>
                `).join('')}
              ` : '<p>No completed tasks today.</p>'}
            </div>
          `).join('')}
          
          <a href="${baseUrl}/dashboard" class="btn">View Team Dashboard</a>
          
          <div class="footer">
            <p>This email was sent from ${companyName} Task Management System</p>
            <p>You can manage your notification preferences in your profile settings.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Daily Completed Tasks Summary for Your Team

Hello ${user.name}, here's your team's completed tasks for today!

${team.map(member => `
${member.name}:
Completed Tasks: ${member.completedTasks}
${member.tasks.length > 0 ? `
Completed Tasks:
${member.tasks.map(task => `
- ${task.title}
  Deadline: ${new Date(task.deadline).toLocaleDateString()}
  ${task.subtasks && task.subtasks.length > 0 ? `
  Subtasks:
  ${task.subtasks.map(subtask => `
    - ${subtask.title} - ${subtask.status} (${subtask.priority} priority)
  `).join('')}
  ` : ''}
`).join('')}
` : 'No completed tasks today.'}
`).join('')}

View team dashboard: ${baseUrl}/dashboard

This email was sent from ${companyName} Task Management System.
You can manage your notification preferences in your profile settings.
  `;
  
  return { subject, html, text };
}

function generateGeneralEmail(data: EmailNotificationData, user: any, baseUrl: string, companyName: string) {
  const subject = `Notification from ${companyName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #8b5cf6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📢 Notification</h1>
          <p>Hello ${user.name}, you have a new notification!</p>
        </div>
        <div class="content">
          <p>You have received a notification from ${companyName} Task Management System.</p>
          
          <a href="${baseUrl}/notifications" class="btn">View Notifications</a>
          
          <div class="footer">
            <p>This email was sent from ${companyName} Task Management System</p>
            <p>You can manage your notification preferences in your profile settings.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Notification from ${companyName}

Hello ${user.name}, you have a new notification!

You have received a notification from ${companyName} Task Management System.

View notifications: ${baseUrl}/notifications

This email was sent from ${companyName} Task Management System.
You can manage your notification preferences in your profile settings.
  `;
  
  return { subject, html, text };
}
