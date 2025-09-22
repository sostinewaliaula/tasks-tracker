import express from 'express';
import { sendUserDailyReport, sendManagerDailySummary, sendWeeklyReport, sendThursdayReport } from '../lib/reporting';

const router = express.Router();

// POST /api/reports/test - trigger a report manually
router.post('/test', async (req, res) => {
  const { type } = req.body;
  try {
    if (type === 'user-daily') await sendUserDailyReport();
    else if (type === 'manager-daily') await sendManagerDailySummary();
    else if (type === 'weekly') await sendWeeklyReport();
    else if (type === 'thursday') await sendThursdayReport();
    else return res.status(400).json({ error: 'Invalid type' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
