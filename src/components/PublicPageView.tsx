import { useEffect } from "react";
import { getPalette, getFont, ensureFontLoaded } from "@/lib/themes";
import { HtmlIframe } from "@/components/HtmlIframe";
import { supabase } from "@/integrations/supabase/client";

type Block = { id: string; type: string; data: any };

function trackEvent(pageId: string, event_type: "visit" | "click", extra?: { label?: string; href?: string }) {
  try {
    supabase.from("page_events").insert({
      page_id: pageId,
      event_type,
      label: extra?.label ?? null,
      href: extra?.href ?? null,
    }).then(() => {});
  } catch { /* ignore */ }
}

export function PublicPageView({ page }: { page: any }) {
  const bs = ((page?.button_style as any) ?? {}) as { color?: string; animation?: string; paletteId?: string; fontId?: string };
  const palette = getPalette(bs.paletteId);
  const font = getFont(bs.fontId);
  useEffect(() => { ensureFontLoaded(font); }, [font]);

  // Registrar una visita al cargar (deduplicado por sessionStorage)
  useEffect(() => {
    if (!page?.id) return;
    const key = `zentry-visit-${page.id}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;
    trackEvent(page.id, "visit");
    try { sessionStorage.setItem(key, "1"); } catch { /* ignore */ }
  }, [page?.id]);

  // Escuchar clics en botones/enlaces desde dentro de los iframes HTML importados
  useEffect(() => {
    if (!page?.id) return;
    const onMessage = (ev: MessageEvent) => {
      const d = ev.data;
      if (d && d.source === "zl-public-click") {
        trackEvent(page.id, "click", { label: d.label || "Botón HTML", href: d.href || "" });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [page?.id]);

  const btnColor = bs.color ?? "#A78BFA";
  const animClass = bs.animation === "shake" ? "anim-shake" : bs.animation === "float" ? "anim-float" : "anim-pulse";

  const blocks = (page?.blocks as Block[]) ?? [];
  const hasCover = !!page?.cover_image || !!page?.description;
  const isHtmlOnlyPage = blocks.length === 1 && blocks[0]?.type === "html" && (!hasCover || /<html[\s>]/i.test(blocks[0]?.data?.html ?? ""));

  if (isHtmlOnlyPage) {
    return (
      <div className="fixed inset-0 h-screen w-screen bg-background overflow-auto">
        <HtmlIframe html={blocks[0]?.data?.html ?? ""} fill className="w-full h-full min-h-screen border-0 block" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ background: palette.bg, color: palette.text, fontFamily: font.family }}>
      {hasCover && (
        <div className="mx-auto max-w-md">
          {page.cover_image && <img src={page.cover_image} alt="" className="aspect-square w-full object-cover" />}
          <div className="p-5">
            <h1 className="text-2xl font-bold" style={{ fontFamily: font.family }}>{page.title}</h1>
            {page.description && <p className="mt-1 text-sm opacity-80">{page.description}</p>}
          </div>
        </div>
      )}
      <div className="w-full">
        {blocks.map((b) =>
          b.type === "html" ? (
            <div key={b.id} className="w-full">
              <RenderBlock b={b} pageId={page.id} btnColor={btnColor} animClass={animClass} />
            </div>
          ) : (
            <div key={b.id} className="mx-auto max-w-md px-5 py-2">
              <RenderBlock b={b} pageId={page.id} btnColor={btnColor} animClass={animClass} />
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function RenderBlock({ b, pageId, btnColor, animClass }: { b: Block; pageId: string; btnColor: string; animClass: string }) {
  const d = b.data ?? {};
  switch (b.type) {
    case "title": return <h2 className="text-xl font-bold">{d.text}</h2>;
    case "text": return <p className="text-sm leading-relaxed">{d.text}</p>;
    case "image": return d.url ? <img src={d.url} alt="" className="w-full rounded-lg" /> : null;
    case "ingredients": return (
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {(d.items ?? []).map((it: string, i: number) => <li key={i}>{it}</li>)}
      </ul>
    );
    case "steps": return (
      <ol className="list-decimal space-y-1 pl-5 text-sm">
        {(d.items ?? []).map((it: string, i: number) => <li key={i}>{it}</li>)}
      </ol>
    );
    case "video": return d.url ? (
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe src={d.url} className="h-full w-full" allow="autoplay; encrypted-media" />
      </div>
    ) : null;
    case "gallery": return (
      <div className="grid grid-cols-2 gap-2">
        {(d.urls ?? d.images ?? []).map((u: string, i: number) => (
          <img key={i} src={u} alt="" className="aspect-square w-full rounded-lg object-cover" />
        ))}
      </div>
    );
    case "button": {
      const href = d.href || d.url || "#";
      const label = d.label || "Abrir";
      return (
        <a href={href} target="_blank" rel="noreferrer"
          onClick={() => trackEvent(pageId, "click", { label, href })}
          className={`block rounded-full px-4 py-3 text-center text-sm font-semibold text-white ${animClass}`}
          style={{ background: btnColor }}>
          {label}
        </a>
      );
    }
    case "social": return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(d).map(([k, v]) => (v ? (
          <a key={k} href={v as string} target="_blank" rel="noreferrer"
            onClick={() => trackEvent(pageId, "click", { label: k, href: v as string })}
            className="rounded-full bg-white/20 px-3 py-1 text-xs capitalize backdrop-blur">{k}</a>
        ) : null))}
      </div>
    );
    case "html": return <HtmlIframe html={d.html ?? ""} className="w-full rounded-lg overflow-hidden" />;
    default: return null;
  }
}
