import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
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
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
