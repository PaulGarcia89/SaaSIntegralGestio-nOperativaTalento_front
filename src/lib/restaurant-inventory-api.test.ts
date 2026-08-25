import { describe, expect, test } from "vitest";
import { ApiError, getApiErrorMessage, requireRestaurantContext } from "./backend";

describe("restaurant inventory API contract", () => {
  test("requires branch and warehouse context for mutations", () => {
    expect(() => requireRestaurantContext({}, "crear una entrada")).toThrowError(/sucursal y almacén/);
    expect(requireRestaurantContext({ branchId: "branch-1", warehouseId: "warehouse-1" }, "crear una entrada")).toEqual({
      branchId: "branch-1",
      warehouseId: "warehouse-1",
    });
  });

  test.each([
    [401, "Tu sesión expiró"],
    [403, "No tienes permiso"],
    [404, "No encontramos el recurso"],
    [409, "Existe un conflicto"],
    [500, "El servicio no está disponible"],
  ])("maps HTTP %s to an accessible message", (status, expected) => {
    expect(getApiErrorMessage(new ApiError("backend detail", status), "fallback")).toContain(expected);
  });
});
