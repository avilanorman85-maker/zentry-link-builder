import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { redeemActivationCode } from "@/lib/subscription.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/app/subscription")({ component: Subscription });

const PLANS = [
  { id: "free", name: "Gratuito", price: "0", per: "siempre", features: ["1 página", "1 imagen (1080×1080)", "Plantillas básicas", "URL bloqueada", "Marca de agua"] },
  { id: "premium", name: "Premium", price: "5", per: "mes", features: ["10 páginas", "4 imágenes HD", "Colores personalizados", "2 cambios de URL", "Sin marca de agua"], highlight: true },
  { id: "vip", name: "VIP", price: "10", per: "mes", features: ["Páginas ilimitadas", "Imágenes ilimitadas", "Alojamiento HTML completo", "Cambios de URL ilimitados", "Dominio propio"] },
];

function Subscription() {
  const { profile, user, refreshProfile } = useAuth();
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const redeemCode = useServerFn(redeemActivationCode);

  const redeem = async () => {
    if (!code.trim() || !user) return;
    setRedeeming(true);
    try {
      const result = await redeemCode({ data: { code: code.trim().toUpperCase() } });
      await refreshProfile();
      toast.success(`¡Plan ${String(result.plan).toUpperCase()} activado!`);
      setCode("");
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo activar el código");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Suscripción</h1>
        <p className="text-muted-foreground">Tu plan actual: <span className="font-semibold text-accent">{(profile?.plan ?? "free").toUpperCase()}</span></p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.id} className={`relative rounded-2xl border p-6 ${p.highlight ? "border-primary bg-gradient-to-br from-primary/15 to-accent/10 glow-violet" : "border-border bg-card"}`}>
            {p.highlight && <span className="absolute -top-3 left-6 rounded-full bg-gradient-neon px-3 py-0.5 text-xs font-semibold text-background">Más popular</span>}
            <div className="text-sm text-muted-foreground">{p.name}</div>
            <div className="mt-2 font-display text-4xl font-bold">${p.price}<span className="text-base font-normal text-muted-foreground"> USD / {p.per}</span></div>
            <ul className="mt-5 space-y-2 text-sm">
              {p.features.map((f) => (<li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-accent" /> {f}</li>))}
            </ul>
            <Button disabled={profile?.plan === p.id} className={`mt-6 w-full ${p.highlight ? "bg-gradient-neon text-background font-semibold" : ""}`}>
              {profile?.plan === p.id ? "Plan actual" : "Activar con código"}
            </Button>
          </div>
        ))}
      </div>

      <div className="max-w-md rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display font-semibold">Activar con código</h3>
        <p className="text-xs text-muted-foreground">Si tienes un código Premium o VIP, ingrésalo aquí.</p>
        <div className="mt-3 flex gap-2">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ZENTRY-XXXX" />
          <Button onClick={redeem} disabled={redeeming || !code.trim()} className="bg-gradient-neon text-background font-semibold">
            {redeeming ? "Activando…" : "Activar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
