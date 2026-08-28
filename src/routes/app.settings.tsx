import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { usePlan } from "@/lib/plan";
import { PaywallModal } from "@/components/PaywallModal";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({ component: Settings });

function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const { plan, limits } = usePlan();
  const isPaid = plan === "premium" || plan === "vip";
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [appName, setAppName] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [paywall, setPaywall] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setBio(profile.bio ?? "");
    setAppName(profile.app_name ?? "");
    setPublicUrl(profile.public_url ?? "");
    setCustomDomain((profile as any).custom_domain ?? "");
  }, [profile]);

  const saveProfile = async () => {
    await supabase.from("profiles").update({ name, bio }).eq("id", user!.id);
    await refreshProfile();
    toast.success("Perfil actualizado");
  };

  const saveApp = async () => {
    if (!limits.customUrl && publicUrl !== (profile?.public_url ?? "")) { setPaywall(true); return; }
    const updates: any = { app_name: appName, public_url: publicUrl };
    if (isPaid) updates.custom_domain = customDomain.trim() || null;
    await supabase.from("profiles").update(updates).eq("id", user!.id);
    await refreshProfile();
    toast.success("Recetario actualizado");
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Tu perfil y los datos públicos de tu cuenta y páginas.</p>
      </div>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Perfil</h2>
        <div><Label>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>Email</Label><Input value={user?.email ?? ""} readOnly disabled /></div>
        <div><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} /></div>
        <Button onClick={saveProfile} className="bg-gradient-neon text-background font-semibold">Guardar perfil</Button>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Sitio y Marca</h2>
        <div><Label>Nombre del proyecto / marca</Label><Input value={appName} onChange={(e) => setAppName(e.target.value)} /></div>
        <div>
          <Label>Tu identificador público {!limits.customUrl && <Lock className="ml-1 inline h-3 w-3 text-accent" />}</Label>
          <div className="flex items-center overflow-hidden rounded-md border border-border bg-input">
            <span className="px-3 text-sm text-muted-foreground">zentry.link/</span>
            <input
              value={publicUrl}
              onChange={(e) => setPublicUrl(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              disabled={!limits.customUrl}
              placeholder="tu-nombre"
              className="flex-1 bg-transparent px-1 py-2 text-sm focus:outline-none disabled:opacity-60"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {!limits.customUrl ? "Mejora a Premium para personalizar tu identificador." : "Identificador asignado a tus páginas."}
          </p>
        </div>

        {isPaid && (
          <div>
            <Label>Dominio propio (opcional)</Label>
            <Input
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value.toLowerCase().trim())}
              placeholder="ej. misitioweb.com"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Si tienes tu propio dominio, configúralo con un registro CNAME apuntando a tu servidor.
            </p>
          </div>
        )}

        <Button onClick={saveApp} className="bg-gradient-neon text-background font-semibold">Guardar cambios</Button>
      </section>

      <PaywallModal open={paywall} onOpenChange={setPaywall} feature="URL personalizada" />
    </div>
  );
}
