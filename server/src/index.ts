import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import { authMiddleware } from './middleware/auth';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
});

app.use('/api/auth', authRouter);

app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ user: (req as any).user });
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});



