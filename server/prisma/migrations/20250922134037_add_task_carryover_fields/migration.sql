-- AlterTable
ALTER TABLE `task` ADD COLUMN `carriedOverAt` DATETIME(3) NULL,
    ADD COLUMN `carriedOverFromDeadline` DATETIME(3) NULL,
    ADD COLUMN `carryOverReason` VARCHAR(191) NULL,
    ADD COLUMN `isCarriedOver` BOOLEAN NOT NULL DEFAULT false;
