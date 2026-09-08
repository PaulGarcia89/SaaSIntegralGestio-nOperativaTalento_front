"use client";

import { Suspense } from "react";
import { AsyncState } from "@/components/async-state";
import { EmployeesDirectoryPage } from "@/components/employees-workspace";

// El directorio lee `?status=` y `?branch=` de la URL, y `useSearchParams`
// exige un límite de Suspense en una página prerenderizada.
export default function Page() {
  return (
    <Suspense fallback={<AsyncState state="loading" title="Cargando el directorio" />}>
      <EmployeesDirectoryPage />
    </Suspense>
  );
}
