export type CareerPortalType = "PUBLIC" | "PRIVATE_STANDARD" | "BRANDED";

export type CareerPortalAccessType = "OPEN" | "LOGIN_REQUIRED" | "INVITATION_ONLY" | "ACCESS_CODE";

export interface CareerPortalBranding {
  primary?: string | null;
  secondary?: string | null;
  accent?: string | null;
  background?: string | null;
  text?: string | null;
  logo?: string | null;
  logoDark?: string | null;
  favicon?: string | null;
  heroImage?: string | null;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  footerText?: string | null;
  legalLinks?: Array<{ label: string; href: string }>;
  supportEmail?: string | null;
  language?: string | null;
  fontFamily?: string | null;
  customCss?: string | null;
}

export interface CareerPortalContext {
  portalId: string;
  slug?: string;
  type: CareerPortalType;
  company?: { name: string; slug: string };
  accessType: CareerPortalAccessType;
  branding: CareerPortalBranding;
  requireLoginToViewJobs: boolean;
  requireLoginToApply: boolean;
  allowApplicantRegistration: boolean;
  status?: "ACTIVE" | "INACTIVE" | "DOMAIN_UNVERIFIED" | string;
  domain?: string | null;
}

export interface CareerPortalConfigResponse {
  tenant: { id: string; slug: string; name: string };
  marketplace: { enabled: boolean; slug: string; type: string };
  companyPortal: { enabled: boolean; portal: CareerPortalChannel | null };
  brandedCareerSite: { enabled: boolean; portal: CareerPortalChannel | null };
}

export interface CareerPortalBackendBranding {
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  fontFamily?: string | null;
  customCss?: string | null;
  heroImageUrl?: string | null;
  footerText?: string | null;
  supportEmail?: string | null;
  title?: string | null;
  subtitle?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface CareerPortalChannel {
  id: string;
  slug: string;
  name: string;
  type: string;
  access: "PUBLIC" | "PRIVATE" | "INVITATION_ONLY";
  domain?: string | null;
  subdomain?: string | null;
  pathPrefix?: string | null;
  branding?: CareerPortalBackendBranding | null;
}

export type CareerPortalChannelConfigInput = {
  enabled: boolean;
  slug?: string;
  name?: string;
  access?: "PUBLIC" | "PRIVATE" | "INVITATION_ONLY";
  domain?: string;
  subdomain?: string;
  pathPrefix?: string;
  branding?: CareerPortalBackendBranding;
};

export function safePortalSlug(slug?: string | null) {
  return (slug ?? "").replace(/[^a-z0-9-]/gi, "").toLowerCase();
}
