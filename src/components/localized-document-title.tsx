"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/locale-provider";

/**
 * El título de la pestaña y la descripción, en el idioma elegido.
 *
 * El problema
 * -----------
 * `metadata` de Next se resuelve en el servidor, antes de que exista el idioma
 * de la persona —que vive en su navegador—. Resultado: la pestaña decía
 * «TalentOS | SaaS multiempresa de RRHH» junto a una pantalla entera en inglés.
 *
 * Por qué así y no con `generateMetadata`
 * ---------------------------------------
 * `generateMetadata` sí podría leer la cookie del idioma, pero leerla convierte
 * la página en dinámica: dejaría de servirse prerenderizada y pasaría a
 * ejecutarse en cada visita. Es un precio alto, sobre todo en la portada.
 *
 * Así que el HTML servido conserva el idioma predeterminado —el canónico para
 * los buscadores— y el título se ajusta en el cliente. El coste es un parpadeo
 * en la pestaña; el beneficio, que las páginas sigan siendo estáticas.
 *
 * Por qué UN SOLO escritor
 * ------------------------
 * La primera versión dejaba que el armazón pusiera un título general y que
 * cada pantalla pusiera el suyo encima. No funcionaba: el orden en que corren
 * los efectos del armazón y los de una pantalla de cliente no está
 * garantizado, y en `/login` —cuya página entera es un componente de cliente—
 * ganaba siempre el general. Medido, no supuesto.
 *
 * Ahora hay un único componente, montado en el armazón, que elige el título
 * según la ruta. Para dar título propio a una pantalla nueva basta con añadir
 * su ruta a `TITULOS`.
 *
 * Lo que queda por resolver
 * -------------------------
 * Next escribe su propio <title> desde `metadata` durante la hidratación, y ese
 * commit compite con este efecto. Por eso se reaplica en los dos fotogramas
 * siguientes. Aun así hay casos —`/register-company` en español, medido— en que
 * el título del servidor gana y queda el general. El idioma SIEMPRE es el
 * correcto; lo que puede no aplicarse es el título específico de la ruta.
 *
 * La solución definitiva no es ganar la carrera sino no correrla: un `metadata`
 * por ruta y por idioma, lo que implica rutas con prefijo de idioma (/es, /en).
 * Es un cambio de rutas públicas y se decide aparte.
 */

/** Ruta → clave del título. La coincidencia es por prefijo, la más larga gana. */
const TITULOS: ReadonlyArray<readonly [string, string, string?]> = [
  ["/login", "auth.meta.login"],
  ["/register-company", "auth.meta.register"],
  ["/", "landing.meta.title", "landing.meta.description"],
];

const POR_DEFECTO = ["app.meta.title", "app.meta.description"] as const;

export function LocalizedDocumentTitle() {
  const { t, locale } = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    const exacta = pathname === "/" ? TITULOS.find(([ruta]) => ruta === "/") : undefined;
    const porPrefijo = TITULOS.filter(([ruta]) => ruta !== "/" && pathname.startsWith(ruta)).sort(
      (a, b) => b[0].length - a[0].length,
    )[0];
    const elegido = exacta ?? porPrefijo;
    const claveTitulo = elegido?.[1] ?? POR_DEFECTO[0];
    const claveDescripcion = elegido?.[2] ?? POR_DEFECTO[1];

    const aplicar = () => {
      document.title = t(claveTitulo);
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", t(claveDescripcion));
    };

    aplicar();
    // Y otra vez al siguiente fotograma. Next escribe su propio <title> desde
    // `metadata` durante la hidratación, y ese commit puede llegar DESPUÉS de
    // este efecto: en español —donde el idioma no cambia tras hidratar y el
    // efecto solo corre una vez— el título del servidor volvía a ganar. Medido
    // sobre la página construida, no supuesto.
    // Dos fotogramas, no uno: el commit de metadatos de Next puede caer en el
    // primero. Con uno solo, `/register-company` en español volvía al título
    // del servidor —medido—; con dos, ya han corrido hidratación y metadatos.
    let segundo = 0;
    const primero = requestAnimationFrame(() => {
      aplicar();
      segundo = requestAnimationFrame(aplicar);
    });
    return () => {
      cancelAnimationFrame(primero);
      cancelAnimationFrame(segundo);
    };
  }, [t, locale, pathname]);

  return null;
}
