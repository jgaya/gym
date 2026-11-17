-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `autorizadoPorMedico` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `detalleLesion` TEXT NULL,
    ADD COLUMN `detalleMedicacion` TEXT NULL,
    ADD COLUMN `detalleRestricciones` TEXT NULL,
    ADD COLUMN `emergenciaContacto` VARCHAR(191) NULL,
    ADD COLUMN `emergenciaParentesco` VARCHAR(191) NULL,
    ADD COLUMN `emergenciaTelefono` VARCHAR(191) NULL,
    ADD COLUMN `objetivoOtro` VARCHAR(191) NULL,
    ADD COLUMN `objetivos` TEXT NULL,
    ADD COLUMN `observacionesSalud` TEXT NULL,
    ADD COLUMN `sucursalId` INTEGER NULL,
    ADD COLUMN `tieneLesion` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `tieneRestricciones` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `tomaMedicacion` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `role` ENUM('USER', 'ENTRENADOR', 'ADMIN', 'SUPERADMIN') NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE `sucursal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `telefono` VARCHAR(191) NOT NULL,
    `direccion` VARCHAR(191) NOT NULL,
    `barrio` VARCHAR(191) NOT NULL,
    `imagen` VARCHAR(191) NULL,
    `urlInstagram` VARCHAR(191) NULL,
    `urlTiktok` VARCHAR(191) NULL,
    `horarios` TEXT NOT NULL,
    `tieneKiosco` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medida_corporal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `unidad` VARCHAR(191) NOT NULL DEFAULT 'cm',
    `valor` DOUBLE NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notas` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `medida_corporal_usuarioId_tipo_fecha_idx`(`usuarioId`, `tipo`, `fecha`),
    INDEX `medida_corporal_usuarioId_fecha_idx`(`usuarioId`, `fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipo_medida_personalizada` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `clave` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `unidad` VARCHAR(191) NOT NULL DEFAULT 'cm',
    `icono` VARCHAR(191) NOT NULL DEFAULT '📏',
    `color` VARCHAR(191) NOT NULL DEFAULT '#3b82f6',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tipo_medida_personalizada_usuarioId_idx`(`usuarioId`),
    UNIQUE INDEX `tipo_medida_personalizada_usuarioId_clave_key`(`usuarioId`, `clave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `producto_kiosco` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sucursalId` INTEGER NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `categoria` VARCHAR(191) NOT NULL DEFAULT 'Bebidas',
    `precioCompra` DECIMAL(10, 2) NOT NULL,
    `precioVenta` DECIMAL(10, 2) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `stockMinimo` INTEGER NOT NULL DEFAULT 5,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `producto_kiosco_sucursalId_idx`(`sucursalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `venta_kiosco` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sucursalId` INTEGER NOT NULL,
    `productoId` INTEGER NOT NULL,
    `usuarioId` INTEGER NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `precioCompraUnitario` DECIMAL(10, 2) NOT NULL,
    `precioVentaUnitario` DECIMAL(10, 2) NOT NULL,
    `totalCosto` DECIMAL(10, 2) NOT NULL,
    `totalVenta` DECIMAL(10, 2) NOT NULL,
    `gananciaNeta` DECIMAL(10, 2) NOT NULL,
    `metodoPago` VARCHAR(191) NOT NULL DEFAULT 'Efectivo',
    `notas` VARCHAR(191) NULL,
    `fechaVenta` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `mes` INTEGER NOT NULL,
    `anio` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `venta_kiosco_sucursalId_anio_mes_idx`(`sucursalId`, `anio`, `mes`),
    INDEX `venta_kiosco_productoId_idx`(`productoId`),
    INDEX `venta_kiosco_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gasto_operativo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sucursalId` INTEGER NOT NULL,
    `concepto` VARCHAR(191) NOT NULL,
    `categoria` VARCHAR(191) NOT NULL DEFAULT 'Alquiler',
    `monto` DECIMAL(10, 2) NOT NULL,
    `metodoPago` VARCHAR(191) NOT NULL DEFAULT 'Transferencia',
    `comprobante` VARCHAR(191) NULL,
    `notas` TEXT NULL,
    `esRecurrente` BOOLEAN NOT NULL DEFAULT false,
    `fechaGasto` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `mes` INTEGER NOT NULL,
    `anio` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `gasto_operativo_sucursalId_anio_mes_idx`(`sucursalId`, `anio`, `mes`),
    INDEX `gasto_operativo_categoria_idx`(`categoria`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `usuario_sucursalId_idx` ON `usuario`(`sucursalId`);

-- AddForeignKey
ALTER TABLE `usuario` ADD CONSTRAINT `usuario_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medida_corporal` ADD CONSTRAINT `medida_corporal_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tipo_medida_personalizada` ADD CONSTRAINT `tipo_medida_personalizada_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `producto_kiosco` ADD CONSTRAINT `producto_kiosco_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `venta_kiosco` ADD CONSTRAINT `venta_kiosco_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `venta_kiosco` ADD CONSTRAINT `venta_kiosco_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `producto_kiosco`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `venta_kiosco` ADD CONSTRAINT `venta_kiosco_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gasto_operativo` ADD CONSTRAINT `gasto_operativo_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
