import express from 'express';
import { authMiddleware, roleCheck } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// All task routes require auth
router.use(authMiddleware);

// Helper to update parent task status based on its subtasks
async function updateParentTaskStatus(parentId: number) {
  if (!parentId) return;
  const subtasks = await prisma.task.findMany({ where: { parentId } });
  if (subtasks.length === 0) return;
  const completed = subtasks.filter(st => st.status === 'completed').length;
  let newStatus: 'todo' | 'in_progress' | 'completed' = 'todo';
  if (completed === subtasks.length) {
    newStatus = 'completed';
  } else if (completed > 0) {
    newStatus = 'in_progress';
  }
  const parent = await prisma.task.findUnique({ where: { id: parentId } });
  if (parent && parent.status !== newStatus) {
    await prisma.task.update({ where: { id: parentId }, data: { status: newStatus } });
  }
}

// GET /api/tasks - list tasks visible to the current user
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user as { id: number; role: 'admin' | 'manager' | 'employee' }; 
    const { status, priority, q, departmentId, createdById, parentId } = req.query as Record<string, string>;

    const where: any = {};
    if (status) where.status = status.replace('-', '_');
    if (priority) where.priority = priority;
    if (q) where.OR = [{ title: { contains: q } }, { description: { contains: q } }];
    if (departmentId) where.departmentId = Number(departmentId);
    if (createdById) where.createdById = Number(createdById);
    if (parentId !== undefined) where.parentId = parentId === 'null' ? null : Number(parentId);

    // Visibility rules
    if (user.role === 'manager') {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      where.departmentId = dbUser?.departmentId ?? -1;
    } else if (user.role === 'employee') {
      where.createdById = user.id;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { deadline: 'asc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        subtasks: true,
      },
      take: 500,
    });
    res.json({ data: tasks });
  } catch (e) {
    console.error('Tasks list error:', e);
    res.status(500).json({ error: 'Failed to load tasks' });
  }
});

// POST /api/tasks - create task or subtask
router.post('/', async (req, res) => {
  try {
    const user = (req as any).user as { id: number; role: 'admin' | 'manager' | 'employee' };
    const { title, description, deadline, priority, status, departmentId, createdById, parentId } = req.body || {};

    if (!title || !deadline || !priority) {
      return res.status(400).json({ error: 'title, deadline, priority are required' });
    }

    let resolvedCreatedById = Number(createdById) || user.id;
    let resolvedDepartmentId = departmentId === undefined ? undefined : Number(departmentId);
    let resolvedParentId = parentId === undefined || parentId === null ? null : Number(parentId);

    if (user.role === 'employee') {
      resolvedCreatedById = user.id;
    }

    if (user.role === 'manager') {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      resolvedDepartmentId = dbUser?.departmentId ?? null;
    }

    const created = await prisma.task.create({
      data: {
        title: String(title),
        description: String(description ?? ''),
        deadline: new Date(deadline),
        priority: String(priority) as any,
        status: (status ? String(status).replace('-', '_') : 'todo') as any,
        createdById: resolvedCreatedById,
        departmentId: resolvedDepartmentId ?? null,
        parentId: resolvedParentId,
      },
    });
    // If this is a subtask, update parent status
    if (created.parentId) {
      await updateParentTaskStatus(created.parentId);
    }
    res.status(201).json({ data: created });
  } catch (e) {
    console.error('Task create error:', e);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id - general update (title, description, deadline, priority, status)
router.patch('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const user = (req as any).user as { id: number; role: 'admin' | 'manager' | 'employee' };

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    if (user.role === 'employee' && existing.createdById !== user.id) {
      return res.status(403).json({ error: 'Cannot modify others\' tasks' });
    }

    const { title, description, deadline, priority, status } = req.body || {};

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title: typeof title === 'string' ? title : undefined,
        description: typeof description === 'string' ? description : undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        priority: priority ? String(priority) as any : undefined,
        status: status ? (String(status).replace('-', '_') as any) : undefined,
      },
    });
    // If this is a subtask, update parent status
    if (updated.parentId) {
      await updateParentTaskStatus(updated.parentId);
    }
    res.json({ data: updated });
  } catch (e) {
    console.error('Task update error:', e);
    res.status(500).json({ error: 'Failed to update task' });
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

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    if (user.role === 'employee' && existing.createdById !== user.id) {
      return res.status(403).json({ error: 'Cannot modify others\' tasks' });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { status: String(status).replace('-', '_') as any },
    });
    // If this is a subtask, update parent status
    if (existing.parentId) {
      await updateParentTaskStatus(existing.parentId);
    }
    res.json({ data: updated });
  } catch (e) {
    console.error('Task status update error:', e);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;


