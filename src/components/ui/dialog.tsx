import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn("fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[3px]", className)}
      {...props}
    />
  );
}

export function DialogContent({
  className,
  children,
  "data-full-page": fullPage = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { "data-full-page"?: boolean }) {
  return (
    <DialogPortal>
      {!fullPage ? <DialogOverlay /> : null}
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-0 z-50 flex h-dvh !max-h-dvh w-full max-w-none flex-col overflow-y-auto rounded-none border border-border-default bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl [-webkit-overflow-scrolling:touch] [&>form>button:last-child]:sticky [&>form>button:last-child]:bottom-0 [&>form>button:last-child]:z-10 [&>form>button:last-child]:bg-card [&>form>button:last-child]:py-3 [&>button:last-child]:sticky [&>button:last-child]:bottom-0 [&>button:last-child]:z-10 [&>button:last-child]:bg-card [&>button:last-child]:py-3 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:!max-h-[calc(100dvh-3rem)] sm:w-[calc(100%-2rem)] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-6",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-section hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus sm:right-4 sm:top-4">
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
