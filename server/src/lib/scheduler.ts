import '../loadEnv';
import cron from 'node-cron';
import { sendUserDailyReport, sendManagerDailySummary, sendWeeklyReport, sendThursdayReport } from './reporting';
import { DateTime } from 'luxon';

// Nairobi time zone
const NAIROBI_TZ = 'Africa/Nairobi';

// Daily user progress report (Mon-Fri, 8pm Nairobi)
cron.schedule('0 20 * * 1-5', async () => {
  await sendUserDailyReport();
}, { timezone: NAIROBI_TZ });

// Daily manager summary (Mon-Fri, 8pm Nairobi)
cron.schedule('0 20 * * 1-5', async () => {
  await sendManagerDailySummary();
}, { timezone: NAIROBI_TZ });

// Wednesday 9am report
cron.schedule('0 9 * * 3', async () => {
  await sendWeeklyReport();
}, { timezone: NAIROBI_TZ });

// Thursday 4:30pm report (with overdue)
cron.schedule('30 16 * * 4', async () => {
  await sendThursdayReport();
}, { timezone: NAIROBI_TZ });
