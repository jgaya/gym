-- CreateTable
CREATE TABLE `plan_rutina_template` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `planId` INTEGER NOT NULL,

    INDEX `plan_rutina_template_planId_idx`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plan_rutina_template_dia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `templateId` INTEGER NOT NULL,
    `diaNumero` INTEGER NOT NULL,
    `nombreDia` VARCHAR(191) NULL,
    `rutinaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `plan_rutina_template_dia_rutinaId_idx`(`rutinaId`),
    UNIQUE INDEX `plan_rutina_template_dia_templateId_diaNumero_key`(`templateId`, `diaNumero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `plan_rutina_template` ADD CONSTRAINT `plan_rutina_template_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plan_rutina_template_dia` ADD CONSTRAINT `plan_rutina_template_dia_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `plan_rutina_template`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plan_rutina_template_dia` ADD CONSTRAINT `plan_rutina_template_dia_rutinaId_fkey` FOREIGN KEY (`rutinaId`) REFERENCES `rutina`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
