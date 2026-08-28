import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, X, ExternalLink, Plus, Copy } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePlan } from "@/lib/plan";
import { PaywallModal } from "@/components/PaywallModal";
import { getPublicUrl, getPublicUrlLabel } from "@/lib/public-url";
import { toast } from "sonner";

export const Route = createFileRoute("/app/pages")({ component: Pages });

function Pages() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const { plan, limits } = usePlan();
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);

  const { data: pages = [] } = useQuery({
    queryKey: ["pages", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("pages").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const handleNew = () => {
    if (pages.length >= limits.pages) { setPaywall(true); return; }
    nav({ to: "/app/builder/new" });
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await supabase.from("pages").delete().eq("id", toDelete);
    qc.invalidateQueries({ queryKey: ["pages"] });
    toast.success("Página eliminada");
    setToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Mis páginas</h1>
          <p className="text-muted-foreground">Gestiona, edita y publica tus páginas.</p>
        </div>
        <Button onClick={handleNew} className="bg-gradient-neon text-background font-semibold glow-violet">
          <Plus className="mr-1 h-4 w-4" /> Nueva página
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        {pages.length === 0 && (
          <div className="p-10 text-center text-muted-foreground">
            Aún no tienes páginas. Crea la primera con "Nueva página".
          </div>
        )}
        <AnimatePresence>
          {pages.map((p: any) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -40, height: 0 }}
              className="flex items-center gap-4 border-b border-border p-4 last:border-0"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {p.cover_image ? <img src={p.cover_image} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">IMG</div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{p.title}</div>
                <div className="text-xs text-muted-foreground">Actualizada {new Date(p.updated_at).toLocaleDateString()}</div>
              </div>
              {(() => {
                const url = getPublicUrl({ slug: p.slug, plan, customDomain: (profile as any)?.custom_domain });
                const label = getPublicUrlLabel({ slug: p.slug, plan, customDomain: (profile as any)?.custom_domain });
                return (
                  <>
                    <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
                      {label}
                      <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Enlace copiado"); }}>
                        <Copy className="h-3.5 w-3.5 hover:text-foreground" />
                      </button>
                    </div>
                    <span className="hidden rounded-full bg-[var(--neon-green)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--neon-green)] md:inline-block">
                      Activa · Saludable
                    </span>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" asChild><a href={url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                      <Button size="icon" variant="ghost" onClick={() => nav({ to: "/app/builder/$id", params: { id: p.id } })}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setToDelete(p.id)}><X className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta página?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <PaywallModal open={paywall} onOpenChange={setPaywall} feature="más páginas" />
    </div>
  );
}
