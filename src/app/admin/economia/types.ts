export const MESES_NOMBRES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export interface UsuarioEconomiaItem {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  isActive: boolean;
  createdAt: string;
  plan: {
    id: number;
    nombre: string;
    precio: number;
    diasPorSemana: number;
  } | null;
  pagoMesActual: {
    id: number;
    monto: number;
    fechaPago: string;
    metodoPago: string | null;
    comprobante: string | null;
    notas: string | null;
  } | null;
  haPagado: boolean;
}

export interface MetricasEconomia {
  mes: number;
  anio: number;
  nombreMes: string;
  recaudacionHastaAhora: number;
  recaudacionTotalPotencial: number;
  pendienteCobro: number;
  porcentajeCobrado: number;
  totalMiembrosConPlan: number;
  miembrosPagados: number;
  miembrosPendientes: number;
}

export interface MesEvolucion {
  mes: number;
  anio: number;
  label: string;
  recaudacion: number;
  cantidadUsuarios: number;
  esProyeccion: boolean;
}

export interface MetodoPagoDesglose {
  metodo: string;
  total: number;
  cantidad: number;
  porcentaje: number;
}

export interface EconomiaDataResponse {
  metricas: MetricasEconomia;
  usuarios: UsuarioEconomiaItem[];
  evolucionHistorica: MesEvolucion[];
  proyeccionFutura: MesEvolucion[];
  metodosPagoDesglose: MetodoPagoDesglose[];
  planesDisponibles: { id: number; nombre: string; precio: number }[];
}

