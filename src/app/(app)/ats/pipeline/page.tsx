import { redirect } from "next/navigation";

/**
 * El tablero por etapas ya no es una pantalla aparte: es la vista "Por fases"
 * de "Postulaciones". Se redirige en lugar de renderizar lo mismo en dos rutas, para
 * que no vuelvan a existir dos pantallas que muestran lo mismo.
 *
 * La ruta se conserva porque hay enlaces guardados y correos que apuntan aquí.
 */
export default function PipelinePage() {
  redirect("/ats/candidates?view=fases");
}
