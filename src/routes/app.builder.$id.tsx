import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Reorder } from "framer-motion";
import {
  Heading, ListChecks, ListOrdered, Images, Video, Share2, MousePointerClick, Trash2, Type,
  Save, Image as ImageIcon, Sparkles, Plus, Link2, GripVertical, Upload, Code, Palette as PaletteIcon,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { PhoneFrame } from "@/components/PhoneFrame";
import { ImageUploader, MultiImageUploader } from "@/components/ImageUploader";
import { SOCIAL, SocialIcon, type SocialKey } from "@/components/SocialIcons";
import { HtmlIframe, type HtmlIframeHandle, type HtmlSelection } from "@/components/HtmlIframe";
import { usePlan } from "@/lib/plan";
import { PaywallModal } from "@/components/PaywallModal";
import { PALETTES, FONTS, getPalette, getFont, ensureFontLoaded, DEFAULT_THEME } from "@/lib/themes";
import { PUBLISHED_HOST } from "@/lib/public-url";
import { toast } from "sonner";

type BlockType = "image" | "title" | "ingredients" | "steps" | "gallery" | "video" | "social" | "button" | "text" | "html";
type Block = { id: string; type: BlockType; data: any };

const PALETTE: { type: BlockType; label: string; icon: any }[] = [
  { type: "image", label: "Imagen", icon: ImageIcon },
  { type: "title", label: "Título", icon: Heading },
  { type: "ingredients", label: "Ingredientes", icon: ListChecks },
  { type: "steps", label: "Pasos", icon: ListOrdered },
  { type: "gallery", label: "Galería", icon: Images },
  { type: "video", label: "Video", icon: Video },
  { type: "social", label: "Redes sociales", icon: Share2 },
  { type: "button", label: "Botón", icon: MousePointerClick },
  { type: "text", label: "Texto", icon: Type },
];

const newId = () => Math.random().toString(36).slice(2, 9);

function newBlock(type: BlockType): Block {
  const defaults: Record<BlockType, any> = {
    image: { url: "" },
    title: { text: "Nuevo título" },
    ingredients: { items: ["3 huevos", "150 g azúcar"] },
    steps: { items: ["Mezcla los ingredientes secos.", "Hornea 35 min a 180°C."] },
    gallery: { urls: [] },
    video: { url: "" },
    social: { youtube: "", tiktok: "", facebook: "", instagram: "" },
    button: { label: "Comprar ahora", href: "https://", action: "pay" },
    text: { text: "Texto descriptivo..." },
    html: { html: "<p>Contenido HTML importado</p>" },
  };
  return { id: newId(), type, data: defaults[type] };
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

const DOMAIN = PUBLISHED_HOST;

export const Route = createFileRoute("/app/builder/$id")({ component: Builder });

function Builder() {
  const { id } = useParams({ from: "/app/builder/$id" });
  const nav = useNavigate();
  const { user, isAdmin } = useAuth();
  const { plan, limits } = usePlan();
  const isNew = id === "new";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [btnColor, setBtnColor] = useState("#A78BFA");
  const [btnAnim, setBtnAnim] = useState<"shake" | "pulse" | "float">("pulse");
  const [paletteId, setPaletteId] = useState<string>(DEFAULT_THEME.paletteId);
  const [fontId, setFontId] = useState<string>(DEFAULT_THEME.fontId);
  const [paywall, setPaywall] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [tplOpen, setTplOpen] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplPublic, setTplPublic] = useState(false);
  const htmlFileRef = useRef<HTMLInputElement>(null);

  // Edición bidireccional de bloques HTML
  const [selectedHtmlBlockId, setSelectedHtmlBlockId] = useState<string | null>(null);
  const [htmlSelection, setHtmlSelection] = useState<HtmlSelection | null>(null);
  const iframeHandles = useRef<Map<string, HtmlIframeHandle | null>>(new Map());
  const registerIframe = (blockId: string, handle: HtmlIframeHandle | null) => {
    iframeHandles.current.set(blockId, handle);
  };
  const handleSelectInPreview = (blockId: string, sel: HtmlSelection | null) => {
    setSelectedHtmlBlockId(sel ? blockId : null);
    setHtmlSelection(sel);
  };
  const handleEditSelection = (patch: { text?: string; href?: string }) => {
    if (!selectedHtmlBlockId || !htmlSelection) return;
    setHtmlSelection({ ...htmlSelection, ...patch });
    iframeHandles.current.get(selectedHtmlBlockId)?.updateSelected(patch);
  };
  const handleHtmlChangeFromIframe = (blockId: string, html: string) => {
    setBlocks((b) => b.map((x) => (x.id === blockId ? { ...x, data: { ...x.data, html } } : x)));
  };

  // Load page
  useEffect(() => {
    if (isNew || !user) return;
    (async () => {
      const { data } = await supabase.from("pages").select("*").eq("id", id).maybeSingle();
      if (data) {
        setTitle(data.title);
        setSlug(data.slug ?? "");
        setSlugTouched(true);
        setDescription(data.description ?? "");
        setCover(data.cover_image ?? "");
        setBlocks((data.blocks as any) ?? []);
        const bs = (data.button_style as any) ?? {};
        if (bs.color) setBtnColor(bs.color);
        if (bs.animation) setBtnAnim(bs.animation);
        if (bs.paletteId) setPaletteId(bs.paletteId);
        if (bs.fontId) setFontId(bs.fontId);
      }
    })();
  }, [id, isNew, user]);

  // Cargar fuente actual en el head
  useEffect(() => { ensureFontLoaded(getFont(fontId)); }, [fontId]);

  // Load templates
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("page_templates")
        .select("id,name,thumbnail,blocks,button_style,is_public,user_id")
        .order("created_at", { ascending: false });
      setTemplates(data ?? []);
    })();
  }, [tplOpen]);

  // Auto-slug from title when not manually edited
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const addBlock = (t: BlockType) => setBlocks((b) => [...b, newBlock(t)]);
  const removeBlock = (bid: string) => setBlocks((b) => b.filter((x) => x.id !== bid));
  const updateBlock = (bid: string, data: any) =>
    setBlocks((b) => b.map((x) => (x.id === bid ? { ...x, data: { ...x.data, ...data } } : x)));

  const handleCustomColor = (c: string) => {
    if (!limits.customColors) { setPaywall(true); return; }
    setBtnColor(c);
  };

  const handleSlugChange = (v: string) => {
    if (!limits.customUrl) { setPaywall(true); return; }
    setSlugTouched(true);
    setSlug(slugify(v));
  };

  const applyTemplate = (tpl: any) => {
    setBlocks((tpl.blocks ?? []).map((b: any) => ({ ...b, id: newId() })));
    const bs = tpl.button_style ?? {};
    if (bs.color) setBtnColor(bs.color);
    if (bs.animation) setBtnAnim(bs.animation);
    if (bs.paletteId) setPaletteId(bs.paletteId);
    if (bs.fontId) setFontId(bs.fontId);
    toast.success(`Plantilla "${tpl.name}" aplicada`);
  };

  const optimizeHtmlImages = async (rawHtml: string): Promise<string> => {
    try {
      const b64Regex = /src=["'](data:image\/([a-zA-Z0-9+]+);base64,([^"']+))["']/g;
      let match;
      let newHtml = rawHtml;
      const tasks: { fullUrl: string; ext: string; b64: string }[] = [];

      while ((match = b64Regex.exec(rawHtml)) !== null) {
        if (match[3] && match[3].length > 5000) {
          tasks.push({ fullUrl: match[1], ext: match[2] || "png", b64: match[3] });
        }
      }

      if (tasks.length === 0) return rawHtml;

      for (const t of tasks) {
        try {
          const byteCharacters = atob(t.b64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: `image/${t.ext}` });
          const fileName = `imported_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${t.ext}`;

          const { error: upErr } = await supabase.storage.from("page-assets").upload(fileName, blob, {
            contentType: `image/${t.ext}`,
            upsert: true,
          });

          if (!upErr) {
            const { data } = supabase.storage.from("page-assets").getPublicUrl(fileName);
            if (data?.publicUrl) {
              newHtml = newHtml.replaceAll(t.fullUrl, data.publicUrl);
            }
          }
        } catch { /* continue */ }
      }
      return newHtml;
    } catch {
      return rawHtml;
    }
  };

  const appHtmlFileRef = useRef<HTMLInputElement>(null);

  const importMiniAppHtml = async (file: File) => {
    if (plan !== "vip" && !isAdmin) {
      toast.error("Importar Mini Apps HTML está disponible solo en el plan VIP");
      setPaywall(true);
      return;
    }
    try {
      const rawText = await file.text();
      toast.info("Configurando Mini App interactiva...");
      const text = await optimizeHtmlImages(rawText);
      setBlocks([{ id: newId(), type: "html", data: { html: text, isMiniApp: true } }]);
      if (!title.trim()) {
        const guess = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
        if (guess) setTitle(guess);
      }
      toast.success("¡Mini App HTML lista con interactividad y guardado 100% activos!");
    } catch (e: any) {
      toast.error("No se pudo leer el archivo: " + (e?.message ?? "error"));
    }
  };

  const importHtml = async (file: File) => {
    if (plan !== "vip" && !isAdmin) {
      toast.error("Importar HTML está disponible solo en el plan VIP");
      setPaywall(true);
      return;
    }
    try {
      const rawText = await file.text();
      toast.info("Procesando y optimizando HTML...");
      const text = await optimizeHtmlImages(rawText);
      const isFull = /<html[\s>]|<!doctype/i.test(text);
      setBlocks((b) => {
        if (isFull && (b.length === 0 || b.every((x) => x.type === "title" && !x.data.text))) {
          return [{ id: newId(), type: "html", data: { html: text } }];
        }
        return [...b, { id: newId(), type: "html", data: { html: text } }];
      });
      if (!title.trim()) {
        const guess = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
        if (guess) setTitle(guess);
      }
      toast.success("Página HTML importada y optimizada con éxito");
    } catch (e: any) {
      toast.error("No se pudo leer el archivo: " + (e?.message ?? "error"));
    }
  };

  const saveTemplate = async () => {
    if (!user) return;
    if (!tplName.trim()) { toast.error("Ponle un nombre"); return; }
    if (tplPublic && !isAdmin) { toast.error("Solo administradores pueden publicar plantillas globales"); return; }
    const { error } = await supabase.from("page_templates").insert({
      user_id: user.id,
      name: tplName.trim(),
      blocks: blocks as any,
      button_style: { color: btnColor, animation: btnAnim, paletteId, fontId } as any,
      thumbnail: cover || null,
      is_public: tplPublic,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Plantilla guardada");
    setTplName(""); setTplPublic(false); setTplOpen(false);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const autoTitle = title.trim() || `Página ${new Date().toLocaleDateString()}`;
    const finalSlug = slug || slugify(autoTitle) || `pagina-${Date.now().toString(36)}`;
    if (!title.trim()) setTitle(autoTitle);
    const payload = {
      user_id: user.id,
      title: autoTitle,
      slug: finalSlug,
      description,
      cover_image: cover || null,
      blocks: blocks as any,
      button_style: { color: btnColor, animation: btnAnim, paletteId, fontId } as any,
      status: "active",
    };
    if (isNew) {
      const { count } = await supabase.from("pages").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      if ((count ?? 0) >= limits.pages) { setPaywall(true); setSaving(false); return; }
      const { data, error } = await supabase.from("pages").insert(payload).select("id").single();
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Página creada");
      nav({ to: "/app/builder/$id", params: { id: data!.id } });
    } else {
      const { error } = await supabase.from("pages").update(payload).eq("id", id);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Cambios guardados");
    }
  };

  const animClass = useMemo(
    () => ({ shake: "anim-shake", pulse: "anim-pulse", float: "anim-float" }[btnAnim]),
    [btnAnim],
  );

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4 lg:flex-row lg:overflow-hidden">
      {/* Área 1 — Paleta + Plantillas */}
      <aside className="w-full shrink-0 space-y-4 lg:h-full lg:w-[230px] lg:overflow-y-auto lg:pr-2">


        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Elementos</div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {PALETTE.map((p) => (
              <button
                key={p.type}
                onClick={() => addBlock(p.type)}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-xs transition hover:border-primary/60 hover:bg-card/80"
              >
                <p.icon className="h-5 w-5 text-accent" />
                {p.label}
              </button>
            ))}
          </div>
          <input
            ref={htmlFileRef}
            type="file"
            accept=".html,.htm,text/html"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importHtml(f); e.target.value = ""; }}
          />
          <input
            ref={appHtmlFileRef}
            type="file"
            accept=".html,.htm,text/html"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importMiniAppHtml(f); e.target.value = ""; }}
          />
          <div className="space-y-1.5 pt-2">
            <button
              onClick={() => htmlFileRef.current?.click()}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-accent/60 bg-accent/10 p-2 text-xs font-medium text-accent transition hover:bg-accent/20"
            >
              <Upload className="h-3.5 w-3.5" /> Subir Página Web (HTML)
              {plan !== "vip" && <span className="ml-1 rounded-full bg-accent/30 px-1.5 py-0.5 text-[9px]">VIP</span>}
            </button>
            <button
              onClick={() => appHtmlFileRef.current?.click()}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--neon-cyan)]/60 bg-[var(--neon-cyan)]/10 p-2 text-xs font-medium text-[var(--neon-cyan)] transition hover:bg-[var(--neon-cyan)]/20"
            >
              <Sparkles className="h-3.5 w-3.5" /> Mini App Web HTML
              {plan !== "vip" && <span className="ml-1 rounded-full bg-[var(--neon-cyan)]/30 px-1.5 py-0.5 text-[9px]">VIP</span>}
            </button>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plantillas</span>
            <Sparkles className="h-3.5 w-3.5 text-accent" />
          </div>
          <div className="space-y-2">
            {templates.length === 0 && (
              <p className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                Aún no hay plantillas
              </p>
            )}
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className="group flex w-full items-center gap-2 rounded-lg border border-border bg-card p-2 text-left text-xs transition hover:border-accent/60"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-gradient-to-br from-primary/30 to-accent/30">
                  {t.thumbnail ? <img src={t.thumbnail} className="h-full w-full object-cover" /> : <Sparkles className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{t.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {t.is_public ? "Sistema" : "Mía"} · {(t.blocks?.length ?? 0)} bloques
                  </div>
                </div>
              </button>
            ))}
            <Dialog open={tplOpen} onOpenChange={setTplOpen}>
              <DialogTrigger asChild>
                <button
                  disabled={!limits.externalTemplates && !isAdmin && blocks.length === 0}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/50 bg-primary/10 p-2 text-xs font-medium text-primary transition hover:bg-primary/20"
                >
                  <Plus className="h-3.5 w-3.5" /> Subir plantilla
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Guardar como plantilla</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Nombre</Label>
                    <Input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Ej. Pastelería minimalista" />
                  </div>
                  {isAdmin && (
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                      <div>
                        <div className="text-sm font-medium">Plantilla pública</div>
                        <div className="text-xs text-muted-foreground">Visible para todos los usuarios</div>
                      </div>
                      <Switch checked={tplPublic} onCheckedChange={setTplPublic} />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={saveTemplate} className="bg-gradient-neon text-background font-semibold">Guardar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </aside>

      {/* Área 2 — Formulario */}
      <section className="min-w-0 flex-1 space-y-6 lg:h-full lg:overflow-y-auto lg:pr-2">
        <div>
          <h1 className="font-display text-3xl font-bold">{isNew ? "Nueva página" : "Editar página"}</h1>
          <p className="text-sm text-muted-foreground">Plan: <span className="font-semibold uppercase text-accent">{plan}</span></p>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <Label>Título del producto/receta</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Bizcocho de postres" />
          </div>
          <div>
            <Label>Descripción corta</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe en 1-2 líneas..." rows={2} />
          </div>
        </div>

        {/* URL editable */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-accent" />
            <h3 className="font-display font-semibold">URL pública</h3>
            {!limits.customUrl && <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">PRO</span>}
          </div>
          <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-background">
            <span className="flex shrink-0 items-center px-3 text-sm text-muted-foreground">{DOMAIN}/</span>
            <Input
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              disabled={!limits.customUrl}
              className="flex-1 rounded-none border-0 focus-visible:ring-0"
              placeholder="biscocho-de-postres"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {limits.customUrl
              ? plan === "vip"
                ? "Cambios ilimitados."
                : `Puedes cambiar la URL hasta ${limits.urlChanges} veces.`
              : "Se genera automáticamente. Mejora tu plan para personalizarla."}
          </p>
        </div>

        {/* Cover image upload */}
        <div className="space-y-2 rounded-2xl border border-border bg-card p-5">
          <Label>Imagen de portada</Label>
          <ImageUploader value={cover} onChange={setCover} />
        </div>

        {/* Button styles */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-display font-semibold">Estilos del botón</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Animación</Label>
              <Select value={btnAnim} onValueChange={(v: any) => setBtnAnim(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="shake">Shake</SelectItem>
                  <SelectItem value="pulse">Pulse</SelectItem>
                  <SelectItem value="float">Float</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Color {!limits.customColors && <span className="text-xs text-accent">(Pro)</span>}</Label>
              <div className="mt-1.5 flex gap-2">
                {["#A78BFA", "#22D3EE", "#34D399", "#F472B6", "#FB923C"].map((c) => (
                  <button key={c} onClick={() => handleCustomColor(c)} className={`h-8 w-8 rounded-full border-2 ${btnColor === c ? "border-white" : "border-transparent"}`} style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tema (paleta + fuente) */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <PaletteIcon className="h-4 w-4 text-accent" />
            <h3 className="font-display font-semibold">Tema visual</h3>
          </div>

          <Label className="text-xs">Paleta de fondo</Label>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                title={p.name}
                onClick={() => setPaletteId(p.id)}
                className={`h-12 rounded-lg border-2 transition ${paletteId === p.id ? "border-white scale-105" : "border-transparent"}`}
                style={{ background: p.bg }}
              >
                <span className="sr-only">{p.name}</span>
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            3 brillantes · 4 mezcladas · 3 neutras. Se guarda con la página o como plantilla.
          </p>

          <div className="mt-4">
            <Label className="text-xs">Tipo de letra</Label>
            <Select value={fontId} onValueChange={setFontId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONTS.map((f) => (
                  <SelectItem key={f.id} value={f.id} style={{ fontFamily: f.family }}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-3">
          {blocks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Añade bloques desde la izquierda o aplica una plantilla. Se previsualizan en vivo →
            </div>
          )}
          {blocks.map((b) => (
            <div key={b.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">{b.type}</span>
                <button onClick={() => removeBlock(b.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <BlockEditor block={b} onChange={(d) => updateBlock(b.id, d)} />
              {b.type === "html" && selectedHtmlBlockId === b.id && htmlSelection && (
                <div className="mt-3 space-y-2 rounded-lg border border-accent/40 bg-accent/5 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                    Elemento seleccionado: &lt;{htmlSelection.tag}&gt;
                  </div>
                  <div>
                    <Label className="text-xs">Texto</Label>
                    <Input value={htmlSelection.text} onChange={(e) => handleEditSelection({ text: e.target.value })} />
                  </div>
                  {(htmlSelection.tag === "a" || htmlSelection.tag === "button") && (
                    <div>
                      <Label className="text-xs">Enlace (URL)</Label>
                      <Input
                        value={htmlSelection.href}
                        onChange={(e) => handleEditSelection({ href: e.target.value })}
                        placeholder="https://"
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">Los cambios se reflejan en vivo. Pulsa “Guardar página” para persistirlos.</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <Button onClick={save} disabled={saving} size="lg" className="w-full bg-gradient-neon text-background font-semibold glow-violet">
          <Save className="mr-2 h-4 w-4" /> {saving ? "Guardando…" : "Guardar página"}
        </Button>
      </section>

      {/* Área 3 — Vista móvil (fija y ampliada) */}
      <aside className="flex w-full shrink-0 flex-col items-center lg:h-full lg:w-[360px] lg:items-stretch">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">Vista en vivo</span>
          <span className="text-muted-foreground text-[11px]">click en botones para editar</span>
        </div>
        <PhoneFrame>
          <PreviewContent
            title={title} description={description} cover={cover}
            blocks={blocks} setBlocks={setBlocks}
            btnColor={btnColor} animClass={animClass!}
            paletteId={paletteId} fontId={fontId}
            selectedHtmlBlockId={selectedHtmlBlockId}
            selectedHtmlElementId={htmlSelection?.id ?? null}
            onSelectHtml={handleSelectInPreview}
            onHtmlChange={handleHtmlChangeFromIframe}
            registerIframe={registerIframe}
          />
        </PhoneFrame>
      </aside>

      <PaywallModal open={paywall} onOpenChange={setPaywall} feature="esta función Pro" />
    </div>
  );
}

function BlockEditor({ block, onChange }: { block: Block; onChange: (d: any) => void }) {
  const d = block.data;
  switch (block.type) {
    case "title":
    case "text":
      return <Input value={d.text} onChange={(e) => onChange({ text: e.target.value })} />;
    case "image":
      return <ImageUploader value={d.url} onChange={(url) => onChange({ url })} />;
    case "video":
      return <Input value={d.url} onChange={(e) => onChange({ url: e.target.value })} placeholder="URL YouTube/Vimeo/Drive" />;
    case "ingredients":
    case "steps":
      return <Textarea value={(d.items ?? []).join("\n")} onChange={(e) => onChange({ items: e.target.value.split("\n") })} rows={4} placeholder="Una línea por ítem" />;
    case "gallery":
      return <MultiImageUploader value={d.urls ?? []} onChange={(urls) => onChange({ urls })} />;
    case "social":
      return (
        <Accordion type="multiple" className="w-full">
          {(Object.keys(SOCIAL) as SocialKey[]).map((k) => (
            <AccordionItem value={k} key={k} className="border-border">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className={`grid h-7 w-7 place-items-center rounded-md text-white ${SOCIAL[k].brand}`}>
                    <SocialIcon kind={k} className="h-4 w-4" />
                  </span>
                  <span>{SOCIAL[k].label}</span>
                  {d[k] && <span className="ml-2 h-1.5 w-1.5 rounded-full bg-[var(--neon-green)]" />}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Input
                  placeholder={`https://${k}.com/tu-usuario`}
                  value={d[k] ?? ""}
                  onChange={(e) => onChange({ [k]: e.target.value })}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      );
    case "button":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input placeholder="Texto del botón" value={d.label} onChange={(e) => onChange({ label: e.target.value })} />
          <Input placeholder="URL destino" value={d.href} onChange={(e) => onChange({ href: e.target.value })} />
        </div>
      );
    case "html":
      return (
        <Textarea
          value={d.html ?? ""}
          onChange={(e) => onChange({ html: e.target.value })}
          rows={8}
          className="font-mono text-xs"
          placeholder="<div>...</div>"
        />
      );
  }
}

function getEmbedUrl(url: string) {
  if (!url) return "";
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

type PreviewExtras = {
  selectedHtmlBlockId?: string | null;
  selectedHtmlElementId?: string | null;
  onSelectHtml?: (blockId: string, sel: HtmlSelection | null) => void;
  onHtmlChange?: (blockId: string, html: string) => void;
  registerIframe?: (blockId: string, handle: HtmlIframeHandle | null) => void;
};

function PreviewBlock({ b, btnColor, animClass, extras }: { b: Block; btnColor: string; animClass: string; extras?: PreviewExtras }) {
  return (
    <div className="group relative">
      <span className="absolute -left-1 top-1/2 z-10 hidden -translate-y-1/2 cursor-grab text-slate-400 group-hover:block">
        <GripVertical className="h-4 w-4" />
      </span>
      {b.type === "title" && <h3 className="text-base font-bold">{b.data.text}</h3>}
      {b.type === "text" && <p className="text-xs text-slate-600">{b.data.text}</p>}
      {b.type === "image" && b.data.url && <img src={b.data.url} className="w-full rounded-lg" />}
      {b.type === "video" && b.data.url && (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe src={getEmbedUrl(b.data.url)} className="h-full w-full" allowFullScreen />
        </div>
      )}
      {b.type === "gallery" && (b.data.urls ?? []).length > 0 && (
        <Carousel className="w-full">
          <CarouselContent>
            {(b.data.urls as string[]).map((u, i) => (
              <CarouselItem key={i} className="basis-3/4">
                <img src={u} className="aspect-square w-full rounded-lg object-cover" />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
      {b.type === "ingredients" && (
        <div>
          <div className="mb-1 text-xs font-bold uppercase text-slate-500">Ingredientes</div>
          <ul className="list-disc pl-4 text-xs">{(b.data.items ?? []).map((i: string, k: number) => <li key={k}>{i}</li>)}</ul>
        </div>
      )}
      {b.type === "steps" && (
        <div>
          <div className="mb-1 text-xs font-bold uppercase text-slate-500">Pasos</div>
          <ol className="list-decimal pl-4 text-xs">{(b.data.items ?? []).map((i: string, k: number) => <li key={k}>{i}</li>)}</ol>
        </div>
      )}
      {b.type === "social" && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SOCIAL) as SocialKey[]).map((k) =>
            b.data[k] ? (
              <a key={k} href={b.data[k]} target="_blank" rel="noreferrer"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white ${SOCIAL[k].brand}`}>
                <SocialIcon kind={k} className="h-3.5 w-3.5" />
                {SOCIAL[k].label}
              </a>
            ) : null,
          )}
        </div>
      )}
      {b.type === "button" && (
        <button className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white ${animClass}`} style={{ background: btnColor }}>
          {b.data.label}
        </button>
      )}
      {b.type === "html" && (
        <div className="relative w-full overflow-hidden rounded-lg bg-white shadow-xs">
          <HtmlIframe
            html={b.data.html ?? ""}
            editable={!!extras?.onSelectHtml}
            selectedId={extras?.selectedHtmlBlockId === b.id ? extras?.selectedHtmlElementId ?? null : null}
            onSelect={(sel) => extras?.onSelectHtml?.(b.id, sel)}
            onHtmlChange={(h) => extras?.onHtmlChange?.(b.id, h)}
            ref={(handle) => extras?.registerIframe?.(b.id, handle)}
            className="w-full min-h-[500px]"
          />
        </div>
      )}
    </div>
  );
}

function PreviewContent({
  title, description, cover, blocks, setBlocks, btnColor, animClass, paletteId, fontId,
  selectedHtmlBlockId, selectedHtmlElementId, onSelectHtml, onHtmlChange, registerIframe,
}: {
  title: string; description: string; cover: string;
  blocks: Block[]; setBlocks: (b: Block[]) => void;
  btnColor: string; animClass: string;
  paletteId: string; fontId: string;
} & PreviewExtras) {
  const palette = getPalette(paletteId);
  const font = getFont(fontId);
  const extras: PreviewExtras = { selectedHtmlBlockId, selectedHtmlElementId, onSelectHtml, onHtmlChange, registerIframe };

  const isPureHtml = blocks.length === 1 && blocks[0].type === "html" && !cover && !description;

  if (isPureHtml) {
    return (
      <div className="h-full w-full flex-1 flex flex-col bg-background overflow-hidden">
        <HtmlIframe
          html={blocks[0].data.html ?? ""}
          fill
          editable={!!onSelectHtml}
          selectedId={selectedHtmlBlockId === blocks[0].id ? selectedHtmlElementId ?? null : null}
          onSelect={(sel) => onSelectHtml?.(blocks[0].id, sel)}
          onHtmlChange={(h) => onHtmlChange?.(blocks[0].id, h)}
          ref={(handle) => registerIframe?.(blocks[0].id, handle)}
          className="h-full w-full border-0 flex-1"
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden scrollbar-none text-sm" style={{ background: palette.bg, color: palette.text, fontFamily: font.family }}>
      {cover && <img src={cover} alt="" className="aspect-square w-full object-cover" />}
      <div className="p-3.5">
        <h2 className="text-lg font-bold" style={{ fontFamily: font.family }}>{title || "Tu título"}</h2>
        {description && <p className="mt-1 text-xs opacity-80">{description}</p>}
        <Reorder.Group axis="y" values={blocks} onReorder={setBlocks} className="mt-3 space-y-2.5">
          {blocks.map((b) => (
            <Reorder.Item key={b.id} value={b} className="cursor-grab active:cursor-grabbing">
              <PreviewBlock b={b} btnColor={btnColor} animClass={animClass} extras={extras} />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
    </div>
  );
}
