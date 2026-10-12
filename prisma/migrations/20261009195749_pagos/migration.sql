-- CreateTable
CREATE TABLE `pago` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `mes` INTEGER NOT NULL,
    `anio` INTEGER NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `fechaPago` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metodoPago` VARCHAR(191) NULL DEFAULT 'Efectivo',
    `comprobante` VARCHAR(191) NULL,
    `notas` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `pago_usuarioId_idx`(`usuarioId`),
    INDEX `pago_anio_mes_idx`(`anio`, `mes`),
    UNIQUE INDEX `pago_usuarioId_anio_mes_key`(`usuarioId`, `anio`, `mes`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pago` ADD CONSTRAINT `pago_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
