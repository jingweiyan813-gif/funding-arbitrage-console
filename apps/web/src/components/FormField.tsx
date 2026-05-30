type FormFieldProps = {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
  hint?: string;
};

export function FormField({
  label,
  value,
  onChange,
  type = "text",
  hint
}: FormFieldProps) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input
        onChange={(event) => onChange(event.currentTarget.value)}
        type={type}
        value={value}
      />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}
