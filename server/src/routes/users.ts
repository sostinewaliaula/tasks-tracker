import express from 'express';
import { authMiddleware, roleCheck } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Admin-only users list with optional search
router.get('/', authMiddleware, roleCheck(['admin']), async (req, res) => {
    try {
        const q = String(req.query.q || '').trim();
        const users = await prisma.user.findMany({
            where: q
                ? {
                      OR: [
                          { name: { contains: q } },
                          { email: q ? { contains: q } : undefined },
                          { ldapUid: { contains: q } },
                      ].filter(Boolean) as any,
                  }
                : undefined,
            select: { id: true, name: true, email: true, ldapUid: true, departmentId: true, role: true },
            orderBy: { name: 'asc' },
            take: 200,
        });
        res.json({ data: users });
    } catch (e) {
        console.error('Users list error:', e);
        res.status(500).json({ error: 'Failed to load users' });
    }
});

export default router;


