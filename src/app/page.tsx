import type { Metadata } from "next";
import { LandingHeader } from "@/components/landing/landing-header";
import { CandidateSection, EmployeeLifecycle, FinalCTA, FlexibleModulesAndRoles, HeroSection, HowItWorks, LandingFooter, ModulesSection, MultiBranchSection } from "@/components/landing/landing-sections";

export const metadata: Metadata = {
  title: "TalentOS | Reclutamiento, capacitación y gestión de equipos",
  description: "Centraliza reclutamiento, onboarding, capacitación, inventario y productividad en una plataforma SaaS multiempresa.",
  alternates: { canonical: "/" },
  openGraph: { title: "TalentOS | Gestión de equipos en una sola plataforma", description: "Contrata, incorpora, capacita y gestiona a tu equipo desde una sola plataforma.", type: "website" },
};

export default function Home() {
  return <main className="overflow-x-hidden"><section className="bg-[radial-gradient(circle_at_75%_0%,rgba(34,211,238,.2),transparent_28%),linear-gradient(145deg,#071b33,#0a3252_58%,#075e75)] text-white"><div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6"><LandingHeader /><HeroSection /></div></section><div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6"><ModulesSection /><EmployeeLifecycle /><MultiBranchSection /><FlexibleModulesAndRoles /><HowItWorks /><CandidateSection /><div className="py-12 sm:py-16"><FinalCTA /></div><LandingFooter /></div></main>;
}
