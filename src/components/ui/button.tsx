import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Botón del sistema.
 *
 * Dos cambios de fondo respecto de la versión anterior:
 *
 * 1. La variante primaria usa `--action` y no `--primary`. `--primary` es el
 *    color que configura cada empresa, así que el contraste del botón dependía
 *    de una decisión del cliente; con una marca clara, el texto encima bajaba
 *    de AA. `--action` es del sistema y está validado (10:1 en tema claro,
 *    10:1 en oscuro). La marca del tenant sigue presente en distintivos, chips
 *    y texto de marca.
 *
 * 2. Las alturas salen de `--control-h-*`, que reescala la densidad. Antes
 *    estaban fijas en `h-11`/`h-12`, así que el modo compacto no habría podido
 *    reducirlas y el cómodo no habría llegado a los 56px acordados.
 *
 * El radio pasa de píldora a `rounded-md`. Una píldora en cada botón es la
 * silueta más reconocible de plantilla administrativa; el rectángulo de
 * esquinas cortas es lo que da el aire de instrumento.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
    "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
    /*
     * Deshabilitado: superficie apagada, NO el relleno de la variante a media
     * opacidad. El relleno oscuro al 55% sobre blanco da un gris medio sólido
     * que se lee como un botón disponible; con superficie y tinta apagadas se
     * lee lo que es. La regla 1.4.3 exime del contraste a los controles
     * inactivos, así que aquí lo que importa es que se distinga del activo.
     */
    "disabled:pointer-events-none disabled:border disabled:border-line disabled:bg-surface-2 disabled:text-ink-disabled disabled:shadow-none",
    "aria-invalid:border-status-danger",
    "data-[loading=true]:cursor-wait",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-action text-on-action shadow-e1 hover:bg-action/90",
        secondary: "border border-line bg-surface-1 text-ink-1 hover:bg-surface-2 hover:border-line-strong",
        outline: "border border-line-control bg-transparent text-ink-1 hover:bg-surface-2",
        ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink-1",
        destructive: "bg-status-danger text-white shadow-e1 hover:bg-status-danger/90",
      },
      size: {
        default: "px-4",
        sm: "px-3 text-xs",
        lg: "px-6 text-base",
        icon: "aspect-square px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/**
 * Alturas por densidad. En móvil manda `--control-h-touch` (56px en cómoda,
 * 44px en compacta); a partir de `sm`, `--control-h-base`. Nunca por debajo de
 * 44px en pantalla táctil, que es el mínimo de WCAG 2.5.8.
 */
const sizeHeights: Record<NonNullable<VariantProps<typeof buttonVariants>["size"]>, string> = {
  default: "min-h-[var(--control-h-touch)] sm:min-h-[var(--control-h-base)]",
  sm: "min-h-11 sm:min-h-[calc(var(--control-h-base)-0.25rem)]",
  lg: "min-h-[var(--control-h-touch)]",
  icon: "size-[var(--control-h-touch)] sm:size-[var(--control-h-base)]",
};

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
  const height = sizeHeights[size ?? "default"];

  // `asChild` delega el renderizado en el hijo (normalmente un `Link`), donde
  // ni `disabled` ni un spinner inyectado tienen sentido.
  if (asChild) {
    return (
      <Comp className={cn(buttonVariants({ variant, size }), height, className)} disabled={disabled} {...props}>
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), height, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
      {loading && loadingLabel ? loadingLabel : children}
    </Comp>
  );
}

export { Button, buttonVariants };
