import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server/.env first (backend-specific), then fallback to project root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import departmentsRouter from './routes/departments';
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

app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ user: (req as any).user });
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});



