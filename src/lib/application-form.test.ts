import { describe, expect, it } from "vitest";
import {
  applicationFormSchemaForApi,
  getApplicationFields,
  localizedApplicationFormSchema,
  missingRequiredApplicationFields,
} from "./application-form";

const schema = { sections: [{ title: "Perfil", fields: [{ key: "years", label: "Años", type: "NUMBER" as const, required: true }, { key: "remote", label: "Trabajo remoto", type: "BOOLEAN" as const, required: true }] }] };

describe("dynamic application form", () => {
  it("flattens fields declared in sections", () => expect(getApplicationFields(schema).map((field) => field.key)).toEqual(["years", "remote"]));
  it("resolves translated section and field copy", () => {
    const localized = localizedApplicationFormSchema({ sections: [{ id: "main", title: "Perfil", translations: { en: { title: "Profile" } }, fields: [{ key: "name", label: "Nombre", type: "TEXT", translations: { en: { label: "Name" } } }] }] }, "en");
    expect(localized?.sections?.[0].title).toBe("Profile");
    expect(localized?.sections?.[0].fields[0].label).toBe("Name");
  });
  it("detects unanswered required fields", () => expect(missingRequiredApplicationFields(schema, { years: 3 }).map((field) => field.key)).toEqual(["remote"]));
  it("accepts numeric zero and explicit consent", () => expect(missingRequiredApplicationFields(schema, { years: 0, remote: true })).toEqual([]));
  it("converts legacy top-level fields to the section contract required by the API", () => {
    expect(
      applicationFormSchemaForApi({
        fields: [{ key: "motivation", label: "Motivación", type: "TEXTAREA" }],
      }),
    ).toEqual({
      sections: [
        {
          id: "application",
          title: "Preguntas adicionales",
          fields: [
            {
              key: "motivation",
              label: "Motivación",
              type: "TEXTAREA",
              required: false,
            },
          ],
        },
      ],
    });
  });
});
