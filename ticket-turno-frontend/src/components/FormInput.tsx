import type { InputHTMLAttributes } from "react";

interface FormInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function FormInput({
  id,
  label,
  value,
  onChange,
  ...inputProps
}: FormInputProps) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        className="field-control"
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...inputProps}
      />
    </div>
  );
}
