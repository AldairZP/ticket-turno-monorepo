export interface ValidationProblemDetails {
  title?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export interface MessageErrorResponse {
  message: string;
}

export interface GenerateTicketRequestDto {
  curp: string;
  nombre: string;
  paterno: string;
  materno?: string;
  telefono: string;
  celular: string;
  correo: string;
  fechaAtencion: string;
  nivelEducativoId: number;
  municipioId: number;
  asuntoId: number;
}

export interface UpdateTicketRequestDto {
  curp: string;
  numeroTurno: number;
  nombre: string;
  paterno: string;
  materno?: string;
  telefono: string;
  celular: string;
  correo: string;
  fechaAtencion: string;
  nivelEducativoId: number;
  asuntoId: number;
}

export interface TicketResponseDto {
  curp: string;
  nombreCompleto: string;
  telefono: string;
  celular: string;
  correo: string;
  numeroTurno: number;
  fechaAtencion: string;
  documentoAutenticacion: string;
  estatus: "Pendiente" | "Resuelto";
  nivelEducativo: string;
  municipio: string;
  oficinaRegional: string;
  asunto: string;
}

export interface AdminTicketDetailDto {
  ticketId?: number;
  id?: number;
  numeroTurno?: number;
  curp?: string;
  nombreCompleto?: string;
  telefono?: string;
  celular?: string;
  correo?: string;
  fechaAtencion?: string;
  estatus?: TicketStatus;
  nivelEducativo?: string;
  municipio?: string;
  oficinaRegional?: string;
  asunto?: string;
}

export interface AdminCaptchaResponseDto {
  captchaToken: string;
  prompt: string;
  expiresAtUtc: string;
}

export interface AdminLoginRequestDto {
  username: string;
  password: string;
  captchaToken: string;
  captchaAnswer: string;
}

export interface AdminLoginResponseDto {
  accessToken: string;
  tokenType: "Bearer";
  expiresAtUtc: string;
}

export interface DashboardByMunicipalityItemDto {
  municipioId: number;
  municipio: string;
  totalSolicitudes: number;
  pendientes: number;
  resueltas: number;
}

export interface DashboardStatusSummaryDto {
  filtradoPorMunicipio: boolean;
  municipioId: number | null;
  municipio: string | null;
  totalSolicitudes: number;
  pendientes: number;
  resueltas: number;
  porcentajePendientes: number;
  porcentajeResueltas: number;
  porMunicipio: DashboardByMunicipalityItemDto[];
}

export type TicketStatus = "Pendiente" | "Resuelto";

export interface UpdateTicketStatusRequestDto {
  estatus: TicketStatus;
}

export interface CatalogItemDto {
  id: number;
  nombre: string;
  oficinaRegionalId?: number;
  oficinaRegional?: string;
}

export interface UpsertCatalogItemDto {
  nombre: string;
  oficinaRegionalId?: number;
}

export type CatalogKind = "municipios" | "niveles-educativos" | "asuntos";
