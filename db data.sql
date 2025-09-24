-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               12.0.2-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table mydb.department
CREATE TABLE IF NOT EXISTS `department` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `parentId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `managerId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Department_name_parentId_key` (`name`,`parentId`),
  KEY `Department_parentId_fkey` (`parentId`),
  KEY `Department_managerId_fkey` (`managerId`),
  CONSTRAINT `Department_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Department_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `department` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table mydb.department: ~8 rows (approximately)
INSERT INTO `department` (`id`, `name`, `parentId`, `createdAt`, `updatedAt`, `managerId`) VALUES
	(1, 'Turnkey', NULL, '2025-09-16 10:59:03.024', '2025-09-16 10:59:03.024', NULL),
	(2, 'IT-Team', 1, '2025-09-16 10:59:44.316', '2025-09-22 08:21:06.053', 1),
	(3, 'Agencify', NULL, '2025-09-16 11:00:04.806', '2025-09-16 11:00:04.806', NULL),
	(4, 'Support Team', 3, '2025-09-16 12:23:00.685', '2025-09-16 12:23:00.685', NULL),
	(6, 'Caava AI', NULL, '2025-09-16 13:41:46.962', '2025-09-16 13:41:46.962', NULL),
	(9, 'test', 3, '2025-09-16 14:08:07.698', '2025-09-16 14:08:07.698', NULL),
	(10, 'Test 2', NULL, '2025-09-22 07:47:04.101', '2025-09-22 07:47:04.101', NULL),
	(11, 'Sus', 1, '2025-09-22 07:51:01.659', '2025-09-22 08:30:16.614', 1);

-- Dumping structure for table mydb.notification
CREATE TABLE IF NOT EXISTS `notification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message` varchar(191) NOT NULL,
  `read` tinyint(1) NOT NULL DEFAULT 0,
  `type` enum('task_completed','task_assigned','task_overdue','task_deadline','general') NOT NULL DEFAULT 'general',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `userId` int(11) NOT NULL,
  `relatedTaskId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Notification_userId_fkey` (`userId`),
  KEY `Notification_relatedTaskId_fkey` (`relatedTaskId`),
  CONSTRAINT `Notification_relatedTaskId_fkey` FOREIGN KEY (`relatedTaskId`) REFERENCES `task` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table mydb.notification: ~59 rows (approximately)
