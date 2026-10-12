-- CreateTable
CREATE TABLE `plan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `diasPorSemana` INTEGER NOT NULL DEFAULT 3,
    `precio` DECIMAL(10, 2) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `dni` VARCHAR(191) NOT NULL,
    `direccion` VARCHAR(191) NULL,
    `birthDate` DATE NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `role` ENUM('USER', 'ADMIN', 'SUPERADMIN') NOT NULL DEFAULT 'USER',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `planId` INTEGER NULL,

    UNIQUE INDEX `usuario_email_key`(`email`),
    UNIQUE INDEX `usuario_dni_key`(`dni`),
    INDEX `usuario_planId_idx`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario_rutina_dia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `diaNumero` INTEGER NOT NULL,
    `nombreDia` VARCHAR(191) NULL,
    `rutinaId` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `usuario_rutina_dia_rutinaId_idx`(`rutinaId`),
    UNIQUE INDEX `usuario_rutina_dia_usuarioId_diaNumero_key`(`usuarioId`, `diaNumero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rutina` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `esTemplate` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ejercicio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `grupoMuscular` VARCHAR(191) NULL,
    `imagenUrl` VARCHAR(191) NULL,
    `videoUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rutina_ejercicio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rutinaId` INTEGER NOT NULL,
    `ejercicioId` INTEGER NOT NULL,
    `orden` INTEGER NOT NULL DEFAULT 1,
    `series` INTEGER NOT NULL DEFAULT 4,
    `repeticiones` VARCHAR(191) NOT NULL DEFAULT '10-12',
    `descansoSegundos` INTEGER NULL DEFAULT 60,
    `pesoSugerido` DOUBLE NULL,
    `notas` VARCHAR(191) NULL,

    INDEX `rutina_ejercicio_ejercicioId_idx`(`ejercicioId`),
    UNIQUE INDEX `rutina_ejercicio_rutinaId_ejercicioId_key`(`rutinaId`, `ejercicioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario_ejercicio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `ejercicioId` INTEGER NOT NULL,
    `pesoActual` DOUBLE NOT NULL DEFAULT 0,
    `series` INTEGER NULL,
    `repeticiones` VARCHAR(191) NULL,
    `notas` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `usuario_ejercicio_ejercicioId_idx`(`ejercicioId`),
    UNIQUE INDEX `usuario_ejercicio_usuarioId_ejercicioId_key`(`usuarioId`, `ejercicioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sesion_entrenamiento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `rutinaId` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completada` BOOLEAN NOT NULL DEFAULT false,
    `duracionMinutos` INTEGER NULL,
    `comentarios` VARCHAR(191) NULL,

    INDEX `sesion_entrenamiento_usuarioId_fecha_idx`(`usuarioId`, `fecha`),
    INDEX `sesion_entrenamiento_rutinaId_idx`(`rutinaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historial_ejercicio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `ejercicioId` INTEGER NOT NULL,
    `sesionId` INTEGER NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `peso` DOUBLE NOT NULL,
    `seriesCompletadas` INTEGER NULL,
    `repeticionesLogradas` INTEGER NULL,
    `rpe` INTEGER NULL,
    `notas` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `historial_ejercicio_usuarioId_ejercicioId_fecha_idx`(`usuarioId`, `ejercicioId`, `fecha`),
    INDEX `historial_ejercicio_ejercicioId_idx`(`ejercicioId`),
    INDEX `historial_ejercicio_sesionId_idx`(`sesionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuario` ADD CONSTRAINT `usuario_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario_rutina_dia` ADD CONSTRAINT `usuario_rutina_dia_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario_rutina_dia` ADD CONSTRAINT `usuario_rutina_dia_rutinaId_fkey` FOREIGN KEY (`rutinaId`) REFERENCES `rutina`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rutina_ejercicio` ADD CONSTRAINT `rutina_ejercicio_rutinaId_fkey` FOREIGN KEY (`rutinaId`) REFERENCES `rutina`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rutina_ejercicio` ADD CONSTRAINT `rutina_ejercicio_ejercicioId_fkey` FOREIGN KEY (`ejercicioId`) REFERENCES `ejercicio`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario_ejercicio` ADD CONSTRAINT `usuario_ejercicio_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario_ejercicio` ADD CONSTRAINT `usuario_ejercicio_ejercicioId_fkey` FOREIGN KEY (`ejercicioId`) REFERENCES `ejercicio`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sesion_entrenamiento` ADD CONSTRAINT `sesion_entrenamiento_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sesion_entrenamiento` ADD CONSTRAINT `sesion_entrenamiento_rutinaId_fkey` FOREIGN KEY (`rutinaId`) REFERENCES `rutina`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_ejercicio` ADD CONSTRAINT `historial_ejercicio_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_ejercicio` ADD CONSTRAINT `historial_ejercicio_ejercicioId_fkey` FOREIGN KEY (`ejercicioId`) REFERENCES `ejercicio`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_ejercicio` ADD CONSTRAINT `historial_ejercicio_sesionId_fkey` FOREIGN KEY (`sesionId`) REFERENCES `sesion_entrenamiento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
