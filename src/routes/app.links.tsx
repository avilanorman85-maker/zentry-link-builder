import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Copy, ExternalLink, Save, Lock, Globe } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/use-auth";
import { usePlan } from "@/lib/plan";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPublicUrl, getPublicUrlLabel, PUBLISHED_HOST } from "@/lib/public-url";

export const Route = createFileRoute("/app/links")({ component: LinksPage });

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-").replace(/(^-|-$)+/g, "").slice(0, 60);

const cleanDomain = (s: string) =>
  s.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");

function LinksPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { plan } = usePlan();
  const qc = useQueryClient();
  const isVip = plan === "vip";
  const isPaid = plan === "premium" || plan === "vip";

  const { data: pages = [] } = useQuery({
    queryKey: ["pages", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("pages").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const customDomain = ((profile as any)?.custom_domain ?? null) as string | null;
  const [domainInput, setDomainInput] = useState(customDomain ?? "");
  const [savingDomain, setSavingDomain] = useState(false);
  useEffect(() => { setDomainInput(customDomain ?? ""); }, [customDomain]);

  const saveDomain = async () => {
    if (!isPaid) { toast.error("Solo planes Premium o VIP pueden usar dominio propio"); return; }
    setSavingDomain(true);
    const next = domainInput ? cleanDomain(domainInput) : null;
    const { error } = await supabase.from("profiles").update({ custom_domain: next }).eq("id", user!.id);
    setSavingDomain(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success(next ? "Dominio propio configurado" : "Dominio propio eliminado");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Links públicos</h1>
        <p className="text-muted-foreground">
          {isVip
            ? "Edita la última parte del enlace (slug) o configura un dominio propio personalizado."
            : "Solo los usuarios VIP pueden editar el slug de sus enlaces públicos o asociar dominio propio."}
        </p>
      </div>

      {/* Dominio propio (premium/VIP) */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4 text-accent" />
          <h2 className="font-display text-lg font-semibold">Tu dominio propio</h2>
          {!isPaid && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Premium / VIP
            </span>
          )}
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          ¿Quieres usar tu propio dominio en lugar de la URL por defecto?
          Apunta un registro CNAME de tu dominio hacia tu servidor/hosting y escríbelo aquí.
        </p>
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            disabled={!isPaid || savingDomain}
            placeholder="mirecetario.com"
          />
          <Button
            onClick={saveDomain}
            disabled={!isPaid || savingDomain || domainInput === (customDomain ?? "")}
            className="bg-gradient-neon text-background font-semibold"
          >
            <Save className="mr-1 h-4 w-4" /> Guardar dominio
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        {pages.length === 0 && (
          <div className="p-10 text-center text-muted-foreground">No tienes páginas todavía.</div>
        )}
        {pages.map((p: any) => (
          <LinkRow
            key={p.id}
            page={p}
            plan={plan}
            customDomain={customDomain}
            canEdit={isVip}
            onSaved={() => qc.invalidateQueries({ queryKey: ["pages"] })}
          />
        ))}
      </div>
    </div>
  );
}

function LinkRow({
  page, plan, customDomain, canEdit, onSaved,
}: { page: any; plan: "free" | "premium" | "vip"; customDomain: string | null; canEdit: boolean; onSaved: () => void }) {
  const [slug, setSlug] = useState<string>(page.slug ?? "");
  const [saving, setSaving] = useState(false);
  useEffect(() => { setSlug(page.slug ?? ""); }, [page.slug]);

  const dirty = slug !== page.slug && slug.length > 0;
  const url = getPublicUrl({ slug: page.slug, plan, customDomain });
  const label = getPublicUrlLabel({ slug: page.slug, plan, customDomain });

  // Prefijo del dominio que se muestra como fijo (no editable).
  const prefixHost = customDomain && (plan === "premium" || plan === "vip")
    ? cleanDomain(customDomain)
    : PUBLISHED_HOST;

  const save = async () => {
    const next = slugify(slug);
    if (!next) { toast.error("Slug inválido"); return; }
    setSaving(true);
    const { error } = await supabase.from("pages").update({ slug: next }).eq("id", page.id);
    setSaving(false);
    if (error) {
      if (error.code === "23505") toast.error("Ese slug ya está en uso");
      else toast.error(error.message);
      return;
    }
    toast.success("Enlace actualizado");
    onSaved();
  };

  return (
    <div className="flex flex-col gap-3 border-b border-border p-4 last:border-0 md:flex-row md:items-center">
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{page.title}</div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{label}</span>
          <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Enlace copiado"); }}>
            <Copy className="h-3.5 w-3.5 hover:text-foreground" />
          </button>
          <a href={url} target="_blank" rel="noreferrer" className="hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" /></a>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center overflow-hidden rounded-lg border border-border bg-background">
          <span className="select-none px-3 py-2 text-xs text-muted-foreground" title="Dominio fijo de la plataforma">
            {prefixHost}/
          </span>
          <Input
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            disabled={!canEdit || saving}
            className="h-9 w-44 border-0 bg-transparent px-1 text-sm focus-visible:ring-0"
            placeholder="mi-pagina"
          />
        </div>
        {canEdit ? (
          <Button size="sm" onClick={save} disabled={!dirty || saving} className="bg-gradient-neon text-background font-semibold">
            <Save className="mr-1 h-4 w-4" /> Guardar
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Solo VIP
          </span>
        )}
      </div>
    </div>
  );
}
