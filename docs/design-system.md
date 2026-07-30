# Sistema de diseño TalentOS

## Tokens semánticos

Usar exclusivamente las clases `surface-*`, `text-*`, `border-*` y `status-*` declaradas en `globals.css`. Los colores de marca alimentan `primary`, foco y selección después de validar contraste.

## Jerarquía

- Nivel 1: alertas o acciones prioritarias.
- Nivel 2: contenido operativo principal.
- Nivel 3: contexto o información secundaria.

`Card` admite `level={1 | 2 | 3}`. Los badges se reservan para estados, riesgos, etapas y alcance.

## Componentes

`PageHeader`, `ActionBar`, `AccessibleCommandPalette`, `MobileDrawer`, `ResponsiveDataView`, `Pagination`, `FormErrorSummary`, `UnsavedChangesDialog`, `Wizard`, `ContextSwitcher`, `ImpersonationBanner`, `SubscriptionGate`, `ModuleLockedState`, `InlineFeedback` y `DemoModeBanner` son los patrones compartidos.

Todo control interactivo debe mostrar estados default, hover, focus-visible, active, disabled, loading, invalid y success. El área táctil mínima es 44 × 44 px.

## Reglas de verdad

- Nunca mezclar datos reales y demostrativos en una sesión.
- No confirmar una acción hasta recibir respuesta del backend.
- Una función no conectada se muestra bloqueada con explicación.
- Toda sugerencia de IA requiere revisión humana explícita.

## Responsive y accesibilidad

Validar 320, 375, 390 y 430 px, tablet y escritorio. Los recorridos completos deben funcionar con teclado, foco visible, reducción de movimiento y contraste WCAG 2.2 AA.

## Telemetría de producto

Registrar por rol y flujo: tiempo hasta completar, abandono por paso, errores de formulario, retrocesos, uso del buscador, tareas sin soporte, tiempo para encontrar funciones y recuperación después de errores. Medir SUS o UMUX-Lite periódicamente sin incluir datos personales en los eventos.
