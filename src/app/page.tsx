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
  return <main className="overflow-x-hidden"><section className="bg-[radial-gradient(circle_at_75%_0%,hsl(38_94%_52%_/_.2),transparent_28%),linear-gradient(145deg,hsl(213_40%_10%),hsl(213_34%_15%)_58%,hsl(206_30%_21%))] text-landing-ink"><div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6"><LandingHeader /><HeroSection /></div></section><div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6"><ModulesSection /><EmployeeLifecycle /><MultiBranchSection /><FlexibleModulesAndRoles /><HowItWorks /><CandidateSection /><div className="py-12 sm:py-16"><FinalCTA /></div><LandingFooter /></div></main>;
}
