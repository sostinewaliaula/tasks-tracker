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

// Get team performance data for a department
router.get('/:id/team-performance', authMiddleware, roleCheck(['admin', 'manager']), async (req, res) => {
    try {
        const departmentId = parseInt(req.params.id);
        const dateFrom = req.query.dateFrom as string;
        const dateTo = req.query.dateTo as string;
        console.log('Fetching team performance for department ID:', departmentId, 'dateFrom:', dateFrom, 'dateTo:', dateTo);
        
        // Get department with all users
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
                    teamMembers: [],
                    dailyActivity: [],
                    performanceMetrics: []
                }
            });
        }
        
        // Get tasks for users in this department
        const dateFilter: any = {
            createdById: {
                in: userIds
            }
        };
        
        if (dateFrom || dateTo) {
            dateFilter.createdAt = {};
            if (dateFrom) {
                dateFilter.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                dateFilter.createdAt.lte = endDate;
            }
        }
        
        const tasks = await prisma.task.findMany({
            where: dateFilter,
            include: {
                subtasks: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        status: true,
                        priority: true,
                        deadline: true,
                        createdAt: true,
                        updatedAt: true,
                        blockerReason: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        
        console.log('Tasks found for team performance:', tasks.length);
        
        // Calculate team member performance
        const teamMembers = userIds.map(userId => {
            const userTasks = tasks.filter(task => task.createdById === userId);
            const completedTasks = userTasks.filter(task => task.status === 'completed');
            const overdueTasks = userTasks.filter(task => {
                const deadline = new Date(task.deadline);
                const now = new Date();
                return deadline < now && task.status !== 'completed';
            });
            
            // Calculate on-time completion rate
            const onTimeTasks = completedTasks.filter(task => {
                const deadline = new Date(task.deadline);
                const completedAt = new Date(task.updatedAt || task.createdAt);
                return completedAt <= deadline;
            });
            
            const onTimeRate = completedTasks.length > 0 ? 
                Math.round((onTimeTasks.length / completedTasks.length) * 100) : 0;
            
            // Calculate efficiency score (combination of completion rate and on-time rate)
            const efficiencyScore = Math.round((onTimeRate + (completedTasks.length * 10)) / 2);
            
            return {
                id: userId,
                name: department.users.find(u => u.id === userId)?.name || 
                      (department.manager?.id === userId ? department.manager.name : `User ${userId}`),
                tasksCompleted: completedTasks.length,
                totalTasks: userTasks.length,
                onTimeRate: Math.min(100, onTimeRate),
                efficiencyScore: Math.min(100, efficiencyScore),
                overdueTasks: overdueTasks.length
            };
        });
        
        // Calculate daily activity for the last 7 days
        const now = new Date();
        const dailyActivity = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            
            const createdOnDay = tasks.filter(task => {
                const createdAt = new Date(task.createdAt);
                return createdAt >= date && createdAt < nextDay;
            }).length;
            
            const completedOnDay = tasks.filter(task => {
                if (task.status !== 'completed') return false;
                const updatedAt = new Date(task.updatedAt || task.createdAt);
                return updatedAt >= date && updatedAt < nextDay;
            }).length;
            
            dailyActivity.push({
                date: date.toISOString().split('T')[0],
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                created: createdOnDay,
                completed: completedOnDay
            });
        }
        
        res.json({
            data: {
                department: {
                    id: department.id,
                    name: department.name
                },
                teamMembers,
                dailyActivity,
                performanceMetrics: {
                    totalTeamMembers: teamMembers.length,
                    averageCompletionRate: teamMembers.length > 0 ? 
                        Math.round(teamMembers.reduce((sum, member) => sum + member.efficiencyScore, 0) / teamMembers.length) : 0,
                    totalTasksCompleted: teamMembers.reduce((sum, member) => sum + member.tasksCompleted, 0),
                    totalOverdueTasks: teamMembers.reduce((sum, member) => sum + member.overdueTasks, 0)
                }
            }
        });
        
    } catch (e) {
        console.error('Get team performance error:', e);
        res.status(500).json({ error: 'Failed to get team performance data' });
    }
});

