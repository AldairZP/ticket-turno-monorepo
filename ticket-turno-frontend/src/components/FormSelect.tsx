import type { SelectHTMLAttributes } from "react";
import type { SelectOption } from "../constants/ticketOptions";

interface FormSelectProps<T extends string> extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "onChange" | "value"
> {
  id: string;
  label: string;
  value: T | "";
  placeholder: string;
  options: ReadonlyArray<SelectOption<T>>;
  onChange: (value: T | "") => void;
}

export function FormSelect<T extends string>({
  id,
  label,
  value,
  placeholder,
  options,
  onChange,
  ...selectProps
}: FormSelectProps<T>) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="select-wrap">
        <select
          className="field-control field-select"
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value as T | "")}
          {...selectProps}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
