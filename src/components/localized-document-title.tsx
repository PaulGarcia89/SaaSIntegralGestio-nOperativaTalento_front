"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/locale-provider";

/**
 * El título de la pestaña y la descripción, en el idioma elegido.
 *
 * El problema
 * -----------
 * `metadata` de Next se resuelve en el servidor, antes de que exista el idioma
 * de la persona —que vive en su navegador—. Resultado: la pestaña decía
 * «TalentOS | Reclutamiento, capacitación y gestión de equipos» junto a una
 * página entera en inglés.
 *
 * Por qué así y no con `generateMetadata`
 * ---------------------------------------
 * `generateMetadata` sí podría leer la cookie del idioma, pero leerla convierte
 * la portada en dinámica: dejaría de servirse prerenderizada y pasaría a
 * ejecutarse en cada visita. Es un precio alto para una página de marketing,
 * justo donde más pesa la carga inicial.
 *
 * Así que el HTML servido conserva el idioma predeterminado —que es el
 * canónico para los buscadores— y el título se ajusta en el cliente cuando la
 * persona ha elegido otro. El coste es un parpadeo en la pestaña; el beneficio,
 * que la portada siga siendo estática.
 */
export function LocalizedDocumentTitle({ titleKey, descriptionKey }: { titleKey: string; descriptionKey?: string }) {
  const { t, locale } = useLocale();

  useEffect(() => {
    document.title = t(titleKey);
    if (!descriptionKey) return;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t(descriptionKey));
  }, [t, locale, titleKey, descriptionKey]);

  return null;
}
