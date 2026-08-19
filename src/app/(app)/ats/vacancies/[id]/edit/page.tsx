import { VacanciesPage } from "../../page";

export default async function EditVacancyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VacanciesPage editId={id} />;
}
