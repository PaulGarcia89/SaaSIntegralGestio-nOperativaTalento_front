import { useId, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  className?: string;
  id?: string;
  children: (props: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  }) => ReactNode;
};

export function FormField({ label, error, description, required, className, children, id: providedId }: FormFieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children({
        id,
        "aria-describedby": [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined,
        "aria-invalid": Boolean(error),
      })}
      {description ? <p id={descriptionId} className="text-xs leading-5 text-muted-foreground">{description}</p> : null}
      {error ? (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
