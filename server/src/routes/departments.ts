import express from 'express';
import { authMiddleware, roleCheck } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Require admin for all department routes
router.use(authMiddleware, roleCheck(['admin']));

// List departments as a tree
router.get('/', async (_req, res) => {
    try {
        const departments = await prisma.department.findMany({
            where: { parentId: null },
            include: {
                children: {
                    include: {
                        children: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        res.json({ data: departments });
    } catch (e) {
        console.error('Departments list error:', e);
        res.status(500).json({ error: 'Failed to load departments' });
    }
});

// Create primary or sub-department
router.post('/', async (req, res) => {
    const { name, parentId } = req.body || {};
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Name is required' });
    }
    try {
        const department = await prisma.department.create({
            data: { name: name.trim(), parentId: parentId ?? null },
        });
        res.status(201).json({ data: department });
    } catch (e: any) {
        if (e?.code === 'P2002') {
            return res.status(409).json({ error: 'A department with this name already exists at this level' });
        }
        console.error('Department create error:', e);
        res.status(500).json({ error: 'Failed to create department' });
    }
});

// Update department (name and/or parent)
router.put('/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { name, parentId } = req.body || {};
    if (!Number.isFinite(id)) {
        return res.status(400).json({ error: 'Invalid id' });
    }
    try {
        const department = await prisma.department.update({
            where: { id },
            data: {
                name: typeof name === 'string' ? name.trim() : undefined,
                parentId: parentId === undefined ? undefined : parentId,
            },
        });
        res.json({ data: department });
    } catch (e: any) {
        if (e?.code === 'P2002') {
            return res.status(409).json({ error: 'A department with this name already exists at this level' });
        }
        console.error('Department update error:', e);
        res.status(500).json({ error: 'Failed to update department' });
    }
});

// Delete department (and optionally cascade handled by DB relations if set)
router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        return res.status(400).json({ error: 'Invalid id' });
    }
    try {
        // Ensure no children exist before delete for safety
        const childrenCount = await prisma.department.count({ where: { parentId: id } });
        if (childrenCount > 0) {
            return res.status(400).json({ error: 'Delete or reassign sub-departments first' });
        }
        // Ensure no users attached (optional business rule)
        const usersCount = await prisma.user.count({ where: { departmentId: id } });
        if (usersCount > 0) {
            return res.status(400).json({ error: 'Reassign users from this department before deletion' });
        }
        await prisma.department.delete({ where: { id } });
        res.status(204).send();
    } catch (e) {
        console.error('Department delete error:', e);
        res.status(500).json({ error: 'Failed to delete department' });
    }
});

// Assign a user to a department by id, ldapUid or email
router.post('/:id/users', async (req, res) => {
    const departmentId = Number(req.params.id);
    const { userId, ldapUid, email } = req.body || {};
    if (!Number.isFinite(departmentId)) {
        return res.status(400).json({ error: 'Invalid department id' });
    }
    if (!userId && !ldapUid && !email) {
        return res.status(400).json({ error: 'Provide userId, ldapUid or email' });
    }
    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    userId ? { id: Number(userId) || -1 } : undefined,
                    ldapUid ? { ldapUid: String(ldapUid) } : undefined,
                    email ? { email: String(email) } : undefined,
                ].filter(Boolean) as any,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { departmentId },
        });

        res.status(200).json({ data: updated });
    } catch (e) {
        console.error('Assign user to department error:', e);
        res.status(500).json({ error: 'Failed to assign user to department' });
    }
});

export default router;