// Get department trends data
router.get('/:id/trends', authMiddleware, roleCheck(['admin', 'manager']), async (req, res) => {
    try {
        const departmentId = parseInt(req.params.id);
        const timeframe = req.query.timeframe as string || 'week';
        console.log('Fetching trends for department ID:', departmentId, 'timeframe:', timeframe);
        
        // Get department with all users
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
                    trends: [],
                    timeframe
                }
            });
        }
        
        // Get tasks for users in this department
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
                        createdAt: true,
                        updatedAt: true
                    }
                }
            }
        });
        
        console.log('Tasks found for trends:', tasks.length);
        
        const now = new Date();
        let trends = [];
        
        if (timeframe === 'week') {
            // Generate data for the last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                
                const nextDay = new Date(date);
                nextDay.setDate(nextDay.getDate() + 1);
                
                const createdOnDay = tasks.filter(task => {
                    const createdAt = new Date(task.createdAt);
                    return createdAt >= date && createdAt < nextDay;
                }).length;
                
                const completedOnDay = tasks.filter(task => {
                    if (task.status !== 'completed') return false;
                    const updatedAt = new Date(task.updatedAt || task.createdAt);
                    return updatedAt >= date && updatedAt < nextDay;
                }).length;
                
                trends.push({
                    name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    date: date.toISOString().split('T')[0],
                    created: createdOnDay,
                    completed: completedOnDay
                });
            }
        } else if (timeframe === 'month') {
            // Generate data for the last 4 weeks
            for (let i = 3; i >= 0; i--) {
                const weekStart = new Date(now);
                weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 7 * i));
                weekStart.setHours(0, 0, 0, 0);
                
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);
                
                const createdInWeek = tasks.filter(task => {
                    const createdAt = new Date(task.createdAt);
                    return createdAt >= weekStart && createdAt <= weekEnd;
                }).length;
                
                const completedInWeek = tasks.filter(task => {
                    if (task.status !== 'completed') return false;
                    const updatedAt = new Date(task.updatedAt || task.createdAt);
                    return updatedAt >= weekStart && updatedAt <= weekEnd;
                }).length;
                
                trends.push({
                    name: `Week ${4 - i}`,
                    date: weekStart.toISOString().split('T')[0],
                    created: createdInWeek,
                    completed: completedInWeek
                });
            }
        } else if (timeframe === 'quarter') {
            // Generate data for the last 3 months
            for (let i = 2; i >= 0; i--) {
                const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
                monthEnd.setHours(23, 59, 59, 999);
                
                const createdInMonth = tasks.filter(task => {
                    const createdAt = new Date(task.createdAt);
                    return createdAt >= monthStart && createdAt <= monthEnd;
                }).length;
                
                const completedInMonth = tasks.filter(task => {
                    if (task.status !== 'completed') return false;
                    const updatedAt = new Date(task.updatedAt || task.createdAt);
                    return updatedAt >= monthStart && updatedAt <= monthEnd;
                }).length;
                
                trends.push({
                    name: monthStart.toLocaleDateString('en-US', { month: 'short' }),
                    date: monthStart.toISOString().split('T')[0],
                    created: createdInMonth,
                    completed: completedInMonth
                });
            }
        }
        
        res.json({
            data: {
                department: {
                    id: department.id,
                    name: department.name
                },
                trends,
                timeframe,
                summary: {
                    totalCreated: trends.reduce((sum, trend) => sum + trend.created, 0),
                    totalCompleted: trends.reduce((sum, trend) => sum + trend.completed, 0),
                    averageCreated: trends.length > 0 ? Math.round(trends.reduce((sum, trend) => sum + trend.created, 0) / trends.length) : 0,
                    averageCompleted: trends.length > 0 ? Math.round(trends.reduce((sum, trend) => sum + trend.completed, 0) / trends.length) : 0
                }
            }
        });
        
    } catch (e) {
        console.error('Get department trends error:', e);
        res.status(500).json({ error: 'Failed to get department trends data' });
    }
});

