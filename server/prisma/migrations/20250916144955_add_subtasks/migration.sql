-- AlterTable
ALTER TABLE `task` ADD COLUMN `parentId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Task`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
