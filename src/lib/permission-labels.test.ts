import { describe, expect, it } from "vitest";
import { PERMISSION_KEYS } from "@/lib/contracts";
import {
  PERMISSION_GROUP_ORDER,
  groupedPermissions,
  manageWithoutView,
  matchesPermission,
  permissionDiff,
  permissionInfo,
  permissionLabel,
  viewCounterpart,
} from "@/lib/permission-labels";

describe("cobertura del catálogo", () => {
  it("describe TODOS los permisos que declara el contrato", () => {
    // Un permiso sin descripción se muestra con su clave técnica, que es
    // exactamente el defecto que este archivo existe para corregir.
    const undescribed = PERMISSION_KEYS.filter((key) => permissionInfo(key).group === "other");
    expect(undescribed).toEqual([]);
  });

  it("ningún rótulo repite la clave técnica", () => {
    for (const key of PERMISSION_KEYS) {
      expect(permissionLabel(key)).not.toBe(key);
      expect(permissionLabel(key)).not.toContain(".");
    }
  });

  it("cada permiso explica su consecuencia, no repite el rótulo", () => {
    for (const key of PERMISSION_KEYS) {
      const info = permissionInfo(key);
      expect(info.detail.length).toBeGreaterThan(20);
      expect(info.detail).not.toBe(info.label);
    }
  });

  it("clasifica cada permiso como ver o gestionar", () => {
    for (const key of PERMISSION_KEYS) {
      expect(["view", "manage"]).toContain(permissionInfo(key).kind);
    }
  });
});

describe("permisos desconocidos", () => {
  it("se muestran legibles en vez de romper o desaparecer", () => {
    // Ocultarlos sería peor: dejarían de poder asignarse sin que nadie lo note.
    const info = permissionInfo("modulo_nuevo.hacer_algo");
    expect(info.label).toBe("Modulo nuevo · hacer algo");
    expect(info.group).toBe("other");
    expect(info.detail.length).toBeGreaterThan(0);
  });

  it("deduce si es de ver o de gestionar por la terminación", () => {
    expect(permissionInfo("modulo_nuevo.view").kind).toBe("view");
    expect(permissionInfo("modulo_nuevo.delete").kind).toBe("manage");
  });
});

describe("agrupación", () => {
  it("reparte los 97 permisos sin perder ni duplicar ninguno", () => {
    const groups = groupedPermissions();
    const flattened = groups.flatMap((group) => group.keys);
    expect(flattened).toHaveLength(PERMISSION_KEYS.length);
    expect(new Set(flattened).size).toBe(PERMISSION_KEYS.length);
  });

  it("respeta el orden declarado de los grupos", () => {
    const order = groupedPermissions().map((group) => group.group);
    const expected = PERMISSION_GROUP_ORDER.filter((group) => order.includes(group));
    expect(order).toEqual(expected);
  });

  it("dentro de cada grupo, «ver» va antes que «gestionar»", () => {
    for (const group of groupedPermissions()) {
      const kinds = group.keys.map((key) => permissionInfo(key).kind);
      const firstManage = kinds.indexOf("manage");
      if (firstManage === -1) continue;
      expect(kinds.slice(firstManage)).not.toContain("view");
    }
  });

  it("no deja ningún permiso en «Otros» con el catálogo real", () => {
    expect(groupedPermissions().some((group) => group.group === "other")).toBe(false);
  });
});

describe("gestionar sin poder ver", () => {
  it("detecta el error más común al componer un rol", () => {
    // Un rol con «Publicar cursos» pero sin «Entrar a capacitación» no llega
    // a la pantalla que tiene permiso de gestionar.
    const gaps = manageWithoutView(["courses.publish"]);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].view).toBe("courses.view");
  });

  it("no se queja cuando el «ver» está presente", () => {
    expect(manageWithoutView(["courses.view", "courses.publish"])).toEqual([]);
  });

  it("no inventa un «ver» que no existe en el contrato", () => {
    // `permissions.assign` no tiene `permissions.view`: exigirlo sería un
    // aviso imposible de resolver.
    expect(viewCounterpart("permissions.assign")).toBeNull();
    expect(manageWithoutView(["permissions.assign"])).toEqual([]);
  });

  it("un permiso de ver nunca genera aviso", () => {
    expect(manageWithoutView(["dashboard.view", "reports.global"])).toEqual([]);
  });
});

describe("búsqueda", () => {
  it("encuentra por rótulo en español", () => {
    expect(matchesPermission("applications.hire", "contratar")).toBe(true);
  });

  it("encuentra por la clave técnica, para quien ya la conoce", () => {
    expect(matchesPermission("applications.hire", "applications.hire")).toBe(true);
  });

  it("encuentra por la descripción", () => {
    expect(matchesPermission("jobs.publish", "portal público")).toBe(true);
  });

  it("ignora acentos y mayúsculas", () => {
    expect(matchesPermission("jobs.publish", "PUBLICO")).toBe(true);
  });

  it("sin término, no filtra nada", () => {
    expect(matchesPermission("dashboard.view", "")).toBe(true);
    expect(matchesPermission("dashboard.view", "   ")).toBe(true);
  });

  it("descarta lo que no coincide", () => {
    expect(matchesPermission("dashboard.view", "inventario")).toBe(false);
  });
});

describe("permissionDiff", () => {
  it("dice qué se añade y qué se quita", () => {
    const diff = permissionDiff(["a", "b", "c"], ["b", "c", "d"]);
    expect(diff.added).toEqual(["d"]);
    expect(diff.removed).toEqual(["a"]);
  });

  it("sin cambios, no hay nada que revisar", () => {
    const diff = permissionDiff(["a", "b"], ["b", "a"]);
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
  });

  it("desde vacío, todo es añadido", () => {
    expect(permissionDiff([], ["a"]).added).toEqual(["a"]);
  });
});
