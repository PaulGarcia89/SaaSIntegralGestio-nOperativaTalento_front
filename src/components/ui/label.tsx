import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      // Tinta SECUNDARIA, no la del titular: doce rótulos con la tinta
      // principal compiten con el contenido del formulario.
      className={cn("text-sm font-medium text-ink-2", className)}
      {...props}
    />
  );
}
