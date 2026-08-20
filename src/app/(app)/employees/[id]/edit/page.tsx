import { EmployeeEditPage } from "@/components/employee-edit-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeEditPage employeeId={id} />;
}
