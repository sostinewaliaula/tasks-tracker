import express from 'express';
import { PrismaClient } from '../generated/prisma2';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Create notification
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { message, type, relatedTaskId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const notification = await prisma.notification.create({
      data: {
        message,
        type: type || 'general',
        userId,
        relatedTaskId: relatedTaskId ? parseInt(relatedTaskId) : null
      },
      include: {
        relatedTask: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    res.json({ notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Get user's notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const notifications = await prisma.notification.findMany({
      where: { userId },
      include: {
        relatedTask: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ notifications });
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

export default router;
