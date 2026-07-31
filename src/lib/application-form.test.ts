import { describe, expect, it } from "vitest";
import {
  applicationFormSchemaForApi,
  getApplicationFields,
  missingRequiredApplicationFields,
} from "./application-form";

const schema = { sections: [{ title: "Perfil", fields: [{ key: "years", label: "Años", type: "NUMBER" as const, required: true }, { key: "remote", label: "Trabajo remoto", type: "BOOLEAN" as const, required: true }] }] };

describe("dynamic application form", () => {
  it("flattens fields declared in sections", () => expect(getApplicationFields(schema).map((field) => field.key)).toEqual(["years", "remote"]));
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
