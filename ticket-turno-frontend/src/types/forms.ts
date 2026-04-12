export interface TicketGenerateFormValues {
  curp: string;
  nombre: string;
  paterno: string;
  materno: string;
  telefono: string;
  celular: string;
  correo: string;
  fechaAtencion: string;
  nivelEducativoId: string;
  municipioId: string;
  asuntoId: string;
}

export interface TicketLookupFormValues {
  curp: string;
  numeroTurno: string;
}

export interface TicketUpdateFormValues {
  curp: string;
  numeroTurno: string;
  nombre: string;
  paterno: string;
  materno: string;
  telefono: string;
  celular: string;
  correo: string;
  fechaAtencion: string;
  nivelEducativoId: string;
  asuntoId: string;
}

export interface CatalogEditorFormValues {
  nombre: string;
  oficinaRegionalId: string;
}
