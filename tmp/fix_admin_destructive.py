"""
Pone confirmación en las acciones de administración que no la tenían.

Todas cambian el acceso o los datos de una empresa entera con un solo clic:
apagar un módulo a los 200 usuarios de una empresa, borrar un plan del
catálogo, borrar reglas de automatización en lote o dejar una regla activa
para que empiece a actuar sobre datos de personas.
"""

IMPORT = 'import { confirmAction } from "@/components/confirm-action";\n'


def edit(path, pairs, anchor='import { Button } from "@/components/ui/button";'):
    src = open(path, encoding="utf-8").read()
    original = src
    for old, new in pairs:
        assert src.count(old) == 1, f"{path}: {src.count(old)} apariciones\n{old[:160]}"
        src = src.replace(old, new)
    if IMPORT.strip() not in src:
        assert anchor in src, f"{path}: falta el ancla"
        src = src.replace(anchor, IMPORT + anchor, 1)
    assert src != original
    open(path, "w", encoding="utf-8").write(src)
    print("ok", path, len(pairs))


# ── Módulos: apagar un módulo a una empresa entera ────────────────────────
edit(
    "src/app/(app)/admin/modules/page.tsx",
    [
        (
            """                      onClick={() => toggleMutation.mutate(assignment)}""",
            """                      onClick={() =>
                        void confirmAction({
                          title: assignment.enabled
                            ? `¿Deshabilitar ${moduleLabels[assignment.module]}?`
                            : `¿Habilitar ${moduleLabels[assignment.module]}?`,
                          description: assignment.enabled
                            ? "El módulo desaparece del menú de todas las personas de esta empresa."
                            : "El módulo aparece en el menú de quien tenga permiso para verlo.",
                          consequence: assignment.enabled
                            ? "Quien esté trabajando dentro ahora mismo perderá el acceso en cuanto recargue. Los datos no se borran: vuelven a estar disponibles si se rehabilita."
                            : "Los datos que ya existieran del módulo vuelven a estar accesibles.",
                          confirmLabel: assignment.enabled ? "Deshabilitar el módulo" : "Habilitar el módulo",
                        }).then((ok) => ok && toggleMutation.mutate(assignment))
                      }""",
        ),
        # Sin `onError`, un fallo del servidor dejaba la fila igual y nadie se
        # enteraba de que el cambio no se había aplicado.
        (
            """    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
    },
  });""",
            """    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success("Módulo actualizado");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible cambiar el módulo.")),
  });""",
        ),
    ],
)

# ── Planes: borrar un plan del catálogo ───────────────────────────────────
edit(
    "src/app/(app)/admin/plans/page.tsx",
    [
        (
            """                  onClick={() => remove.mutate(plan.id)}""",
            """                  onClick={() =>
                    void confirmAction({
                      title: `¿Eliminar el plan «${plan.name}»?`,
                      description: "Deja de poder contratarse y desaparece del catálogo.",
                      consequence:
                        "Solo se puede eliminar un plan sin suscripciones. Las empresas que ya contrataron otro plan no se ven afectadas.",
                      confirmLabel: "Eliminar el plan",
                      irreversible: true,
                    }).then((ok) => ok && remove.mutate(plan.id))
                  }""",
        ),
    ],
)

# ── Automatizaciones ──────────────────────────────────────────────────────
edit(
    "src/app/(app)/admin/automations/page.tsx",
    [
        (
            'onClick={() => bulkRules.mutate({ action: "DELETE" })}',
            'onClick={() => void confirmAction({ title: selectedRules.length === 1 ? "¿Eliminar la regla seleccionada?" : `¿Eliminar las ${selectedRules.length} reglas seleccionadas?`, description: "Dejan de existir y de poder ejecutarse.", consequence: "El historial de ejecuciones que ya generaron se conserva, pero las reglas no se pueden recuperar.", confirmLabel: "Eliminar", irreversible: true }).then((ok) => ok && bulkRules.mutate({ action: "DELETE" }))}',
        ),
        (
            "onClick={() => remove.mutate(rule.id)}",
            'onClick={() => void confirmAction({ title: `¿Eliminar «${rule.name}»?`, description: "La regla deja de existir y de ejecutarse.", consequence: "Su historial de ejecuciones se conserva, pero la regla no se puede recuperar.", confirmLabel: "Eliminar la regla", irreversible: true }).then((ok) => ok && remove.mutate(rule.id))}',
        ),
        # Activar una regla la pone a actuar sobre datos de personas reales.
        (
            "onClick={() => toggle.mutate(rule)}",
            'onClick={() => { if (rule.enabled) { toggle.mutate(rule); return; } void confirmAction({ title: `¿Activar «${rule.name}»?`, description: "A partir de ahora la regla se ejecutará sola cada vez que ocurra el evento que la dispara.", consequence: "Actuará sobre datos de personas reales sin volver a preguntar. Simúlala antes si no estás seguro de qué hace.", confirmLabel: "Activar la regla" }).then((ok) => ok && toggle.mutate(rule)); }}',
        ),
    ],
)

# ── Imports que faltaban en módulos: `toast` y el lector de errores ────────
p = "src/app/(app)/admin/modules/page.tsx"
src = open(p, encoding="utf-8").read()
if "from \"sonner\"" not in src:
    src = src.replace(
        'import { fetchModuleAssignments, fetchTenants, updateModuleAssignment } from "@/lib/backend";',
        'import { toast } from "sonner";\n'
        'import {\n'
        '  fetchModuleAssignments,\n'
        '  fetchTenants,\n'
        '  getApiErrorMessage,\n'
        '  updateModuleAssignment,\n'
        '} from "@/lib/backend";',
        1,
    )
    open(p, "w", encoding="utf-8").write(src)
    print("ok imports", p)
