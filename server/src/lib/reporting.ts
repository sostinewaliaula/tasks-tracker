import '../loadEnv';
import { prisma } from './prisma';
import { sendMail } from './mailer';
import { DateTime } from 'luxon';

function formatTaskList(tasks: any[], status: string) {
  if (!tasks.length) return '<p>None</p>';
  return `<ul>${tasks.map(task => `
    <li><b>${task.title}</b> (Deadline: ${DateTime.fromJSDate(task.deadline).setZone('Africa/Nairobi').toFormat('dd LLL yyyy, HH:mm')})
      ${status === 'blocker' && task.blockerReason ? `<br/><i>Blocker Reason:</i> ${task.blockerReason}` : ''}
      ${task.subtasks && task.subtasks.length ? `<ul>${task.subtasks.map((sub: any) => `<li>${sub.title}</li>`).join('')}</ul>` : ''}
    </li>`).join('')}</ul>`;
}

export async function sendUserDailyReport() {
  const today = DateTime.now().setZone('Africa/Nairobi');
  const start = today.startOf('day').toJSDate();
  const end = today.endOf('day').toJSDate();

  const users = await prisma.user.findMany({ where: { email: { not: null } } });
  for (const user of users) {
    const tasks = await prisma.task.findMany({
      where: {
        createdById: user.id,
        updatedAt: { gte: start, lte: end },
      },
      include: { subtasks: true },
    });
    const completed = tasks.filter(t => t.status === 'completed');
    const pending = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
    const blockers = tasks.filter(t => t.status === 'blocker');

    const html = `
      <p>Hello, ${user.name},</p>
      <p>Here is your daily task progress report for ${today.toFormat('cccc, dd LLL yyyy')}:</p>
      <ul>
        <li><b>Completed/Closed tasks:</b> ${completed.length}</li>
        <li><b>Pending tasks:</b> ${pending.length}</li>
        <li><b>Blockers:</b> ${blockers.length}</li>
      </ul>
      <h4>Completed/Closed</h4>
      ${formatTaskList(completed, 'completed')}
      <h4>Pending</h4>
      ${formatTaskList(pending, 'pending')}
      <h4>Blockers</h4>
      ${formatTaskList(blockers, 'blocker')}
      <p>Keep up the good work!</p>
    `;
    if (user.email) {
      await sendMail({
        to: user.email,
        subject: 'Your Daily Task Progress Report',
        html,
      });
    }
  }
}

export async function sendManagerDailySummary() {
  const today = DateTime.now().setZone('Africa/Nairobi');
  const start = today.startOf('day').toJSDate();
  const end = today.endOf('day').toJSDate();

  // Get all departments with a manager
  const departments = await prisma.department.findMany({
    where: { managerId: { not: null } },
    include: {
      manager: true,
      users: true,
    },
  });

  for (const dept of departments) {
    if (!dept.manager?.email) continue;
    let html = `<p>Hello, ${dept.manager.name},</p>
      <p>Here is the daily completed tasks summary for your team (${today.toFormat('cccc, dd LLL yyyy')}):</p>`;
    for (const user of dept.users) {
      const completed = await prisma.task.findMany({
        where: {
          createdById: user.id,
          status: 'completed',
          updatedAt: { gte: start, lte: end },
        },
        include: { subtasks: true },
      });
      html += `<h4>${user.name} (${completed.length} completed)</h4>`;
      html += formatTaskList(completed, 'completed');
    }
    html += '<p>Thank you for supporting your team!</p>';
    await sendMail({
      to: dept.manager.email,
      subject: 'Daily Completed Tasks Summary for Your Team',
      html,
    });
  }
}

export async function sendWeeklyReport() {
  const now = DateTime.now().setZone('Africa/Nairobi');
  const weekStart = now.startOf('week').toJSDate();
  const weekEnd = now.endOf('week').toJSDate();

  const users = await prisma.user.findMany({ where: { email: { not: null } } });
  for (const user of users) {
    const tasks = await prisma.task.findMany({
      where: {
        createdById: user.id,
        updatedAt: { gte: weekStart, lte: weekEnd },
      },
      include: { subtasks: true },
    });
    const completed = tasks.filter(t => t.status === 'completed');
    const pending = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
    const blockers = tasks.filter(t => t.status === 'blocker');

    const html = `
      <p>Hello, ${user.name},</p>
      <p>Here is your weekly progress report for the week of ${DateTime.fromJSDate(weekStart).toFormat('dd LLL')} - ${DateTime.fromJSDate(weekEnd).toFormat('dd LLL yyyy')}:</p>
      <ul>
        <li><b>Completed/Closed tasks:</b> ${completed.length}</li>
        <li><b>Pending tasks:</b> ${pending.length}</li>
        <li><b>Blockers:</b> ${blockers.length}</li>
      </ul>
      <h4>Completed/Closed</h4>
      ${formatTaskList(completed, 'completed')}
      <h4>Pending</h4>
      ${formatTaskList(pending, 'pending')}
      <h4>Blockers</h4>
      ${formatTaskList(blockers, 'blocker')}
      <p>Keep up the great work this week!</p>
    `;
    if (user.email) {
      await sendMail({
        to: user.email,
        subject: 'Weekly Progress Report',
        html,
      });
    }
  }
}

export async function sendThursdayReport() {
  const now = DateTime.now().setZone('Africa/Nairobi');
  const weekStart = now.startOf('week').toJSDate();
  const weekEnd = now.endOf('week').toJSDate();

  const users = await prisma.user.findMany({ where: { email: { not: null } } });
  for (const user of users) {
    const tasks = await prisma.task.findMany({
      where: {
        createdById: user.id,
        updatedAt: { gte: weekStart, lte: weekEnd },
      },
      include: { subtasks: true },
    });
    const completed = tasks.filter(t => t.status === 'completed');
    const pending = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
    const blockers = tasks.filter(t => t.status === 'blocker');
    const overdue = await prisma.task.findMany({
      where: {
        createdById: user.id,
        status: { not: 'completed' },
        deadline: { lt: now.toJSDate() },
      },
      include: { subtasks: true },
    });

    const html = `
      <p>Hello, ${user.name},</p>
      <p>Here is your Thursday progress and overdue tasks report for the week of ${DateTime.fromJSDate(weekStart).toFormat('dd LLL')} - ${DateTime.fromJSDate(weekEnd).toFormat('dd LLL yyyy')}:</p>
      <ul>
        <li><b>Completed/Closed tasks:</b> ${completed.length}</li>
        <li><b>Pending tasks:</b> ${pending.length}</li>
        <li><b>Blockers:</b> ${blockers.length}</li>
        <li><b>Overdue tasks:</b> ${overdue.length}</li>
      </ul>
      <h4>Completed/Closed</h4>
      ${formatTaskList(completed, 'completed')}
      <h4>Pending</h4>
      ${formatTaskList(pending, 'pending')}
      <h4>Blockers</h4>
      ${formatTaskList(blockers, 'blocker')}
      <h4>Overdue Tasks (to be worked on next week)</h4>
      ${formatTaskList(overdue, 'overdue')}
      <p>Let's focus on closing out overdue tasks next week!</p>
    `;
    if (user.email) {
      await sendMail({
        to: user.email,
        subject: 'Thursday Progress & Overdue Tasks Report',
        html,
      });
    }
  }
}
