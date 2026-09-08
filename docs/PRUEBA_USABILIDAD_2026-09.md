# Prueba de usabilidad — TalentOS (rediseño 2026-09)

Protocolo listo para aplicar con cinco personas y tres tareas, tal como pide
el encargo. Está pensado para que lo conduzca una sola persona (moderadora)
con un cronómetro y esta hoja; no hace falta software de grabación, aunque si
la persona participante lo autoriza, grabar la pantalla del teléfono ayuda a
revisar después.

Cuando tengas las cinco hojas rellenas, pásamelas (foto, CSV o texto) y yo
hago la síntesis: patrones por tarea, severidad y qué cambiar primero.

## 1. Qué se quiere saber

Si una persona que no ha visto la aplicación puede, sin ayuda, completar las
tres operaciones más frecuentes, en su teléfono y en un ordenador, y dónde se
atasca. No se evalúa a la persona: se evalúa la interfaz. Conviene decirlo
en voz alta al empezar.

## 2. Participantes

Cinco personas, ninguna del equipo que construyó el producto. Mezcla
recomendada, porque cada perfil usa un módulo distinto:

| # | Perfil | Módulo que más va a tocar | Dispositivo principal |
|---|---|---|---|
| P1 | Responsable de RR. HH. o administración de una PYME | Reclutamiento | Ordenador (1440 px) |
| P2 | Supervisor o encargado de turno | Reclutamiento y Personas | iPhone (390 px) |
| P3 | Empleado de línea (cocina, sala, operaciones) | Aprendizaje | iPhone |
| P4 | Encargado de compras o inventario de restaurante | Inventario de restaurante | Tablet o iPhone |
| P5 | Persona mayor de 60 años sin costumbre de apps de gestión | Aprendizaje e Inventario | iPhone |

P5 es deliberado: el brief exige que la interfaz sirva a adultos mayores
(texto ≥ 16 px, objetivos de 44 px, iconos con texto). Si P5 falla donde los
demás no, ese hallazgo pesa más, no menos.

## 3. Preparación (30 minutos, una sola vez)

1. Entorno local levantado con `reconstruir-local.command` y datos de prueba
   cargados (`scripts/seed-pruebas-datalink.cjs` con `TEST_PASSWORD`).
2. Tres cuentas listas, con la contraseña escrita en un papel para no
   dictarla: administrador de la empresa, supervisor, empleado. Las crea el
   script de datos de prueba.
3. Estado inicial idéntico para todas las sesiones:
   - Reclutamiento: la vacante «Cocinero de línea» (la crea el script, con
     cuatro candidaturas) con la de **Marco Antonio Ruiz** movida a la etapa
     de entrevista y una entrevista registrada ayer, sin evaluación.
   - Aprendizaje: uno de los cursos publicados asignado a la cuenta
     `empleado.prueba@example.com`, con la segunda lección empezada y sin
     terminar. Anota aquí su título: ______________________.
   - Inventario: una orden de compra aprobada, con cuatro líneas (una de
     ellas tomate, 10 kg), sin recibir. Anota el proveedor: ______________.
   Los datos de prueba llevan siempre `PRUEBA` o `@example.com`, así que se
   distinguen de cualquier dato real.
   Si una sesión cambia ese estado, restáuralo antes de la siguiente (basta
   con revertir la operación desde la propia aplicación).
4. El teléfono de la persona participante o uno de pruebas, sin sesión
   abierta: el inicio de sesión forma parte de lo observado.
5. Cronómetro y esta hoja impresa, una por persona.

## 4. Guion de la sesión (45 minutos por persona)

**Apertura (5 min).** «Vamos a probar una aplicación, no a ti. Piensa en voz
alta: di lo que buscas, lo que esperas que pase y lo que te sorprende. Si te
atascas, intenta salir sola; si no puedes, pídeme ayuda y lo anoto, no pasa
nada.» Pide permiso para grabar pantalla si lo vas a hacer.

**Tres tareas (30 min).** Lee cada tarea tal cual, sin explicar la interfaz
ni señalar dónde está nada. Arranca el cronómetro al terminar de leerla.
Detén la tarea a los 8 minutos aunque no esté acabada.

**Cierre (10 min).** Tres preguntas y despedida.

### Tarea A — Evaluar a un candidato (Reclutamiento)

> «Eres quien entrevistó ayer a Marco Antonio Ruiz para el puesto de
> cocinero de línea. Registra tu evaluación: le das 4 sobre 5 y recomiendas
> avanzar. Después, pásalo a la siguiente etapa del proceso.»

Se considera completada cuando la evaluación queda guardada **y** la
candidatura aparece en la etapa siguiente. Caminos previstos: Dashboard de
Reclutamiento → tarjeta «Entrevistas pendientes de evaluación» → «Evaluar»;
o Candidatos → buscar por nombre → perfil → «Evaluar».

