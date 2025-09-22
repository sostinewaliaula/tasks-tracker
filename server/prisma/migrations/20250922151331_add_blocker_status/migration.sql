-- AlterTable
ALTER TABLE `task` ADD COLUMN `blockerReason` VARCHAR(191) NULL,
    MODIFY `status` ENUM('todo', 'in_progress', 'completed', 'blocker') NOT NULL DEFAULT 'todo';
