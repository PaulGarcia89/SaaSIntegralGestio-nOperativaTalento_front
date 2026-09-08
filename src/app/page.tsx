import type { Metadata } from "next";
import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/landing-hero";
import { ModulesShowcase } from "@/components/landing/landing-showcase";
import { CandidateSection, EmployeeLifecycle, FinalCTA, FlexibleModulesAndRoles, HowItWorks, LandingFooter, MultiBranchSection } from "@/components/landing/landing-sections";

export const metadata: Metadata = {
  title: "TalentOS | Reclutamiento, capacitación y gestión de equipos",
  description: "Centraliza reclutamiento, onboarding, capacitación, inventario y productividad en una plataforma SaaS multiempresa.",
  alternates: { canonical: "/" },
  openGraph: { title: "TalentOS | Gestión de equipos en una sola plataforma", description: "Contrata, incorpora, capacita y gestiona a tu equipo desde una sola plataforma.", type: "website" },
};

export default function Home() {
  return (
    <main className="overflow-x-hidden bg-canvas">
      <div className="bg-[linear-gradient(160deg,hsl(213_40%_10%),hsl(213_34%_15%)_55%,hsl(206_30%_19%))] text-surface-dark-ink">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
          <LandingHeader />
          <HeroSection />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
        <ModulesShowcase />
        <EmployeeLifecycle />
        <MultiBranchSection />
        <FlexibleModulesAndRoles />
        <HowItWorks />
        <CandidateSection />
        <div className="py-16 sm:py-24">
          <FinalCTA />
        </div>
        <LandingFooter />
      </div>
    </main>
  );
}
