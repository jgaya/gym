import "dotenv/config";
import { prisma } from "../lib/prisma.ts";
import { Role } from "../lib/generated/prisma/enums.ts";
import { hashPassword } from "../src/lib/password.ts";

async function main() {
  console.log("🌱 Iniciando seed de la base de datos de Gym Meraki...");

  // ---------------------------------------------------------------------------
  // 1. PLANES DE MEMBRESÍA
  // ---------------------------------------------------------------------------
  console.log("Creando planes de membresía...");
  const plan3Dias = await prisma.plan.upsert({
    where: { id: 1 },
    update: {
      nombre: "Plan 3 Días — Musculación y Cardio",
      diasPorSemana: 3,
      precio: 28000,
      descripcion: "Acceso a sala de musculación 3 días por semana con rutina personalizada.",
      isActive: true,
    },
    create: {
      id: 1,
      nombre: "Plan 3 Días — Musculación y Cardio",
      diasPorSemana: 3,
      precio: 28000,
      descripcion: "Acceso a sala de musculación 3 días por semana con rutina personalizada.",
      isActive: true,
    },
  });

  const plan5Dias = await prisma.plan.upsert({
    where: { id: 2 },
    update: {
      nombre: "Plan 5 Días — Alto Rendimiento",
      diasPorSemana: 5,
      precio: 38000,
      descripcion: "Entrenamiento intensivo de lunes a viernes con seguimiento de cargas.",
      isActive: true,
    },
    create: {
      id: 2,
      nombre: "Plan 5 Días — Alto Rendimiento",
      diasPorSemana: 5,
      precio: 38000,
      descripcion: "Entrenamiento intensivo de lunes a viernes con seguimiento de cargas.",
      isActive: true,
    },
  });

  console.log(`✓ Planes listos: ${plan3Dias.nombre}, ${plan5Dias.nombre}`);

  // ---------------------------------------------------------------------------
  // 2. UN USUARIO DE CADA TIPO (SUPERADMIN, ADMIN, USER)
  // ---------------------------------------------------------------------------
  console.log("Creando usuarios para cada rol...");

  const defaultAdminPassHash = hashPassword("admin123");

  // SuperAdmin
  const superadmin = await prisma.usuario.upsert({
    where: { email: "superadmin@gymmeraki.com" },
    update: {
      nombre: "Gonzalo",
      apellido: "Meraki",
      telefono: "+54 9 11 9999-0001",
      dni: "10000001",
      direccion: "Av. Libertador 1500, CABA",
      role: Role.SUPERADMIN,
      passwordHash: defaultAdminPassHash,
      isActive: true,
    },
    create: {
      email: "superadmin@gymmeraki.com",
      nombre: "Gonzalo",
      apellido: "Meraki",
      telefono: "+54 9 11 9999-0001",
      dni: "10000001",
      direccion: "Av. Libertador 1500, CABA",
      role: Role.SUPERADMIN,
      passwordHash: defaultAdminPassHash,
      isActive: true,
    },
  });

  // Admin
  const admin = await prisma.usuario.upsert({
    where: { email: "admin@gymmeraki.com" },
    update: {
      nombre: "Martín",
      apellido: "Entrenador",
      telefono: "+54 9 11 8888-0002",
      dni: "20000002",
      direccion: "Av. Santa Fe 2300, CABA",
      role: Role.ADMIN,
      passwordHash: defaultAdminPassHash,
      isActive: true,
    },
    create: {
      email: "admin@gymmeraki.com",
      nombre: "Martín",
      apellido: "Entrenador",
      telefono: "+54 9 11 8888-0002",
      dni: "20000002",
      direccion: "Av. Santa Fe 2300, CABA",
      role: Role.ADMIN,
      passwordHash: defaultAdminPassHash,
      isActive: true,
    },
  });

  // Usuario Regular (Miembro)
  const usuario = await prisma.usuario.upsert({
    where: { email: "usuario@gymmeraki.com" },
    update: {
      nombre: "Lucas",
      apellido: "Gómez",
      telefono: "+54 9 11 7777-0003",
      dni: "30000003",
      direccion: "Av. Corrientes 3400, CABA",
      birthDate: new Date("1996-05-18"),
      role: Role.USER,
      planId: plan3Dias.id,
      isActive: true,
    },
    create: {
      email: "usuario@gymmeraki.com",
      nombre: "Lucas",
      apellido: "Gómez",
      telefono: "+54 9 11 7777-0003",
      dni: "30000003",
      direccion: "Av. Corrientes 3400, CABA",
      birthDate: new Date("1996-05-18"),
      role: Role.USER,
      planId: plan3Dias.id,
      isActive: true,
    },
  });

  console.log(`✓ SuperAdmin: ${superadmin.email}`);
  console.log(`✓ Admin:      ${admin.email}`);
  console.log(`✓ Miembro:    ${usuario.email} (Asignado al ${plan3Dias.nombre})`);

  // ---------------------------------------------------------------------------
  // 3. 47 EJERCICIOS DE LA BASE DE DATOS
  // ---------------------------------------------------------------------------
  console.log("Creando 47 ejercicios de la base de datos...");

  const ejerciciosData = [
    {
      id: 1,
      nombre: "Press de Banca Plano con Barra",
      grupoMuscular: "Pecho",
      descripcion: "Acostado en banco horizontal, descender la barra de forma controlada hasta la línea media del pecho y empujar verticalmente manteniendo retracción escapular.",
      imagenUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=60",
      videoUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg",
      isActive: false,
      deletedAt: "2026-10-06T13:34:40.420Z",
    },
    {
      id: 2,
      nombre: "Sentadilla Trasera con Barra",
      grupoMuscular: "Piernas",
      descripcion: "Barra apoyada sobre los trapecios, descender flexionando caderas y rodillas hasta romper el paralelo (90 grados) con el torso erguido y mirada al frente.",
      imagenUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=60",
      videoUrl: "https://www.youtube.com/watch?v=bEv6CCg2BC8",
      isActive: false,
      deletedAt: "2026-10-06T13:34:37.858Z",
    },
    {
      id: 3,
      nombre: "Dominadas en Barra Fija",
      grupoMuscular: "Espalda",
      descripcion: "Agarre prono ligeramente más amplio que el ancho de hombros, traccionar el cuerpo hasta superar la barra con el mentón activando dorsales y romboides.",
      imagenUrl: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600&auto=format&fit=crop&q=60",
      videoUrl: "https://www.youtube.com/watch?v=eGo4IYlbE5g",
      isActive: false,
      deletedAt: "2026-10-06T13:34:46.280Z",
    },
    {
      id: 4,
      nombre: "Press Militar con Mancuernas",
      grupoMuscular: "Hombros",
      descripcion: "Sentado con respaldo firme a 90 grados, empujar las mancuernas desde la altura de las clavículas hasta la extensión vertical completa sobre la cabeza.",
      imagenUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=60",
      videoUrl: "https://www.youtube.com/watch?v=qEwKCR5JCog",
      isActive: false,
      deletedAt: "2026-10-06T13:34:43.239Z",
    },
    {
      id: 5,
      nombre: "Extensiones de Tríceps en Polea Alta",
      grupoMuscular: "Tríceps",
      descripcion: "Con soga o barra recta en polea alta, codos fijos pegados al torso, extender los antebrazos hacia abajo contrayendo los tríceps en la posición final.",
      imagenUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=60",
      videoUrl: "https://www.youtube.com/watch?v=2-LAMcpzODU",
      isActive: false,
      deletedAt: "2026-10-06T13:34:34.675Z",
    },
    {
      id: 6,
      nombre: "Columpio Ruso",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Colócate de pie con los pies separados a la altura de los hombros y sostén una pesa rusa con una mano.\n- Empuja tus caderas hacia atrás y baja la pesa rusa hacia el suelo, manteniendo los brazos rectos.\n- Al llegar a la posición más baja, balancea la pesa rusa hacia atrás y entre tus piernas.\n- Utilizando la fuerza de las caderas y los glúteos, impulsa la pesa rusa hacia arriba mientras estiras el brazo. La pesa rusa debe terminar arriba de la cabeza.\n- Baja la pesa rusa de nuevo al suelo en un movimiento controlado y repite el movimiento.\n- Asegúrate de mantener una buena postura durante todo el ejercicio, con el pecho hacia arriba, el abdomen contraído y las rodillas ligeramente flexionadas. También es importante prestar atención a la técnica de la elevación y bajada de la pesa rusa para evitar lesiones en la espalda.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 7,
      nombre: "Rotación de Cintura en Landmine",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Colócate de pie frente a la máquina Landmine, con los pies separados a la altura de los hombros. Sujeta la barra con ambas manos, manteniéndola a la altura del pecho y con los codos ligeramente flexionados.\n- Da un pequeño paso hacia atrás para que la barra quede cerca de tu pecho y la máquina esté alineada con tu torso. Asegúrate de mantener una postura erguida y el core activado.\n- Gira la parte superior del torso hacia un lado, llevando la barra contigo. Mantén las caderas y las piernas estables, concentrándote en la rotación desde la cintura. Realiza el movimiento de forma controlada y mantén la tensión en el core.\n- Regresa lentamente a la posición inicial y luego gira hacia el lado opuesto, repitiendo el movimiento de la misma manera. Asegúrate de mantener la misma amplitud y control en ambos lados.\n- Completa el número deseado de repeticiones, asegurándote de realizar una rotación completa y mantener una buena técnica en cada repetición.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 8,
      nombre: "Rotación de Torso Sujeción Superior",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Siéntate en la máquina de Rotary Torso con la espalda recta y ajusta el asiento para que las rodillas queden alineadas con los soportes laterales.\n- Bajar el soporte hasta que haga tope con el hombro.\n- Selecciona el peso adecuado para tu nivel de fuerza, comenzando con un peso ligero si es necesario.\n- Mantén el núcleo activado y asegúrate de que las caderas y las piernas estén fijas durante el ejercicio.\n- Inhala mientras te preparas para el movimiento.\n- Exhala y rota el torso hacia un lado, concentrándote en activar los músculos oblicuos mientras mantienes las piernas inmóviles.\n- Mantén la contracción al final del movimiento durante un segundo para maximizar la activación de los oblicuos.\n- Inhala mientras regresas lentamente a la posición inicial de manera controlada.\n- Repite el movimiento hacia el otro lado, alternando giros, y mantén el control del peso durante todo el ejercicio.\n- Realiza el número deseado de repeticiones para ambos lados, asegurándote de no usar el impulso y de mantener una forma adecuada para evitar lesiones.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 9,
      nombre: "Rotación de Torso en Máquina",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Siéntate en la máquina de Rotary Torso con la espalda recta y ajusta el asiento para que las rodillas queden alineadas con los soportes laterales.\n- Ajusta el rango de movimiento de la máquina seleccionando el ángulo de inicio deseado para el giro del torso.\n- Coloca las manos en las empuñaduras o apoya los brazos en los cojines laterales, según el diseño de la máquina.\n- Selecciona el peso adecuado para tu nivel de fuerza, comenzando con un peso ligero si es necesario.\n- Mantén el núcleo activado y asegúrate de que las caderas y las piernas estén fijas durante el ejercicio.\n- Inhala mientras te preparas para el movimiento.\n- Exhala y rota el torso hacia un lado, concentrándote en activar los músculos oblicuos mientras mantienes las piernas inmóviles.\n- Mantén la contracción al final del movimiento durante un segundo para maximizar la activación de los oblicuos.\n- Inhala mientras regresas lentamente a la posición inicial de manera controlada.\n- Repite el movimiento hacia el otro lado, alternando giros, y mantén el control del peso durante todo el ejercicio.\n- Realiza el número deseado de repeticiones para ambos lados, asegurándote de no usar el impulso y de mantener una forma adecuada para evitar lesiones.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 10,
      nombre: "Abdominales en polea",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Ajusta una máquina de polea con una polea alta y selecciona un peso apropiado.\n- Coloca un accesorio de cuerda en la polea y ajústalo para que esté a la altura de tus hombros.\n- Arrodíllate frente a la máquina y sujeta la cuerda con ambas manos, manteniendo las palmas hacia abajo.\n- Despliega la cuerda y lleva las manos hacia tus hombros, manteniendo los codos en línea con tus orejas.\n- Ajusta la distancia entre tus rodillas y la máquina para crear tensión en los músculos abdominales.\n- Inicia el movimiento contrayendo los músculos abdominales y flexionando la columna vertebral hacia adelante.\n- Lleva los codos hacia las rodillas, llevando el pecho hacia las piernas y sintiendo la contracción en los abdominales.\n- Mantén la contracción durante un segundo para maximizar el trabajo en los abdominales.\n- Controla el retorno hacia la posición inicial, extendiendo la columna vertebral y estirando los abdominales.\n- Realiza el mismo número de repeticiones, manteniendo un ritmo controlado y enfocándote en la conexión mente-músculo.\n- Evita tirar del cuello o utilizar el impulso del cuerpo; concéntrate en el trabajo de los abdominales.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 11,
      nombre: "Máquina de Crunch Abdominal",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Antes de subir a la máquina, sujeta las manijas para ganar equilibrio.\n- Apoya las rodillas en la colchoneta una al lado de la otra, de forma paralela.\n- Contrae tu abdominal llevando las rodillas hacia arriba hasta que haga tope la máquina.\n- Sostiene unos segundos el abdomen contraido y luego baja lentamente hasta su posición inicial.\n- Repite la cantidad de veces necesarias",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 12,
      nombre: "Máquina de Lower Back",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Siéntate en la máquina de lower back con la almohadilla ajustada a la altura de la parte superior de tu espalda.\n- Asegura los pies en los soportes de la máquina, manteniéndolos firmemente plantados en el suelo.\n- Selecciona el peso adecuado para tu nivel de fuerza. Comienza con un peso ligero si es necesario.\n- Coloca las manos en las empuñaduras laterales para mantener la estabilidad durante el ejercicio.\n- Inhala profundamente mientras te preparas para el movimiento, activando los músculos de la zona lumbar.\n- Exhala mientras empujas hacia atrás con el torso, extendiendo la espalda contra la resistencia de la máquina.\n- Asegúrate de mantener el control durante todo el movimiento, evitando arquear excesivamente la espalda.\n- Inhala mientras regresas lentamente a la posición inicial, asegurándote de que el movimiento sea controlado.\n- Mantén una buena postura en todo momento, evitando usar el impulso o empujar con fuerza excesiva para proteger la zona lumbar.\n- Realiza el número deseado de repeticiones y series, ajustando el peso si es necesario para mantener una forma correcta y segura.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 13,
      nombre: "Máquina de Encogimiento Abdominal",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Antes de subir a la máquina, ajusta el peso a levantar.\n- Siéntate en el cojín y sujetas las manijas en la parte superior\n- Contrae tu abdominal llevando las rodillas hacia arriba hasta que haga tope la máquina.\n- Sostiene unos segundos el abdomen contraido y luego baja lentamente hasta su posición inicial.\n- Repite la cantidad de veces necesarias",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 14,
      nombre: "Elevación de Piernas en Máquina",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Agarra la barra con las manos separadas a la anchura de los hombros, coloca los brazos rectos y los hombros hacia atrás y abajo.\n- Levanta las piernas juntas hacia arriba, doblando ligeramente las rodillas y manteniendo los pies juntos.\n- Continúa elevando las piernas hasta que tu cuerpo quede en un ángulo de 90 grados, si es posible, o hasta donde puedas.\n- Mantén esta posición durante unos segundos y luego baja lentamente las piernas hacia la posición inicial.\n- Repite el movimiento para completar el número deseado de repeticiones.\nEs importante mantener una buena técnica y controlar el movimiento en todo momento para evitar lesiones. Si eres principiante, puedes empezar con una versión más fácil del ejercicio doblando ligeramente las rodillas y elevando las piernas solo hasta donde puedas sin forzar la espalda baja.",
      imagenUrl: null,
      videoUrl: null,
      isActive: false,
      deletedAt: "2026-10-06T17:09:47.254Z",
    },
    {
      id: 15,
      nombre: "Elevación de Piernas en Máquina",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Agarra la barra con las manos separadas a la anchura de los hombros, coloca los brazos rectos y los hombros hacia atrás y abajo.\n- Levanta las piernas juntas hacia arriba, doblando ligeramente las rodillas y manteniendo los pies juntos.\n- Continúa elevando las piernas hasta que tu cuerpo quede en un ángulo de 90 grados, si es posible, o hasta donde puedas.\n- Mantén esta posición durante unos segundos y luego baja lentamente las piernas hacia la posición inicial.\n- Repite el movimiento para completar el número deseado de repeticiones.\nEs importante mantener una buena técnica y controlar el movimiento en todo momento para evitar lesiones. Si eres principiante, puedes empezar con una versión más fácil del ejercicio doblando ligeramente las rodillas y elevando las piernas solo hasta donde puedas sin forzar la espalda baja.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 16,
      nombre: "Extensión de Piernas",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Siéntate en el borde de un banco plano, apoyando las manos a los lados del cuerpo para mantener el equilibrio.\n- Inclínate ligeramente hacia atrás, manteniendo el torso recto y el core contraído. Tus pies deben estar juntos y ligeramente levantados del suelo.\n- Inicia el movimiento extendiendo las piernas hacia adelante, manteniéndolas juntas y en línea recta. Asegúrate de no arquear la espalda durante este movimiento.\n- Mantén una ligera flexión en las rodillas si es necesario, pero intenta mantener las piernas lo más rectas posible.\n- Desde la posición extendida, lleva las rodillas hacia el pecho mientras contraes los músculos abdominales. Evita balancearte hacia adelante y atrás; en su lugar, enfócate en usar los músculos del core para controlar el movimiento.\n- Mantén una breve pausa en la parte superior del movimiento, asegurándote de que los abdominales estén completamente contraídos.\n- Extiende nuevamente las piernas hacia adelante para volver a la posición inicial, controlando el movimiento y manteniendo la tensión en los abdominales durante todo el ejercicio.\n- Completa el número deseado de repeticiones, manteniendo una buena técnica y control en cada repetición.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 17,
      nombre: "Toque Talón",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Acuéstate boca arriba sobre una colchoneta con las piernas extendidas y los brazos extendidos hacia arriba, justo por encima de la cabeza.\n- Levanta las piernas hacia arriba mientras mantienes las rodillas ligeramente flexionadas. Mantén los pies juntos y apunta con los dedos de los pies hacia el techo.\n- Al mismo tiempo, levanta el tronco hacia arriba, tratando de alcanzar los pies con las manos extendidas. Para ello, contrae los músculos abdominales y eleva los omóplatos del suelo.\n- Alcanza los talones con las manos o los dedos mientras mantienes las piernas elevadas en el aire y el tronco elevado.\n- Mantén la contracción en los músculos abdominales durante un breve momento en la posición más alta del movimiento.\n- Baja lentamente el tronco y las piernas de vuelta a la posición inicial, manteniendo el control del movimiento en todo momento.\n- Completa el número deseado de repeticiones, manteniendo una técnica adecuada en cada repetición y sintiendo el trabajo en los músculos abdominales.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 18,
      nombre: "Giro Ruso",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Siéntate en el suelo con las rodillas dobladas y los pies apoyados en el suelo. Inclínate ligeramente hacia atrás, manteniendo la espalda recta y el abdomen apretado.\n- Levanta los pies del suelo para que estén paralelos al suelo. Mantén las rodillas dobladas y las manos juntas frente a tu pecho.\n- Gira tu torso hacia la derecha, llevando tus manos hacia el lado derecho. Mantén los codos rectos y no te inclines hacia atrás.\n- Vuelve a la posición inicial y repite hacia el lado izquierdo.\n- Continúa alternando los giros hacia la izquierda y la derecha durante el número deseado de repeticiones.\nEs importante mantener la postura correcta y no forzar el movimiento, ya que esto puede provocar lesiones en la espalda. También se pueden usar pesas o una bola medicinal para aumentar la intensidad del ejercicio.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 19,
      nombre: "Elevación de Rodillas en Banco Plano",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Acuéstate sobre un banco plano con la espalda apoyada firmemente y las piernas extendidas.\n- Sujeta los bordes del banco con las manos para mantener la estabilidad.\n- Contrae los músculos abdominales y flexiona las rodillas mientras elevas las piernas hacia el pecho.\n- Mantén el movimiento controlado y evita balancear las piernas o usar impulso.\n- Exhala mientras elevas las rodillas y contraes los abdominales.\n- Lleva las rodillas hacia el pecho lo más que puedas sin levantar la parte baja de la espalda del banco.\n- Mantén la posición superior durante un segundo para maximizar la contracción en los abdominales.\n- Inhala mientras bajas lentamente las piernas de regreso a la posición inicial, extendiendo las rodillas.\n- Evita que las piernas caigan bruscamente; mantén el control en todo momento.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 20,
      nombre: "Abdominales con Rueda",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Siéntate sobre una colchoneta con las rodillas dobladas y los pies apoyados en el suelo.\n- Sostén la rueda de accesorio con ambas manos, colocándola frente a ti en el suelo.\n- Comienza el movimiento inclinando el torso hacia adelante y extendiendo los brazos para rodar la rueda hacia delante.\n- Mantén los brazos extendidos y el abdomen contraído mientras te inclinas hacia adelante.\n- Continúa rodando la rueda hacia adelante hasta que sientas que tus músculos abdominales están completamente contraídos y tus brazos estén estirados por encima de tu cabeza.\n- Mantén esta posición durante un segundo para maximizar la contracción en los músculos abdominales.\n- Controla el retorno de la rueda hacia ti, flexionando los abdominales para mantener el control del movimiento.\n- Evita dejar caer el cuerpo hacia el suelo y mantener la tensión en los abdominales durante todo el ejercicio.\n- Ajusta la dificultad del ejercicio ajustando la distancia que ruedas la rueda hacia adelante.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 21,
      nombre: "Abdominales en L",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Siéntate en el suelo con las piernas estiradas frente a ti y los pies juntos.\n- Levanta los brazos por encima de la cabeza, manteniendo los codos rectos y las manos extendidas hacia el techo.\n- Contrae los músculos abdominales y levanta las piernas del suelo, manteniéndolas juntas y extendidas.\n- Al mismo tiempo, inclina el torso hacia adelante y extiende los brazos hacia los pies.\n- Intenta tocar las puntas de los pies con las manos mientras mantienes las piernas y los brazos extendidos.\n- Mantén la posición durante un segundo, sintiendo la contracción en los músculos abdominales.\n- Controla el retorno a la posición inicial, bajando lentamente las piernas y el torso hacia el suelo.\n- Evita balancear el cuerpo o utilizar impulso; concéntrate en el trabajo específico de los músculos abdominales.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 22,
      nombre: "Oblicuos con Suspención",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Asegura tus pies bajo el soporte acolchado del banco plano.\n- Acomódate de modo que tu cuerpo quede en una posición diagonal, con las caderas y las piernas extendidas hacia un lado del banco y el torso hacia el otro lado.\n- Mantén las manos detrás de la cabeza o extendidas hacia adelante para equilibrar el movimiento, según tu preferencia.\n- Inhala y desciende el torso hacia el suelo, asegurándote de que el movimiento se realice de forma controlada.\n- Exhala mientras contraes los oblicuos y elevas el torso hacia la posición inicial.\n- Concentra la fuerza en los músculos oblicuos del lado hacia el que estás dirigiendo el movimiento.\n- Mantén los movimientos fluidos y controlados en todo momento, evitando el impulso.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 23,
      nombre: "Oblicuos en Colchoneta",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Asegura tus pies bajo el soporte acolchado del banco plano.\n- Acomódate de modo que tu cuerpo quede en una posición diagonal, con las caderas y las piernas extendidas hacia un lado del banco y el torso hacia el otro lado.\n- Mantén las manos detrás de la cabeza o extendidas hacia adelante para equilibrar el movimiento, según tu preferencia.\n- Inhala y desciende el torso hacia el suelo, asegurándote de que el movimiento se realice de forma controlada.\n- Exhala mientras contraes los oblicuos y elevas el torso hacia la posición inicial.\n- Concentra la fuerza en los músculos oblicuos del lado hacia el que estás dirigiendo el movimiento.\n- Mantén los movimientos fluidos y controlados en todo momento, evitando el impulso.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 24,
      nombre: "Abdominales Oblicuos (Bicicleta)",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Acuéstate boca arriba en una esterilla con las manos detrás de la cabeza y las piernas extendidas.\n- Eleva la cabeza y los hombros del suelo, manteniendo el cuello en posición neutral y los codos abiertos hacia los lados.\n- Lleva una rodilla hacia el pecho al mismo tiempo que giras el tronco, acercando el codo opuesto a la rodilla que se acerca.\n- Extiende la pierna opuesta simultáneamente, manteniéndola elevada y a unos centímetros del suelo.\n- Alterna el movimiento, llevando la otra rodilla hacia el pecho mientras giras el tronco en dirección al codo opuesto.\n- Realiza el ejercicio con un movimiento fluido y controlado, manteniendo el abdomen contraído en todo momento.\n- Completa el mismo número de repeticiones en cada lado para trabajar ambos lados del abdomen de manera equitativa.\n- Este ejercicio trabaja los músculos abdominales, especialmente los oblicuos, y ayuda a fortalecer el core y mejorar la definición abdominal.\n- Puedes incorporar el \"bicycle crunch\" en tu rutina de entrenamiento de abdominales o incluirlo en un circuito de ejercicios para trabajar la zona central del cuerpo.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 25,
      nombre: "Abdominales Oblicuos Cruzados",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Acuéstate boca arriba sobre una colchoneta con las piernas extendidas y los brazos extendidos hacia los lados, formando una \"T\" con tu cuerpo.\n- Dobla una rodilla y levántala hacia el pecho, al mismo tiempo que giras el tronco y el codo opuesto hacia esa rodilla.\n- Intenta tocar la rodilla elevada con el codo contrario mientras contraes los abdominales oblicuos.\n- Mantén una contracción en los abdominales durante un breve momento en la posición contraída.\n- Vuelve lentamente a la posición inicial, bajando la pierna y girando el tronco hacia el centro.\n- Alterna el movimiento con la otra pierna y el codo opuesto.\n- Completa el número deseado de repeticiones en cada lado.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 26,
      nombre: "Toque de Hombros",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Comienza en una posición de plancha, apoyando las manos y los pies en el suelo. Asegúrate de que tus manos estén justo debajo de tus hombros y tus pies estén juntos.\n- Desde esta posición, mantén tus caderas en línea recta con el resto de tu cuerpo y evita que se levanten o se hundan.\n- Levanta la mano derecha del suelo y toca tu hombro izquierdo. Vuelve a bajar la mano al suelo y repite con la mano izquierda tocando tu hombro derecho. Ese es un ciclo completo.\n- Continúa alternando las manos, tocando cada hombro mientras mantienes la posición de plancha.\nRecuerda que es importante mantener la postura correcta en todo momento, evitando arquear o hundir la espalda y manteniendo el core apretado. Además, si eres principiante, puedes comenzar haciendo el ejercicio sobre las rodillas en lugar de los pies para reducir la intensidad del ejercicio.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 27,
      nombre: "Posición de Hollow Hold Flexionado",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Acuéstate en el suelo boca arriba y dobla las piernas en un ángulo de 90 grados, de manera que las pantorrillas queden paralelas al suelo. Los pies deben estar juntos y apoyados en el suelo.\n- Coloca las manos detrás estiradas hacia los pies.\n- Levanta los hombros y la cabeza del suelo, tratando de mantener la espalda baja pegada al suelo.\n- Ahora, levanta los hombros y las piernas del suelo al mismo tiempo.\n- Mantén esta posición, tratando de mantener el equilibrio y evitando que la espalda baja se levante del suelo. Mantén los músculos abdominales apretados y la respiración controlada.\n- Aguanta la posición durante el tiempo que desees o el que te indique tu rutina de entrenamiento.\n- Para finalizar, baja lentamente las piernas y la cabeza al suelo.\nRecuerda que es importante realizar el ejercicio con control y evitar la compensación con otros músculos para que realmente trabajes los músculos abdominales.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 28,
      nombre: "Postura de la Barca",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Siéntate en el suelo con las piernas estiradas frente a ti y las manos a los lados de las caderas.\n- Inclínate hacia atrás ligeramente y levanta los pies del suelo, manteniendo las piernas rectas.\n- Continúa inclinándote hacia atrás hasta que tu torso y piernas formen un ángulo de 45 grados con el suelo. Trata de mantener la espalda recta y el pecho abierto.\n- Extiende los brazos hacia adelante, paralelos al suelo.\n- Mantén la posición durante unos segundos y luego relaja el cuerpo y baja las piernas al suelo.\nPuedes repetir este ejercicio varias veces, tratando de mantener la posición durante más tiempo en cada repetición. También puedes variar el ejercicio, flexionando las rodillas y agarrando las piernas con las manos, para hacerlo más fácil.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 29,
      nombre: "Plancha con Deslizamiento",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Coloca una mancuerna en un extremo de la esterilla o superficie donde realizarás el ejercicio.\n- Colócate en posición de plancha con las manos en el suelo a la altura de los hombros y los pies juntos detrás de ti.\n- Asegúrate de que tu cuerpo esté recto y en línea desde la cabeza hasta los talones.\n- Mantén la posición de la plancha mientras levantas una mano y la llevas hacia la mancuerna.\n- Agarra la mancuerna y llévala hacia el otro lado de tu cuerpo, pasándola por debajo de tu torso.\n- Coloca la mancuerna en el suelo en el otro extremo de la esterilla.\n- Repite el movimiento con la otra mano para volver a la posición inicial.\n- Continúa alternando los lados y desplazando la mancuerna hacia la izquierda y hacia la derecha mientras mantienes la posición de la plancha.\nRecuerda mantener siempre la alineación correcta del cuerpo y el control del movimiento para evitar lesiones y maximizar los beneficios del ejercicio.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 30,
      nombre: "Plancha",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Comienza colocándote boca abajo en el suelo.\n- Levanta tu cuerpo apoyándote en tus antebrazos y en tus dedos de los pies.\n- Los antebrazos deben estar alineados con los hombros y los codos deben estar flexionados a 90 grados.\n- Mantén tu cuerpo en línea recta desde la cabeza hasta los talones, evitando que las caderas se hundan o que se levanten demasiado.\n- Mantén los músculos abdominales y glúteos contraídos para estabilizar tu cuerpo.\n- Mantén esta posición durante el tiempo deseado, comenzando con intervalos cortos y aumentando gradualmente a medida que tu fuerza y resistencia mejoren.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 31,
      nombre: "Plancha con Extensión de Codo",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Comienza en una posición de plancha estándar, con tus antebrazos apoyados en el suelo, los codos debajo de los hombros y los dedos de los pies apoyados en el suelo, formando una línea recta desde la cabeza hasta los talones.\n- Mantén tus abdominales y glúteos contraídos para estabilizar tu cuerpo y evitar que las caderas se hundan o se levanten demasiado.\n- Desde esta posición, extiende uno de tus codos mientras mantienes el otro antebrazo apoyado en el suelo.\n- Extiende completamente el brazo, manteniendo la estabilidad en el core y evitando que las caderas se balanceen.\n- Mantén la posición de extensión de codo durante unos segundos, asegurándote de mantener una alineación adecuada del cuerpo.\n- Vuelve a doblar el codo y regresa a la posición de plancha estándar.\n- Alterna entre los dos brazos, extendiendo y doblando los codos de manera controlada.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 32,
      nombre: "Plancha con Elevación de Codo",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Comienza en una posición de plancha estándar, con los antebrazos apoyados en el suelo, los codos debajo de los hombros y los dedos de los pies apoyados en el suelo, manteniendo una línea recta desde la cabeza hasta los talones.\n- Contrae los músculos abdominales y glúteos para estabilizar el cuerpo.\n- Desde esta posición, eleva uno de tus codos del suelo, extendiendo completamente el brazo hacia arriba.\n- Mantén la posición y repite con el segundo codo.\n- Mantén la posición unos segundos y baja el primer codo extendido\n- Baja el segundo codo a la posición inicial.\n- Repite el proceso, alternando entre los dos codos, elevándolos y bajándolos de manera controlada.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 33,
      nombre: "Plancha con Rotación de Caderas",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Comienza en una posición de plancha estándar, con los antebrazos apoyados en el suelo, los codos debajo de los hombros y los dedos de los pies apoyados en el suelo, manteniendo una línea recta desde la cabeza hasta los talones.\n- Contrae los músculos abdominales y glúteos para estabilizar el cuerpo.\n- Desde esta posición, gira las caderas hacia un lado, y luego hacia el otro, levantando la cadera correspondiente hacia arriba.\n- Repite la rotación de cadera durante el tiempo deseado, sintiendo el estiramiento en los oblicuos.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 34,
      nombre: "Plancha Lateral",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Acuéstate de lado en el suelo y apoya el antebrazo en el suelo. Asegúrate de que el codo esté justo debajo del hombro y el antebrazo esté apuntando hacia adelante.\n- Coloca las piernas juntas y estíralas. Luego, levántalas del suelo y apóyate en el antebrazo y en el borde exterior del pie.\n- Mantén el cuerpo en línea recta desde la cabeza hasta los pies. Evita que las caderas se hundan o se levanten demasiado. Si tienes dificultades para mantener el equilibrio, puedes apoyar la mano libre en el suelo para mayor estabilidad.\n- Mantén la posición durante el tiempo deseado (normalmente de 30 segundos a 1 minuto) y luego cambia de lado y repite el ejercicio.\nEs importante mantener una buena técnica durante todo el ejercicio para evitar lesiones y obtener los máximos beneficios. También puedes agregar variaciones a la plancha lateral, como levantar una pierna o un brazo para aumentar la intensidad del ejercicio.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 35,
      nombre: "Patada Mariposa",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Acuéstate boca arriba sobre una esterilla o superficie cómoda. Extiende las piernas y despegalas apenas del suelo, con los dedos de los pies apuntando hacia el techo.\n- Coloca las manos debajo de los glúteos para ayudar a mantener la estabilidad. También puedes extender los brazos a los lados, pero asegúrate de que estén apoyados en el suelo.\n- Comienza a mover las piernas hacia arriba y hacia abajo en un patrón de patada continua y rítmica, manteniendo las piernas estiradas y juntas.\n- A medida que haces las patadas, asegúrate de mantener el abdomen y los músculos de la espalda baja tensos para ayudar a mantener la estabilidad y evitar lesiones.\n- Continúa haciendo las patadas durante el tiempo deseado o hasta que sientas una quemazón en los músculos abdominales.\nRecuerda que la técnica es muy importante en este ejercicio, así que asegúrate de mantener la espalda baja apoyada en el suelo en todo momento y evita hacer movimientos bruscos con las piernas.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 36,
      nombre: "Patada Mariposa Extendida",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Acuéstate boca arriba sobre una esterilla o superficie cómoda. Extiende las piernas y despegalas apenas del suelo, con los dedos de los pies apuntando hacia el techo.\n- Levanta las manos y extiéndelas por arriba de tu cabeza, como si estarías en posición de estrella.\n- Comienza a mover las piernas hacia arriba y hacia abajo en un patrón de patada continua y rítmica, manteniendo las piernas estiradas y juntas.\n- A medida que haces las patadas, asegúrate de mantener el abdomen y los músculos de la espalda baja tensos para ayudar a mantener la estabilidad y evitar lesiones.\n- Continúa haciendo las patadas durante el tiempo deseado o hasta que sientas una quemazón en los músculos abdominales.\nRecuerda que la técnica es muy importante en este ejercicio, así que asegúrate de mantener la espalda baja apoyada en el suelo en todo momento y evita hacer movimientos bruscos con las piernas.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 37,
      nombre: "Levantamiento de Piernas con Giro",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Comienza acostado sobre una colchoneta en el suelo, boca arriba, con las piernas extendidas y los brazos a los lados del cuerpo.\n- Levanta las piernas rectas juntas del suelo, manteniendo los brazos pegados al suelo. Usa los músculos abdominales para levantar las piernas, no la inercia.\n- Una vez que las piernas estén en posición vertical, gira las caderas hacia un lado mientras mantienes las piernas rectas. El giro se realiza levantando una cadera del suelo mientras la otra permanece en contacto con él.\n- Baja las piernas controladamente hacia el suelo mientras vuelves a la posición inicial con las caderas apoyadas en el suelo. Este es un movimiento completo.\n- Repite el ejercicio levantando las piernas y girando las caderas hacia el otro lado en el siguiente movimiento.\nEs importante mantener el control y no hacer movimientos bruscos durante todo el ejercicio para evitar lesiones. Además, es esencial no balancear las piernas o moverlas usando el impulso del movimiento. Recuerda que el movimiento debe provenir de los músculos abdominales y no de la inercia.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 38,
      nombre: "Levantamiento de Torso",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Acuéstate en el suelo boca arriba, con las piernas extendidas y los brazos estirados por encima de la cabeza.\n- Simultáneamente levanta las piernas y los brazos hacia arriba hasta que los dedos de las manos toquen los dedos de los pies.\n- Mantén los abdominales apretados y los brazos y piernas estirados mientras sostienes la posición por un segundo.\n- Baja lentamente las piernas y los brazos hasta la posición inicial mientras exhalas.\n- Repite el movimiento para el número deseado de repeticiones.\nRecuerda que para hacer este ejercicio correctamente, es importante mantener los abdominales contraídos en todo momento y evitar arquear la espalda al levantar los hombros y las piernas.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 39,
      nombre: "Enebrando la Aguja",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Comienza en una posición de plancha lateral con el brazo inferior apoyado en el suelo y el otro brazo estirado hacia arriba.\n- Lleva lentamente el brazo superior hacia el suelo y por debajo de tu cuerpo, como si estuvieras \"enebrando una aguja\".\n- Asegúrate de mantener tu cuerpo estable y en línea recta mientras realizas este movimiento. Evita balancearte hacia adelante o hacia atrás.\n- Luego, levanta lentamente el brazo de nuevo hacia arriba y regresa a la posición inicial de plancha lateral.\n- Completa el número deseado de repeticiones en un lado antes de cambiar de lado y repetir el ejercicio con el otro brazo.\nEs importante recordar mantener una buena postura y controlar el movimiento en todo momento para evitar lesiones y maximizar los beneficios del ejercicio.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 40,
      nombre: "Elevaciones con Peso",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Acuéstate boca arriba en un colchoneta con las piernas dobladas y los pies apoyados en el suelo. Toma la mancuerna con ambas manos y mantenla sobre tu pecho.\n- Lentamente levanta la cabeza, los hombros y la parte superior de la espalda del suelo. Mantén los codos ligeramente flexionados y enfoca la contracción en tus abdominales.\n- Alcanza tu máxima contracción en la parte superior del movimiento y luego baja lentamente el torso de vuelta al suelo.\n- Repite el movimiento para completar una serie.\nRecuerda que debes realizar el ejercicio con control y sin hacer uso de la fuerza del impulso para evitar lesiones. Además, es importante mantener la postura correcta durante todo el ejercicio para maximizar el trabajo en los músculos abdominales.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 41,
      nombre: "Abdominales en Banco Declinado",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Ajusta un banco declinado a un ángulo cómodo, generalmente entre 30 y 45 grados. Siéntate en el extremo superior del banco, asegurando los pies bajo las almohadillas o soportes para mantener el cuerpo estable durante el ejercicio.\n- Cruza los brazos sobre el pecho o coloca las manos detrás de la cabeza sin empujarla, manteniendo los codos abiertos. Evita usar las manos para jalar el cuello hacia adelante.\n- Inhala y, mientras exhalas, activa el core y comienza a levantar el torso, enrollando la columna hacia adelante. Mantén el movimiento controlado, concentrándote en contraer los músculos abdominales. Evita usar el impulso para elevar el torso.\n- Continúa levantando el torso hasta que los hombros estén cerca de las rodillas o hasta donde te sientas cómodo, manteniendo la contracción abdominal en todo momento.\n- Pausa brevemente en la parte superior del movimiento, asegurándote de mantener la contracción en los abdominales.\n- Inhala y baja el torso de manera controlada de regreso a la posición inicial, desenrollando lentamente la columna hasta que los hombros toquen el banco. Mantén los abdominales activados durante el descenso para evitar la relajación de los músculos.\n- Completa el número deseado de repeticiones, asegurándote de mantener una buena técnica y control en cada repetición. El movimiento debe ser fluido y constante, sin tirones ni rebotes.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 42,
      nombre: "Abdominales con Elevación",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Acuéstate en el suelo con los pies estirados.\n- Sostén la pesa con ambas manos y estira los brazos hacia adelante, manteniendo la pesa por encima del pecho.\n- Levanta tu torso sin flexionar los codos, empujando las pesas hacia arriba.\n- Baja lentamente a tu posición inicial.\n- Repite el movimiento para completar una serie.\n- Es importante mantener una buena postura y controlar la respiración durante todo el ejercicio. Además, asegúrate de elegir una pesa que sea adecuada para tu nivel de fuerza y resistencia.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 43,
      nombre: "Elevación de Piernas",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Acuéstate boca arriba en una colchoneta o en el suelo con las piernas rectas y los brazos a los lados del cuerpo.\n- Manteniendo las piernas rectas y juntas, levántalas del suelo hasta que formen un ángulo de 90 grados con tu torso. Asegúrate de mantenerlas rectas durante todo el movimiento.\n- Mantén esta posición durante un segundo, luego baja lentamente las piernas hacia el suelo, manteniéndolas siempre rectas.\n- Una vez que tus pies estén a unos centímetros del suelo, levanta las piernas de nuevo para comenzar la siguiente repetición.\n- Repite el movimiento para completar una serie.\nAsegúrate de mantener tu espalda baja pegada al suelo durante todo el ejercicio y evitar balancearte para evitar lesiones. Para hacer el ejercicio más difícil, puedes agregar un peso entre los pies o hacer el movimiento más lento y controlado.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 44,
      nombre: "Elevación de Piernas en Posición Supina",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Acuéstate boca arriba en una colchoneta o superficie acolchada. Coloca las manos debajo de los glúteos con las palmas hacia abajo para ayudar a mantener la estabilidad en la parte baja de la espalda o sujétate de alguna columna u objeto.\n- Levanta las piernas del suelo manteniéndolas juntas y estiradas. Puedes mantenerlas en posición vertical o ligeramente inclinadas hacia el cuerpo.\n- Mantén la posición durante unos segundos, asegurándote de mantener la contracción en la parte baja del abdomen.\n- Baja lentamente las piernas hacia el suelo, pero sin llegar a tocarlo, manteniéndolas siempre bajo control. Este es un movimiento controlado y lento.\n- Vuelve a levantar las piernas y repite el movimiento durante el número deseado de repeticiones.\nEs importante recordar que debes mantener siempre una buena técnica y controlar bien el movimiento durante todo el ejercicio. También es importante que respetes tus limitaciones y vayas aumentando la intensidad del ejercicio gradualmente a medida que vayas ganando fuerza y resistencia.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 45,
      nombre: "Crunch Abdominal",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Acuéstate boca arriba en el suelo con las rodillas dobladas y los pies apoyados en el suelo. Los brazos pueden estar cruzados en el pecho o detrás de la cabeza.\n- Contrae los músculos abdominales y levanta los hombros y la cabeza del suelo, manteniendo la mirada hacia el techo y sin forzar el cuello.\n- Mantén la contracción de los músculos abdominales y baja lentamente hacia el suelo, manteniendo el control del movimiento en todo momento.\n- Repite el movimiento durante el número deseado de repeticiones.\nEs importante recordar que no debes tirar del cuello ni forzarlo hacia adelante, ya que esto puede causar lesiones. Además, es recomendable respirar profundamente mientras se realiza el ejercicio y mantener una buena postura durante todo el movimiento.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 46,
      nombre: "Abdominales V Up con Pierna Alternada",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Acuéstate sobre tu espalda con las piernas y los brazos extendidos hacia arriba.\n- Levanta tu torso y al mismo tiempo levanta una pierna hasta que ambos se encuentren en un ángulo de 45 grados.\n- Mantén esa posición durante unos segundos y luego baja el torso y la pierna de regreso a la posición inicial.\n- Repite el movimiento, pero esta vez levantando la otra pierna.\n- Continúa alternando las piernas en cada repetición.\nEs importante mantener una buena postura y técnica durante todo el ejercicio. Asegúrate de mantener tu espalda recta, el cuello relajado y los abdominales contraídos. Puedes aumentar la intensidad del ejercicio sosteniendo una pesa o mancuerna en tus manos.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 47,
      nombre: "Doble Crunch",
      grupoMuscular: "Core / Abdomen",
      descripcion: "- Acuéstate boca arriba con las piernas extendidas y los brazos extendidos por encima de la cabeza.\n- Simultáneamente levanta las piernas, las rodillas y el torso hacia arriba, formando una \"V\" con tu cuerpo.\n- Lleva tus rodillas hacia tu pecho, al mismo tiempo que tus manos se dirigen hacia tus tobillos. Trata de tocar tus tobillos con las manos, y mantén la posición por un momento.\n- Regresa a la posición inicial lentamente, desenrollando la columna vertebral y extendiendo las piernas y los brazos.\n- Repite el movimiento varias veces.\nEs importante mantener la atención en la respiración durante todo el ejercicio. Exhala cuando levantes las piernas y el torso, e inhala cuando bajes. Además, debes mantener los abdominales tensos durante todo el movimiento para evitar lesiones y obtener los mejores resultados.",
      imagenUrl: null,
      videoUrl: null,
      isActive: true,
      deletedAt: null,
    },
  ];

  for (const ej of ejerciciosData) {
    const res = await prisma.ejercicio.upsert({
      where: { id: ej.id },
      update: {
        nombre: ej.nombre,
        grupoMuscular: ej.grupoMuscular,
        descripcion: ej.descripcion,
        imagenUrl: ej.imagenUrl,
        videoUrl: ej.videoUrl,
        isActive: ej.isActive,
        deletedAt: ej.deletedAt ? new Date(ej.deletedAt) : null,
      },
      create: {
        id: ej.id,
        nombre: ej.nombre,
        grupoMuscular: ej.grupoMuscular,
        descripcion: ej.descripcion,
        imagenUrl: ej.imagenUrl,
        videoUrl: ej.videoUrl,
        isActive: ej.isActive,
        deletedAt: ej.deletedAt ? new Date(ej.deletedAt) : null,
      },
    });
    console.log(`✓ Ejercicio: ${res.nombre} (${res.grupoMuscular})`);
  }

  // ---------------------------------------------------------------------------
  // 4. RUTINAS DIARIAS (Catálogo de Rutinas Diarias)
  // ---------------------------------------------------------------------------
  console.log("Creando catálogo de rutinas diarias...");

  // Rutina 1: Plantilla Principiante Dia 1
  const rutina1 = await prisma.rutina.upsert({
    where: { id: 1 },
    update: {
      nombre: "Plantilla Principiante Dia 1",
      descripcion: "Rutina inicial de adaptación y acondicionamiento muscular.",
      esTemplate: true,
      isActive: true,
    },
    create: {
      id: 1,
      nombre: "Plantilla Principiante Dia 1",
      descripcion: "Rutina inicial de adaptación y acondicionamiento muscular.",
      esTemplate: true,
      isActive: true,
    },
  });

  await prisma.rutinaEjercicio.deleteMany({ where: { rutinaId: rutina1.id } });
  await prisma.rutinaEjercicio.createMany({
    data: [
      { rutinaId: rutina1.id, ejercicioId: 7, orden: 1, series: 4, repeticiones: "10-12", descansoSegundos: 60, pesoSugerido: 20 },
      { rutinaId: rutina1.id, ejercicioId: 44, orden: 2, series: 4, repeticiones: "10-12", descansoSegundos: 60, pesoSugerido: null },
    ],
  });

  // Rutina 2: Piernas y Cadena Posterior
  const rutina2 = await prisma.rutina.upsert({
    where: { id: 2 },
    update: {
      nombre: "Día B: Piernas y Glúteos",
      descripcion: "Trabajo integral de miembros inferiores. Movimientos compuestos para tren inferior.",
      esTemplate: true,
      isActive: true,
    },
    create: {
      id: 2,
      nombre: "Día B: Piernas y Glúteos",
      descripcion: "Trabajo integral de miembros inferiores. Movimientos compuestos para tren inferior.",
      esTemplate: true,
      isActive: true,
    },
  });

  await prisma.rutinaEjercicio.deleteMany({ where: { rutinaId: rutina2.id } });
  await prisma.rutinaEjercicio.createMany({
    data: [
      { rutinaId: rutina2.id, ejercicioId: 2, orden: 1, series: 4, repeticiones: "8-10", descansoSegundos: 120, pesoSugerido: 60 },
      { rutinaId: rutina2.id, ejercicioId: 5, orden: 2, series: 3, repeticiones: "12-15", descansoSegundos: 60, pesoSugerido: 20 },
    ],
  });

  // Rutina 3: Espalda y Acondicionamiento (Tracción)
  const rutina3 = await prisma.rutina.upsert({
    where: { id: 3 },
    update: {
      nombre: "Día C: Espalda y Core",
      descripcion: "Trabajo de tirón vertical y bisagra para postura y masa muscular dorsal.",
      esTemplate: true,
      isActive: true,
    },
    create: {
      id: 3,
      nombre: "Día C: Espalda y Core",
      descripcion: "Trabajo de tirón vertical y bisagra para postura y masa muscular dorsal.",
      esTemplate: true,
      isActive: true,
    },
  });

  await prisma.rutinaEjercicio.deleteMany({ where: { rutinaId: rutina3.id } });
  await prisma.rutinaEjercicio.createMany({
    data: [
      { rutinaId: rutina3.id, ejercicioId: 3, orden: 1, series: 4, repeticiones: "6-8", descansoSegundos: 90, pesoSugerido: null },
      { rutinaId: rutina3.id, ejercicioId: 5, orden: 2, series: 4, repeticiones: "15", descansoSegundos: 45, pesoSugerido: 24 },
    ],
  });

  console.log(`✓ 3 Rutinas diarias creadas en el catálogo.`);

  // ---------------------------------------------------------------------------
  // 5. PLANTILLA DE PLAN (Multi-Día: 3 Días)
  // ---------------------------------------------------------------------------
  console.log("Creando Plantilla de Rutina para Plan de 3 Días...");

  const templatePlan3 = await prisma.planRutinaTemplate.upsert({
    where: { id: 1 },
    update: {
      nombre: "Principiante 3 dias",
      descripcion: "Plantilla oficial de 3 días para nuevos miembros.",
      planId: plan3Dias.id,
      isActive: true,
    },
    create: {
      id: 1,
      nombre: "Principiante 3 dias",
      descripcion: "Plantilla oficial de 3 días para nuevos miembros.",
      planId: plan3Dias.id,
      isActive: true,
    },
  });

  await prisma.planRutinaTemplateDia.deleteMany({
    where: { templateId: templatePlan3.id },
  });

  await prisma.planRutinaTemplateDia.createMany({
    data: [
      { templateId: templatePlan3.id, diaNumero: 1, nombreDia: "Día 1 — Pecho y Hombros", rutinaId: rutina1.id },
      { templateId: templatePlan3.id, diaNumero: 2, nombreDia: "Día 2 — Piernas y Glúteos", rutinaId: rutina2.id },
      { templateId: templatePlan3.id, diaNumero: 3, nombreDia: "Día 3 — Espalda y Core", rutinaId: rutina3.id },
    ],
  });

  console.log(`✓ Plantilla Multi-Día "${templatePlan3.nombre}" configurada para los 3 días del plan.`);

  // ---------------------------------------------------------------------------
  // 6. ASIGNACIÓN AL MIEMBRO DE PRUEBA (Lucas Gómez: Días 1, 2 y 3)
  // ---------------------------------------------------------------------------
  console.log("Asignando los 3 días de la plantilla al socio Lucas Gómez...");

  await prisma.usuarioRutinaDia.deleteMany({
    where: { usuarioId: usuario.id },
  });

  await prisma.usuarioRutinaDia.createMany({
    data: [
      { usuarioId: usuario.id, diaNumero: 1, nombreDia: "Día 1 — Pecho y Hombros", rutinaId: rutina1.id, isActive: true },
      { usuarioId: usuario.id, diaNumero: 2, nombreDia: "Día 2 — Piernas y Glúteos", rutinaId: rutina2.id, isActive: true },
      { usuarioId: usuario.id, diaNumero: 3, nombreDia: "Día 3 — Espalda y Core", rutinaId: rutina3.id, isActive: true },
    ],
  });

  // Inicializar registros de peso de trabajo para los ejercicios asignados
  const ejerciciosParaUsuario = [7, 44];
  for (const ejId of ejerciciosParaUsuario) {
    await prisma.usuarioEjercicio.upsert({
      where: {
        usuarioId_ejercicioId: {
          usuarioId: usuario.id,
          ejercicioId: ejId,
        },
      },
      update: {},
      create: {
        usuarioId: usuario.id,
        ejercicioId: ejId,
        pesoActual: ejId === 7 ? 20 : 0,
      },
    });
  }

  console.log(`✓ Rutina de 3 días asignada a Lucas Gómez.`);

  console.log("\n🎉 Seed completado exitosamente con:");
  console.log("  • 1 SuperAdmin: superadmin@gymmeraki.com (pass: admin123)");
  console.log("  • 1 Admin:      admin@gymmeraki.com (pass: admin123)");
  console.log("  • 1 Miembro:    usuario@gymmeraki.com (DNI: 30000003)");
  console.log("  • 47 Ejercicios catalogados con fotos, videos y descripciones completas");
  console.log("  • 3 Rutinas diarias en el catálogo");
  console.log("  • 1 Plantilla multi-día para Plan de 3 Días");
  console.log("  • Asignación completa de 3 días a Lucas Gómez");
}

main()
  .catch((e) => {
    console.error("❌ Error ejecutando seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
