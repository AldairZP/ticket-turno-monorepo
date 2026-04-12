export function toDatetimeLocalValue(isoDate: string) {
  const parsedDate = new Date(isoDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const offsetMs = parsedDate.getTimezoneOffset() * 60000;
  return new Date(parsedDate.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function toIsoFromDatetimeLocal(datetimeLocal: string) {
  return new Date(datetimeLocal).toISOString();
}

export function formatDateTimeForUi(isoDate: string) {
  const parsedDate = new Date(isoDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Fecha invalida";
  }

  return parsedDate.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function getDefaultFutureDatetimeLocal() {
  const oneHourAhead = new Date(Date.now() + 60 * 60 * 1000);

  // The backend has daily capacity configured only from Monday to Friday.
  while (oneHourAhead.getDay() === 0 || oneHourAhead.getDay() === 6) {
    oneHourAhead.setDate(oneHourAhead.getDate() + 1);
    oneHourAhead.setHours(9, 0, 0, 0);
  }

  const offsetMs = oneHourAhead.getTimezoneOffset() * 60000;

  return new Date(oneHourAhead.getTime() - offsetMs).toISOString().slice(0, 16);
}
