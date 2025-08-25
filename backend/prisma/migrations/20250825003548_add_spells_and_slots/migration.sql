-- AlterTable
ALTER TABLE `item` ADD COLUMN `spellSlots` JSON NULL;

-- CreateTable
CREATE TABLE `Spell` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `iconUrl` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Spell_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
