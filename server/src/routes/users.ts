import express from 'express';
import { authMiddleware, roleCheck } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Admin-only users list with optional search
router.get('/', authMiddleware, roleCheck(['admin']), async (req, res) => {
    try {
        const q = String(req.query.q || '').trim();
        const role = String(req.query.role || '').trim();
        const eligibleManager = String(req.query.eligibleManager || '').trim().toLowerCase() === 'true';
        const users = await prisma.user.findMany({
            where: q || role || eligibleManager
                ? {
                      OR: [
                          q ? { name: { contains: q } } : undefined,
                          q ? { email: { contains: q } } : undefined,
                          q ? { ldapUid: { contains: q } } : undefined,
                      ].filter(Boolean) as any,
                      AND: [
                        role ? { role: role as any } : undefined,
                        eligibleManager ? { managingDepartments: { none: {} } } : undefined,
                      ].filter(Boolean) as any,
                  }
                : role
                ? { role: role as any }
                : eligibleManager
                ? { managingDepartments: { none: {} } }
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


