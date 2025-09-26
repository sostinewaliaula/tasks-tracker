import './loadEnv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendMail } from './lib/mailer';
import './lib/scheduler';
import reportsRouter from './routes/reports';
import { prisma } from './lib/prisma';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import departmentsRouter from './routes/departments';
import usersRouter from './routes/users';
import tasksRouter from './routes/tasks';
import userRouter from './routes/user';
import notificationsRouter from './routes/notifications';
import notificationsSSERouter from './routes/notifications-sse';
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
app.use('/api/user', userRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/notifications', notificationsSSERouter);

app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: (req as any).user.id },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ 
            user: {
                id: user.id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                department_id: user.departmentId?.toString() || '',
                department: user.department?.name || '',
                ldap_uid: user.ldapUid,
                phone: user.phone,
                bio: user.bio,
                language: user.language,
                timezone: user.timezone,
                darkMode: user.darkMode,
                emailNotifications: user.emailNotifications,
                taskAssigned: user.taskAssigned,
                taskCompleted: user.taskCompleted,
                taskOverdue: user.taskOverdue,
                taskDeadline: user.taskDeadline,
                weeklyReport: user.weeklyReport,
                showEmail: user.showEmail,
                showPhone: user.showPhone,
                showBio: user.showBio
            }
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
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



