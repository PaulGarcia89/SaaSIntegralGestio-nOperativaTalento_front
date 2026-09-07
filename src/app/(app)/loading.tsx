import { SkeletonBlock, SkeletonRows } from "@/components/system";

/**
 * Silueta mientras se resuelve una ruta de la aplicación.
 *
 * Estaba construida a mano con nueve `div` de `animate-pulse` y radios de
 * `rounded-3xl` y `rounded-2xl` que ninguna tarjeta real usa: la silueta no
 * se parecía a lo que venía después, que es justo lo único que una silueta
 * tiene que hacer. Ahora usa las del sistema, que comparten geometría con el
 * contenido definitivo.
 */
export default function AppLoading() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-24" />
      <SkeletonRows rows={6} label="Cargando la pantalla" />
    </div>
  );
}
