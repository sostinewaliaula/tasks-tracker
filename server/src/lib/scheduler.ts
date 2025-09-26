import '../loadEnv';
import cron from 'node-cron';
import { sendUserDailyReport, sendManagerDailySummary, sendWeeklyReport, sendThursdayReport } from './reporting';
import { sendDailyProgressEmails, sendManagerSummaryEmails, sendWeeklyReports, sendOverdueTasksReports, sendDeadlineReminders, sendFridayMorningReport, sendFridayAfternoonReport } from './scheduledNotifications';
import { DateTime } from 'luxon';

// Nairobi time zone
const NAIROBI_TZ = 'Africa/Nairobi';

// Daily user progress report (Mon-Fri, 8pm Nairobi)
cron.schedule('0 20 * * 1-5', async () => {
  await sendUserDailyReport();
  await sendDailyProgressEmails();
}, { timezone: NAIROBI_TZ });

// Daily manager summary (Mon-Fri, 8pm Nairobi)
cron.schedule('0 20 * * 1-5', async () => {
  await sendManagerDailySummary();
  await sendManagerSummaryEmails();
}, { timezone: NAIROBI_TZ });

// Wednesday 9am report
cron.schedule('0 9 * * 3', async () => {
  await sendWeeklyReport();
  await sendWeeklyReports();
}, { timezone: NAIROBI_TZ });

// Thursday 4:30pm report (with overdue)
cron.schedule('30 16 * * 4', async () => {
  await sendThursdayReport();
  await sendOverdueTasksReports();
}, { timezone: NAIROBI_TZ });

// Daily deadline reminders (9am Nairobi)
cron.schedule('0 9 * * *', async () => {
  await sendDeadlineReminders();
}, { timezone: NAIROBI_TZ });

// Friday morning weekly status report (9am Nairobi)
cron.schedule('0 9 * * 5', async () => {
  await sendFridayMorningReport();
}, { timezone: NAIROBI_TZ });

// Friday afternoon weekly wrap-up report (5:20pm Nairobi)
cron.schedule('20 17 * * 5', async () => {
  await sendFridayAfternoonReport();
}, { timezone: NAIROBI_TZ });
