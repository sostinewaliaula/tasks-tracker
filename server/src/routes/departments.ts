import express from 'express';
import { authMiddleware, roleCheck } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { syncUserRolesWithDepartments, validateRoleConsistency } from '../lib/roleSync';

const router = express.Router();

// Require authentication for all department routes
router.use(authMiddleware);

// List departments as a tree
router.get('/', async (req, res) => {
    try {
        const user = (req as any).user;
        
        // If user is admin, return all departments
        if (user.role === 'admin') {
        const departments = await prisma.department.findMany({
            where: { parentId: null },
            include: {
                manager: { select: { id: true, name: true } },
                users: { select: { id: true, name: true, role: true } },
                children: {
                    include: {
                        manager: { select: { id: true, name: true } },
                        users: { select: { id: true, name: true, role: true } },
                        children: {
                            include: {
                                manager: { select: { id: true, name: true } },
                                users: { select: { id: true, name: true, role: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
            return res.json({ data: departments });
        }
        
        // If user is manager, return only their managed department
        if (user.role === 'manager') {
            const department = await prisma.department.findFirst({
                where: { managerId: user.id },
                include: {
                    manager: { select: { id: true, name: true } },
                    users: { select: { id: true, name: true, role: true } },
                    children: {
                        include: {
                            manager: { select: { id: true, name: true } },
                            users: { select: { id: true, name: true, role: true } },
                        },
                    },
                },
            });
            
            if (!department) {
                return res.json({ data: [] });
            }
            
            // Return as array to maintain consistency with admin response
            return res.json({ data: [department] });
        }
        
        // If user is employee, return empty array
        res.json({ data: [] });
    } catch (e) {
        console.error('Departments list error:', e);
        res.status(500).json({ error: 'Failed to load departments' });
    }
});

// Create primary or sub-department (optional manager) - Admin only
router.post('/', roleCheck(['admin']), async (req, res) => {
    const { name, parentId, managerId } = req.body || {};
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Name is required' });
    }
    try {
        // Ensure manager is not already assigned elsewhere
        if (managerId) {
            const existing = await prisma.department.findFirst({ where: { managerId: Number(managerId) } });
            if (existing) {
                return res.status(400).json({ error: 'Selected manager is already assigned to another department' });
            }
        }
        const result = await prisma.$transaction(async (tx) => {
            const department = await tx.department.create({
                data: {
                    name: name.trim(),
                    parentId: parentId ?? null,
                    managerId: managerId ? Number(managerId) : null,
                },
            });
            if (managerId) {
                await tx.user.update({ where: { id: Number(managerId) }, data: { role: 'manager', departmentId: department.id } });
            }
            return department;
        });
        res.status(201).json({ data: result });
    } catch (e: any) {
        if (e?.code === 'P2002') {
            return res.status(409).json({ error: 'A department with this name already exists at this level' });
        }
        console.error('Department create error:', e);
        res.status(500).json({ error: 'Failed to create department' });
    }
});

// Update department (name and/or parent and/or manager)
router.put('/:id', roleCheck(['admin']), async (req, res) => {
    const id = Number(req.params.id);
    const { name, parentId, managerId } = req.body || {};
    if (!Number.isFinite(id)) {
        return res.status(400).json({ error: 'Invalid id' });
    }
    try {
        if (managerId !== undefined && managerId !== null) {
            const existing = await prisma.department.findFirst({ where: { managerId: Number(managerId), NOT: { id } } });
            if (existing) {
                return res.status(400).json({ error: 'Selected manager is already assigned to another department' });
            }
        }
        const department = await prisma.department.findUnique({ where: { id } });
        const updated = await prisma.$transaction(async (tx) => {
            // Get the current department to check for existing manager
            const currentDept = await tx.department.findUnique({ 
                where: { id }, 
                select: { managerId: true } 
            });
            
            const dep = await tx.department.update({
                where: { id },
                data: {
                    name: typeof name === 'string' ? name.trim() : undefined,
                    parentId: parentId === undefined ? undefined : parentId,
                    managerId: managerId === undefined ? undefined : (managerId === null ? null : Number(managerId)),
                },
            });
            
            // Handle manager assignment/removal/reassignment
            if (managerId) {
                // If there was a previous manager, demote them to employee
                if (currentDept?.managerId && currentDept.managerId !== Number(managerId)) {
                    await tx.user.update({ 
                        where: { id: currentDept.managerId }, 
                        data: { role: 'employee' } 
                    });
                }
                
                // Assign new manager
                await tx.user.update({ 
                    where: { id: Number(managerId) }, 
                    data: { role: 'manager', departmentId: dep.id } 
                });
            } else if (managerId === null && currentDept?.managerId) {
                // Remove existing manager - change their role back to employee
                await tx.user.update({ 
                    where: { id: currentDept.managerId }, 
                    data: { role: 'employee' } 
                });
            }
            
            return dep;
        });
        res.json({ data: updated });
    } catch (e: any) {
        if (e?.code === 'P2002') {
            return res.status(409).json({ error: 'A department with this name already exists at this level' });
        }
        console.error('Department update error:', e);
        res.status(500).json({ error: 'Failed to update department' });
    }
});

// Delete department (and optionally cascade handled by DB relations if set)
router.delete('/:id', roleCheck(['admin']), async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        return res.status(400).json({ error: 'Invalid id' });
    }
    try {
        // Get the department and its manager before deletion
        const department = await prisma.department.findUnique({
            where: { id },
            select: { managerId: true }
        });
        
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
        
        // Delete department and demote manager if exists
        await prisma.$transaction(async (tx) => {
            // Demote manager to employee if they exist
            if (department?.managerId) {
                await tx.user.update({
                    where: { id: department.managerId },
                    data: { role: 'employee' }
                });
            }
            
            // Delete the department
            await tx.department.delete({ where: { id } });
        });
        
        res.status(204).send();
    } catch (e) {
        console.error('Department delete error:', e);
        res.status(500).json({ error: 'Failed to delete department' });
    }
});

// Assign a user to a department by id, ldapUid or email
router.post('/:id/users', roleCheck(['admin']), async (req, res) => {
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

// Get department members (including manager)
router.get('/:id/members', roleCheck(['admin', 'manager']), async (req, res) => {
    const departmentId = Number(req.params.id);
    if (!Number.isFinite(departmentId)) {
        return res.status(400).json({ error: 'Invalid department id' });
    }
    
    try {
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: {
                manager: { select: { id: true, name: true, email: true, role: true } },
                users: { select: { id: true, name: true, email: true, role: true } },
            },
        });
        
        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }
        
        // Combine manager and users into a single members array
        const members = [];
        
        // Add manager if exists
        if (department.manager) {
            members.push({
                ...department.manager,
                isManager: true,
            });
        }
        
        // Add regular users (excluding manager if they're also in users list)
        const regularUsers = department.users.filter(user => 
            !department.manager || user.id !== department.manager.id
        );
        
        members.push(...regularUsers.map(user => ({
            ...user,
            isManager: false,
        })));
        
        res.json({ 
            data: {
                department: {
                    id: department.id,
                    name: department.name,
                    parentId: department.parentId,
                },
                members,
                totalMembers: members.length,
            }
        });
    } catch (e) {
        console.error('Get department members error:', e);
        res.status(500).json({ error: 'Failed to load department members' });
    }
});

// Get department task statistics
router.get('/:id/stats', authMiddleware, roleCheck(['admin', 'manager']), async (req, res) => {
    try {
        const departmentId = parseInt(req.params.id);
        console.log('Fetching stats for department ID:', departmentId);
        
        // Get department with all users (including manager)
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: {
                manager: {
                    select: { id: true, name: true }
                },
                users: {
                    select: { id: true, name: true }
                }
            }
        });
        
        console.log('Department found:', department);
        
        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }
        
        // Get all user IDs in this department
        const userIds = [];
        if (department.manager) {
            userIds.push(department.manager.id);
        }
        department.users.forEach(user => {
            if (!userIds.includes(user.id)) {
                userIds.push(user.id);
            }
        });
        
        if (userIds.length === 0) {
            return res.json({
                data: {
                    department: {
                        id: department.id,
                        name: department.name
                    },
                    stats: {
                        totalTasks: 0,
                        todo: 0,
                        inProgress: 0,
                        completed: 0,
                        blocker: 0,
                        high: 0,
                        medium: 0,
                        low: 0,
                        overdue: 0,
                        completionRate: 0,
                        totalUsers: 0
                    }
                }
            });
        }
        
        // Get all tasks for users in this department
        console.log('User IDs for tasks query:', userIds);
        const tasks = await prisma.task.findMany({
            where: {
                createdById: {
                    in: userIds
                }
            },
            include: {
                subtasks: {
                    select: {
                        id: true,
                        status: true,
                        priority: true,
                        deadline: true,
                        createdAt: true
                    }
                }
            }
        });
        
        console.log('Tasks found:', tasks.length);
        
        // Calculate statistics
        const now = new Date();
        let totalTasks = tasks.length;
        let todo = 0;
        let inProgress = 0;
        let completed = 0;
        let blocker = 0;
        let high = 0;
        let medium = 0;
        let low = 0;
        let overdue = 0;
        
        // Process main tasks
        tasks.forEach(task => {
            // Status counts
            if (task.status === 'todo') todo++;
            else if (task.status === 'in-progress') inProgress++;
            else if (task.status === 'completed') {
                completed++;
            }
            else if (task.status === 'blocker') blocker++;
            
            // Priority counts
            if (task.priority === 'high') high++;
            else if (task.priority === 'medium') medium++;
            else if (task.priority === 'low') low++;
            
            // Overdue check
            if (task.status !== 'completed' && new Date(task.deadline) < now) {
                overdue++;
            }
            
            // Process subtasks
            if (task.subtasks) {
                task.subtasks.forEach(subtask => {
                    totalTasks++;
                    
                    if (subtask.status === 'todo') todo++;
                    else if (subtask.status === 'in-progress') inProgress++;
                    else if (subtask.status === 'completed') {
                        completed++;
                    }
                    else if (subtask.status === 'blocker') blocker++;
                    
                    if (subtask.priority === 'high') high++;
                    else if (subtask.priority === 'medium') medium++;
                    else if (subtask.priority === 'low') low++;
                    
                    if (subtask.status !== 'completed' && new Date(subtask.deadline) < now) {
                        overdue++;
                    }
                });
            }
        });
        
        const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
        
        res.json({
            data: {
                department: {
                    id: department.id,
                    name: department.name
                },
                stats: {
                    totalTasks,
                    todo,
                    inProgress,
                    completed,
                    blocker,
                    high,
                    medium,
                    low,
                    overdue,
                    completionRate,
                    totalUsers: userIds.length
                }
            }
        });
    } catch (e) {
        console.error('Get department stats error:', e);
        console.error('Error details:', JSON.stringify(e, null, 2));
        res.status(500).json({ error: 'Failed to fetch department statistics', details: e.message });
    }
});

// Sync user roles with department manager assignments
router.post('/sync-roles', roleCheck(['admin']), async (_req, res) => {
    try {
        const result = await syncUserRolesWithDepartments();
        res.json({ 
            message: 'Role synchronization completed successfully',
            data: result
        });
    } catch (error) {
        console.error('Role sync error:', error);
        res.status(500).json({ error: 'Failed to synchronize roles' });
    }
});

// Check role consistency
router.get('/check-consistency', roleCheck(['admin']), async (_req, res) => {
    try {
        const result = await validateRoleConsistency();
        res.json({ 
            data: result
        });
    } catch (error) {
        console.error('Role consistency check error:', error);
        res.status(500).json({ error: 'Failed to check role consistency' });
    }
});

export default router;


