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
  sucursalId: number | null;
  sucursal: {
    id: number;
    barrio: string;
    direccion: string;
  } | null;
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

export const CATEGORIAS_GASTO = [
  "Alquiler",
  "Profesores",
  "Luz y Servicios",
  "Reposición de Máquinas",
  "Limpieza e Insumos",
  "Impuestos y Contabilidad",
  "Marketing y Publicidad",
  "Otros",
] as const;

export interface GastoOperativoItem {
  id: number;
  sucursalId: number;
  sucursal: {
    id: number;
    barrio: string;
    direccion: string;
  };
  concepto: string;
  categoria: string;
  monto: number;
  metodoPago: string;
  comprobante: string | null;
  notas: string | null;
  esRecurrente: boolean;
  fechaGasto: string;
  mes: number;
  anio: number;
}

export interface CategoriaGastoDesglose {
  categoria: string;
  total: number;
  cantidad: number;
  porcentaje: number;
}

export interface MetricasEconomia {
  mes: number;
  anio: number;
  nombreMes: string;
  recaudacionHastaAhora: number; // Recaudación por cuotas de socios
  recaudacionTotalPotencial: number; // Potencial de cuotas de socios
  pendienteCobro: number;
  porcentajeCobrado: number;
  totalMiembrosConPlan: number;
  miembrosPagados: number;
  miembrosPendientes: number;
  // Métricas de Kiosco / Ventas en Mostrador
  ingresosKiosco: number;
  costoKiosco: number;
  gananciaNetaKiosco: number;
  cantidadVentasKiosco: number;
  recaudacionTotalConKiosco: number; // Cuotas cobradas + Ventas Kiosco
  // Métricas de Gastos Operativos y Beneficio Neto Real (Ingresos vs Egresos)
  totalGastosOperativos: number;
  cantidadGastosOperativos: number;
  egresosTotales: number; // Gastos operativos + Costo mercadería kiosco
  beneficioNetoReal: number; // Ingresos totales (Cuotas + Kiosco) - Egresos totales (Gastos + Costo Kiosco)
  margenNetoPorcentaje: number; // % de beneficio neto sobre el ingreso total
}

export interface SucursalResumenEconomia {
  id: number;
  barrio: string;
  direccion: string;
  telefono: string;
  tieneKiosco: boolean;
  recaudacionHastaAhora: number;
  recaudacionTotalPotencial: number;
  pendienteCobro: number;
  porcentajeCobrado: number;
  totalMiembrosConPlan: number;
  miembrosPagados: number;
  miembrosPendientes: number;
  ingresosKiosco: number;
  costoKiosco: number;
  gananciaNetaKiosco: number;
  cantidadVentasKiosco: number;
  recaudacionTotalConKiosco: number;
  // Gastos y Margen Neto de la sucursal
  totalGastosOperativos: number;
  cantidadGastosOperativos: number;
  egresosTotales: number;
  beneficioNetoReal: number;
  margenNetoPorcentaje: number;
}

export interface MesEvolucion {
  mes: number;
  anio: number;
  label: string;
  recaudacion: number;
  gastos: number;
  beneficioNeto: number;
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
  gastosOperativos: GastoOperativoItem[];
  categoriasGastoDesglose: CategoriaGastoDesglose[];
  evolucionHistorica: MesEvolucion[];
  proyeccionFutura: MesEvolucion[];
  metodosPagoDesglose: MetodoPagoDesglose[];
  planesDisponibles: { id: number; nombre: string; precio: number }[];
  sucursalesResumen: SucursalResumenEconomia[];
  sucursalSeleccionadaId: number | null;
}
