import type { OnboardingTemplateTaskConfigDto } from "./contracts";

export function createOnboardingTemplateTask(
  tasks: OnboardingTemplateTaskConfigDto[],
): OnboardingTemplateTaskConfigDto {
  let sequence = tasks.length + 1;
  let taskKey = `custom-task-${sequence}`;
  const existingKeys = new Set(tasks.map((task) => task.taskKey));

  while (existingKeys.has(taskKey)) {
    sequence += 1;
    taskKey = `custom-task-${sequence}`;
  }

  return {
    taskKey,
    taskType: "HR_CHECKLIST",
    title: "Nueva tarea",
    description: "",
    ownerType: "SYSTEM",
    dueOffsetDays: 1,
    dependsOnKeys: [],
    required: true,
    sortOrder: tasks.length,
  };
}

export function moveOnboardingTemplateTask(
  tasks: OnboardingTemplateTaskConfigDto[],
  index: number,
  direction: -1 | 1,
) {
  const destination = index + direction;
  if (destination < 0 || destination >= tasks.length) return tasks;

  const reordered = [...tasks];
  [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
  return prepareOnboardingTemplateTasks(reordered);
}

export function removeOnboardingTemplateTask(
  tasks: OnboardingTemplateTaskConfigDto[],
  index: number,
) {
  return prepareOnboardingTemplateTasks(tasks.filter((_, taskIndex) => taskIndex !== index));
}

export function prepareOnboardingTemplateTasks(
  tasks: OnboardingTemplateTaskConfigDto[],
) {
  const previousKeys = new Set<string>();

  return tasks.map((task, index) => {
    const dependsOnKeys = [...new Set(task.dependsOnKeys ?? [])].filter((key) =>
      previousKeys.has(key),
    );
    previousKeys.add(task.taskKey);

    return {
      ...task,
      title: task.title.trim(),
      description: task.description?.trim() || undefined,
      ownerType: task.ownerType ?? "SYSTEM",
      ownerId: task.ownerType === "USER" ? task.ownerId || undefined : undefined,
      dueOffsetDays:
        task.dueOffsetDays === null || task.dueOffsetDays === undefined
          ? undefined
          : Number(task.dueOffsetDays),
      dependsOnKeys,
      required: task.required ?? false,
      sortOrder: index,
    };
  });
}

export function onboardingTemplateTaskErrors(
  tasks: OnboardingTemplateTaskConfigDto[],
) {
  const errors: string[] = [];
  if (!tasks.length) errors.push("Agrega al menos una tarea.");

  tasks.forEach((task, index) => {
    const label = task.title.trim() || `Tarea ${index + 1}`;
    if (!task.title.trim()) errors.push(`La tarea ${index + 1} necesita un título.`);
    if (
      task.dueOffsetDays !== null &&
      task.dueOffsetDays !== undefined &&
      (!Number.isFinite(Number(task.dueOffsetDays)) || Number(task.dueOffsetDays) < 0)
    ) {
      errors.push(`"${label}" necesita un vencimiento válido.`);
    }
    if (task.ownerType === "USER" && !task.ownerId) {
      errors.push(`Selecciona una persona responsable para "${label}".`);
    }
  });

  return errors;
}
