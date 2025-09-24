import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      role: user.role,
      department: user.department?.name || '',
      departmentId: user.departmentId?.toString() || '',
      language: user.language,
      timezone: user.timezone,
      darkMode: user.darkMode,
      emailNotifications: user.emailNotifications,
      taskAssigned: user.taskAssigned,
      taskCompleted: user.taskCompleted,
      taskOverdue: user.taskOverdue,
      taskDeadline: user.taskDeadline,
      weeklyReport: user.weeklyReport,
      showEmail: user.showEmail,
      showPhone: user.showPhone,
      showBio: user.showBio
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { name, phone, bio, language, timezone } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        phone: phone || null,
        bio: bio || null,
        language: language || 'en',
        timezone: timezone || 'UTC'
      },
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      id: updatedUser.id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
      role: updatedUser.role,
      department: updatedUser.department?.name || '',
      departmentId: updatedUser.departmentId?.toString() || '',
      language: updatedUser.language,
      timezone: updatedUser.timezone,
      darkMode: updatedUser.darkMode,
      emailNotifications: updatedUser.emailNotifications,
      taskAssigned: updatedUser.taskAssigned,
      taskCompleted: updatedUser.taskCompleted,
      taskOverdue: updatedUser.taskOverdue,
      taskDeadline: updatedUser.taskDeadline,
      weeklyReport: updatedUser.weeklyReport,
      showEmail: updatedUser.showEmail,
      showPhone: updatedUser.showPhone,
      showBio: updatedUser.showBio
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { 
      notifications, 
      privacy, 
      darkMode 
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        darkMode: darkMode !== undefined ? darkMode : undefined,
        emailNotifications: notifications?.emailNotifications !== undefined ? notifications.emailNotifications : undefined,
        taskAssigned: notifications?.taskAssigned !== undefined ? notifications.taskAssigned : undefined,
        taskCompleted: notifications?.taskCompleted !== undefined ? notifications.taskCompleted : undefined,
        taskOverdue: notifications?.taskOverdue !== undefined ? notifications.taskOverdue : undefined,
        taskDeadline: notifications?.taskDeadline !== undefined ? notifications.taskDeadline : undefined,
        weeklyReport: notifications?.weeklyReport !== undefined ? notifications.weeklyReport : undefined,
        showEmail: privacy?.showEmail !== undefined ? privacy.showEmail : undefined,
        showPhone: privacy?.showPhone !== undefined ? privacy.showPhone : undefined,
        showBio: privacy?.showBio !== undefined ? privacy.showBio : undefined
      },
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      id: updatedUser.id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
      role: updatedUser.role,
      department: updatedUser.department?.name || '',
      departmentId: updatedUser.departmentId?.toString() || '',
      language: updatedUser.language,
      timezone: updatedUser.timezone,
      darkMode: updatedUser.darkMode,
      emailNotifications: updatedUser.emailNotifications,
      taskAssigned: updatedUser.taskAssigned,
      taskCompleted: updatedUser.taskCompleted,
      taskOverdue: updatedUser.taskOverdue,
      taskDeadline: updatedUser.taskDeadline,
      weeklyReport: updatedUser.weeklyReport,
      showEmail: updatedUser.showEmail,
      showPhone: updatedUser.showPhone,
      showBio: updatedUser.showBio
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
