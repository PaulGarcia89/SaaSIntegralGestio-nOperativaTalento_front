import type { EmployeeOnboardingFlowDto } from "./contracts";

type SignatureFlowSource = Pick<EmployeeOnboardingFlowDto, "id" | "employee">;

export interface SignaturePackageFlowPrefill {
  onboardingFlowId: string;
  fullName: string;
  email: string;
}

export function findSignaturePackageFlowPrefill(
  flows: SignatureFlowSource[],
  flowId: string,
): SignaturePackageFlowPrefill | null {
  const flow = flows.find((item) => item.id === flowId);
  if (!flow) return null;

  return {
    onboardingFlowId: flow.id,
    fullName: flow.employee.name,
    email: flow.employee.email,
  };
}
