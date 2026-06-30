import { PageIntro, SectionCard, InfoList } from "@/components/ui";

export default function ApplyPage() {
  return (
    <>
      <PageIntro
        eyebrow="Aplicacion a vacantes"
        title="Formulario guiado, progresivo y apto para mobile."
        description="La postulacion se divide en pasos claros, con guardado parcial, carga de documentos y preguntas knockout."
      />
      <div className="split-grid">
        <SectionCard title="Paso actual" subtitle="Perfil y experiencia">
          <div className="form-stack">
            <div className="field">
              <label>Nombre completo</label>
              <input placeholder="Ingresa tu nombre" />
            </div>
            <div className="field">
              <label>Email</label>
              <input placeholder="tu@email.com" />
            </div>
            <div className="field">
              <label>Resumen profesional</label>
              <textarea placeholder="Cuentanos por que eres un gran match" rows={5} />
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Experiencia UX" subtitle="Principios">
          <InfoList
            items={[
              { title: "Progreso visible", description: "5 pasos con retorno seguro y validacion inline" },
              { title: "Accesible", description: "Areas tactiles amplias y feedback claro en error o exito" },
              { title: "Compatible", description: "Input dinamico segun vacante, tenant y plan" },
            ]}
          />
        </SectionCard>
      </div>
    </>
  );
}
