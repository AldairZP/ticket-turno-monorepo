export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export const LEVEL_OPTIONS: ReadonlyArray<SelectOption<string>> = [
  { value: "1", label: "Primaria" },
  { value: "2", label: "Secundaria" },
  { value: "3", label: "Preparatoria" },
  { value: "4", label: "Licenciatura" },
  { value: "5", label: "Posgrado" },
];

export const MUNICIPALITY_OPTIONS: ReadonlyArray<SelectOption<string>> = [
  { value: "1", label: "Monterrey" },
  { value: "2", label: "San Nicolas" },
  { value: "3", label: "Guadalajara" },
  { value: "4", label: "Zapopan" },
  { value: "5", label: "Merida" },
  { value: "6", label: "Cancun" },
];

export const SUBJECT_OPTIONS: ReadonlyArray<SelectOption<string>> = [
  { value: "1", label: "Inscripcion" },
  { value: "2", label: "Entrega de documentos" },
  { value: "3", label: "Aclaracion de expediente" },
  { value: "4", label: "Tramite general" },
];

export const STATUS_OPTIONS: ReadonlyArray<
  SelectOption<"Pendiente" | "Resuelto">
> = [
  { value: "Pendiente", label: "Pendiente" },
  { value: "Resuelto", label: "Resuelto" },
];

export function findOptionValueByLabel(
  options: ReadonlyArray<SelectOption<string>>,
  label: string,
) {
  const normalizedLabel = label.trim().toLowerCase();

  return (
    options.find(
      (option) => option.label.trim().toLowerCase() === normalizedLabel,
    )?.value ?? ""
  );
}
