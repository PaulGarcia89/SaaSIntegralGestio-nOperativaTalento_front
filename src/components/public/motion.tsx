"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ==========================================================================
   MOVIMIENTO DE LA PORTADA
   ==========================================================================
   Tres reglas, y solo tres:

   · Todo entra una vez, al llegar a la vista, y se queda. Nada parpadea al
     volver a pasar por encima.
   · Un solo tipo de entrada (subir 18 px y aparecer) con escalonado corto.
     Variar la coreografía por sección es lo que hace que una página parezca
     una plantilla.
   · `prefers-reduced-motion` apaga todo: el contenido se pinta ya en su
     estado final, sin retrasos ni desplazamientos.
   ========================================================================== */

const subir: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "figure";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      variants={subir}
      initial={reduce ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : delay }}
    >
      {children}
    </Tag>
  );
}

/** Lista cuyos hijos entran escalonados. Cada hijo debe ser un `RevealItem`. */
export function RevealGroup({ children, className, as = "div", stagger = 0.08 }: { children: ReactNode; className?: string; as?: "div" | "ul" | "ol"; stagger?: number }) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={reduce ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{ staggerChildren: reduce ? 0 : stagger }}
    >
      {children}
    </Tag>
  );
}

export function RevealItem({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" | "article" }) {
  const Tag = motion[as];
  return (
    <Tag className={className} variants={subir} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </Tag>
  );
}

/** Palabra que cambia cada pocos segundos, con salida hacia arriba y entrada desde abajo. */
export function RotatingWord({ words, interval = 2600, className }: { words: string[]; interval?: number; className?: string }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reduce || words.length < 2) return;
    const id = window.setInterval(() => setIndex((current) => (current + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [words.length, interval, reduce]);
  const word = words[index] ?? words[0];
  return (
    <span className={cn("relative inline-grid overflow-hidden align-baseline", className)} aria-live="off">
      {/* Reserva el ancho de la palabra más larga para que la línea no salte. */}
      <span className="invisible col-start-1 row-start-1 whitespace-nowrap">{words.reduce((a, b) => (a.length >= b.length ? a : b), "")}</span>
      <motion.span
        key={word}
        className="col-start-1 row-start-1 whitespace-nowrap"
        initial={reduce ? false : { y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {word}
      </motion.span>
    </span>
  );
}

/** Elemento que flota suavemente (2 px arriba y abajo). Se apaga con `prefers-reduced-motion`. */
export function Float({ children, className, delay = 0, amplitude = 6 }: { children: ReactNode; className?: string; delay?: number; amplitude?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      animate={reduce ? undefined : { y: [0, -amplitude, 0] }}
      transition={{ duration: 6, ease: "easeInOut", repeat: Infinity, delay }}
    >
      {children}
    </motion.div>
  );
}
