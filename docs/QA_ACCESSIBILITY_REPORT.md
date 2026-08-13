# Reporte de Accesibilidad QA

Objetivo: WCAG 2.1 AA como mínimo, incluyendo criterios relevantes WCAG 2.2.

## Resultado automatizado

| Área | Motor | Resultado |
| --- | --- | --- |
| `/jobs` | Axe, Chromium/Chrome móvil | Sin violaciones detectables A/AA. |
| Portal candidato, perfil, estado, preboarding y reset | Axe, Chromium/Chrome móvil | Sin violaciones detectables A/AA. |
| Rutas internas | Axe | Suite creada, pendiente de credenciales `E2E_RECRUITER_*`. |
| Safari iOS | Axe/Playwright WebKit | Bloqueado por navegador no instalado. |

## Controles observados

- Enlace "Saltar al contenido" presente en shell autenticado.
- Paleta de comandos usa roles de combobox/listbox y foco inicial.
- Dialog base incorpora botón de cierre táctil; `ResponsiveDialog` mantiene acciones en pie fijo.
- Estados de acceso comunican la causa y acción de recuperación.

## Riesgos pendientes de verificar

- Orden de tabulación y devolución de foco tras cada diálogo, drawer y hoja de filtros.
- Zoom 200%, escalado de texto de iOS/Android y modo alto contraste.
- Contraste de branding de cada tenant, no solo tema base.
- Jerarquía de headings y nombres accesibles en todas las pantallas administrativas.
- Lectura de tablas complejas por lector de pantalla, especialmente analítica y compras.
- Anuncios `aria-live` para save/error/asignaciones en todos los formularios.

## Casos obligatorios de regresión

1. Navegar por teclado Login -> Dashboard -> ATS -> modal de contratación -> cierre; comprobar foco.
2. Abrir/cerrar drawer móvil y filtros con teclado/touch; comprobar foco y Escape.
3. Ejecutar Axe autenticado en Dashboard, Candidates, Pipeline, Training Content, Inventory y Onboarding Documents.
4. Revisar contraste por tenant desde colores configurables.