Errores típicos que anotar: abrir «Entrevistas» y no encontrar el botón;
confundir «Reprogramar» con evaluar; guardar la evaluación y no ver cómo
cambiar de etapa; intentar cambiar de etapa desde la lista en vez del perfil.

### Tarea B — Continuar un curso (Aprendizaje)

> «Empezaste un curso la semana pasada y lo dejaste a medias.
> Termina la lección en la que estabas, marca que la completaste y responde
> el cuestionario que viene después.»

Completada cuando el cuestionario queda enviado. Camino previsto: Dashboard
de Aprendizaje → «Continuar donde lo dejaste» → reproductor → «Marcar como
completada» → cuestionario.

Errores típicos: buscar el curso en «Contenido» (que es la parte de
administración); no ver «Marcar como completada» porque está debajo del
vídeo; no entender que el cuestionario es un paso más del mismo curso.

### Tarea C — Recibir mercancía (Inventario de restaurante)

> «Ha llegado el pedido del proveedor [nombre anotado arriba]. Faltó una caja: de tomate
> pediste 10 kg y llegaron 8. Todo lo demás llegó completo. Registra la
> entrada y déjala confirmada.»

Completada cuando la entrada queda confirmada con 8 kg de tomate y las
otras líneas completas, y las existencias han subido. Camino previsto:
Dashboard de Inventario de restaurante → «Recibir mercancía» (o «Pedidos por
recibir») → asistente de entrada: elegir orden → cantidades → confirmar.

Errores típicos: buscar la orden en «Compras» en vez de en «Entradas»;
escribir 8 en una línea equivocada; no saber si «Guardar» ya confirma o
falta un paso; dudar de si la diferencia de 2 kg hay que anotarla en algún
sitio aparte.

### Preguntas de cierre

1. «De las tres cosas, ¿cuál te costó más y por qué?»
2. «¿Hubo algún momento en que no supiste dónde estabas o qué hacer?»
3. «Del 1 al 5, ¿qué tan cómoda te sentirías usando esto cada día?»

## 5. Hoja de registro (una por persona)

Rellena una fila por tarea. «Errores» son acciones que no llevan al
objetivo (abrir la sección equivocada, pulsar el botón equivocado, dar
marcha atrás). «Ayudas» son las veces que la persona pide ayuda o que la
moderadora interviene para desatascar.

| Tarea | Resultado (completada / con ayuda / abandonada / tiempo agotado) | Tiempo (mm:ss) | Errores | Ayudas | Dónde se atascó (pantalla y momento exacto) | Comentario textual de la persona |
|---|---|---|---|---|---|---|
| A · Evaluar candidato | | | | | | |
| B · Continuar curso | | | | | | |
| C · Recibir mercancía | | | | | | |

Datos de la sesión: participante (P1–P5), perfil, dispositivo y tamaño de
pantalla, navegador, fecha, respuestas 1–3 del cierre.

Para pasarme los datos vale este CSV, una fila por tarea y persona:

```
participante,perfil,dispositivo,tarea,resultado,segundos,errores,ayudas,atasco,comentario,comodidad_1a5
P1,rrhh,desktop-1440,A,completada,95,1,0,"Buscó Evaluar en la lista de entrevistas",,4
```

## 6. Cómo se leerán los resultados

Una tarea se da por bien resuelta en el conjunto si al menos 4 de 5 la
completan sin ayuda en menos de 3 minutos (A y B) o 5 minutos (C). Cada
atasco se clasifica por severidad:

| Severidad | Criterio |
|---|---|
| Bloqueante | Impide terminar la tarea o exige ayuda; o lo sufre P5 aunque los demás no |
| Grave | Cuesta más de un minuto o provoca dos o más errores en la misma pantalla |
| Menor | Se resuelve solo, en segundos, pero se repite en dos o más personas |
| Anecdótico | Una sola persona, sin coste de tiempo |

Los bloqueantes y graves se corrigen antes de cualquier otra mejora; los
menores se agrupan por pantalla. Con las cinco hojas, la síntesis entrega:
tabla de éxito y tiempo por tarea, lista de atascos con severidad y pantalla,
citas textuales que ilustran cada uno, y los cambios propuestos en orden.

## 7. Qué no hacer durante la prueba

No señalar dónde está un botón, no completar frases, no defender el diseño
cuando alguien se queja, no corregir el vocabulario de la persona («eso se
llama etapa»). Si la persona pregunta «¿aquí?», responder «¿tú qué crees?».
Anotar también lo que sale bien: si alguien dice «ah, esto es claro», es
dato.
