import express from 'express';
import { PrismaClient } from '../generated/prisma2';
import { authMiddleware } from '../middleware/auth';
import { broadcastNotificationToUser } from './notifications-sse';
import { sendEmailNotification } from '../lib/emailNotifications';

const router = express.Router();
const prisma = new PrismaClient();

// Create notification
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { message, type, relatedTaskId, category, priority, metadata } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const notification = await prisma.notification.create({
      data: {
        message,
        type: type || 'general',
        category: category || null,
        priority: priority || 'medium',
        metadata: metadata || null,
        userId,
        relatedTaskId: relatedTaskId ? parseInt(relatedTaskId) : null
      },
      include: {
        relatedTask: {
          select: {
            id: true,
            title: true,
            status: true,
            subtasks: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                deadline: true,
                blockerReason: true
              }
            }
          }
        }
      }
    });

    // Broadcast to user via SSE if connected
    broadcastNotificationToUser(userId, notification);

    // Send email notification if enabled
    try {
      await sendEmailNotification({
        userId,
        type: notification.type as any,
        taskData: notification.relatedTask ? {
          id: notification.relatedTask.id,
          title: notification.relatedTask.title,
          status: notification.relatedTask.status,
          subtasks: notification.relatedTask.subtasks
        } : undefined
      });
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the request if email fails
    }

    res.json({ notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Get user's notifications with advanced filtering
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { 
      type, 
      category, 
      priority, 
      read, 
      dateFrom, 
      dateTo, 
      search,
      limit = 50,
      offset = 0
    } = req.query;

    // Build where clause
    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (priority) {
      where.priority = priority;
    }

    if (read !== undefined) {
      where.read = read === 'true';
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo as string);
      }
    }

    if (search) {
      where.message = {
        contains: search as string,
        mode: 'insensitive'
      };
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        relatedTask: {
          select: {
            id: true,
            title: true,
            status: true,
            subtasks: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                deadline: true,
                blockerReason: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    // Get total count for pagination
    const totalCount = await prisma.notification.count({ where });

    res.json({ 
      notifications,
      pagination: {
        total: totalCount,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: totalCount > parseInt(offset as string) + parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    // Verify the notification belongs to the user
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    // Verify the notification belongs to the user
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete multiple notifications
router.delete('/bulk', authMiddleware, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const userId = (req as any).user.id;

    if (!Array.isArray(notificationIds)) {
      return res.status(400).json({ error: 'notificationIds must be an array' });
    }

    // Verify all notifications belong to the user
    const notifications = await prisma.notification.findMany({
      where: { 
        id: { in: notificationIds.map(id => parseInt(id)) },
        userId 
      }
    });

    if (notifications.length !== notificationIds.length) {
      return res.status(403).json({ error: 'Some notifications do not belong to the user' });
    }

    await prisma.notification.deleteMany({
      where: { 
        id: { in: notificationIds.map(id => parseInt(id)) },
        userId 
      }
    });

    res.json({ success: true, deletedCount: notificationIds.length });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    res.status(500).json({ error: 'Failed to delete notifications' });
  }
});

// Get notification analytics
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    // Get notification counts by type
    const typeStats = await prisma.notification.groupBy({
      by: ['type'],
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      _count: { type: true }
    });

    // Get notification counts by priority
    const priorityStats = await prisma.notification.groupBy({
      by: ['priority'],
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      _count: { priority: true }
    });

    // Get read vs unread stats
    const readStats = await prisma.notification.groupBy({
      by: ['read'],
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      _count: { read: true }
    });

    // Get daily notification counts
    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count,
        SUM(CASE WHEN read = true THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN read = false THEN 1 ELSE 0 END) as unread_count
      FROM Notification 
      WHERE userId = ${userId} 
        AND createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `;

    res.json({
      period: `${days} days`,
      typeStats: typeStats.map(stat => ({
        type: stat.type,
        count: stat._count.type
      })),
      priorityStats: priorityStats.map(stat => ({
        priority: stat.priority || 'medium',
        count: stat._count.priority
      })),
      readStats: readStats.map(stat => ({
        read: stat.read,
        count: stat._count.read
      })),
      dailyStats
    });
  } catch (error) {
    console.error('Error fetching notification analytics:', error);
    res.status(500).json({ error: 'Failed to fetch notification analytics' });
  }
});

// Get available notification categories
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const categories = await prisma.notification.findMany({
      where: { userId },
      select: { category: true },
      distinct: ['category']
    });

    const categoryList = categories
      .map(c => c.category)
      .filter(Boolean)
      .sort();

    // Add default categories
    const defaultCategories = [
      'Tasks',
      'Deadlines',
      'Team Updates',
      'System',
      'Reports',
      'Reminders'
    ];

    const allCategories = [...new Set([...defaultCategories, ...categoryList])];

    res.json({ categories: allCategories });
  } catch (error) {
    console.error('Error fetching notification categories:', error);
    res.status(500).json({ error: 'Failed to fetch notification categories' });
  }
});

// Test notification endpoint (for development/testing)
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { type = 'general', message, category, priority = 'medium' } = req.body;

    const testMessage = message || `Test ${type} notification - ${new Date().toLocaleString()}`;

    const notification = await prisma.notification.create({
      data: {
        message: testMessage,
        type: type as any,
        category: category || 'System',
        priority: priority as any,
        userId,
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      },
      include: {
        relatedTask: {
          select: {
            id: true,
            title: true,
            status: true,
            subtasks: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                deadline: true,
                blockerReason: true
              }
            }
          }
        }
      }
    });

    // Broadcast to user via SSE if connected
    broadcastNotificationToUser(userId, notification);

    // Send email notification if enabled
    try {
      await sendEmailNotification({
        userId,
        type: notification.type as any,
        taskData: notification.relatedTask ? {
          id: notification.relatedTask.id,
          title: notification.relatedTask.title,
          status: notification.relatedTask.status,
          subtasks: notification.relatedTask.subtasks
        } : undefined
      });
    } catch (emailError) {
      console.error('Error sending test email notification:', emailError);
    }

    res.json({ 
      notification,
      message: 'Test notification created and sent successfully'
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ error: 'Failed to create test notification' });
  }
});

export default router;