INSERT INTO `notification` (`id`, `message`, `read`, `type`, `createdAt`, `updatedAt`, `userId`, `relatedTaskId`) VALUES
	(1, 'Reminder: \'Zabbix Configuration\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:09.652', '2025-09-24 18:47:09.652', 1, 16),
	(2, 'Reminder: \'Zabbix Configuration\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:09.728', '2025-09-24 18:47:09.728', 1, 16),
	(3, 'Reminder: \'OS Ticket Resolutions\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:09.809', '2025-09-24 18:47:09.809', 1, 21),
	(4, 'Reminder: \'OS Ticket Resolutions\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:09.866', '2025-09-24 18:47:09.866', 1, 21),
	(5, 'Reminder: \'OS Ticket Resolutions\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:10.198', '2025-09-24 18:47:10.198', 1, 21),
	(6, 'Reminder: \'IT Support (Office environment)\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:10.295', '2025-09-24 18:47:10.295', 1, 23),
	(7, 'Reminder: \'IT Support (Office environment)\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:10.424', '2025-09-24 18:47:10.424', 1, 23),
	(8, 'Reminder: \'IT Support (Office environment)\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:10.393', '2025-09-24 18:47:10.393', 1, 23),
	(9, 'Reminder: \'IT Support (Office environment)\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:10.660', '2025-09-24 18:47:10.660', 1, 23),
	(10, 'Reminder: \'Assigned tasks\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:10.714', '2025-09-24 18:47:10.714', 1, 25),
	(11, 'Reminder: \'IT Support (Office environment)\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:10.696', '2025-09-24 18:47:10.696', 1, 23),
	(12, 'Reminder: \'Assigned tasks\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:10.680', '2025-09-24 18:47:10.680', 1, 25),
	(13, 'Reminder: \'Assigned tasks\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:10.845', '2025-09-24 18:47:10.845', 1, 25),
	(14, 'Reminder: \'Assigned tasks\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:10.856', '2025-09-24 18:47:10.856', 1, 25),
	(15, 'Reminder: \'Assigned tasks\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:11.279', '2025-09-24 18:47:11.279', 1, 25),
	(16, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:11.355', '2025-09-24 18:47:11.355', 1, 26),
	(17, 'Reminder: \'Assigned tasks\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:11.610', '2025-09-24 18:47:11.610', 1, 25),
	(18, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:11.618', '2025-09-24 18:47:11.618', 1, 26),
	(19, 'Reminder: \'Assigned tasks\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:11.793', '2025-09-24 18:47:11.793', 1, 25),
	(20, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:11.809', '2025-09-24 18:47:11.809', 1, 26),
	(21, 'Reminder: \'Assigned tasks\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:11.900', '2025-09-24 18:47:11.900', 1, 25),
	(22, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:11.910', '2025-09-24 18:47:11.910', 1, 26),
	(23, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:11.994', '2025-09-24 18:47:11.994', 1, 26),
	(24, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:12.013', '2025-09-24 18:47:12.013', 1, 26),
	(25, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:12.073', '2025-09-24 18:47:12.073', 1, 26),
	(26, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:12.085', '2025-09-24 18:47:12.085', 1, 26),
	(27, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:12.290', '2025-09-24 18:47:12.290', 1, 26),
	(28, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:12.322', '2025-09-24 18:47:12.322', 1, 26),
	(29, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:12.750', '2025-09-24 18:47:12.750', 1, 26),
	(30, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:12.968', '2025-09-24 18:47:12.968', 1, 26),
	(31, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:13.001', '2025-09-24 18:47:13.001', 1, 26),
	(32, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:47:13.005', '2025-09-24 18:47:13.005', 1, 26),
	(33, 'Reminder: \'Zabbix Configuration\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:50:49.503', '2025-09-24 18:50:49.503', 1, 16),
	(34, 'Reminder: \'OS Ticket Resolutions\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:50:49.872', '2025-09-24 18:50:49.872', 1, 21),
	(35, 'Reminder: \'IT Support (Office environment)\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:50:50.046', '2025-09-24 18:50:50.046', 1, 23),
	(36, 'Reminder: \'Assigned tasks\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:50:50.451', '2025-09-24 18:50:50.451', 1, 25),
	(37, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:50:50.592', '2025-09-24 18:50:50.592', 1, 26),
	(38, 'Reminder: \'Zabbix Configuration\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:25.044', '2025-09-24 18:57:25.044', 2, 16),
	(39, 'Reminder: \'OS Ticket Resolutions\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:27.394', '2025-09-24 18:57:27.394', 2, 21),
	(40, 'Reminder: \'OS Ticket Resolutions\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:27.804', '2025-09-24 18:57:27.804', 2, 21),
	(41, 'Reminder: \'IT Support (Office environment)\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:28.117', '2025-09-24 18:57:28.117', 2, 23),
	(42, 'Reminder: \'IT Support (Office environment)\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:28.618', '2025-09-24 18:57:28.618', 2, 23),
	(43, 'Reminder: \'IT Support (Office environment)\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:28.773', '2025-09-24 18:57:28.773', 2, 23),
	(44, 'Reminder: \'Assigned tasks\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:29.087', '2025-09-24 18:57:29.087', 2, 25),
	(45, 'Reminder: \'Assigned tasks\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:29.116', '2025-09-24 18:57:29.116', 2, 25),
	(46, 'Reminder: \'Assigned tasks\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:29.481', '2025-09-24 18:57:29.481', 2, 25),
	(47, 'Reminder: \'Assigned tasks\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:29.495', '2025-09-24 18:57:29.495', 2, 25),
	(48, 'Reminder: \'Assigned tasks\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:29.822', '2025-09-24 18:57:29.822', 2, 25),
	(49, 'Reminder: \'Assigned tasks\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:29.919', '2025-09-24 18:57:29.919', 2, 25),
	(50, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:30.888', '2025-09-24 18:57:30.888', 2, 26),
	(51, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:30.900', '2025-09-24 18:57:30.900', 2, 26),
	(52, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:31.087', '2025-09-24 18:57:31.087', 2, 26),
	(53, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:31.099', '2025-09-24 18:57:31.099', 2, 26),
	(54, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:31.219', '2025-09-24 18:57:31.219', 2, 26),
	(55, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:31.205', '2025-09-24 18:57:31.205', 2, 26),
	(56, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:31.271', '2025-09-24 18:57:31.271', 2, 26),
	(57, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:31.804', '2025-09-24 18:57:31.804', 2, 26),
	(58, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:32.536', '2025-09-24 18:57:32.536', 2, 26),
	(59, 'Reminder: \'Follow ups\' is due tomorrow', 0, 'task_deadline', '2025-09-24 18:57:33.826', '2025-09-24 18:57:33.826', 2, 26);

-- Dumping structure for table mydb.task
CREATE TABLE IF NOT EXISTS `task` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(191) NOT NULL,
  `description` varchar(191) NOT NULL,
  `deadline` datetime(3) NOT NULL,
  `priority` enum('high','medium','low') NOT NULL,
  `status` enum('todo','in_progress','completed','blocker') NOT NULL DEFAULT 'todo',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `createdById` int(11) NOT NULL,
  `departmentId` int(11) DEFAULT NULL,
  `parentId` int(11) DEFAULT NULL,
  `carriedOverAt` datetime(3) DEFAULT NULL,
  `carriedOverFromDeadline` datetime(3) DEFAULT NULL,
  `carryOverReason` varchar(191) DEFAULT NULL,
  `isCarriedOver` tinyint(1) NOT NULL DEFAULT 0,
  `blockerReason` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Task_createdById_fkey` (`createdById`),
  KEY `Task_departmentId_fkey` (`departmentId`),
  KEY `Task_parentId_fkey` (`parentId`),
  CONSTRAINT `Task_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `Task_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Task_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `task` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table mydb.task: ~36 rows (approximately)
INSERT INTO `task` (`id`, `title`, `description`, `deadline`, `priority`, `status`, `createdAt`, `updatedAt`, `createdById`, `departmentId`, `parentId`, `carriedOverAt`, `carriedOverFromDeadline`, `carryOverReason`, `isCarriedOver`, `blockerReason`) VALUES
	(1, 'test', 'tets', '2025-09-20 00:00:00.000', 'medium', 'todo', '2025-09-16 14:43:09.747', '2025-09-16 14:43:09.747', 1, NULL, NULL, NULL, NULL, NULL, 0, NULL),
	(2, 'tesd', 'dff', '2025-09-20 00:00:00.000', 'low', 'todo', '2025-09-16 14:52:55.636', '2025-09-16 14:52:55.636', 1, NULL, NULL, NULL, NULL, NULL, 0, NULL),
	(3, 'tege', 'he', '2025-09-18 00:00:00.000', 'medium', 'todo', '2025-09-16 15:01:43.336', '2025-09-16 15:01:43.336', 1, NULL, NULL, NULL, NULL, NULL, 0, NULL),
	(4, 'hghh', 'hgh', '2025-09-18 00:00:00.000', 'medium', 'todo', '2025-09-16 15:13:16.736', '2025-09-16 15:13:16.736', 1, NULL, 3, NULL, NULL, NULL, 0, NULL),
	(5, 'tets', 'testgs', '2025-09-17 00:00:00.000', 'medium', 'todo', '2025-09-16 15:20:05.486', '2025-09-16 15:20:05.486', 1, NULL, NULL, NULL, NULL, NULL, 0, NULL),
	(6, 'Test main', '', '2025-09-25 00:00:00.000', 'medium', 'in_progress', '2025-09-22 09:05:02.566', '2025-09-22 13:14:37.283', 2, NULL, NULL, NULL, NULL, NULL, 0, NULL),
	(7, 'sub task', '', '2025-09-25 00:00:00.000', 'medium', 'blocker', '2025-09-22 09:05:02.640', '2025-09-24 10:51:11.037', 2, NULL, 6, NULL, NULL, NULL, 0, NULL),
	(8, 'Test sub task', 'test', '2025-09-25 00:00:00.000', 'medium', 'completed', '2025-09-22 12:07:48.218', '2025-09-22 13:00:58.401', 2, NULL, 6, NULL, NULL, NULL, 0, NULL),
	(9, 'Test today', '', '2025-09-23 00:00:00.000', 'medium', 'in_progress', '2025-09-22 13:20:40.469', '2025-09-22 14:11:15.729', 2, NULL, NULL, '2025-09-22 14:11:15.725', '2025-09-22 00:00:00.000', 'h', 1, NULL),
	(10, 'work on', '', '2025-09-22 00:00:00.000', 'medium', 'completed', '2025-09-22 13:20:57.436', '2025-09-22 13:21:11.703', 2, NULL, 9, NULL, NULL, NULL, 0, NULL),
	(11, 'test 2', '', '2025-09-22 00:00:00.000', 'medium', 'todo', '2025-09-22 13:21:23.522', '2025-09-22 13:21:23.522', 2, NULL, 9, NULL, NULL, NULL, 0, NULL),
	(12, 'carryover', '', '2025-09-23 00:00:00.000', 'medium', 'todo', '2025-09-22 13:51:42.515', '2025-09-22 15:47:14.490', 2, NULL, NULL, '2025-09-22 14:06:23.262', '2025-09-20 18:00:00.000', 'workload', 1, NULL),
	(13, 'test', '', '2025-09-20 18:00:00.000', 'medium', 'todo', '2025-09-22 13:53:58.320', '2025-09-22 13:53:58.320', 2, NULL, 12, NULL, NULL, NULL, 0, NULL),
	(14, 'Assets Management Release', '', '2025-09-26 00:00:00.000', 'medium', 'completed', '2025-09-24 06:11:02.852', '2025-09-24 07:49:36.696', 2, NULL, NULL, NULL, NULL, NULL, 0, NULL),
	(15, 'Assets Management Release', '', '2025-09-26 00:00:00.000', 'medium', 'completed', '2025-09-24 06:11:02.930', '2025-09-24 07:49:36.535', 2, NULL, 14, NULL, NULL, NULL, 0, NULL),
	(16, 'Zabbix Configuration', '', '2025-09-26 00:00:00.000', 'medium', 'in_progress', '2025-09-24 06:12:35.842', '2025-09-24 06:13:31.726', 2, NULL, NULL, NULL, NULL, NULL, 0, NULL),
	(17, 'Provision hosts monitoring', '', '2025-09-26 00:00:00.000', 'medium', 'completed', '2025-09-24 06:12:35.956', '2025-09-24 06:13:31.686', 2, NULL, 16, NULL, NULL, NULL, 0, NULL),
	(18, 'Add more triggers and metrics', '', '2025-09-26 00:00:00.000', 'medium', 'in_progress', '2025-09-24 06:12:36.085', '2025-09-24 06:13:14.933', 2, NULL, 16, NULL, NULL, NULL, 0, NULL),
	(19, 'Sort out the alerting feature', '', '2025-09-26 00:00:00.000', 'medium', 'in_progress', '2025-09-24 06:12:36.229', '2025-09-24 06:13:37.133', 2, NULL, 16, NULL, NULL, NULL, 0, NULL),
	(20, 'Work on the remote startup scripts', '', '2025-09-26 00:00:00.000', 'medium', 'in_progress', '2025-09-24 06:12:36.373', '2025-09-24 06:13:41.104', 2, NULL, 16, NULL, NULL, NULL, 0, NULL),
	(21, 'OS Ticket Resolutions', '', '2025-09-26 00:00:00.000', 'medium', 'todo', '2025-09-24 06:14:51.928', '2025-09-24 06:14:51.928', 2, NULL, NULL, NULL, NULL, NULL, 0, NULL),
	(22, 'OS Ticket Resolutions', '', '2025-09-26 00:00:00.000', 'medium', 'todo', '2025-09-24 06:14:52.416', '2025-09-24 06:14:52.416', 2, NULL, 21, NULL, NULL, NULL, 0, NULL),
	(23, 'IT Support (Office environment)', '', '2025-09-26 00:00:00.000', 'medium', 'todo', '2025-09-24 06:15:29.529', '2025-09-24 06:15:29.529', 2, NULL, NULL, NULL, NULL, NULL, 0, NULL),
	(24, 'IT Support (Office environment)', '', '2025-09-26 00:00:00.000', 'medium', 'todo', '2025-09-24 06:15:29.803', '2025-09-24 06:15:29.803', 2, NULL, 23, NULL, NULL, NULL, 0, NULL),
	(25, 'Assigned tasks', '', '2025-09-26 00:00:00.000', 'medium', 'todo', '2025-09-24 06:16:09.297', '2025-09-24 12:58:13.989', 2, NULL, NULL, NULL, NULL, NULL, 0, NULL),
	(26, 'Follow ups', '', '2025-09-26 00:00:00.000', 'medium', 'todo', '2025-09-24 06:16:40.158', '2025-09-24 06:16:40.158', 2, NULL, NULL, NULL, NULL, NULL, 0, NULL),
	(27, 'Collection of Assets details from staff', '', '2025-09-26 00:00:00.000', 'medium', 'todo', '2025-09-24 06:16:40.258', '2025-09-24 06:16:40.258', 2, NULL, 26, NULL, NULL, NULL, 0, NULL),
	(28, 'Provisioning of machines for new staff', '', '2025-09-26 00:00:00.000', 'medium', 'blocker', '2025-09-24 06:17:03.377', '2025-09-24 12:58:13.949', 2, NULL, 25, NULL, NULL, NULL, 0, NULL),
	(39, 'test task after update', '', '2025-09-24 01:00:00.000', 'medium', 'todo', '2025-09-24 10:10:01.786', '2025-09-24 10:10:01.786', 2, NULL, NULL, NULL, NULL, NULL, 0, NULL),
	(40, 'test', '', '2025-09-24 00:00:00.000', 'medium', 'todo', '2025-09-24 10:10:06.211', '2025-09-24 10:10:06.211', 2, NULL, 39, NULL, NULL, NULL, 0, NULL),
	(41, 'tesr', '', '2025-09-23 00:00:00.000', 'medium', 'in_progress', '2025-09-24 12:06:50.302', '2025-09-24 14:15:37.478', 2, NULL, 9, NULL, NULL, NULL, 0, NULL),
	(42, 'sample', '', '2025-09-24 00:00:00.000', 'medium', 'todo', '2025-09-24 14:11:15.627', '2025-09-24 14:11:15.627', 2, NULL, NULL, NULL, NULL, NULL, 0, NULL),
	(43, 'test', '', '2025-09-24 00:00:00.000', 'medium', 'todo', '2025-09-24 14:11:16.369', '2025-09-24 14:11:16.369', 2, NULL, 42, NULL, NULL, NULL, 0, NULL),
	(44, 'test3', '', '2025-09-23 00:00:00.000', 'medium', 'todo', '2025-09-24 14:15:13.904', '2025-09-24 14:15:13.904', 2, NULL, 9, NULL, NULL, NULL, 0, NULL),
	(45, 'toST', '', '2025-09-24 00:00:00.000', 'medium', 'todo', '2025-09-24 14:32:26.806', '2025-09-24 14:32:26.806', 2, NULL, NULL, NULL, NULL, NULL, 0, NULL),
	(46, 'ROst', '', '2025-09-24 00:00:00.000', 'medium', 'todo', '2025-09-24 14:32:27.983', '2025-09-24 14:32:27.983', 2, NULL, 45, NULL, NULL, NULL, 0, NULL);

-- Dumping structure for table mydb.user
CREATE TABLE IF NOT EXISTS `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ldapUid` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `role` enum('admin','manager','employee') NOT NULL DEFAULT 'employee',
  `departmentId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `bio` varchar(191) DEFAULT NULL,
  `darkMode` tinyint(1) NOT NULL DEFAULT 0,
  `emailNotifications` tinyint(1) NOT NULL DEFAULT 1,
  `language` varchar(191) NOT NULL DEFAULT 'en',
  `phone` varchar(191) DEFAULT NULL,
  `showBio` tinyint(1) NOT NULL DEFAULT 1,
  `showEmail` tinyint(1) NOT NULL DEFAULT 1,
  `showPhone` tinyint(1) NOT NULL DEFAULT 0,
  `taskAssigned` tinyint(1) NOT NULL DEFAULT 1,
  `taskCompleted` tinyint(1) NOT NULL DEFAULT 1,
  `taskDeadline` tinyint(1) NOT NULL DEFAULT 1,
  `taskOverdue` tinyint(1) NOT NULL DEFAULT 1,
  `timezone` varchar(191) NOT NULL DEFAULT 'UTC',
  `weeklyReport` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_ldapUid_key` (`ldapUid`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `User_departmentId_fkey` (`departmentId`),
  CONSTRAINT `User_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table mydb.user: ~3 rows (approximately)
INSERT INTO `user` (`id`, `ldapUid`, `email`, `name`, `role`, `departmentId`, `createdAt`, `updatedAt`, `bio`, `darkMode`, `emailNotifications`, `language`, `phone`, `showBio`, `showEmail`, `showPhone`, `taskAssigned`, `taskCompleted`, `taskDeadline`, `taskOverdue`, `timezone`, `weeklyReport`) VALUES
	(1, 'sostine.waliaula', 'sostine.waliaula@turnkeyafrica.com', 'sostine.waliaula', 'admin', 2, '2025-09-16 10:56:39.420', '2025-09-24 18:50:52.253', NULL, 0, 1, 'en', NULL, 1, 1, 0, 1, 1, 1, 1, 'UTC', 1),
	(2, 'test.test', 'test.test@turnkeyafrica.com', 'test.test', 'employee', 2, '2025-09-22 08:37:35.819', '2025-09-24 18:59:01.069', NULL, 0, 1, 'en', '0707800972', 1, 1, 0, 1, 1, 1, 1, 'UTC', 1),
	(3, 'manager.it', 'manager.it@turnkeyafrica.com', 'manager.it', 'manager', NULL, '2025-09-24 14:58:55.986', '2025-09-24 18:59:16.847', NULL, 0, 1, 'en', NULL, 1, 1, 0, 1, 1, 1, 1, 'UTC', 1);

-- Dumping structure for table mydb._prisma_migrations
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table mydb._prisma_migrations: ~9 rows (approximately)
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
	('116d59fc-7581-446b-ad1f-1e9456263c25', 'd97dbdb828066df4210dabfd5977ca073faf72d62b49dae8e9ada1a98efb5a73', '2025-09-22 08:04:51.457', '20250922080450_add_department_manager', NULL, NULL, '2025-09-22 08:04:50.464', 1),
	('1e38110b-df9f-4b1d-b8cf-1e08d889da02', '783542ff7c5ec0d1f1297d20d0b9108caf8738d8d9242b17f3fc9cb4de3a8647', '2025-09-24 09:14:47.158', '20250924091447_add_user_profile_fields', NULL, NULL, '2025-09-24 09:14:47.115', 1),
	('3b703534-a524-4251-b275-439a730baa85', '0e62ba78e34af91f7f83877a4b0a4a61f3cf814dc80780a4a5b83d9843611851', '2025-09-16 14:49:55.884', '20250916144955_add_subtasks', NULL, NULL, '2025-09-16 14:49:55.727', 1),
	('5dfa5b82-1b15-4026-9840-b22edf494500', 'f98dbf9f5b8b1333d00f8b6fce74284d2f92dd262b689fd5ebd45347ecd42d07', '2025-09-22 15:13:31.729', '20250922151331_add_blocker_status', NULL, NULL, '2025-09-22 15:13:31.663', 1),
	('883dcc51-d0b1-4802-928b-3779e62f3743', '69f94bcaeb17c3ee7e1e28761078628593fb5ec0ca1bd04fcd2998b78ae13219', '2025-09-16 10:50:34.839', '20250915100931_init', NULL, NULL, '2025-09-16 10:50:34.744', 1),
	('8bd2e072-642e-495c-93b5-8a2108372aab', 'ee8843d7d0a7ed064fe84b191cc3f0c35c597a2c55d6f10f36aa328d214c15fa', '2025-09-22 13:40:37.457', '20250922134037_add_task_carryover_fields', NULL, NULL, '2025-09-22 13:40:37.368', 1),
	('a47c2da6-cae0-434b-98db-009865055f4b', 'f27d0bbfe0a8605bf9fdedc977286a35019e599877fb395fea29114cb8ad093b', '2025-09-16 14:35:25.364', '20250916143525_add_task_model', NULL, NULL, '2025-09-16 14:35:25.219', 1),
	('a4b04ebc-1560-4cd4-becf-1013195d5601', 'e676a9f3f96623c957398e57cdd872449adf5a7d3a261a05e896fdde9745d589', '2025-09-24 16:44:43.692', '20250924164443_add_notifications', NULL, NULL, '2025-09-24 16:44:43.445', 1),
	('f06706b7-eb18-4206-bd5d-2fdcf39770d0', '18307761727dd81d66f8d7abca7ad157d96b93cbc9f248b9f71b011cf3c5a078', '2025-09-16 10:51:27.123', '20250916105126_add_department', NULL, NULL, '2025-09-16 10:51:26.884', 1);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
