import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PhoneFrame } from "@/components/PhoneFrame";

export const Route = createFileRoute("/app/mobile")({ component: Mobile });

function Mobile() {
  const { user } = useAuth();
  const { data: page } = useQuery({
    queryKey: ["mobile-preview", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("pages").select("*").eq("user_id", user!.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h1 className="font-display text-3xl font-bold">Vista móvil</h1>
        <p className="text-muted-foreground">Previsualiza cómo se ve tu última receta en un dispositivo móvil.</p>
        <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-5 text-sm">
          <div className="flex items-center justify-between"><span>Dispositivo</span><span className="font-semibold">iPhone 15 Pro</span></div>
          <div className="flex items-center justify-between"><span>Modo</span><span className="font-semibold">Claro</span></div>
          <div className="flex items-center justify-between"><span>Animaciones</span><span className="font-semibold text-[var(--neon-green)]">Activadas</span></div>
        </div>
      </div>
      <PhoneFrame>
        {!page ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">Crea una página para ver la vista previa aquí.</div>
        ) : (
          <div>
            {page.cover_image && <img src={page.cover_image} className="aspect-square w-full object-cover" />}
            <div className="p-4">
              <h2 className="text-lg font-bold">{page.title}</h2>
              <p className="mt-1 text-xs text-slate-500">{page.description}</p>
            </div>
          </div>
        )}
      </PhoneFrame>
    </div>
  );
}
