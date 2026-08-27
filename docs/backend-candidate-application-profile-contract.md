# Contrato backend: perfil reutilizable del postulante

## Objetivo

Persistir en PostgreSQL, dentro del registro del postulante autenticado, toda la información reutilizable de una aplicación. Al iniciar una segunda aplicación, el backend debe devolver esos datos para precargar el formulario. La aplicación actual solo debe sobrescribir los campos que el postulante cambie.

## Extensión de `candidate-auth/profile`

Mantener la ruta existente y ampliar su contrato:

### `GET /candidate-auth/profile`

Requiere la sesión del postulante mediante cookie segura o `Authorization: Bearer`.

Respuesta:

```json
{
  "id": "applicant-id",
  "email": "candidate@example.com",
  "fullName": "Nombre Apellido",
  "phone": "+1...",
  "city": "Miami",
  "linkedinUrl": null,
  "portfolioUrl": null,
  "applicationProfile": {
    "lastName": "Apellido",
    "address": "...",
    "apartmentNumber": "...",
    "state": "FL",
    "zipCode": "33101",
    "dateOfBirth": "1990-01-01",
    "emergencyContactName": "...",
    "emergencyContactRelationship": "...",
    "emergencyContactPhone": "...",
    "is18OrOlder": true,
    "authorizedToWorkInUS": true,
    "workedForCompany": false,
    "familyWorksForCompany": false,
    "felonyConviction": false,
    "educationLevel": "UNIVERSIDAD",
    "schoolName": "...",
    "schoolLocation": "...",
    "previousEmployerCompany": "...",
    "previousEmployerPosition": "...",
    "previousEmployerAddress": "...",
    "previousEmployerLocation": "...",
    "previousEmployerStartDate": "2020-01-01",
    "previousEmployerEndDate": "2024-01-01",
    "previousEmployerEndingSalary": 25,
    "previousEmployerSupervisor": "...",
    "previousEmployerPhone": "...",
    "previousEmployerLeavingReason": "...",
    "previousEmployerMayContactSupervisor": true,
    "reference1Name": "...",
    "reference1Relationship": "...",
    "reference1Phone": "...",
    "reference2Name": "...",
    "reference2Relationship": "...",
    "reference2Phone": "...",
    "reference3Name": "...",
    "reference3Relationship": "...",
    "reference3Phone": "...",
    "updatedAt": "2026-08-27T16:00:00.000Z"
  },
  "socialSecurityNumber": null,
  "socialSecurityNumberMasked": "***-**-1234"
}
```

El Seguro Social nunca debe devolverse en texto plano. Debe almacenarse cifrado y solo devolverse enmascarado. El frontend no debe precargarlo automáticamente.

### `PATCH /candidate-auth/profile`

Debe aceptar actualización parcial y hacer merge transaccional, sin borrar campos omitidos:

```json
{
  "fullName": "Nombre Apellido",
  "phone": "+1...",
  "city": "Miami",
  "applicationProfile": {
    "lastName": "Apellido",
    "educationLevel": "UNIVERSIDAD",
    "workedForCompany": true,
    "workedForCompanyExplanation": "..."
  },
  "socialSecurityNumber": "..."
}
```

Respuestas esperadas:

- `200`: perfil completo actualizado, con el Seguro Social únicamente enmascarado.
- `400`: validación de campos, fechas, enums o formato.
- `401`: sesión ausente o expirada.
- `403`: el postulante intenta modificar otro perfil.
- `409`: conflicto de versión si se implementa control optimista.
- `422`: dato válido sintácticamente pero no aceptable por la política del tenant.

## Integración con postulaciones

En `POST /public/vacancies/:vacancyId/applications`, cuando exista un postulante autenticado:

1. El backend identifica al postulante desde la sesión, nunca desde `candidateId`, `tenantId` o datos enviados por el navegador.
2. Carga `applicationProfile` desde PostgreSQL.
3. Usa esos datos como valores iniciales de la nueva aplicación.
4. Aplica los valores enviados explícitamente por el postulante.
5. Actualiza el perfil reutilizable y crea la aplicación dentro de una transacción.
6. Conserva el snapshot de respuestas usado por esa aplicación para auditoría.

La aplicación debe conservar sus propias respuestas históricas, mientras que el perfil reutilizable debe quedar disponible para futuras aplicaciones.

## Persistencia y seguridad

- Relacionar el perfil con `applicantId`, no con un `tenantId` enviado por el navegador.
- Aplicar autorización en backend para cada lectura y modificación.
- Cifrar el Seguro Social en reposo y ocultarlo en logs, respuestas, analytics y SEO.
- No guardar el Seguro Social ni tokens en `localStorage`.
- Validar tamaño, tipos, enums y fechas en backend.
- Auditar quién y cuándo modificó cada campo sensible.
- Permitir actualización desde el perfil del postulante y desde una aplicación autenticada.
- No sobrescribir valores persistidos con cadenas vacías enviadas por formularios incompletos.

## Estado del frontend

El frontend ya persiste el borrador completo por vacante mediante `/candidate/applications/drafts/:vacancyId` y reutiliza los campos básicos mediante `/candidate-auth/profile`. No debe afirmar que todos los campos se reutilizan entre vacantes hasta que el backend exponga y persista `applicationProfile` con este contrato.
