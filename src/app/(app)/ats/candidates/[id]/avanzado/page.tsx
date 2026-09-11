import { redirect } from "next/navigation";

// Los enlaces guardados llevan al único flujo de contratación.
export default async function LegacyCandidateProfileRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/ats/candidates/${encodeURIComponent(id)}`);
}
