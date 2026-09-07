import { redirect } from "next/navigation";

/**
 * La consola vive en `/admin/integrations`, que es la ruta registrada en la
 * política de acceso y la que apunta el menú. `/admin/queues` era donde
 * estaba el código, y `/admin/integrations` lo reexportaba: quien abría
 * `/admin/queues` directamente —desde un marcador, por ejemplo— se topaba con
 * «esta ruta no está registrada en la política de acceso», porque no lo
 * estaba. Ahora redirige en vez de mentir.
 */
export default function QueuesRedirectPage() {
  redirect("/admin/integrations");
}