// Get department blockers data
router.get('/:id/blockers', authMiddleware, roleCheck(['admin', 'manager']), async (req, res) => {
    try {
        const departmentId = parseInt(req.params.id);
        const dateFrom = req.query.dateFrom as string;
        const dateTo = req.query.dateTo as string;
        console.log('Fetching blockers for department ID:', departmentId, 'dateFrom:', dateFrom, 'dateTo:', dateTo);
        
        // Get department with all users
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
                    blockers: [],
                    analytics: {
                        total: 0,
                        urgent: 0,
                        overdue: 0,
                        longTerm: 0,
                        priorityBreakdown: {},
                        departmentBreakdown: {},
                        ageDistribution: { '0-1d': 0, '1-3d': 0, '3-7d': 0, '7d+': 0 },
                        averageResolutionTime: 0,
                        mainTasks: 0,
                        subtasks: 0
                    }
                }
            });
        }
        
        // Get all tasks for users in this department
        const dateFilter: any = {
            createdById: {
                in: userIds
            }
        };
        
        if (dateFrom || dateTo) {
            dateFilter.createdAt = {};
            if (dateFrom) {
                dateFilter.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                dateFilter.createdAt.lte = endDate;
            }
        }
        
        const tasks = await prisma.task.findMany({
            where: dateFilter,
            include: {
                subtasks: {
                    select: {
                        id: true,
                        status: true,
                        priority: true,
                        deadline: true,
                        createdAt: true,
                        updatedAt: true,
                        blockerReason: true
                    }
                }
            }
        });
        
        console.log('Tasks found for blockers:', tasks.length);
        
        // Find all blockers (main tasks and subtasks)
        const allBlockers = [];
        
        // Main task blockers
        tasks.forEach(task => {
            if (task.status === 'blocker') {
                allBlockers.push({
                    id: task.id,
                    title: task.title,
                    status: task.status,
                    priority: task.priority,
                    deadline: task.deadline,
                    createdAt: task.createdAt,
                    updatedAt: task.updatedAt,
                    blockerReason: task.blockerReason,
                    createdBy: task.createdById,
                    department: department.name,
                    isSubtask: false,
                    parentId: null
                });
            }
            
            // Subtask blockers
            task.subtasks.forEach(subtask => {
                if (subtask.status === 'blocker') {
                    allBlockers.push({
                        id: subtask.id,
                        title: `${task.title} - ${subtask.id}`,
                        status: subtask.status,
                        priority: subtask.priority,
                        deadline: subtask.deadline,
                        createdAt: subtask.createdAt,
                        updatedAt: subtask.updatedAt,
                        blockerReason: subtask.blockerReason,
                        createdBy: task.createdById,
                        department: department.name,
                        isSubtask: true,
                        parentId: task.id
                    });
                }
            });
        });
        
        console.log('Blockers found:', allBlockers.length);
        
        const now = new Date();
        
        // Calculate analytics
        const urgentBlockers = allBlockers.filter(blocker => {
            const days = Math.ceil((new Date(blocker.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return days <= 1 && days >= 0;
        });
        
        const overdueBlockers = allBlockers.filter(blocker => {
            const days = Math.ceil((new Date(blocker.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return days < 0;
        });
        
        const longTermBlockers = allBlockers.filter(blocker => {
            const age = Math.floor((now.getTime() - new Date(blocker.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            return age > 7;
        });
        
        // Priority breakdown
        const priorityBreakdown = allBlockers.reduce((acc, blocker) => {
            acc[blocker.priority] = (acc[blocker.priority] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        // Department breakdown
        const departmentBreakdown = allBlockers.reduce((acc, blocker) => {
            acc[blocker.department] = (acc[blocker.department] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        // Age distribution
        const ageDistribution = allBlockers.reduce((acc, blocker) => {
            const age = Math.floor((now.getTime() - new Date(blocker.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            if (age <= 1) acc['0-1d']++;
            else if (age <= 3) acc['1-3d']++;
            else if (age <= 7) acc['3-7d']++;
            else acc['7d+']++;
            return acc;
        }, { '0-1d': 0, '1-3d': 0, '3-7d': 0, '7d+': 0 });
        
        // Average resolution time
        const averageResolutionTime = allBlockers.length > 0 ? 
            Math.round(allBlockers.reduce((sum, blocker) => {
                const age = Math.floor((now.getTime() - new Date(blocker.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                return sum + age;
            }, 0) / allBlockers.length) : 0;
        
        const analytics = {
            total: allBlockers.length,
            urgent: urgentBlockers.length,
            overdue: overdueBlockers.length,
            longTerm: longTermBlockers.length,
            priorityBreakdown,
            departmentBreakdown,
            ageDistribution,
            averageResolutionTime,
            mainTasks: allBlockers.filter(blocker => !blocker.isSubtask).length,
            subtasks: allBlockers.filter(blocker => blocker.isSubtask).length
        };
        
        res.json({
            data: {
                department: {
                    id: department.id,
                    name: department.name
                },
                blockers: allBlockers,
                analytics
            }
        });
        
    } catch (e) {
        console.error('Get department blockers error:', e);
        res.status(500).json({ error: 'Failed to get department blockers data' });
    }
});

// Get department task statistics
router.get('/:id/stats', authMiddleware, roleCheck(['admin', 'manager']), async (req, res) => {
    try {
        const departmentId = parseInt(req.params.id);
        const timeframe = req.query.timeframe as string || 'week';
        const dateFrom = req.query.dateFrom as string;
        const dateTo = req.query.dateTo as string;
        console.log('Fetching stats for department ID:', departmentId, 'timeframe:', timeframe, 'dateFrom:', dateFrom, 'dateTo:', dateTo);
        
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
        
        // Build date filter
        const dateFilter: any = {
            createdById: {
                in: userIds
            }
        };
        
        if (dateFrom || dateTo) {
            dateFilter.createdAt = {};
            if (dateFrom) {
                dateFilter.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                dateFilter.createdAt.lte = endDate;
            }
        }
        
        const tasks = await prisma.task.findMany({
            where: dateFilter,
            include: {
                subtasks: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        status: true,
                        priority: true,
                        deadline: true,
                        createdAt: true,
                        updatedAt: true,
                        blockerReason: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        
        console.log('Tasks found:', tasks.length);
        console.log('Sample task:', tasks[0]);
        console.log('Tasks with subtasks:', tasks.filter(t => t.subtasks.length > 0).length);
        
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
        
        const responseData = {
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
                },
                tasks: tasks.map(task => ({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    deadline: task.deadline,
                    createdAt: task.createdAt,
                    updatedAt: task.updatedAt,
                    blockerReason: task.blockerReason,
                    createdBy: task.createdBy?.name || 'Unknown',
                    subtasks: task.subtasks.map(subtask => ({
                        id: subtask.id,
                        title: subtask.title,
                        description: subtask.description,
                        status: subtask.status,
                        priority: subtask.priority,
                        deadline: subtask.deadline,
                        createdAt: subtask.createdAt,
                        updatedAt: subtask.updatedAt,
                        blockerReason: subtask.blockerReason
                    }))
                }))
            }
        };
        
        console.log('Response data structure:', {
            department: responseData.data.department,
            statsKeys: Object.keys(responseData.data.stats),
            tasksCount: responseData.data.tasks.length,
            sampleTask: responseData.data.tasks[0]
        });
        
        res.json(responseData);
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


