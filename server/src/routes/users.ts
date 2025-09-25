import express from 'express';
import { authMiddleware, roleCheck } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { syncUserRolesWithDepartments } from '../lib/roleSync';

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
        
        // Check if user is currently managing any department
        const currentDepartments = await prisma.department.findMany({
            where: { managerId: userId },
            select: { id: true, name: true }
        });
        
        const user = await prisma.user.update({
            where: { id: userId },
            data: { role: role as any },
            select: { id: true, name: true, email: true, role: true, departmentId: true }
        });
        
        // If changing from manager to employee and user manages departments, remove them as manager
        if (role === 'employee' && currentDepartments.length > 0) {
            await prisma.department.updateMany({
                where: { managerId: userId },
                data: { managerId: null }
            });
            console.log(`Removed user ${user.name} as manager from ${currentDepartments.length} department(s)`);
        }
        
        // If changing to manager role, ensure they're not managing any department (they need to be assigned)
        if (role === 'manager' && currentDepartments.length === 0) {
            console.log(`User ${user.name} has manager role but doesn't manage any department`);
        }
        
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
        
        console.log('Update user department request:', { userId, departmentId, body: req.body });
        
        // Validate userId
        if (!userId || isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true }
        });
        
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // If departmentId is provided, validate it exists
        if (departmentId) {
            const department = await prisma.department.findUnique({
                where: { id: parseInt(departmentId) },
                select: { id: true, name: true }
            });
            
            if (!department) {
                return res.status(404).json({ error: 'Department not found' });
            }
        }
        
        const user = await prisma.user.update({
            where: { id: userId },
            data: { departmentId: departmentId ? parseInt(departmentId) : null },
            select: { id: true, name: true, email: true, role: true, departmentId: true }
        });
        
        console.log('User department updated successfully:', user);
        res.json({ data: user });
    } catch (e) {
        console.error('Update user department error:', e);
        res.status(500).json({ error: 'Failed to update user department' });
    }
});

export default router;


