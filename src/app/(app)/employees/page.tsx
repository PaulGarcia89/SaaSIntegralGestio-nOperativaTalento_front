"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UsersRound } from "lucide-react";
import { fetchEmployees, type EmployeeDirectoryItem } from "@/lib/backend";
import { AsyncState } from "@/components/async-state";
import { PageHeader, ResponsiveDataView } from "@/components/design-system";
import { FilterToolbar } from "@/components/domain";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const employees = useQuery({ queryKey: ["employees", search, status], queryFn: () => fetchEmployees({ search, status, page: 1, pageSize: 50 }) });
  if (employees.isLoading) return <AsyncState state="loading" title="Cargando empleados" />;
  if (employees.isError) return <AsyncState state="error" title="No fue posible cargar el directorio" onRetry={() => void employees.refetch()} />;
  const data = employees.data?.data ?? [];
  return <div className="space-y-5"><PageHeader eyebrow="Personas" title="Directorio de empleados" description="Consulta el equipo de la sucursal activa, su estado y sus asignaciones actuales." /><FilterToolbar searchPlaceholder="Buscar por nombre o correo" options={[{ label: "Todos", value: "" }, { label: "Activos", value: "ACTIVE" }, { label: "Inactivos", value: "INACTIVE" }, { label: "Finalizados", value: "TERMINATED" }]} searchValue={search} onSearchChange={setSearch} filterValue={status} onFilterChange={setStatus} /><p className="text-sm text-text-secondary">{employees.data?.meta.total ?? 0} empleados encontrados</p><ResponsiveDataView data={data} getKey={(employee) => employee.id} desktop={<div className="grid gap-3 lg:grid-cols-2">{data.map((employee) => <EmployeeCard key={employee.id} employee={employee} />)}</div>} mobile={(employee) => <EmployeeCard employee={employee} />} empty={<Card level={3}><CardContent className="p-6 text-sm text-text-secondary">No hay empleados que coincidan con los filtros de la sucursal activa.</CardContent></Card>} /></div>;
}

function EmployeeCard({ employee }: { employee: EmployeeDirectoryItem }) {
  const primary = employee.branchAssignments.find((assignment) => assignment.isPrimary) ?? employee.branchAssignments[0];
  return <Card level={2}><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><UsersRound className="size-4 text-primary" /><h2 className="truncate font-semibold">{employee.name}</h2></div><p className="mt-1 truncate text-sm text-text-secondary">{employee.email}</p></div><Badge variant={employee.status === "ACTIVE" ? "success" : "secondary"}>{employee.status === "ACTIVE" ? "Activo" : employee.status}</Badge></div><p className="mt-4 text-sm text-text-secondary">{primary ? `${primary.branch.name} · ${primary.role}` : "Sin asignación activa"}</p></CardContent></Card>;
}
