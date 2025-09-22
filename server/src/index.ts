import './loadEnv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendMail } from './lib/mailer';
import './lib/scheduler';
import reportsRouter from './routes/reports';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import departmentsRouter from './routes/departments';
import usersRouter from './routes/users';
import tasksRouter from './routes/tasks';
import { authMiddleware } from './middleware/auth';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/reports', reportsRouter);

app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ user: (req as any).user });
});

app.get('/api/test-email', async (req, res) => {
    try {
        await sendMail({
            to: 'turnquest-infra-monitoring@turnkeyafrica.com',
            subject: 'SMTP Test Email',
            text: 'This is a test email from the tasks-tracker system.',
        });
        res.json({ success: true, message: 'Test email sent.' });
    } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});



