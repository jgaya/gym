-- =============================================================================
-- GYM MERAKI — SCRIPT DE POBLACIÓN DE DATOS DEMOSTRATIVOS (SQL)
-- =============================================================================
-- Propósito: Cargar datos ficticios completos y realistas para demostrar todas
-- las funcionalidades y vistas del sistema:
--   1. Múltiples Sucursales operativas (Centro, Palermo, Express)
--   2. Catálogo de Planes de membresía (2, 3, 5 y 6 días por semana)
--   3. Padrón integral de Usuarios:
--      - SuperAdmin, Admins de sede y Entrenadores
--      - Socios activos al día
--      - Socios en mora: recientes, alerta (+10 días) y morosos críticos (+15 días)
--      - Socios con ficha de salud completa, lesiones, medicación y contactos de emergencia
--      - Socios dados de baja / inactivos y socios sin plan/rutina asignada
--   4. Plantillas de Rutinas Multi-Día (Push/Pull/Legs, Fuerza 5 Días, Torso/Pierna)
--   5. Asignación de días y pesos personalizados de trabajo
--   6. Historial de sesiones y evolución temporal de cargas levantadas (gráficos de fuerza)
--   7. Registro y evolución de Medidas Corporales (% grasa, cintura, bíceps, peso)
--   8. Kiosco de mostrador: stock abundante, bajo stock, productos agotados y ventas
--   9. Gastos operativos mensuales (fijos y eventuales)
--  10. Cobranzas y pagos de cuotas para métricas de Economía y Margen Neto
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. SUCURSALES (3 Sedes con características diferenciadas)
-- -----------------------------------------------------------------------------
INSERT INTO `sucursal` (`id`, `telefono`, `direccion`, `barrio`, `imagen`, `urlInstagram`, `urlTiktok`, `horarios`, `tieneKiosco`, `isActive`, `createdAt`, `updatedAt`)
VALUES
  (1, '+54 9 249 412-3451', 'Av. Lunghi 2176', 'El Tropezón (Centro)', '/hero-gym.jpg', 'https://instagram.com/meraki.centro', 'https://tiktok.com/@meraki.tandil', 'Lun a Vie: 06:30 a 12:00 | 14:30 a 22:00\nSáb: 08:30 a 13:00', 1, 1, NOW(3), NOW(3)),
  (2, '+54 9 249 465-7890', 'Gral. Paz 850', 'Palermo / Parque', '/hero-gym.jpg', 'https://instagram.com/meraki.palermo', 'https://tiktok.com/@meraki.tandil', 'Lun a Vie: 07:00 a 22:00 corrido\nSáb: 09:00 a 14:00', 1, 1, NOW(3), NOW(3)),
  (3, '+54 9 249 488-9900', 'San Martín 420', 'Centro Histórico (Express)', '/hero-gym.jpg', 'https://instagram.com/meraki.express', NULL, 'Lun a Vie: 07:00 a 21:00\nSáb: Cerrado', 0, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `telefono` = VALUES(`telefono`),
  `direccion` = VALUES(`direccion`),
  `barrio` = VALUES(`barrio`),
  `horarios` = VALUES(`horarios`),
  `tieneKiosco` = VALUES(`tieneKiosco`),
  `isActive` = VALUES(`isActive`),
  `updatedAt` = NOW(3);

-- -----------------------------------------------------------------------------
-- 2. PLANES DE ENTRENAMIENTO
-- -----------------------------------------------------------------------------
INSERT INTO `plan` (`id`, `nombre`, `descripcion`, `diasPorSemana`, `precio`, `isActive`, `createdAt`, `updatedAt`)
VALUES
  (1, 'Plan Estándar 3 Días', 'Acceso de hasta 3 días por semana con rutina personalizada y seguimiento en sala.', 3, 28000.00, 1, NOW(3), NOW(3)),
  (2, 'Pase Libre 5 Días', 'Acceso ilimitado de lunes a viernes, rutinas multi-día y asesoramiento continuo.', 5, 38000.00, 1, NOW(3), NOW(3)),
  (3, 'Plan Inicial 2 Días', 'Ideal para principiantes, acondicionamiento y mantenimiento de salud.', 2, 22000.00, 1, NOW(3), NOW(3)),
  (4, 'Atleta Pro 6 Días', 'Para atletas de rendimiento, sobrecarga progresiva y preparación física avanzada.', 6, 45000.00, 1, NOW(3), NOW(3)),
  (5, 'Pase Fin de Semana', 'Acceso viernes por la tarde y sábados para entrenar sin apuro.', 2, 19500.00, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `descripcion` = VALUES(`descripcion`),
  `diasPorSemana` = VALUES(`diasPorSemana`),
  `precio` = VALUES(`precio`),
  `isActive` = VALUES(`isActive`),
  `updatedAt` = NOW(3);

-- -----------------------------------------------------------------------------
-- 3. USUARIOS (SuperAdmin, Admins, Entrenadores y Socios)
-- Password por defecto para personal: "admin123"
-- Hash: "a1b2c3d4e5f60718293a4b5c6d7e8f90:7c43f80888aec4f243a0260d244acb67ec6cf57fbd24d638206bd49f858714c66d1f344dfc0fd966549384e2021176646919ef63add209a8201a7ee09fab58f1"
-- Los socios (USER) pueden ingresar directamente ingresando su número de DNI.
-- -----------------------------------------------------------------------------
INSERT INTO `usuario` (
  `id`, `email`, `passwordHash`, `nombre`, `apellido`, `telefono`, `dni`, `direccion`,
  `birthDate`, `role`, `isActive`, `deletedAt`, `createdAt`, `updatedAt`, `sucursalId`, `planId`,
  `autorizadoPorMedico`, `tieneLesion`, `detalleLesion`, `tomaMedicacion`, `detalleMedicacion`,
  `tieneRestricciones`, `detalleRestricciones`, `observacionesSalud`,
  `emergenciaContacto`, `emergenciaParentesco`, `emergenciaTelefono`, `objetivos`
) VALUES
  
  -- 3.2 Socios Activos y Al Día (Pagaron el mes corriente Noviembre 2026)
  (10, 'mateo.rossi@email.com', NULL, 'Mateo', 'Rossi', '+54 9 249 411-1222', '40111222', 'Av. Colón 1020', '1998-05-18', 'USER', 1, NULL, NOW(3), NOW(3), 1, 2, 1, 0, NULL, 0, NULL, 0, NULL, 'Apto médico vigente hasta marzo 2027.', 'Elena Rossi', 'Madre', '+54 9 249 433-1122', '["hipertrofia", "fuerza"]'),
  (11, 'camila.benitez@email.com', NULL, 'Camila', 'Benítez', '+54 9 249 422-2333', '41222333', 'Rodríguez 840', '1999-09-03', 'USER', 1, NULL, NOW(3), NOW(3), 1, 1, 1, 0, NULL, 0, NULL, 0, NULL, 'Chequeo ergométrico sin particularidades.', 'Jorge Benítez', 'Padre', '+54 9 249 444-2233', '["perdida_grasa", "tonificacion"]'),
  (12, 'lucas.fernandez@email.com', NULL, 'Lucas', 'Fernández', '+54 9 249 433-3444', '42333444', 'Sarmiento 1450', '2000-01-22', 'USER', 1, NULL, NOW(3), NOW(3), 2, 1, 1, 1, 'Tendinitis en supraespinoso izquierdo en etapa de fortalecimiento', 0, NULL, 1, 'Evitar press militar tras nuca con cargas máximas', 'Derivado por kinesiólogo para fortalecimiento de manguito rotador', 'Patricia Fernández', 'Madre', '+54 9 249 455-3344', '["rehabilitacion", "fuerza"]'),
  (13, 'valentina.morales@email.com', NULL, 'Valentina', 'Morales', '+54 9 249 444-4555', '43444555', '9 de Julio 410', '2001-07-15', 'USER', 1, NULL, NOW(3), NOW(3), 2, 2, 1, 0, NULL, 0, NULL, 0, NULL, 'Muy buena constancia y técnica.', 'Roberto Morales', 'Padre', '+54 9 249 466-4455', '["salud", "tonificacion"]'),
  (21, 'facundo.medina@email.com', NULL, 'Facundo', 'Medina', '+54 9 249 412-2334', '51222333', 'Alem 890', '1997-10-10', 'USER', 1, NULL, NOW(3), NOW(3), 1, 4, 1, 0, NULL, 0, NULL, 0, NULL, 'Atleta avanzado de powerlifting y fuerza.', 'Silvia Medina', 'Madre', '+54 9 249 477-8899', '["fuerza", "rendimiento"]'),
  (22, 'mariana.sosa@email.com', NULL, 'Mariana', 'Sosa', '+54 9 249 423-3445', '52333444', 'San Lorenzo 670', '1984-03-29', 'USER', 1, NULL, NOW(3), NOW(3), 2, 3, 1, 0, NULL, 1, 'Enalapril 10mg diario por hipertensión arterial controlada', 1, 'Evitar maniobras de Valsalva prolongadas y pausas sin respirar', 'Control médico cardiológico semestral presentado en secretaría.', 'Gonzalo Sosa', 'Esposo', '+54 9 249 488-9900', '["salud", "cardiovascular"]'),
  (23, 'tomas.gimenez@email.com', NULL, 'Tomás', 'Giménez', '+54 9 249 434-4556', '53444555', 'Uriburu 1120', '2003-12-05', 'USER', 1, NULL, NOW(3), NOW(3), 2, 1, 1, 0, NULL, 0, NULL, 0, NULL, 'Estudiante universitario, entrena en turno vespertino.', 'Susana Giménez', 'Madre', '+54 9 249 499-0011', '["hipertrofia", "resistencia"]'),

  -- 3.3 Socios en Mora (Para poblar el Semáforo de Pagos en Economía y Alertas)
  -- Martín Díaz: Vencimiento día 10 de nov, sin pago en nov -> Mora Reciente (~10 días)
  (14, 'martin.diaz@email.com', NULL, 'Martín', 'Díaz', '+54 9 249 455-5666', '44555666', 'Av. Rivadavia 320', '1994-04-11', 'USER', 1, NULL, NOW(3), NOW(3), 1, 1, 1, 0, NULL, 0, NULL, 0, NULL, 'Pendiente de cobro cuota actual.', 'Estela Díaz', 'Madre', '+54 9 249 477-5566', '["hipertrofia"]'),
  -- Florencia Castro: Sin pagar mes actual, cuota vencida hace 12 días -> Alerta Naranja (+10 días)
  (15, 'florencia.castro@email.com', NULL, 'Florencia', 'Castro', '+54 9 249 466-6777', '45666777', 'Paz 1050', '1997-12-01', 'USER', 1, NULL, NOW(3), NOW(3), 2, 3, 1, 0, NULL, 0, NULL, 0, NULL, 'Avisada por WhatsApp de regularización.', 'Hugo Castro', 'Padre', '+54 9 249 488-6677', '["perdida_grasa"]'),
  -- Rodrigo Álvarez: Sin pagar Octubre ni Noviembre -> Moroso Crítico Rojo (+15 días)
  (16, 'rodrigo.alvarez@email.com', NULL, 'Rodrigo', 'Álvarez', '+54 9 249 477-7888', '46777888', 'Las Heras 780', '1993-06-19', 'USER', 1, NULL, NOW(3), NOW(3), 1, 2, 0, 0, NULL, 0, NULL, 0, NULL, 'Deuda de 2 períodos consecutivos. Solicitar regularización al ingresar.', 'Mirta Álvarez', 'Madre', '+54 9 249 499-7788', '["fuerza"]'),
  -- Antonella Ruiz: Sede Express, mora crítica acumulada
  (17, 'antonella.ruiz@email.com', NULL, 'Antonella', 'Ruiz', '+54 9 249 488-8999', '47888999', 'San Martín 180', '2002-08-20', 'USER', 1, NULL, NOW(3), NOW(3), 3, 1, 1, 0, NULL, 0, NULL, 0, NULL, 'Sin pago registrado en sistema.', 'Mario Ruiz', 'Padre', '+54 9 249 411-8899', '["tonificacion"]'),

  -- 3.4 Casos Especiales para Pruebas de Filtros en Tablas
  -- Esteban Navarro: Dado de baja (Inactivo)
  (18, 'esteban.navarro@email.com', NULL, 'Esteban', 'Navarro', '+54 9 249 499-9000', '48999000', 'España 910', '1991-03-04', 'USER', 0, '2026-10-15 10:00:00', NOW(3), NOW(3), 1, 1, 1, 0, NULL, 0, NULL, 0, NULL, 'Baja voluntaria por mudanza laboral.', 'Laura Navarro', 'Hermana', '+54 9 249 422-9900', '["mantenimiento"]'),
  -- Julieta Herrera: Recién inscripta, aún sin plan asignado
  (19, 'julieta.herrera@email.com', NULL, 'Julieta', 'Herrera', '+54 9 249 400-0111', '49000111', 'General Pinto 330', '2004-10-14', 'USER', 1, NULL, NOW(3), NOW(3), 1, NULL, 1, 0, NULL, 0, NULL, 0, NULL, 'Inscripción de mostrador pendiente de asignar plan.', 'Claudio Herrera', 'Padre', '+54 9 249 433-0011', '["salud"]'),
  -- Nicolás Romero: Con plan pero sin rutina asignada por el entrenador
  (20, 'nicolas.romero@email.com', NULL, 'Nicolás', 'Romero', '+54 9 249 411-1223', '50111222', 'San Martín 920', '2001-02-28', 'USER', 1, NULL, NOW(3), NOW(3), 2, 1, 1, 0, NULL, 0, NULL, 0, NULL, 'Esperando entrevista inicial con el profesor para armado de rutina.', 'Beatriz Romero', 'Madre', '+54 9 249 444-1122', '["hipertrofia"]')
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `apellido` = VALUES(`apellido`),
  `telefono` = VALUES(`telefono`),
  `role` = VALUES(`role`),
  `isActive` = VALUES(`isActive`),
  `deletedAt` = VALUES(`deletedAt`),
  `sucursalId` = VALUES(`sucursalId`),
  `planId` = VALUES(`planId`),
  `autorizadoPorMedico` = VALUES(`autorizadoPorMedico`),
  `tieneLesion` = VALUES(`tieneLesion`),
  `detalleLesion` = VALUES(`detalleLesion`),
  `tomaMedicacion` = VALUES(`tomaMedicacion`),
  `detalleMedicacion` = VALUES(`detalleMedicacion`),
  `tieneRestricciones` = VALUES(`tieneRestricciones`),
  `detalleRestricciones` = VALUES(`detalleRestricciones`),
  `observacionesSalud` = VALUES(`observacionesSalud`),
  `emergenciaContacto` = VALUES(`emergenciaContacto`),
  `emergenciaParentesco` = VALUES(`emergenciaParentesco`),
  `emergenciaTelefono` = VALUES(`emergenciaTelefono`),
  `objetivos` = VALUES(`objetivos`),
  `updatedAt` = NOW(3);

-- -----------------------------------------------------------------------------
-- 4. CATÁLOGO DE RUTINAS
-- -----------------------------------------------------------------------------
INSERT INTO `rutina` (`id`, `nombre`, `descripcion`, `esTemplate`, `createdAt`, `updatedAt`, `deletedAt`, `isActive`)
VALUES
  (1, 'Empuje — Pecho, Hombro y Tríceps', 'Enfoque en press con barra, sobrecarga progresiva y aislamiento de deltoides y tríceps.', 1, NOW(3), NOW(3), NULL, 1),
  (2, 'Tracción — Espalda, Posterior y Bíceps', 'Trabajo vertical y horizontal de dorsal ancho, deltoides posterior y flexores de codo.', 1, NOW(3), NOW(3), NULL, 1),
  (3, 'Piernas y Core — Tren Inferior Completo', 'Sentadillas, empuje de prensa pesada y trabajo de abdomen y zona media.', 1, NOW(3), NOW(3), NULL, 1),
  (4, 'Torso Fuerza e Hipertrofia', 'Sesión integral de torso combinando empujes pesados y tracciones controladas.', 1, NOW(3), NOW(3), NULL, 1),
  (5, 'Pierna y Cadena Posterior Enfoque Glúteo / Isquios', 'Enfoque en bisagra de cadera, femoral y estímulo directo a glúteos.', 1, NOW(3), NOW(3), NULL, 1),
  (6, 'Full Body Acondicionamiento Metabólico', 'Rutina de cuerpo completo para estímulo neuromuscular y gasto calórico.', 1, NOW(3), NOW(3), NULL, 1),
  (7, 'Brazos y Deltoides — Sesión de Bombeo', 'Dedicada al desarrollo de bíceps, tríceps y cabeza lateral del hombro.', 0, NOW(3), NOW(3), NULL, 1)
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `descripcion` = VALUES(`descripcion`),
  `esTemplate` = VALUES(`esTemplate`),
  `isActive` = VALUES(`isActive`),
  `updatedAt` = NOW(3);

-- -----------------------------------------------------------------------------
-- 5. PLANTILLAS DE RUTINA MULTI-DÍA (PlanRutinaTemplate y PlanRutinaTemplateDia)
-- -----------------------------------------------------------------------------
INSERT INTO `plan_rutina_template` (`id`, `nombre`, `descripcion`, `isActive`, `deletedAt`, `createdAt`, `updatedAt`, `planId`)
VALUES
  (1, 'Rutina Hipertrofia Clásica Push / Pull / Legs (3 Días)', 'Estructura óptima de frecuencia 1 para desarrollo muscular equilibrado en 3 sesiones semanales.', 1, NULL, NOW(3), NOW(3), 1),
  (2, 'Fuerza y Rendimiento Integral (5 Días)', 'Programa avanzado de 5 días con división de empuje, tracción, pierna, torso y full body.', 1, NULL, NOW(3), NOW(3), 2),
  (3, 'Acondicionamiento y Salud (2 Días)', 'Ideal para iniciación o deportistas con poco tiempo semanal que buscan estímulo completo.', 1, NULL, NOW(3), NOW(3), 3)
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `descripcion` = VALUES(`descripcion`),
  `isActive` = VALUES(`isActive`),
  `planId` = VALUES(`planId`),
  `updatedAt` = NOW(3);

INSERT INTO `plan_rutina_template_dia` (`id`, `templateId`, `diaNumero`, `nombreDia`, `rutinaId`, `createdAt`, `updatedAt`)
VALUES
  -- Template 1 (3 Días: Push / Pull / Legs)
  (1, 1, 1, 'Día 1 — Empuje (Pecho, Hombro, Tríceps)', 1, NOW(3), NOW(3)),
  (2, 1, 2, 'Día 2 — Tracción (Espalda, Posterior, Bíceps)', 2, NOW(3), NOW(3)),
  (3, 1, 3, 'Día 3 — Piernas y Abdomen', 3, NOW(3), NOW(3)),

  -- Template 2 (5 Días)
  (4, 2, 1, 'Día 1 — Pecho y Tríceps Pesado', 1, NOW(3), NOW(3)),
  (5, 2, 2, 'Día 2 — Espalda y Bíceps Densidad', 2, NOW(3), NOW(3)),
  (6, 2, 3, 'Día 3 — Pierna Cuádriceps y Prensa', 3, NOW(3), NOW(3)),
  (7, 2, 4, 'Día 4 — Torso Fuerza e Hipertrofia', 4, NOW(3), NOW(3)),
  (8, 2, 5, 'Día 5 — Full Body y Acondicionamiento', 6, NOW(3), NOW(3)),

  -- Template 3 (2 Días)
  (9, 3, 1, 'Día 1 — Torso y Core', 4, NOW(3), NOW(3)),
  (10, 3, 2, 'Día 2 — Piernas y Estabilidad', 3, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `nombreDia` = VALUES(`nombreDia`),
  `rutinaId` = VALUES(`rutinaId`),
  `updatedAt` = NOW(3);

-- -----------------------------------------------------------------------------
-- 6. EJERCICIOS DENTRO DE CADA RUTINA (rutina_ejercicio)
-- Se utilizan IDs reales existentes en el catálogo base (1=Banca, 2=Sentadilla, 3=Dominadas, etc.)
-- -----------------------------------------------------------------------------
INSERT INTO `rutina_ejercicio` (`id`, `rutinaId`, `ejercicioId`, `grupoNumero`, `orden`, `series`, `repeticiones`, `descansoSegundos`, `pesoSugerido`, `notas`)
VALUES
  -- Rutina 1: Empuje
  (1, 1, 1, 1, 1, 4, '8-10', 90, 60.0, 'Retracción escapular firme y descenso controlado al esternón.'),
  (2, 1, 4, 1, 2, 4, '10-12', 60, 16.0, 'Tronco firme, no hiper-extender la zona lumbar al empujar.'),
  (3, 1, 5, 2, 3, 3, '12-15', 60, 25.0, 'Codos pegados al cuerpo, buscar máxima extensión y contracción.'),
  (4, 1, 6, 2, 4, 3, '15-20', 45, 16.0, 'Empuje con cadera, mantener abdomen bien comprimido.'),

  -- Rutina 2: Tracción
  (5, 2, 3, 1, 1, 4, '6-8', 90, 0.0, 'Rango completo de movimiento. Si cuesta, usar banda elástica.'),
  (6, 2, 48, 1, 2, 4, '10-12', 60, 14.0, 'Agarre neutro para enfatizar braquiorradial y braquial anterior.'),
  (7, 2, 49, 2, 3, 3, '12', 60, 12.0, 'Rotación suave de muñecas en supinación al ascender.'),
  (8, 2, 10, 2, 4, 3, '15-20', 45, 30.0, 'Flexionar columna desde el abdomen sin tirar con los brazos.'),

  -- Rutina 3: Piernas
  (9, 3, 2, 1, 1, 4, '8-10', 120, 80.0, 'Profundidad paralela, rodillas alineadas con la punta de los pies.'),
  (10, 3, 93, 1, 2, 4, '10-12', 90, 140.0, 'Empujar con toda la planta del pie, no bloquear rodillas arriba.'),
  (11, 3, 11, 2, 3, 3, '15', 60, 40.0, 'Mantener tensión continua en la fase excéntrica.'),
  (12, 3, 14, 2, 4, 3, '15', 45, 0.0, 'Subir controlando desde la cadera sin impulsos bruscos.'),

  -- Rutina 4: Torso Fuerza
  (13, 4, 1, 1, 1, 4, '6-8', 120, 70.0, 'Foco en fuerza pura con pausa de 1 segundo en el pecho.'),
  (14, 4, 3, 1, 2, 4, '8', 90, 0.0, 'Tracción explosiva y descenso en 2 segundos.'),
  (15, 4, 4, 2, 3, 3, '10', 60, 18.0, 'Press vertical controlado.'),

  -- Rutina 6: Full Body
  (16, 6, 2, 1, 1, 3, '10', 90, 70.0, 'Activación de tren inferior.'),
  (17, 6, 1, 1, 2, 3, '10', 90, 50.0, 'Empuje horizontal.'),
  (18, 6, 3, 2, 3, 3, '8', 60, 0.0, 'Tracción vertical.'),
  (19, 6, 6, 2, 4, 3, '20', 45, 20.0, 'Finalizador metabólico con kettlebell.')
ON DUPLICATE KEY UPDATE
  `series` = VALUES(`series`),
  `repeticiones` = VALUES(`repeticiones`),
  `descansoSegundos` = VALUES(`descansoSegundos`),
  `pesoSugerido` = VALUES(`pesoSugerido`),
  `notas` = VALUES(`notas`);

-- -----------------------------------------------------------------------------
-- 7. ASIGNACIÓN DE DÍAS Y RUTINAS A CADA SOCIO (usuario_rutina_dia)
-- -----------------------------------------------------------------------------
INSERT INTO `usuario_rutina_dia` (`id`, `usuarioId`, `diaNumero`, `nombreDia`, `rutinaId`, `isActive`, `createdAt`, `updatedAt`)
VALUES
  -- Mateo Rossi (ID 10, Plan 5 Días)
  (1, 10, 1, 'Lunes — Empuje y Pecho', 1, 1, NOW(3), NOW(3)),
  (2, 10, 2, 'Martes — Tracción y Espalda', 2, 1, NOW(3), NOW(3)),
  (3, 10, 3, 'Miércoles — Pierna Pesada', 3, 1, NOW(3), NOW(3)),
  (4, 10, 4, 'Jueves — Torso Hipertrofia', 4, 1, NOW(3), NOW(3)),
  (5, 10, 5, 'Viernes — Full Body y Cardio', 6, 1, NOW(3), NOW(3)),

  -- Camila Benítez (ID 11, Plan 3 Días)
  (6, 11, 1, 'Lunes — Empuje', 1, 1, NOW(3), NOW(3)),
  (7, 11, 2, 'Miércoles — Tracción', 2, 1, NOW(3), NOW(3)),
  (8, 11, 3, 'Viernes — Piernas y Glúteos', 3, 1, NOW(3), NOW(3)),

  -- Lucas Fernández (ID 12, Plan 3 Días)
  (9, 12, 1, 'Lunes — Empuje Adaptado', 1, 1, NOW(3), NOW(3)),
  (10, 12, 2, 'Miércoles — Espalda y Bíceps', 2, 1, NOW(3), NOW(3)),
  (11, 12, 3, 'Viernes — Pierna y Core', 3, 1, NOW(3), NOW(3)),

  -- Valentina Morales (ID 13, Plan 5 Días)
  (12, 13, 1, 'Lunes — Torso', 4, 1, NOW(3), NOW(3)),
  (13, 13, 2, 'Martes — Pierna y Glúteos', 3, 1, NOW(3), NOW(3)),
  (14, 13, 3, 'Miércoles — Tracción', 2, 1, NOW(3), NOW(3)),
  (15, 13, 4, 'Jueves — Empuje', 1, 1, NOW(3), NOW(3)),
  (16, 13, 5, 'Viernes — Full Body', 6, 1, NOW(3), NOW(3)),

  -- Martín Díaz (ID 14, Plan 3 Días)
  (17, 14, 1, 'Lunes — Empuje', 1, 1, NOW(3), NOW(3)),
  (18, 14, 2, 'Miércoles — Tracción', 2, 1, NOW(3), NOW(3)),
  (19, 14, 3, 'Viernes — Piernas', 3, 1, NOW(3), NOW(3)),

  -- Mariana Sosa (ID 22, Plan 2 Días)
  (20, 22, 1, 'Martes — Torso y Salud', 4, 1, NOW(3), NOW(3)),
  (21, 22, 2, 'Jueves — Pierna y Estabilidad', 3, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `nombreDia` = VALUES(`nombreDia`),
  `rutinaId` = VALUES(`rutinaId`),
  `isActive` = VALUES(`isActive`),
  `updatedAt` = NOW(3);

-- -----------------------------------------------------------------------------
-- 8. PESOS ACTUALES CONFIGURADOS POR USUARIO (usuario_ejercicio)
-- -----------------------------------------------------------------------------
INSERT INTO `usuario_ejercicio` (`id`, `usuarioId`, `ejercicioId`, `pesoActual`, `series`, `repeticiones`, `notas`, `updatedAt`)
VALUES
  -- Mateo Rossi (ID 10)
  (1, 10, 1, 75.0, 4, '8-10', 'Progresó de 60kg a 75kg este trimestre.', NOW(3)),
  (2, 10, 2, 110.0, 4, '8-10', 'Sentadilla profunda y sólida.', NOW(3)),
  (3, 10, 3, 10.0, 4, '6-8', 'Dominadas con lastre de disco de 10kg.', NOW(3)),
  (4, 10, 4, 22.0, 4, '10-12', 'Mancuernas de 22kg por lado.', NOW(3)),
  (5, 10, 48, 18.0, 4, '10-12', 'Curl martillo con técnica estricta.', NOW(3)),

  -- Camila Benítez (ID 11)
  (6, 11, 1, 37.5, 4, '10', 'Barra olímpica de 20kg + 8.75kg por lado.', NOW(3)),
  (7, 11, 2, 65.0, 4, '10', 'Excelente progreso en sentadilla.', NOW(3)),
  (8, 11, 93, 120.0, 4, '12', 'Prensa a 45 grados con recorrido completo.', NOW(3)),
  (9, 11, 48, 9.0, 4, '12', 'Mancuernas de 9kg.', NOW(3)),

  -- Lucas Fernández (ID 12)
  (10, 12, 1, 55.0, 4, '10', 'Cuidando el hombro izquierdo.', NOW(3)),
  (11, 12, 3, 0.0, 4, '8', 'Peso corporal asistido si hay fatiga.', NOW(3))
ON DUPLICATE KEY UPDATE
  `pesoActual` = VALUES(`pesoActual`),
  `series` = VALUES(`series`),
  `repeticiones` = VALUES(`repeticiones`),
  `notas` = VALUES(`notas`),
  `updatedAt` = NOW(3);

-- -----------------------------------------------------------------------------
-- 9. HISTORIAL DE LEVANTAMIENTO Y EVOLUCIÓN DE FUERZA (historial_ejercicio)
-- Alimenta los gráficos temporales de sobrecarga progresiva y las asistencias del calendario
-- -----------------------------------------------------------------------------
INSERT INTO `historial_ejercicio` (`id`, `usuarioId`, `ejercicioId`, `sesionId`, `fecha`, `peso`, `seriesCompletadas`, `repeticionesLogradas`, `rpe`, `notas`, `createdAt`)
VALUES
  -- Mateo Rossi: Evolución en Press de Banca (Ejercicio 1) de Septiembre a Noviembre 2026
  (100, 10, 1, NULL, '2026-09-07 18:30:00', 60.0, 4, 10, 7, 'Inicio de mes con buena técnica.', '2026-09-07 18:30:00'),
  (101, 10, 1, NULL, '2026-09-14 18:45:00', 62.5, 4, 10, 8, 'Aumento de carga +2.5kg.', '2026-09-14 18:45:00'),
  (102, 10, 1, NULL, '2026-09-21 18:30:00', 65.0, 4, 9, 8, 'Control total en la bajada.', '2026-09-21 18:30:00'),
  (103, 10, 1, NULL, '2026-09-28 18:40:00', 67.5, 4, 8, 8, 'Cierre de septiembre muy firme.', '2026-09-28 18:40:00'),
  (104, 10, 1, NULL, '2026-10-05 18:30:00', 67.5, 4, 10, 8, 'Completó 10 repeticiones con el mismo peso.', '2026-10-05 18:30:00'),
  (105, 10, 1, NULL, '2026-10-12 18:35:00', 70.0, 4, 8, 9, 'Cruza la barrera de los 70kg.', '2026-10-12 18:35:00'),
  (106, 10, 1, NULL, '2026-10-19 18:30:00', 70.0, 4, 9, 9, 'Gran congestión muscular.', '2026-10-19 18:30:00'),
  (107, 10, 1, NULL, '2026-10-26 18:40:00', 72.5, 4, 8, 9, 'Sobre carga progresiva.', '2026-10-26 18:40:00'),
  (108, 10, 1, NULL, '2026-11-02 18:30:00', 72.5, 4, 9, 9, 'Excelente velocidad de barra.', '2026-11-02 18:30:00'),
  (109, 10, 1, NULL, '2026-11-09 18:30:00', 75.0, 4, 8, 9, 'Nuevo récord personal (PR).', '2026-11-09 18:30:00'),
  (110, 10, 1, NULL, '2026-11-16 18:30:00', 75.0, 4, 8, 8, 'Movimiento consolidado y seguro.', '2026-11-16 18:30:00'),

  -- Mateo Rossi: Evolución en Sentadilla (Ejercicio 2)
  (111, 10, 2, NULL, '2026-09-09 19:00:00', 85.0, 4, 10, 7, 'Sentadilla paralela cómoda.', '2026-09-09 19:00:00'),
  (112, 10, 2, NULL, '2026-09-23 19:15:00', 92.5, 4, 8, 8, 'Muy buena postura lumbar.', '2026-09-23 19:15:00'),
  (113, 10, 2, NULL, '2026-10-07 19:00:00', 97.5, 4, 8, 8, 'Aceleración al salir del fondo.', '2026-10-07 19:00:00'),
  (114, 10, 2, NULL, '2026-10-21 19:10:00', 102.5, 4, 8, 9, 'Entrando en las 3 cifras.', '2026-10-21 19:10:00'),
  (115, 10, 2, NULL, '2026-11-04 19:00:00', 107.5, 4, 8, 9, 'Cargas pesadas.', '2026-11-04 19:00:00'),
  (116, 10, 2, NULL, '2026-11-18 19:00:00', 110.0, 4, 8, 9, '110kg sólidos con buena profundidad.', '2026-11-18 19:00:00'),

  -- Camila Benítez: Evolución en Sentadilla (Ejercicio 2)
  (117, 11, 2, NULL, '2026-09-11 18:00:00', 45.0, 4, 12, 7, 'Base técnica perfecta.', '2026-09-11 18:00:00'),
  (118, 11, 2, NULL, '2026-09-25 18:15:00', 50.0, 4, 10, 8, 'Subiendo de a 2.5kg por lado.', '2026-09-25 18:15:00'),
  (119, 11, 2, NULL, '2026-10-09 18:00:00', 55.0, 4, 10, 8, 'Gran estabilidad.', '2026-10-09 18:00:00'),
  (120, 11, 2, NULL, '2026-10-23 18:10:00', 60.0, 4, 10, 9, 'Cuerpo adaptado a la carga.', '2026-10-23 18:10:00'),
  (121, 11, 2, NULL, '2026-11-06 18:00:00', 62.5, 4, 10, 9, 'Fuerza en aumento.', '2026-11-06 18:00:00'),
  (122, 11, 2, NULL, '2026-11-13 18:00:00', 65.0, 4, 10, 9, '65kg logrados con técnica impecable.', '2026-11-13 18:00:00'),

  -- Camila Benítez: Evolución en Prensa a 45º (Ejercicio 93)
  (123, 11, 93, NULL, '2026-09-11 18:25:00', 80.0, 4, 12, 7, 'Prensa controlada.', '2026-09-11 18:25:00'),
  (124, 11, 93, NULL, '2026-10-09 18:30:00', 100.0, 4, 12, 8, 'Fuerza en piernas y glúteos.', '2026-10-09 18:30:00'),
  (125, 11, 93, NULL, '2026-11-13 18:30:00', 120.0, 4, 12, 9, 'Prensa pesada con 120kg.', '2026-11-13 18:30:00')
ON DUPLICATE KEY UPDATE
  `peso` = VALUES(`peso`),
  `seriesCompletadas` = VALUES(`seriesCompletadas`),
  `repeticionesLogradas` = VALUES(`repeticionesLogradas`),
  `rpe` = VALUES(`rpe`),
  `notas` = VALUES(`notas`);

-- -----------------------------------------------------------------------------
-- 10. MEDIDAS CORPORALES Y EVOLUCIÓN FÍSICA (medida_corporal)
-- Alimenta la sección "Mis Medidas" (/mis-medidas) con gráficos y tablas de progreso
-- -----------------------------------------------------------------------------
INSERT INTO `medida_corporal` (`id`, `usuarioId`, `tipo`, `nombre`, `unidad`, `valor`, `fecha`, `notas`, `createdAt`, `updatedAt`)
VALUES
  -- Mateo Rossi (ID 10): Recomposición corporal (baja grasa, sube masa muscular y contorno de brazo/pecho)
  -- Agosto 2026
  (1, 10, 'peso', 'Peso Corporal', 'kg', 85.0, '2026-08-15 08:00:00', 'Pesaje en ayunas al inicio de temporada.', NOW(3), NOW(3)),
  (2, 10, 'cintura', 'Cintura', 'cm', 89.0, '2026-08-15 08:05:00', 'Perímetro umbilical.', NOW(3), NOW(3)),
  (3, 10, 'biceps', 'Bíceps', 'cm', 36.0, '2026-08-15 08:10:00', 'Brazo contraído a 90 grados.', NOW(3), NOW(3)),
  (4, 10, 'pecho', 'Pecho / Torso', 'cm', 101.0, '2026-08-15 08:15:00', 'Contorno torácico en reposo.', NOW(3), NOW(3)),
  (5, 10, 'porcentajeGrasa', '% Grasa Corporal', '%', 21.5, '2026-08-15 08:20:00', 'Bioimpedancia 8 puntos.', NOW(3), NOW(3)),

  -- Septiembre 2026
  (6, 10, 'peso', 'Peso Corporal', 'kg', 83.4, '2026-09-15 08:00:00', 'Menos retención, mejor definición.', NOW(3), NOW(3)),
  (7, 10, 'cintura', 'Cintura', 'cm', 87.0, '2026-09-15 08:05:00', '-2cm de cintura.', NOW(3), NOW(3)),
  (8, 10, 'biceps', 'Bíceps', 'cm', 36.8, '2026-09-15 08:10:00', '+0.8cm ganancia muscular.', NOW(3), NOW(3)),
  (9, 10, 'pecho', 'Pecho / Torso', 'cm', 102.5, '2026-09-15 08:15:00', 'Mayor densidad en pectorales.', NOW(3), NOW(3)),
  (10, 10, 'porcentajeGrasa', '% Grasa Corporal', '%', 19.8, '2026-09-15 08:20:00', 'Descendiendo grasa visceral.', NOW(3), NOW(3)),

  -- Octubre 2026
  (11, 10, 'peso', 'Peso Corporal', 'kg', 82.0, '2026-10-15 08:00:00', 'Excelente forma física.', NOW(3), NOW(3)),
  (12, 10, 'cintura', 'Cintura', 'cm', 85.0, '2026-10-15 08:05:00', 'Abdominales visibles.', NOW(3), NOW(3)),
  (13, 10, 'biceps', 'Bíceps', 'cm', 37.5, '2026-10-15 08:10:00', 'Creciendo en volumen limpio.', NOW(3), NOW(3)),
  (14, 10, 'pecho', 'Pecho / Torso', 'cm', 104.0, '2026-10-15 08:15:00', 'Expansión dorsal y pectoral.', NOW(3), NOW(3)),
  (15, 10, 'porcentajeGrasa', '% Grasa Corporal', '%', 18.0, '2026-10-15 08:20:00', 'Pliegues subcutáneos reducidos.', NOW(3), NOW(3)),

  -- Noviembre 2026
  (16, 10, 'peso', 'Peso Corporal', 'kg', 80.8, '2026-11-15 08:00:00', 'Objetivo del cuatrimestre alcanzado.', NOW(3), NOW(3)),
  (17, 10, 'cintura', 'Cintura', 'cm', 83.0, '2026-11-15 08:05:00', 'Reducción total de 6cm de cintura.', NOW(3), NOW(3)),
  (18, 10, 'biceps', 'Bíceps', 'cm', 38.2, '2026-11-15 08:10:00', '+2.2cm de brazo limpio.', NOW(3), NOW(3)),
  (19, 10, 'pecho', 'Pecho / Torso', 'cm', 105.5, '2026-11-15 08:15:00', 'Excelente estructura en V.', NOW(3), NOW(3)),
  (20, 10, 'porcentajeGrasa', '% Grasa Corporal', '%', 16.5, '2026-11-15 08:20:00', 'Punto óptimo de salud y estética.', NOW(3), NOW(3)),

  -- Camila Benítez (ID 11): Tonificación, reducción de cintura y aumento de glúteos/muslo
  (21, 11, 'peso', 'Peso Corporal', 'kg', 64.2, '2026-08-20 09:00:00', 'Inicio plan nutrición + gym.', NOW(3), NOW(3)),
  (22, 11, 'cintura', 'Cintura', 'cm', 74.0, '2026-08-20 09:05:00', 'Cintura inicial.', NOW(3), NOW(3)),
  (23, 11, 'cadera', 'Cadera / Glúteos', 'cm', 99.0, '2026-08-20 09:10:00', 'Punto de mayor prominencia.', NOW(3), NOW(3)),
  (24, 11, 'muslo', 'Muslo / Pierna', 'cm', 56.0, '2026-08-20 09:15:00', 'Muslo medio.', NOW(3), NOW(3)),
  (25, 11, 'porcentajeGrasa', '% Grasa Corporal', '%', 26.5, '2026-08-20 09:20:00', 'Medición plicometría.', NOW(3), NOW(3)),

  (26, 11, 'peso', 'Peso Corporal', 'kg', 62.4, '2026-09-20 09:00:00', 'Mejora en energía y tono.', NOW(3), NOW(3)),
  (27, 11, 'cintura', 'Cintura', 'cm', 71.5, '2026-09-20 09:05:00', '-2.5cm.', NOW(3), NOW(3)),
  (28, 11, 'cadera', 'Cadera / Glúteos', 'cm', 98.5, '2026-09-20 09:10:00', 'Glúteo más firme.', NOW(3), NOW(3)),
  (29, 11, 'muslo', 'Muslo / Pierna', 'cm', 56.8, '2026-09-20 09:15:00', 'Ganancia muscular limpia.', NOW(3), NOW(3)),
  (30, 11, 'porcentajeGrasa', '% Grasa Corporal', '%', 24.0, '2026-09-20 09:20:00', '-2.5% grasa.', NOW(3), NOW(3)),

  (31, 11, 'peso', 'Peso Corporal', 'kg', 60.8, '2026-10-20 09:00:00', 'Mayor fuerza en entrenamientos.', NOW(3), NOW(3)),
  (32, 11, 'cintura', 'Cintura', 'cm', 69.5, '2026-10-20 09:05:00', 'Cintura angosta y tonificada.', NOW(3), NOW(3)),
  (33, 11, 'cadera', 'Cadera / Glúteos', 'cm', 98.0, '2026-10-20 09:10:00', 'Forma atlética.', NOW(3), NOW(3)),
  (34, 11, 'muslo', 'Muslo / Pierna', 'cm', 57.5, '2026-10-20 09:15:00', 'Muslo firme y fuerte.', NOW(3), NOW(3)),
  (35, 11, 'porcentajeGrasa', '% Grasa Corporal', '%', 22.0, '2026-10-20 09:20:00', 'Excelente progresión.', NOW(3), NOW(3)),

  (36, 11, 'peso', 'Peso Corporal', 'kg', 59.8, '2026-11-18 09:00:00', 'Peso ideal consolidado.', NOW(3), NOW(3)),
  (37, 11, 'cintura', 'Cintura', 'cm', 68.0, '2026-11-18 09:05:00', 'Total -6cm de cintura.', NOW(3), NOW(3)),
  (38, 11, 'cadera', 'Cadera / Glúteos', 'cm', 98.0, '2026-11-18 09:10:00', 'Excelente proyección glútea.', NOW(3), NOW(3)),
  (39, 11, 'muslo', 'Muslo / Pierna', 'cm', 58.0, '2026-11-18 09:15:00', 'Cuádriceps definido.', NOW(3), NOW(3)),
  (40, 11, 'porcentajeGrasa', '% Grasa Corporal', '%', 20.5, '2026-11-18 09:20:00', 'Punto óptimo atlético.', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `unidad` = VALUES(`unidad`),
  `valor` = VALUES(`valor`),
  `notas` = VALUES(`notas`),
  `updatedAt` = NOW(3);

-- -----------------------------------------------------------------------------
-- 11. PRODUCTOS DE KIOSCO Y SUPLEMENTACIÓN (producto_kiosco)
-- Con diferentes niveles de stock para verificar estados: Stock OK, Stock Bajo y Agotado
-- -----------------------------------------------------------------------------
INSERT INTO `producto_kiosco` (`id`, `sucursalId`, `nombre`, `categoria`, `precioCompra`, `precioVenta`, `stock`, `stockMinimo`, `isActive`, `createdAt`, `updatedAt`)
VALUES
  -- Sede Centro (Sucursal 1)
  (1, 1, 'Gatorade Frutos Tropicales 500ml', 'Bebidas', 1200.00, 2400.00, 32, 8, 1, NOW(3), NOW(3)),
  (2, 1, 'Gatorade Cool Blue 500ml', 'Bebidas', 1200.00, 2400.00, 24, 8, 1, NOW(3), NOW(3)),
  (3, 1, 'Agua Mineral Glaciar 500ml', 'Bebidas', 500.00, 1200.00, 48, 12, 1, NOW(3), NOW(3)),
  (4, 1, 'Barra Ena Protein Crisp Vainilla', 'Snacks', 1400.00, 2800.00, 18, 6, 1, NOW(3), NOW(3)),
  (5, 1, 'Barra Ena Protein Crisp Chocolate', 'Snacks', 1400.00, 2800.00, 14, 6, 1, NOW(3), NOW(3)),
  (6, 1, 'Proteína Whey Gold Scoop 30g', 'Suplementos', 1800.00, 3500.00, 30, 10, 1, NOW(3), NOW(3)),
  (7, 1, 'Monster Energy Green 473ml', 'Bebidas', 2000.00, 3900.00, 3, 6, 1, NOW(3), NOW(3)), -- Bajo Stock (Alerta)
  (8, 1, 'Shaker Meraki Pro 700ml', 'Accesorios', 3500.00, 7500.00, 12, 4, 1, NOW(3), NOW(3)),
  (9, 1, 'Toalla Microfibra Secado Rápido', 'Indumentaria', 4200.00, 8900.00, 0, 4, 1, NOW(3), NOW(3)), -- Sin Stock (Agotado)
  (10, 1, 'Creatina Monohidrato Creapure 300g', 'Suplementos', 19000.00, 34000.00, 6, 2, 1, NOW(3), NOW(3)),

  -- Sede Palermo (Sucursal 2)
  (11, 2, 'Gatorade Frutos Tropicales 500ml', 'Bebidas', 1200.00, 2400.00, 20, 6, 1, NOW(3), NOW(3)),
  (12, 2, 'Agua Mineral Glaciar 500ml', 'Bebidas', 500.00, 1200.00, 36, 10, 1, NOW(3), NOW(3)),
  (13, 2, 'Barra Ena Protein Crisp Chocolate', 'Snacks', 1400.00, 2800.00, 2, 5, 1, NOW(3), NOW(3)), -- Bajo Stock
  (14, 2, 'Proteína Whey Gold Scoop 30g', 'Suplementos', 1800.00, 3500.00, 16, 6, 1, NOW(3), NOW(3)),
  (15, 2, 'Creatina Monohidrato Creapure 300g', 'Suplementos', 19000.00, 34000.00, 4, 2, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `categoria` = VALUES(`categoria`),
  `precioCompra` = VALUES(`precioCompra`),
  `precioVenta` = VALUES(`precioVenta`),
  `stock` = VALUES(`stock`),
  `stockMinimo` = VALUES(`stockMinimo`),
  `isActive` = VALUES(`isActive`),
  `updatedAt` = NOW(3);

-- -----------------------------------------------------------------------------
-- 12. VENTAS DE MOSTRADOR / KIOSCO (venta_kiosco)
-- Con socios identificados y ventas de mostrador al paso, en diferentes métodos de pago
-- -----------------------------------------------------------------------------
INSERT INTO `venta_kiosco` (
  `id`, `sucursalId`, `productoId`, `usuarioId`, `cantidad`,
  `precioCompraUnitario`, `precioVentaUnitario`, `totalCosto`, `totalVenta`, `gananciaNeta`,
  `metodoPago`, `notas`, `fechaVenta`, `mes`, `anio`, `createdAt`
) VALUES
  -- Ventas Noviembre 2026 (Mes Actual)
  (1, 1, 1, 10, 2, 1200.00, 2400.00, 2400.00, 4800.00, 2400.00, 'Efectivo', 'Mateo Rossi post entrenamiento', '2026-11-03 19:30:00', 11, 2026, NOW(3)),
  (2, 1, 6, 10, 1, 1800.00, 3500.00, 1800.00, 3500.00, 1700.00, 'Mercado Pago', 'Scoop proteína en el momento', '2026-11-04 20:00:00', 11, 2026, NOW(3)),
  (3, 1, 4, 11, 1, 1400.00, 2800.00, 1400.00, 2800.00, 1400.00, 'Efectivo', 'Barra vainilla Camila B.', '2026-11-05 19:15:00', 11, 2026, NOW(3)),
  (4, 1, 3, 11, 1, 500.00, 1200.00, 500.00, 1200.00, 700.00, 'Efectivo', 'Agua fresca', '2026-11-07 18:00:00', 11, 2026, NOW(3)),
  (5, 1, 7, NULL, 1, 2000.00, 3900.00, 2000.00, 3900.00, 1900.00, 'Mercado Pago', 'Venta mostrador al paso', '2026-11-08 17:45:00', 11, 2026, NOW(3)),
  (6, 1, 8, 21, 1, 3500.00, 7500.00, 3500.00, 7500.00, 4000.00, 'Transferencia', 'Shaker Meraki Facundo M.', '2026-11-10 19:30:00', 11, 2026, NOW(3)),
  (7, 1, 10, 10, 1, 19000.00, 34000.00, 19000.00, 34000.00, 15000.00, 'Transferencia', 'Pote Creatina Creapure Mateo R.', '2026-11-12 18:30:00', 11, 2026, NOW(3)),
  (8, 2, 11, 13, 2, 1200.00, 2400.00, 2400.00, 4800.00, 2400.00, 'Efectivo', 'Valentina M. 2 Gatorades', '2026-11-11 19:00:00', 11, 2026, NOW(3)),
  (9, 2, 14, 12, 1, 1800.00, 3500.00, 1800.00, 3500.00, 1700.00, 'Tarjeta de Débito', 'Lucas F. post entreno', '2026-11-13 18:45:00', 11, 2026, NOW(3)),
  (10, 2, 12, NULL, 3, 500.00, 1200.00, 1500.00, 3600.00, 2100.00, 'Efectivo', 'Pack 3 aguas mostrador', '2026-11-15 11:30:00', 11, 2026, NOW(3)),

  -- Ventas Octubre 2026 (Histórico)
  (11, 1, 1, 10, 3, 1200.00, 2400.00, 3600.00, 7200.00, 3600.00, 'Efectivo', 'Ventas del mes Mateo R.', '2026-10-10 19:00:00', 10, 2026, NOW(3)),
  (12, 1, 4, 11, 2, 1400.00, 2800.00, 2800.00, 5600.00, 2800.00, 'Efectivo', 'Barras proteína Camila B.', '2026-10-14 18:30:00', 10, 2026, NOW(3)),
  (13, 1, 10, 21, 1, 19000.00, 34000.00, 19000.00, 34000.00, 15000.00, 'Transferencia', 'Creatina Facundo Medina', '2026-10-18 20:00:00', 10, 2026, NOW(3)),
  (14, 2, 11, 13, 2, 1200.00, 2400.00, 2400.00, 4800.00, 2400.00, 'Mercado Pago', 'Bebidas isotónicas', '2026-10-22 19:30:00', 10, 2026, NOW(3)),
  (15, 2, 12, NULL, 4, 500.00, 1200.00, 2000.00, 4800.00, 2800.00, 'Efectivo', 'Agua para atletas de clase', '2026-10-25 10:15:00', 10, 2026, NOW(3))
ON DUPLICATE KEY UPDATE
  `cantidad` = VALUES(`cantidad`),
  `totalCosto` = VALUES(`totalCosto`),
  `totalVenta` = VALUES(`totalVenta`),
  `gananciaNeta` = VALUES(`gananciaNeta`),
  `metodoPago` = VALUES(`metodoPago`),
  `notas` = VALUES(`notas`);

-- -----------------------------------------------------------------------------
-- 13. GASTOS OPERATIVOS Y EGRESOS POR SEDE (gasto_operativo)
-- Alimenta el cálculo de balance neto: Cuotas + Kiosco - Gastos = Margen Neto
-- -----------------------------------------------------------------------------
INSERT INTO `gasto_operativo` (
  `id`, `sucursalId`, `concepto`, `categoria`, `monto`, `metodoPago`,
  `comprobante`, `notas`, `esRecurrente`, `fechaGasto`, `mes`, `anio`, `createdAt`, `updatedAt`
) VALUES
  -- Noviembre 2026 (Mes Actual) — Sede Centro
  (1, 1, 'Alquiler Mensual Local Av. Lunghi', 'Alquiler', 480000.00, 'Transferencia', 'FACT-A-0012-00441', 'Contrato vigente al día.', 1, '2026-11-05 10:00:00', 11, 2026, NOW(3), NOW(3)),
  (2, 1, 'Honorarios Profesores y Entrenadores', 'Profesores', 720000.00, 'Transferencia', 'REC-HON-NOV-26', 'Liquidación equipo docente sala de pesas.', 1, '2026-11-06 14:00:00', 11, 2026, NOW(3), NOW(3)),
  (3, 1, 'Factura Usina / Energía Eléctrica', 'Luz y Servicios', 135000.00, 'Débito Automático', 'SERV-LUZ-112026', 'Consumo aires acondicionados e iluminación LED.', 0, '2026-11-10 11:30:00', 11, 2026, NOW(3), NOW(3)),
  (4, 1, 'Reposición de Cables de Polea y Mosquetones', 'Reposición de Máquinas', 45000.00, 'Transferencia', 'MANT-8891', 'Mantenimiento preventivo de poleas altas y bajas.', 0, '2026-11-12 16:00:00', 11, 2026, NOW(3), NOW(3)),
  (5, 1, 'Insumos de Limpieza y Dispensers de Alcohol', 'Limpieza e Insumos', 58000.00, 'Efectivo', 'TICK-LIM-4412', 'Lavandina, desinfectante de colchonetas y papel toalla.', 0, '2026-11-14 09:30:00', 11, 2026, NOW(3), NOW(3)),
  (6, 1, 'Campaña Publicitaria Redes Meta Ads', 'Marketing', 40000.00, 'Mercado Pago', 'FB-ADS-NOV26', 'Atracción de nuevos socios para la temporada.', 0, '2026-11-08 12:00:00', 11, 2026, NOW(3), NOW(3)),

  -- Noviembre 2026 (Mes Actual) — Sede Palermo
  (7, 2, 'Alquiler Mensual Local Gral. Paz', 'Alquiler', 420000.00, 'Transferencia', 'FACT-B-0005-00192', 'Alquiler sede Palermo.', 1, '2026-11-05 10:30:00', 11, 2026, NOW(3), NOW(3)),
  (8, 2, 'Honorarios Profesores de Turno', 'Profesores', 540000.00, 'Transferencia', 'REC-HON-PAL-NOV', 'Equipo docente sede Palermo.', 1, '2026-11-06 14:30:00', 11, 2026, NOW(3), NOW(3)),
  (9, 2, 'Servicio Eléctrico y Gas', 'Luz y Servicios', 98000.00, 'Débito Automático', 'SERV-PAL-1126', 'Facturas de servicios del local.', 0, '2026-11-09 10:00:00', 11, 2026, NOW(3), NOW(3)),
  (10, 2, 'Insumos de Higiene y Vestuarios', 'Limpieza e Insumos', 42000.00, 'Efectivo', 'TICK-LIM-PAL-09', 'Jabón líquido, papel y cloro.', 0, '2026-11-11 11:00:00', 11, 2026, NOW(3), NOW(3)),

  -- Octubre 2026 (Histórico para gráficos de evolución)
  (11, 1, 'Alquiler Mensual Local Av. Lunghi', 'Alquiler', 480000.00, 'Transferencia', 'FACT-A-0012-00390', 'Período Octubre.', 1, '2026-10-05 10:00:00', 10, 2026, NOW(3), NOW(3)),
  (12, 1, 'Honorarios Profesores y Entrenadores', 'Profesores', 700000.00, 'Transferencia', 'REC-HON-OCT-26', 'Liquidación mensual docentes.', 1, '2026-10-06 14:00:00', 10, 2026, NOW(3), NOW(3)),
  (13, 1, 'Servicio de Luz y Gas Octubre', 'Luz y Servicios', 120000.00, 'Débito Automático', 'SERV-LUZ-102026', 'Consumo general.', 0, '2026-10-10 11:00:00', 10, 2026, NOW(3), NOW(3)),
  (14, 2, 'Alquiler Mensual Local Gral. Paz', 'Alquiler', 420000.00, 'Transferencia', 'FACT-B-0005-00180', 'Período Octubre sede Palermo.', 1, '2026-10-05 10:30:00', 10, 2026, NOW(3), NOW(3)),
  (15, 2, 'Honorarios Profesores Sede Palermo', 'Profesores', 520000.00, 'Transferencia', 'REC-HON-PAL-OCT', 'Equipo docente.', 1, '2026-10-06 14:30:00', 10, 2026, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `concepto` = VALUES(`concepto`),
  `categoria` = VALUES(`categoria`),
  `monto` = VALUES(`monto`),
  `metodoPago` = VALUES(`metodoPago`),
  `comprobante` = VALUES(`comprobante`),
  `notas` = VALUES(`notas`),
  `esRecurrente` = VALUES(`esRecurrente`),
  `updatedAt` = NOW(3);

-- -----------------------------------------------------------------------------
-- 14. PAGOS DE CUOTAS / MEMBRESÍAS (pago)
-- Registra los pagos de cuotas para los socios al día en Noviembre 2026 e históricos en Octubre
-- (Los socios 14, 15, 16, 17 intencionalmente NO tienen fila en Noviembre para figurar en mora)
-- -----------------------------------------------------------------------------
INSERT INTO `pago` (
  `id`, `usuarioId`, `mes`, `anio`, `monto`, `fechaPago`, `metodoPago`, `comprobante`, `notas`, `createdAt`, `updatedAt`
) VALUES
  -- Pagos Noviembre 2026 (Socios Al Día)
  (1, 10, 11, 2026, 38000.00, '2026-11-04 18:30:00', 'Transferencia', 'TRANSF-GAL-99214', 'Cuota Pase Libre 5 Días Mateo Rossi.', NOW(3), NOW(3)),
  (2, 11, 11, 2026, 28000.00, '2026-11-05 19:00:00', 'Mercado Pago', 'MP-CHECKOUT-881234', 'Pago digital con Mercado Pago Camila Benítez.', NOW(3), NOW(3)),
  (3, 12, 11, 2026, 28000.00, '2026-11-06 18:15:00', 'Transferencia', 'TRANSF-BBVA-44120', 'Plan 3 Días Lucas Fernández.', NOW(3), NOW(3)),
  (4, 13, 11, 2026, 38000.00, '2026-11-03 17:45:00', 'Efectivo', 'REC-MOSTR-001142', 'Abonó en recepción Valentina Morales.', NOW(3), NOW(3)),
  (5, 21, 11, 2026, 45000.00, '2026-11-02 16:30:00', 'Transferencia', 'TRANSF-SANT-11029', 'Plan Atleta Pro 6 Días Facundo Medina.', NOW(3), NOW(3)),
  (6, 22, 11, 2026, 22000.00, '2026-11-08 10:30:00', 'Efectivo', 'REC-MOSTR-001150', 'Plan 2 Días Mariana Sosa.', NOW(3), NOW(3)),
  (7, 23, 11, 2026, 28000.00, '2026-11-07 19:20:00', 'Mercado Pago', 'MP-CHECKOUT-881559', 'Plan 3 Días Tomás Giménez.', NOW(3), NOW(3)),

  -- Pagos Octubre 2026 (Histórico para ver comparativa intermensual)
  (8, 10, 10, 2026, 38000.00, '2026-10-04 18:30:00', 'Transferencia', 'TRANSF-GAL-88102', 'Cuota Octubre Mateo R.', NOW(3), NOW(3)),
  (9, 11, 10, 2026, 28000.00, '2026-10-05 19:00:00', 'Mercado Pago', 'MP-OCT-77112', 'Cuota Octubre Camila B.', NOW(3), NOW(3)),
  (10, 12, 10, 2026, 28000.00, '2026-10-06 18:15:00', 'Transferencia', 'TRANSF-BBVA-33019', 'Cuota Octubre Lucas F.', NOW(3), NOW(3)),
  (11, 13, 10, 2026, 38000.00, '2026-10-03 17:45:00', 'Efectivo', 'REC-MOSTR-000980', 'Cuota Octubre Valentina M.', NOW(3), NOW(3)),
  (12, 14, 10, 2026, 28000.00, '2026-10-08 19:00:00', 'Efectivo', 'REC-MOSTR-000995', 'Último pago de Martín Díaz (al día en oct, adeuda nov).', NOW(3), NOW(3)),
  (13, 21, 10, 2026, 45000.00, '2026-10-02 16:30:00', 'Transferencia', 'TRANSF-SANT-99014', 'Cuota Octubre Facundo M.', NOW(3), NOW(3)),
  (14, 22, 10, 2026, 22000.00, '2026-10-08 10:30:00', 'Efectivo', 'REC-MOSTR-001011', 'Cuota Octubre Mariana S.', NOW(3), NOW(3)),
  (15, 23, 10, 2026, 28000.00, '2026-10-07 19:20:00', 'Mercado Pago', 'MP-OCT-77441', 'Cuota Octubre Tomás G.', NOW(3), NOW(3)),

  -- Septiembre 2026 (Para curva trimestral de evolución económica)
  (16, 10, 9, 2026, 35000.00, '2026-09-04 18:30:00', 'Transferencia', 'TRANSF-GAL-77011', 'Cuota Septiembre Mateo R.', NOW(3), NOW(3)),
  (17, 11, 9, 2026, 26000.00, '2026-09-05 19:00:00', 'Mercado Pago', 'MP-SEP-66112', 'Cuota Septiembre Camila B.', NOW(3), NOW(3)),
  (18, 12, 9, 2026, 26000.00, '2026-09-06 18:15:00', 'Transferencia', 'TRANSF-BBVA-22019', 'Cuota Septiembre Lucas F.', NOW(3), NOW(3)),
  (19, 13, 9, 2026, 35000.00, '2026-09-03 17:45:00', 'Efectivo', 'REC-MOSTR-000850', 'Cuota Septiembre Valentina M.', NOW(3), NOW(3)),
  (20, 15, 9, 2026, 20000.00, '2026-09-08 19:00:00', 'Efectivo', 'REC-MOSTR-000870', 'Último pago de Florencia Castro (en mora desde octubre).', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `monto` = VALUES(`monto`),
  `fechaPago` = VALUES(`fechaPago`),
  `metodoPago` = VALUES(`metodoPago`),
  `comprobante` = VALUES(`comprobante`),
  `notas` = VALUES(`notas`),
  `updatedAt` = NOW(3);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- FIN DEL SCRIPT DEMO
-- =============================================================================
