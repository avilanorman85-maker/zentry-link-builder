// Catálogo de paletas y fuentes para personalizar el fondo y tipografía.

export type Palette = {
  id: string;
  name: string;
  kind: "bright" | "mix" | "neutral";
  bg: string; // CSS gradient o color
  text: string;
  accent: string;
};

export const PALETTES: Palette[] = [
  // 3 brillantes (2 colores, llamativos)
  { id: "neon-violet-cyan", name: "Neón Violeta · Cyan", kind: "bright",
    bg: "linear-gradient(135deg,#7C3AED 0%,#22D3EE 100%)", text: "#FFFFFF", accent: "#FFE066" },
  { id: "neon-magenta-orange", name: "Magenta · Naranja", kind: "bright",
    bg: "linear-gradient(135deg,#EC4899 0%,#FB923C 100%)", text: "#FFFFFF", accent: "#FFFBEB" },
  { id: "neon-lime-blue", name: "Lima · Azul Eléctrico", kind: "bright",
    bg: "linear-gradient(135deg,#A3E635 0%,#3B82F6 100%)", text: "#0F172A", accent: "#FFFFFF" },

  // 4 mezcla sin brillo (2 colores llamativos pero apagados)
  { id: "mix-coral-teal", name: "Coral · Verde Mar", kind: "mix",
    bg: "linear-gradient(135deg,#F87171 0%,#14B8A6 100%)", text: "#FFFFFF", accent: "#FDE68A" },
  { id: "mix-purple-pink", name: "Púrpura · Rosa", kind: "mix",
    bg: "linear-gradient(135deg,#8B5CF6 0%,#F472B6 100%)", text: "#FFFFFF", accent: "#FEF3C7" },
  { id: "mix-amber-rose", name: "Ámbar · Rosa Oscuro", kind: "mix",
    bg: "linear-gradient(135deg,#F59E0B 0%,#BE185D 100%)", text: "#FFFFFF", accent: "#FFFBEB" },
  { id: "mix-indigo-emerald", name: "Índigo · Esmeralda", kind: "mix",
    bg: "linear-gradient(135deg,#4F46E5 0%,#10B981 100%)", text: "#FFFFFF", accent: "#FDE68A" },

  // 3 neutras llamativas
  { id: "neutral-sand", name: "Arena Cálida", kind: "neutral",
    bg: "linear-gradient(180deg,#FAF3E0 0%,#E8D8B7 100%)", text: "#3F2E1E", accent: "#C2410C" },
  { id: "neutral-graphite", name: "Grafito Suave", kind: "neutral",
    bg: "linear-gradient(180deg,#1F2937 0%,#374151 100%)", text: "#F9FAFB", accent: "#FBBF24" },
  { id: "neutral-pearl", name: "Perla Mate", kind: "neutral",
    bg: "linear-gradient(180deg,#F5F5F4 0%,#D6D3D1 100%)", text: "#1C1917", accent: "#9333EA" },
];

export type FontPreset = {
  id: string;
  name: string;
  family: string; // CSS font-family value
  href: string;   // Google Fonts URL
};

export const FONTS: FontPreset[] = [
  { id: "inter", name: "Inter (moderna)", family: "'Inter', sans-serif",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" },
  { id: "poppins", name: "Poppins (amigable)", family: "'Poppins', sans-serif",
    href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" },
  { id: "playfair", name: "Playfair (elegante)", family: "'Playfair Display', serif",
    href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;800&display=swap" },
  { id: "montserrat", name: "Montserrat (limpia)", family: "'Montserrat', sans-serif",
    href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap" },
  { id: "lora", name: "Lora (editorial)", family: "'Lora', serif",
    href: "https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap" },
  { id: "raleway", name: "Raleway (delgada)", family: "'Raleway', sans-serif",
    href: "https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;800&display=swap" },
];

export const DEFAULT_THEME = { paletteId: "neutral-pearl", fontId: "inter" };

export function getPalette(id?: string | null): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[PALETTES.length - 1];
}
export function getFont(id?: string | null): FontPreset {
  return FONTS.find((f) => f.id === id) ?? FONTS[0];
}

/** Inyecta un <link> de Google Fonts en <head> (idempotente). */
export function ensureFontLoaded(font: FontPreset) {
  if (typeof document === "undefined") return;
  const linkId = `gf-${font.id}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = font.href;
  document.head.appendChild(link);
}
