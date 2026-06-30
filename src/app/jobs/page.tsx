import Link from "next/link";
import { PageIntro } from "@/components/ui";
import { jobs } from "@/lib/mock-data";

export default function JobsPortalPage() {
  return (
    <>
      <PageIntro
        eyebrow="Portal de empleos"
        title="Marca empleadora adaptable por tenant, con filtro simple y foco en conversion."
        description="La experiencia publica prioriza descubrimiento, claridad de requisitos y aplicacion sin friccion."
        actions={<Link className="primary-button" href="/apply">Aplicar ahora</Link>}
      />
      <div className="card-grid">
        {jobs.map((job) => (
          <article className="panel listing-card" key={job.title}>
            <span className="mini-badge">{job.area}</span>
            <h3>{job.title}</h3>
            <p>{job.mode} · Estado {job.status}</p>
            <Link href="/apply" className="secondary-button">
              Ver vacante
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
