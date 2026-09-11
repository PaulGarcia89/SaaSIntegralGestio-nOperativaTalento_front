/** Interpret a datetime-local value in the selected IANA zone, independent of the browser. */
export function interviewStartInZone(value: string, timezone: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Selecciona una fecha y hora válidas.");
  let format: Intl.DateTimeFormat;
  try { format = new Intl.DateTimeFormat("sv-SE", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }); }
  catch { throw new Error("Selecciona una zona horaria válida."); }
  const wallTime = Date.parse(value + ":00Z");
  if (!Number.isFinite(wallTime)) throw new Error("Selecciona una fecha válida.");
  const partsAt = (time: number) => {
    const parts = Object.fromEntries(format.formatToParts(new Date(time)).map((part) => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  };
  // Collect offsets on both sides of a possible DST transition.
  const offsets = new Set([-36, 0, 36].map((hours) => { const instant = wallTime + hours * 3_600_000; return Date.parse(partsAt(instant) + ":00Z") - instant; }));
  const matches = [...offsets].map((offset) => wallTime - offset).filter((instant) => partsAt(instant) === value);
  if (matches.length === 0) throw new Error("Esa hora no existe en la zona seleccionada por el cambio de horario. Elige otra hora.");
  if (matches.length > 1) throw new Error("Esa hora ocurre dos veces por el cambio de horario. Elige una hora fuera de ese intervalo.");
  return new Date(matches[0]);
}
