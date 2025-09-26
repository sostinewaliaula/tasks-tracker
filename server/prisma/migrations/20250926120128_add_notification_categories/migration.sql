-- AlterTable
ALTER TABLE `notification` ADD COLUMN `category` VARCHAR(191) NULL,
    ADD COLUMN `metadata` JSON NULL,
    ADD COLUMN `priority` VARCHAR(191) NULL,
    MODIFY `type` ENUM('task_completed', 'task_assigned', 'task_overdue', 'task_deadline', 'general', 'daily_progress', 'weekly_report', 'manager_summary', 'deadline_reminder', 'blocker_resolved', 'task_updated', 'department_update', 'system_announcement') NOT NULL DEFAULT 'general';
