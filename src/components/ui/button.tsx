import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all active:translate-y-px disabled:pointer-events-none disabled:text-text-disabled disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus aria-invalid:border-status-danger aria-invalid:ring-status-danger/30 data-[loading=true]:cursor-wait data-[loading=true]:opacity-75",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90",
        secondary:
          "border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-11 px-4 text-xs",
        lg: "h-12 px-6",
        icon: "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingLabel,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /**
     * Muestra el indicador de carga, desactiva el botón y expone `aria-busy`.
     *
     * Antes cada pantalla resolvía esto por su cuenta: se pasaba un atributo
     * suelto `data-loading` y se cambiaba el texto a mano ("Guardando…"), sin
     * `aria-busy` y sin impedir el segundo clic de forma consistente.
     */
    loading?: boolean;
    /** Texto alternativo mientras carga. Si se omite, se conserva el original. */
    loadingLabel?: React.ReactNode;
  }) {
  const Comp = asChild ? Slot : "button";

  // `asChild` delega el renderizado en el hijo (normalmente un `Link`), donde
  // ni `disabled` ni un spinner inyectado tienen sentido.
  if (asChild) {
    return <Comp className={cn(buttonVariants({ variant, size, className }))} disabled={disabled} {...props}>{children}</Comp>;
  }

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
      {loading && loadingLabel ? loadingLabel : children}
    </Comp>
  );
}

export { Button, buttonVariants };
