// Resolver dinámico del enlace público

export type PublicUrlInput = {
  slug: string;
  plan?: "free" | "premium" | "vip";
  customDomain?: string | null;
};

export function getBaseOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return import.meta.env.VITE_APP_URL || "https://zentry.link";
}

export function getBaseHost(): string {
  if (typeof window !== "undefined") {
    return window.location.host;
  }
  return (import.meta.env.VITE_APP_URL || "zentry.link").replace(/^https?:\/\//, "");
}

export const PUBLISHED_HOST = typeof window !== "undefined" ? window.location.host : "zentry.link";
export const PUBLISHED_ORIGIN = typeof window !== "undefined" ? window.location.origin : "https://zentry.link";

/** URL real navegable de la página pública. */
export function getPublicUrl({ slug, plan = "free", customDomain }: PublicUrlInput): string {
  const cd = customDomain?.trim();
  if ((plan === "premium" || plan === "vip") && cd) {
    const clean = cd.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `https://${clean}/${slug}`;
  }
  return `${getBaseOrigin()}/${slug}`;
}

/** Etiqueta amigable para mostrar al usuario. */
export function getPublicUrlLabel({ slug, plan = "free", customDomain }: PublicUrlInput): string {
  const cd = customDomain?.trim();
  if ((plan === "premium" || plan === "vip") && cd) {
    const clean = cd.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `${clean}/${slug}`;
  }
  return `${getBaseHost()}/${slug}`;
}
