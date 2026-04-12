export type EducationLevel =
  | "primaria"
  | "secundaria"
  | "preparatoria"
  | "superior";

export type Municipality = "centro" | "norte" | "sur";

export type Subject = "inscripcion" | "beca" | "certificacion" | "otros";

export interface TicketFormData {
  applicantFullName: string;
  studentFirstName: string;
  studentLastNameP: string;
  studentLastNameM: string;
  studentCurp: string;
  phone: string;
  cell: string;
  email: string;
  level: EducationLevel | "";
  municipality: Municipality | "";
  subject: Subject | "";
}
