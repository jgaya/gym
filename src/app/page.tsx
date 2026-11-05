import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Meraki Centro de Entrenamiento — Pasión, Fuerza y Salud",
  description:
    "Centro de entrenamiento integral. Musculación, entrenamiento funcional y seguimiento personalizado en nuestras 3 sedes.",
};

// Datos de las 3 Sedes de Meraki
export const SEDES_MERAKI = [
  {
    id: 1,
    nombre: "Centro Entrenamiento 1",
    direccion: "Av. Lunghi 2176",
    ciudad: "Tandil, Buenos Aires",
    horarios: "Lun a Vie: 06:30 a 11:30 | 14:30 a 21:00",
    badge: "El Tropezon",
    telefono: "+54 9 249 412-3451",
    whatsappUrl:
      "https://wa.me/5492494123451?text=Hola%20Meraki!%20Quiero%20consultar%20sobre%20la%20Sede%20Central%20(Av.%20Lunghi)",
    googleMapsUrl: "https://maps.google.com/?q=Av.+Lunghi+2176,+Tandil",
    servicios: ["Musculación & Sobrecarga", "Entrenamiento Funcional", "Zona de Peso Libre"],
  },
  {
    id: 2,
    nombre: "Centro Entrenamiento 2",
    direccion: "Quintana 658",
    ciudad: "Tandil, Buenos Aires",
    horarios: "Lun, Mie, Vie: 07:00 a 12:00 | Lun a Vie: 14:30 a 21:00",
    badge: "Villa Italia",
    telefono: "+54 9 249 412-3452",
    whatsappUrl:
      "https://wa.me/5492494123452?text=Hola%20Meraki!%20Quiero%20consultar%20sobre%20la%20Sede%20Centro",
    googleMapsUrl: "https://maps.google.com/?q=Quintana+658,+Tandil",
    servicios: ["Cardio & Acondicionamiento", "Grupos Reducidos", "Rutinas Personalizadas"],
  },
  {
    id: 3,
    nombre: "Centro Entrenamiento 3",
    direccion: "Av. Del Valle 1380",
    ciudad: "Gardey, Buenos Aires",
    horarios: "Lun a Vie: 07:30 a 21:30 | Sáb: 09:00 a 13:00",
    badge: "Gardey",
    telefono: "+54 9 249 412-3453",
    whatsappUrl:
      "https://wa.me/5492494123453?text=Hola%20Meraki!%20Quiero%20consultar%20sobre%20la%20Sede%20Norte",
    googleMapsUrl: "https://maps.google.com/?q=Av.+Del+Valle+1380,+Gardey",
    servicios: ["Fuerza & Potencia", "Preparación Física", "Circuitos Metabólicos"],
  },
];

// Enlaces de contacto oficiales
export const CONTACTO_MERAKI = {
  instagram: "https://www.instagram.com/merakicentrodeentrenamiento/",
  instagramHandle: "@merakicentrodeentrenamiento",
  whatsappGeneral:
    "https://wa.me/5492494123456?text=Hola%20Meraki!%20Quiero%20información%20sobre%20los%20planes%20y%20horarios%20de%20entrenamiento",
  whatsappNumero: "+5492494610629",
  tiktok: "https://www.tiktok.com/@merakisport.tandil",
  tiktokHandle: "@merakisport.tandil"
};

// Componente SVG de WhatsApp
function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.053-1.01-.065-.25-.078-.57-.19-1.002-.379-1.838-.802-3.039-2.656-3.13-2.779-.093-.122-.739-.983-.739-1.875 0-.891.468-1.33.635-1.512.166-.182.364-.228.485-.228.122 0 .243.002.348.007.112.005.263-.042.411.314.156.376.533 1.3.579 1.394.047.094.078.204.016.327-.063.125-.094.204-.187.313-.094.11-.197.246-.282.33-.095.093-.194.194-.083.384.111.191.493.813 1.056 1.315.725.645 1.335.844 1.526.938.192.094.304.079.418-.047.114-.125.485-.563.615-.756.129-.193.26-.162.437-.094.177.067 1.127.531 1.32.628.194.097.323.144.37.225.047.081.047.472-.097.877zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.434 5.177L2 22l4.98-1.306A9.946 9.946 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.25c-1.634 0-3.15-.499-4.417-1.353l-.316-.214-2.927.768.781-2.853-.232-.37C3.96 14.887 3.75 13.486 3.75 12c0-4.549 3.701-8.25 8.25-8.25 4.548 0 8.25 3.701 8.25 8.25 0 4.548-3.702 8.25-8.25 8.25z" />
    </svg>
  );
}

