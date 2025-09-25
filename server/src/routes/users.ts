import express from 'express';
import { authMiddleware, roleCheck } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Users list with optional search - accessible by admin and manager roles
router.get('/', authMiddleware, roleCheck(['admin', 'manager']), async (req, res) => {
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
                        eligibleManager ? { role: { in: ['manager', 'admin'] } } : undefined,
                      ].filter(Boolean) as any,
                  }
                : role
                ? { role: role as any }
                : eligibleManager
                ? { role: { in: ['manager', 'admin'] } }
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

// Update user role to manager
router.patch('/:id/role', authMiddleware, roleCheck(['admin']), async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { role } = req.body;
        
        if (!role || !['admin', 'manager', 'employee'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        
        const user = await prisma.user.update({
            where: { id: userId },
            data: { role: role as any },
            select: { id: true, name: true, email: true, role: true, departmentId: true }
        });
        
        res.json({ data: user });
    } catch (e) {
        console.error('Update user role error:', e);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// Assign user to department
router.patch('/:id/department', authMiddleware, roleCheck(['admin', 'manager']), async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { departmentId } = req.body;
        
        const user = await prisma.user.update({
            where: { id: userId },
            data: { departmentId: departmentId ? parseInt(departmentId) : null },
            select: { id: true, name: true, email: true, role: true, departmentId: true }
        });
        
        res.json({ data: user });
    } catch (e) {
        console.error('Update user department error:', e);
        res.status(500).json({ error: 'Failed to update user department' });
    }
});

export default router;


