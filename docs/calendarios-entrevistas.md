# Calendarios de empresa y entrevistas

## Uso

Administración → Configuración de empresa → Calendarios y entrevistas (`/admin/company/calendar`). El administrador pulsa **Conectar con Google**, elige su cuenta en Google y autoriza Calendar. No se solicita ni almacena su contraseña de Google. Se muestra el correo conectado y se permite probar el acceso, elegir calendario, desconectar y guardar preferencias. Microsoft usa el mismo flujo con Entra.

En el perfil de la postulación, agendar una entrevista toma la modalidad, duración, zona horaria y recordatorio de la empresa. Google Calendar/Meet y Outlook/Teams envían la invitación desde el proveedor a candidato, entrevistador y participantes. Para presencial, teléfono o enlace propio se usa el correo configurado de la empresa con invitación ICS. Los reintentos de correo conservan esa invitación. La cola de correo sigue mostrando su estado de entrega.

La hora se interpreta en la zona seleccionada. Horas inexistentes o repetidas durante cambios de horario se rechazan con una indicación para elegir otra. Si falla el proveedor, la cita queda guardada con error y se ofrece reintentar. Reprogramar/cancelar se mantiene disponible en Reclutamiento → Entrevistas.

## Configuración inicial de Google (una vez)

1. Crear un proyecto en Google Cloud y habilitar **Google Calendar API**.
2. Configurar la pantalla de consentimiento OAuth. Durante las pruebas, agregar las cuentas autorizadas como usuarios de prueba.
3. Crear un cliente OAuth de tipo **Aplicación web**.
4. Registrar exactamente esta URI local: `http://localhost/admin/company/calendar`. En producción, registrar `https://TU-DOMINIO/admin/company/calendar`.
5. Guardar Client ID y Client secret en “Configuración de la aplicación” dentro de la pantalla. Alternativamente, configurar `GOOGLE_CALENDAR_CLIENT_ID` y `GOOGLE_CALENDAR_CLIENT_SECRET` en el backend. Nunca usar una contraseña personal aquí.
6. Pulsar **Conectar con Google**, autorizar, luego **Probar conexión**. Si se cambian permisos, volver a conectar.

Se solicitan identidad/correo, eventos, disponibilidad y listado de calendarios. Los tokens se cifran en el backend. Google puede requerir verificación de la aplicación antes de permitir uso general; en modo de prueba las autorizaciones pueden caducar. Véase [OAuth para aplicaciones web](https://developers.google.com/identity/protocols/oauth2/web-server) y [creación de eventos](https://developers.google.com/workspace/calendar/api/guides/create-events).

## Microsoft

Registrar una aplicación web en Microsoft Entra. Configurar la misma ruta de retorno del dominio de la plataforma, agregar permisos delegados `User.Read`, `Calendars.ReadWrite`, `offline_access`, y guardar Application Client ID, Client secret y Directory Tenant ID (o `common`, según el tipo de cuentas admitidas). El calendario/cuenta debe admitir Teams. [Creación de eventos con Microsoft Graph](https://learn.microsoft.com/en-us/graph/api/user-post-events?view=graph-rest-1.0).

## Despliegue y datos

- Aplicar `prisma migrate deploy`. La migración `20260911230000_company_calendar_interviews` es aditiva: crea configuración de empresa y añade metadatos a las entrevistas. **No se debe borrar ni regenerar la base de datos**.
- `FRONTEND_URL` debe ser el origen del frontend. Si se necesitan varias URLs, definir `CALENDAR_OAUTH_REDIRECT_URIS` separadas por comas, con rutas exactas. No se aceptan retornos arbitrarios.
- Configurar y conservar `CALENDAR_TOKEN_ENCRYPTION_KEY` y `CALENDAR_OAUTH_STATE_SECRET`; se admite la compatibilidad existente con `JWT_REFRESH_SECRET` y `JWT_ACCESS_SECRET`. Rotar la clave de cifrado sin migrar los tokens exige reconectar las cuentas.
- La cuenta y calendario se guardan en cada entrevista. Cambiar la configuración afecta las citas nuevas; las anteriores conservan su organizador.
- Desconectar elimina los tokens locales e impide futuras operaciones con esa conexión. También se puede retirar el permiso de la aplicación desde la cuenta del proveedor.
- La conexión OAuth real requiere las credenciales de aplicación y el consentimiento del administrador. Las pruebas automatizadas simulan las respuestas del proveedor; no envían invitaciones reales.

## Validación

Pruebas de estado OAuth firmado, rechazo de retorno no permitido, reutilización y cruce de empresa/usuario; aislamiento del calendario; invitación ICS con UID/SEQUENCE, asistentes sin duplicados y plegado UTF-8; fechas y DST; compatibilidad de entrega SMTP/Resend. La prueba de conexión comprueba lectura del calendario sin crear eventos ni enviar correos.