// Componente SVG de Instagram
function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

// Componente SVG de TikTok
function TikTokIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
    </svg>
  );
}

export default async function Home() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
  const isMember = user?.role === "USER";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8 space-y-16 max-w-6xl mx-auto w-full">
      {/* =========================================================================
          1. HERO PRINCIPAL: MERAKI CENTRO DE ENTRENAMIENTO
          ========================================================================= */}
      <section className="relative w-full overflow-hidden rounded-3xl border border-border bg-surface text-center px-4 py-12 sm:px-8 sm:py-20 shadow-sm">
        {/* Imagen de fondo responsiva alusiva al gimnasio */}
        <img
          src="/hero-gym.jpg"
          alt="Personas entrenando en el gimnasio Meraki"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none select-none"
        />

        {/* Capa de overlay traslúcida para ver claramente el gimnasio y la gente entrenando con excelente legibilidad */}
        <div className="absolute inset-0 bg-white/30 dark:bg-black/30 pointer-events-none select-none" />

        {/* Contenedor de contenido */}
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          {/* Badge & Logo Header */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/logoGym.jpg"
                alt="Meraki Centro de Entrenamiento"
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-border shadow-md"
              />
              <div className="text-left">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-content leading-none">
                  MERAKI
                </h2>
                <span className="text-xs font-black uppercase tracking-widest text-primary block">
                  Centro de Entrenamiento
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-content-muted shadow-2xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>3 Sedes Activas</span>
              <span>•</span>
              <span className="text-content font-bold">Fuerza & Rendimiento</span>
            </div>
          </div>

          {/* Título Principal */}
          <h1 className="text-4xl font-black tracking-tight text-content sm:text-5xl md:text-6xl leading-tight">
            Entrená con pasión,{" "}
            <span className="text-primary block sm:inline">superá tus límites</span>
          </h1>

          {/* Subtítulo Descriptivo */}
          <p className="text-base sm:text-lg text-black dark:text-white font-medium leading-relaxed max-w-2xl mx-auto">
            Somos un centro de entrenamiento dedicado a la salud, la fuerza y la disciplina diaria.
            Planes diseñados a tu medida, equipamiento completo y seguimiento profesional en cada una de nuestras sedes.
          </p>

          {/* Botones Call to Action (WhatsApp, Instagram, TikTok, Acceso a Mi Cuenta) */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
            {/* Botón WhatsApp */}
            <a
              href={CONTACTO_MERAKI.whatsappGeneral}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-95 cursor-pointer"
            >
              <WhatsAppIcon className="h-5 w-5" />
              <span>Escribinos al WhatsApp</span>
            </a>

            {/* Botón Instagram */}
            <a
              href={CONTACTO_MERAKI.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 text-sm font-bold text-content shadow-2xs transition-all hover:bg-surface-hover hover:border-pink-500/50 hover:text-pink-500 active:scale-95 cursor-pointer"
            >
              <InstagramIcon className="h-5 w-5 text-pink-500" />
              <span>Instagram</span>
            </a>

            {/* Botón TikTok */}
            <a
              href={CONTACTO_MERAKI.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 text-sm font-bold text-content shadow-2xs transition-all hover:bg-surface-hover hover:border-neutral-500/50 active:scale-95 cursor-pointer"
            >
              <TikTokIcon className="h-5 w-5" />
              <span>TikTok</span>
            </a>

            {/* Botón Miembro / Acceso a la App */}
            {user ? (
              <Link
                href={isAdmin ? "/admin/rutinas" : "/mi-rutina"}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover active:scale-95"
              >
                <span>{isAdmin ? "Panel Admin" : "Ver Mi Rutina de Hoy 🏋️"}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover active:scale-95"
              >
                <span>Ingresar como Socio</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. NUESTRAS 3 SEDES (DIRECCIONES Y MAPAS)
          ========================================================================= */}
      <section className="w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <span>Ubicación y Horarios</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-content">
            Nuestras 3 Sedes
          </h2>
          <p className="text-sm text-content-muted max-w-xl mx-auto">
            Elegí la sede que más te convenga y acercate a entrenar. Todos los espacios cuentan con equipamiento completo para tu desarrollo físico.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {SEDES_MERAKI.map((sede) => (
            <div
              key={sede.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-xs transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase px-2.5 py-1">
                    {sede.badge}
                  </span>
                  <span className="text-xl">📍</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-content leading-snug">
                    {sede.nombre}
                  </h3>
                  <p className="text-sm font-semibold text-content mt-1">
                    {sede.direccion}
                  </p>
                  <p className="text-xs text-content-muted">
                    {sede.ciudad}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/60 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-content-muted">
                    <span className="text-sm">⏱️</span>
                    <span>{sede.horarios}</span>
                  </div>
                </div>

                {/* Etiquetas de Servicios
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {sede.servicios.map((srv) => (
                    <span
                      key={srv}
                      className="text-[10px] font-semibold bg-surface-hover text-content-muted px-2 py-0.5 rounded border border-border/70"
                    >
                      {srv}
                    </span>
                  ))}
                </div> */}
              </div>

              {/* Botones de Acción de Sede */}
              <div className="pt-6 border-t border-border/60 flex flex-col gap-2">
                <a
                  href={sede.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface hover:bg-surface-hover text-content py-2.5 text-xs font-semibold transition-colors"
                >
                  <span>Ver en Google Maps</span>
                  <span>🗺️</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          3. PILARES Y METODOLOGÍA MERAKI
          ========================================================================= */}
      <section className="w-full space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            ¿Por qué elegirnos?
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-content">
            Metodología y Rendimiento
          </h2>
          <p className="text-sm text-content-muted max-w-lg mx-auto">
            Hacer las cosas con "Meraki" significa poner el alma, la creatividad y la pasión en cada entrenamiento.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl mb-2">
              🏋️‍♂️
            </div>
            <h3 className="text-base font-bold text-content">Musculación & Fuerza</h3>
            <p className="text-xs sm:text-sm text-content-muted leading-relaxed">
              Equipamiento guiado y barras olímpicas para sobrecarga progresiva, aumento de masa muscular y desarrollo de fuerza base.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl mb-2">
              ⚡
            </div>
            <h3 className="text-base font-bold text-content">Entrenamiento Funcional</h3>
            <p className="text-xs sm:text-sm text-content-muted leading-relaxed">
              Circuitos dinámicos adaptados a tu ritmo para optimizar tu capacidad cardiovascular, agilidad, coordinación y movilidad.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl mb-2">
              📱
            </div>
            <h3 className="text-base font-bold text-content">Plataforma para Socios</h3>
            <p className="text-xs sm:text-sm text-content-muted leading-relaxed">
              Accedé a tus rutinas con videos demostrativos en bucle, cronómetro de descanso integrado y calendario mensual de asistencias.
            </p>
          </div>
        </div>
      </section>


      {/* =========================================================================
          5. SECCIÓN ÁREA DE SOCIOS (ACCESO RÁPIDO)
          ========================================================================= */}
      <section className="w-full rounded-2xl border border-dashed border-border bg-surface-hover/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-content">
            {user ? `¡Hola de nuevo, ${user.nombre}! 👋` : "¿Ya sos socio de Meraki?"}
          </h3>
          <p className="text-xs sm:text-sm text-content-muted">
            {user
              ? "Revisá tus ejercicios de hoy, anotá tus pesos y mantené tu constancia al día."
              : "Ingresá con tu DNI para ver tu rutina asignada, cronómetro y calendario de asistencias."}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <Link
              href="/mi-rutina"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary-hover transition-colors shadow-2xs"
            >
              <span>Ir a Mi Rutina</span>
              <span>➜</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary-hover transition-colors shadow-2xs"
            >
              <span>Iniciar Sesión</span>
              <span>➜</span>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
