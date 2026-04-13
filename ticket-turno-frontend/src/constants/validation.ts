export const CURP_REGEX = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[A-Z0-9][0-9]$/;
export const CURP_HTML_PATTERN = "[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[A-Z0-9][0-9]";
export const CURP_FORMAT_HINT =
  "Formato invalido. Ejemplo: 4 letras, 6 digitos, H/M, 5 letras y 2 caracteres finales.";

export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export const EMAIL_HTML_PATTERN =
  "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}";
export const EMAIL_FORMAT_HINT =
  "Ingresa un correo valido, por ejemplo: usuario@dominio.com";

export function isValidCurpFormat(value: string) {
  return CURP_REGEX.test(value.trim().toUpperCase());
}

export function isValidEmailFormat(value: string) {
  return EMAIL_REGEX.test(value.trim());
}
