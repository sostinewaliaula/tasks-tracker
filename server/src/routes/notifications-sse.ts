import express from 'express';
import { PrismaClient } from '../generated/prisma2';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Store active SSE connections
const activeConnections = new Map<number, express.Response>();

// SSE endpoint for real-time notifications
router.get('/stream', authMiddleware, (req, res) => {
  const userId = (req as any).user.id;
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Store connection
  activeConnections.set(userId, res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Real-time notifications enabled' })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    activeConnections.delete(userId);
  });

  // Keep connection alive with periodic heartbeat
  const heartbeat = setInterval(() => {
    if (activeConnections.has(userId)) {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
    } else {
      clearInterval(heartbeat);
    }
  }, 30000); // Send heartbeat every 30 seconds
});

// Function to broadcast notification to a specific user
export function broadcastNotificationToUser(userId: number, notification: any) {
  const connection = activeConnections.get(userId);
  if (connection) {
    try {
      connection.write(`data: ${JSON.stringify({ 
        type: 'notification', 
        notification 
      })}\n\n`);
    } catch (error) {
      console.error('Error sending SSE notification:', error);
      activeConnections.delete(userId);
    }
  }
}

// Function to broadcast to all connected users
export function broadcastToAllUsers(data: any) {
  activeConnections.forEach((connection, userId) => {
    try {
      connection.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('Error broadcasting to user:', userId, error);
      activeConnections.delete(userId);
    }
  });
}

// Cleanup function to remove stale connections
setInterval(() => {
  activeConnections.forEach((connection, userId) => {
    if (connection.destroyed) {
      activeConnections.delete(userId);
    }
  });
}, 60000); // Cleanup every minute

export default router;
