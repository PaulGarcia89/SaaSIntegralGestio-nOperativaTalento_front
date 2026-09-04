"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormSelectOption = {
  label: string;
  value: string;
};

type FormSelectProps = {
  options: FormSelectOption[];
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
};

export function FormSelect({
  options,
  placeholder,
  value,
  onValueChange,
  className,
  disabled,
  "aria-label": ariaLabel,
}: FormSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      {/* Sin rótulo envolvente ni `aria-label` explícito, el marcador de
          posición ("Cargar dashboard guardado") es el mejor nombre disponible:
          describe la función del control, no su valor actual. */}
      <SelectTrigger className={className} aria-label={ariaLabel ?? placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
