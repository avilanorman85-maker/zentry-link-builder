import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Eye, MousePointerClick, TrendingUp, Layers, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

function Dashboard() {
  const { profile, user } = useAuth();

  const { data: pages = [] } = useQuery({
    queryKey: ["pages", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("pages")
        .select("id,title,status,visits,created_at,slug")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const pageIds = pages.map((p) => p.id);

  const { data: eventsData } = useQuery({
    queryKey: ["dashboard-events", pageIds.join(",")],
    enabled: pageIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("page_events")
        .select("id,event_type,created_at,label,href,page_id")
        .in("page_id", pageIds)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const events = eventsData ?? [];
  const totalVisits = events.filter((e) => e.event_type === "visit").length;
  const totalClicks = events.filter((e) => e.event_type === "click").length;
  const conversionRate = totalVisits > 0 ? Math.round((totalClicks / totalVisits) * 100) : 0;

  // Clics este mes
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const visitsThisMonth = events.filter((e) => e.event_type === "visit" && new Date(e.created_at).getTime() >= startOfMonth).length;

  const stats = [
    { label: "Páginas publicadas", value: pages.length, icon: Layers },
    { label: "Visitas totales", value: totalVisits, icon: Eye },
    { label: "Visitas este mes", value: visitsThisMonth, icon: TrendingUp },
    { label: "Clics en botones", value: totalClicks, icon: MousePointerClick },
    { label: "Tasa de conversión", value: totalVisits > 0 ? `${conversionRate}%` : "—", icon: CheckCircle2 },
  ];

  // Gráfico de los últimos 14 días
  const days = 14;
  const chartData = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1 - i));
    const start = d.getTime();
    const end = start + 86400000;
    const dayVisits = events.filter((e) => {
      const t = new Date(e.created_at).getTime();
      return e.event_type === "visit" && t >= start && t < end;
    }).length;
    const dayClicks = events.filter((e) => {
      const t = new Date(e.created_at).getTime();
      return e.event_type === "click" && t >= start && t < end;
    }).length;

    return {
      d: `${d.getDate()}/${d.getMonth() + 1}`,
      visitas: dayVisits,
      clics: dayClicks,
    };
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl font-bold">¡Hola {profile?.name ?? "creador"}! 👋</h1>
        <p className="mt-1 text-muted-foreground">Aquí tienes el resumen en tiempo real de tus recetas y páginas.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs">{s.label}</span>
              <s.icon className="h-4 w-4 text-accent" />
            </div>
            <div className="font-display text-3xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Real-time Chart */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Rendimiento en vivo — Visitas vs Clics de compra</h2>
            <p className="text-xs text-muted-foreground">Actividad registrada durante los últimos 14 días</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#22D3EE]" />
              <span className="text-muted-foreground">Visitas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#A78BFA]" />
              <span className="text-muted-foreground">Clics</span>
            </div>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
              <XAxis dataKey="d" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0B0F19", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="visitas" stroke="#22D3EE" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="clics" stroke="#A78BFA" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pages summary */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">Tus páginas publicadas</h2>
          <Link to="/app/pages" className="text-xs text-accent hover:underline">
            Ver todas →
          </Link>
        </div>
        {pages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no has creado páginas. Crea la primera desde "Nueva página".</p>
        ) : (
          <ul className="divide-y divide-border">
            {pages.slice(0, 6).map((p: any) => {
              const pageClicks = events.filter((e) => e.page_id === p.id && e.event_type === "click").length;
              const pageVisits = events.filter((e) => e.page_id === p.id && e.event_type === "visit").length;
              return (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground">/{p.slug}</div>
                  </div>
                  <div className="flex items-center gap-4 text-xs mr-4">
                    <span className="text-muted-foreground">{pageVisits} visitas</span>
                    <span className="font-semibold text-primary">{pageClicks} clics</span>
                  </div>
                  <span className="rounded-full bg-[var(--neon-green)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--neon-green)]">
                    Activa
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
