export interface MedidaItem {
  id: number;
  usuarioId: number;
  tipo: string;       // Clave identificadora (ej: "peso", "cintura", o slug personalizado)
  nombre: string;     // Nombre de la medida (ej: "Peso Corporal", "Cintura", "Muslo Superior")
  unidad: string;     // Unidad de medida (ej: "kg", "cm", "%")
  valor: number;      // Valor medido
  fecha: string;      // ISO string
  notas: string | null;
  createdAt: string;
}

export interface MetricaDef {
  key: string;
  label: string;
  unidad: string;
  icono: string;
  descripcion: string;
  color: string;
  esPersonalizada?: boolean;
}

export const METRICAS_PREDEFINIDAS: MetricaDef[] = [
  {
    key: "peso",
    label: "Peso Corporal",
    unidad: "kg",
    icono: "⚖️",
    descripcion: "Evolución de peso corporal",
    color: "#10b981", // Emerald
  },
  {
    key: "cintura",
    label: "Cintura",
    unidad: "cm",
    icono: "📏",
    descripcion: "Perímetro abdominal a la altura del ombligo",
    color: "#3b82f6", // Blue
  },
  {
    key: "biceps",
    label: "Bíceps",
    unidad: "cm",
    icono: "💪",
    descripcion: "Perímetro del brazo contraído o relajado",
    color: "#f59e0b", // Amber
  },
  {
    key: "pecho",
    label: "Pecho / Torso",
    unidad: "cm",
    icono: "🫁",
    descripcion: "Contorno torácico en reposo",
    color: "#ec4899", // Pink
  },
  {
    key: "cadera",
    label: "Cadera / Glúteos",
    unidad: "cm",
    icono: "📐",
    descripcion: "Circunferencia en el punto de mayor volumen",
    color: "#8b5cf6", // Purple
  },
  {
    key: "muslo",
    label: "Muslo / Pierna",
    unidad: "cm",
    icono: "🦵",
    descripcion: "Contorno del cuádriceps / muslo medio",
    color: "#06b6d4", // Cyan
  },
  {
    key: "pantorrilla",
    label: "Pantorrilla",
    unidad: "cm",
    icono: "🦶",
    descripcion: "Perímetro del gemelo en su punto más ancho",
    color: "#14b8a6", // Teal
  },
  {
    key: "hombros",
    label: "Hombros",
    unidad: "cm",
    icono: "🏋️",
    descripcion: "Circunferencia clavicular / deltoides",
    color: "#f97316", // Orange
  },
  {
    key: "cuello",
    label: "Cuello",
    unidad: "cm",
    icono: "👔",
    descripcion: "Perímetro cervical",
    color: "#6366f1", // Indigo
  },
  {
    key: "antebrazo",
    label: "Antebrazo",
    unidad: "cm",
    icono: "✊",
    descripcion: "Perímetro del antebrazo proximal",
    color: "#84cc16", // Lime
  },
  {
    key: "porcentajeGrasa",
    label: "% Grasa Corporal",
    unidad: "%",
    icono: "📉",
    descripcion: "Porcentaje estimado de grasa por plicometría o bioimpedancia",
    color: "#e11d48", // Rose
  },
];

export interface RegistrarMedidaIndividualInput {
  tipo: string;
  nombre?: string;
  unidad?: string;
  valor: number;
  fecha?: string;
  notas?: string | null;
}

export interface ActualizarMedidaInput {
  tipo?: string;
  nombre?: string;
  unidad?: string;
  valor: number;
  fecha?: string;
  notas?: string | null;
}

export interface CrearTipoMedidaInput {
  nombre: string;
  unidad?: string;
  icono?: string;
  color?: string;
}
