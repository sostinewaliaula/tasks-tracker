import express from 'express';
import { authMiddleware, roleCheck } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// All task routes require auth
router.use(authMiddleware);

// GET /api/tasks - list tasks visible to the current user
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user as { id: number; role: 'admin' | 'manager' | 'employee' }; 
    const { status, priority, q, departmentId, createdById } = req.query as Record<string, string>;

    const where: any = {};
    if (status) where.status = status.replace('-', '_');
    if (priority) where.priority = priority;
    if (q) where.OR = [{ title: { contains: q } }, { description: { contains: q } }];
    if (departmentId) where.departmentId = Number(departmentId);
    if (createdById) where.createdById = Number(createdById);

    // Visibility rules
    if (user.role === 'manager') {
      // Managers see tasks in their department only
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      where.departmentId = dbUser?.departmentId ?? -1;
    } else if (user.role === 'employee') {
      // Employees see only their tasks
      where.createdById = user.id;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { deadline: 'asc' },
      include: { createdBy: { select: { id: true, name: true } }, department: { select: { id: true, name: true } } },
      take: 500,
    });
    res.json({ data: tasks });
  } catch (e) {
    console.error('Tasks list error:', e);
    res.status(500).json({ error: 'Failed to load tasks' });
  }
});

// POST /api/tasks - create task (manager/admin). Employees can create own tasks optionally.
router.post('/', async (req, res) => {
  try {
    const user = (req as any).user as { id: number; role: 'admin' | 'manager' | 'employee' };
    const { title, description, deadline, priority, status, departmentId, createdById } = req.body || {};

    if (!title || !description || !deadline || !priority) {
      return res.status(400).json({ error: 'title, description, deadline, priority are required' });
    }

    // Determine creator and allowed department
    let resolvedCreatedById = Number(createdById) || user.id;
    let resolvedDepartmentId = departmentId === undefined ? undefined : Number(departmentId);

    if (user.role === 'employee') {
      // Employees can only create tasks for themselves
      resolvedCreatedById = user.id;
    }

    if (user.role === 'manager') {
      // Managers limited to their own department
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      resolvedDepartmentId = dbUser?.departmentId ?? null;
    }

    const created = await prisma.task.create({
      data: {
        title: String(title),
        description: String(description),
        deadline: new Date(deadline),
        priority: String(priority) as any,
        status: (status ? String(status).replace('-', '_') : 'todo') as any,
        createdById: resolvedCreatedById,
        departmentId: resolvedDepartmentId ?? null,
      },
    });
    res.status(201).json({ data: created });
  } catch (e) {
    console.error('Task create error:', e);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id/status - update status
router.patch('/:id/status', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    const user = (req as any).user as { id: number; role: 'admin' | 'manager' | 'employee' };
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    if (!status) return res.status(400).json({ error: 'status is required' });

    // Check ownership or managerial/admin rights
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    if (user.role === 'employee' && existing.createdById !== user.id) {
      return res.status(403).json({ error: 'Cannot modify others\' tasks' });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { status: String(status).replace('-', '_') as any },
    });
    res.json({ data: updated });
  } catch (e) {
    console.error('Task status update error:', e);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;


