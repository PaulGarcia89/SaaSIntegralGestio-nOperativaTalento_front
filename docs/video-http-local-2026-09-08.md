# Video desde una IP local por HTTP

La página de aprendizaje monta StrictVideoLesson para los cursos que requieren ver el 100 % del video. Ese componente llamaba directamente a crypto.randomUUID dentro del efecto de montaje; el reproductor normal también lo llamaba al inicializar la sesión. En un origen HTTP de la LAN esa función no está disponible y el error termina en el límite de errores de la sección.

Los dos reproductores ahora usan createPlaybackSessionId: emplea randomUUID cuando existe y, en su ausencia, construye un UUID v4 con getRandomValues. Se mantiene el identificador por sesión y el contrato del API de progreso. No se altera el porcentaje de finalización, los controles de adelanto ni las validaciones del servidor.

Validación: tres pruebas de generación nativa, ausencia de randomUUID y bits UUID v4; comprobación de tipos y ESLint sin errores. La prueba simula la disponibilidad de API de HTTP local; no constituye una prueba ejecutada en el iPhone del usuario.
