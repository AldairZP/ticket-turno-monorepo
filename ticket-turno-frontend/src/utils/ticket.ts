import type { TicketFormData } from "../types/ticket";

const FOLIO_LENGTH = 8;

function sanitize(value: string) {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function buildProvisionalFolio(formData: TicketFormData) {
  const seed = sanitize(
    `${formData.studentCurp}${formData.studentFirstName}${formData.studentLastNameP}${formData.studentLastNameM}`,
  );

  if (!seed) {
    return "#----";
  }

  return `#${seed.slice(0, FOLIO_LENGTH).padEnd(FOLIO_LENGTH, "X")}`;
}

export function buildCitizenName(formData: TicketFormData) {
  const applicantName = formData.applicantFullName.trim();
  if (applicantName) {
    return applicantName;
  }

  const studentName = [
    formData.studentFirstName,
    formData.studentLastNameP,
    formData.studentLastNameM,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

  return studentName || "Pendiente de registro";
}
