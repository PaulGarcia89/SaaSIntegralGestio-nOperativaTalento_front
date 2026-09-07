"""
Claves nuevas de la pantalla de sucursales, en los dos idiomas.

Las existentes no se tocan: la regla del proyecto es conservar la
compatibilidad con las traducciones ya presentes. Estas se añaden porque la
pantalla dice cosas que antes no decía —qué arrastra un borrado, por qué el
formulario ya no pide responsable ni dotación—.
"""

import json
from collections import OrderedDict

NEW = {
    "es": {
        "branches.pageDescription": "Dónde opera la empresa. Cada persona, cada movimiento y cada documento pertenece a una sucursal.",
        "branches.formDescription": "El registro de una sucursal guarda su nombre y su ciudad.",
        "branches.scopeNoteTitle": "Qué guarda una sucursal",
        "branches.scopeNote": "Solo nombre y ciudad. El responsable y la dotación no se registran aquí: se deducen de las personas asignadas a la sucursal desde la pantalla de usuarios.",
        "branches.searchPlaceholder": "Buscar por nombre, ciudad o empresa",
        "branches.noMatches": "Ninguna sucursal coincide",
        "branches.noMatchesDescription": "Prueba con otro texto.",
        "branches.unknownCompany": "Empresa sin cargar",
        "branches.noAccessCause": "Las sucursales definen el alcance de casi todo lo que se registra en la empresa.",
        "branches.noAccessOwner": "Quien administra la empresa",
        "branches.noAccessResolution": "Si necesitas consultarlas, pide el permiso «Ver sucursales».",
        "branches.errorDetail": "Reintenta la consulta para continuar.",
        "branches.nameError": "Escribe el nombre de la sucursal.",
        "branches.cityError": "Escribe la ciudad.",
        "branches.companiesWithBranches": "Empresas con sucursales",
        "branches.citiesCovered": "Ciudades cubiertas",
        "branches.billing": "Cobro",
        "branches.deleteIntro": "Eliminar una sucursal la quita del selector y de todo lo que dependa de ella. No hay papelera.",
        "branches.deleteConsequencePeople": "Quien tenga esta sucursal como sede deja de poder seleccionarla y necesitará que se le asigne otra.",
        "branches.deleteConsequenceHistory": "Lo ya registrado en esta sucursal (contrataciones, movimientos, documentos) se conserva con su firma.",
        "branches.deleteConsequenceLast": "Es la única sucursal de {{company}}: la empresa se queda sin ninguna sede operativa.",
        "branches.deleteConsequenceRemaining": "Quedan {{count}} sucursales en la empresa.",
    },
    "en": {
        "branches.pageDescription": "Where the company operates. Every person, movement and document belongs to a branch.",
        "branches.formDescription": "A branch record stores its name and its city.",
        "branches.scopeNoteTitle": "What a branch stores",
        "branches.scopeNote": "Only name and city. Manager and headcount are not recorded here: they follow from the people assigned to the branch on the users screen.",
        "branches.searchPlaceholder": "Search by name, city or company",
        "branches.noMatches": "No branch matches",
        "branches.noMatchesDescription": "Try different text.",
        "branches.unknownCompany": "Company not loaded",
        "branches.noAccessCause": "Branches define the scope of almost everything recorded in the company.",
        "branches.noAccessOwner": "Whoever administers the company",
        "branches.noAccessResolution": "If you need to see them, ask for the «View branches» permission.",
        "branches.errorDetail": "Retry the request to continue.",
        "branches.nameError": "Enter the branch name.",
        "branches.cityError": "Enter the city.",
        "branches.companiesWithBranches": "Companies with branches",
        "branches.citiesCovered": "Cities covered",
        "branches.billing": "Billing",
        "branches.deleteIntro": "Deleting a branch removes it from the selector and from everything that depends on it. There is no recycle bin.",
        "branches.deleteConsequencePeople": "Anyone based at this branch can no longer select it and will need another one assigned.",
        "branches.deleteConsequenceHistory": "What was already recorded at this branch (hires, movements, documents) is kept with its signature.",
        "branches.deleteConsequenceLast": "It is the only branch of {{company}}: the company is left with no operating site.",
        "branches.deleteConsequenceRemaining": "{{count}} branches remain in the company.",
    },
}


def main():
    for locale, entries in NEW.items():
        path = f"src/i18n/locales/{locale}/common.json"
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle, object_pairs_hook=OrderedDict)
        added = 0
        for key, value in entries.items():
            if key in data:
                continue
            data[key] = value
            added += 1
        with open(path, "w", encoding="utf-8") as handle:
            json.dump(data, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        print("ok", path, added, "claves nuevas")


main()
