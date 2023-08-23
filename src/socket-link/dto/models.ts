export interface HandleNuevoQrData {
  codigoNuevo: CodigoNuevo;
  usuarioQuema: UsuarioQuema;
  resultQuemar: CodigoNuevo;
}

export interface CodigoNuevo {
  sucursalId: number;
  entradaId: null;
  empleadoId: number | null;
  fechaHora: Date | null;
  lat: null | string;
  lng: null | string;
  finalizado: boolean;
  usuarioId: null;
  id: number;
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  sucursal?: Sucursal;
  contrato?: Contrato;
}

export interface Contrato {
  id: number;
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  empleadoId: number;
  puestoId: number;
  fecha: Date;
  fechaVencimiento: Date;
  numero: string;
  tipoContratoId: number;
  sucursalId: number;
  esquemaPagoId: number;
  esquemaPago2Id: number;
  jornadaId: number;
  cuentaPagoId: number;
  cuentaDepositoBancoId: number;
  cuentaDepositoCuenta: string;
  sueldoReal: number;
  sueldoContratado: number;
  fondoAhorro: number;
  fondoAhorroPorcentaje: number;
  usuarioCancelaId: null;
  motivoCancelacion: null;
  fechaCancelacion: Date;
  nss: string;
  clabe: string;
  salario: number;
  recibeHorasExtras: boolean;
  horarioPredefinidoId: null;
  dependenciaId: null;
  renovacionId: null;
  esValido: boolean;
  fechaPrimerContrato: Date;
  diasCalculoDescuentosPorDia: number;
  horasCalculoDescuentosPorHora: number;
  empleado: Empleado;
  puesto: Puesto;
}

export interface Empleado {
  id: number;
  nombreCompleto: string;
}

export interface Puesto {
  id: number;
  nombre: string;
}

export interface Sucursal {
  id: number;
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  nombre: string;
  descripcion: string;
  calle: string;
  numExt: string;
  colonia: string;
  cp: number;
  municipio: string;
  esMatriz: boolean;
  esLaboratorio: boolean;
  esForanea: boolean;
  lat: number;
  lng: number;
  telefono: string;
  responsable: null;
  puedeHacerRequisicion: boolean;
  usaPrecioNocturno: boolean;
  horarioNocturnoInicio: string;
  horarioNocturnoFin: string;
  zona: string;
  seleccionarZona: boolean;
  diasInventario: number;
  enviaWhatsappVentas: boolean;
  mostrarEventor: boolean;
  haceVentas: boolean;
}

export interface UsuarioQuema {
  firstName: string;
  lastName: string;
  sucursal: string;
  lastUserCheck: Date;
  uuid: string;
}
