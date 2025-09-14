import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/login', authenticate);

export default router;