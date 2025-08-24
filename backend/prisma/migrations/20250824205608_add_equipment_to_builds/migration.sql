-- AlterTable
ALTER TABLE `build` ADD COLUMN `consumables` JSON NULL,
    ADD COLUMN `equipment` JSON NULL,
    MODIFY `description` VARCHAR(191) NULL;
