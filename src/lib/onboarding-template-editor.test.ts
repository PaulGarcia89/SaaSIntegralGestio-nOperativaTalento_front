import { describe, expect, it } from "vitest";
import type { OnboardingTemplateTaskConfigDto } from "./contracts";
import {
  moveOnboardingTemplateTask,
  onboardingTemplateTaskErrors,
  prepareOnboardingTemplateTasks,
  removeOnboardingTemplateTask,
} from "./onboarding-template-editor";

const tasks: OnboardingTemplateTaskConfigDto[] = [
  {
    taskKey: "documents",
    taskType: "DOCUMENT_COLLECTION",
    title: " Documentos ",
    ownerType: "SYSTEM",
    dependsOnKeys: [],
    sortOrder: 0,
  },
  {
    taskKey: "review",
    taskType: "HR_CHECKLIST",
    title: "Revisión",
    ownerType: "SYSTEM",
    dependsOnKeys: ["documents"],
    sortOrder: 1,
  },
];

describe("onboarding template editor", () => {
  it("normalizes order and trims editable values", () => {
    const prepared = prepareOnboardingTemplateTasks(tasks);
    expect(prepared[0]).toMatchObject({ title: "Documentos", sortOrder: 0 });
    expect(prepared[1]).toMatchObject({ sortOrder: 1, dependsOnKeys: ["documents"] });
  });

  it("removes dependencies that become invalid after reordering", () => {
    const moved = moveOnboardingTemplateTask(tasks, 1, -1);
    expect(moved.map((task) => task.taskKey)).toEqual(["review", "documents"]);
    expect(moved[0].dependsOnKeys).toEqual([]);
  });

  it("removes references to deleted tasks", () => {
    const remaining = removeOnboardingTemplateTask(tasks, 0);
    expect(remaining[0].dependsOnKeys).toEqual([]);
    expect(remaining[0].sortOrder).toBe(0);
  });

  it("requires a named owner when the task is assigned to a user", () => {
    expect(
      onboardingTemplateTaskErrors([
        { ...tasks[0], ownerType: "USER", ownerId: undefined },
      ]),
    ).toContain('Selecciona una persona responsable para "Documentos".');
  });
});
