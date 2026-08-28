import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Eye, MousePointerClick, BarChart3 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useAuth } from "@/lib/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/stats")({ component: Stats });

function Stats() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<{ id: string; title: string } | null>(null);

  const { data: pages = [] } = useQuery({
    queryKey: ["stats-pages", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("pages")
        .select("id,title,slug,cover_image,status,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  if (selected) {
    return <PageStats pageId={selected.id} title={selected.title} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Estadísticas</h1>
        <p className="text-muted-foreground">Selecciona una página para ver sus visitas y clics en botones.</p>
      </header>

      <PagesOverview pageIds={pages.map((p: any) => p.id)} />

      <div className="rounded-2xl border border-border bg-card">
        {pages.length === 0 && (
          <div className="p-10 text-center text-muted-foreground">Aún no tienes páginas creadas.</div>
        )}
        {pages.map((p: any) => (
          <button
            key={p.id}
            onClick={() => setSelected({ id: p.id, title: p.title })}
            className="flex w-full items-center gap-4 border-b border-border p-4 text-left transition hover:bg-muted/40 last:border-0"
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
              {p.cover_image
                ? <img src={p.cover_image} className="h-full w-full object-cover" alt="" />
                : <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">IMG</div>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{p.title}</div>
              <div className="text-xs text-muted-foreground">/{p.slug}</div>
            </div>
            <PageMiniStats pageId={p.id} />
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

function PagesOverview({ pageIds }: { pageIds: string[] }) {
  const { data } = useQuery({
    queryKey: ["stats-overview", pageIds.join(",")],
    enabled: pageIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("page_events")
        .select("event_type")
        .in("page_id", pageIds);
      const visits = (data ?? []).filter((e: any) => e.event_type === "visit").length;
      const clicks = (data ?? []).filter((e: any) => e.event_type === "click").length;
      return { visits, clicks };
    },
  });
  const visits = data?.visits ?? 0;
  const clicks = data?.clicks ?? 0;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <StatCard icon={<Eye className="h-4 w-4" />} label="Visitas totales" value={visits} />
      <StatCard icon={<MousePointerClick className="h-4 w-4" />} label="Clics en botones" value={clicks} />
      <StatCard
        icon={<BarChart3 className="h-4 w-4" />}
        label="Tasa de conversión"
        value={visits > 0 ? `${Math.round((clicks / visits) * 100)}%` : "—"}
      />
    </div>
  );
}

function PageMiniStats({ pageId }: { pageId: string }) {
  const { data } = useQuery({
    queryKey: ["stats-mini", pageId],
    queryFn: async () => {
      const { data } = await supabase.from("page_events").select("event_type").eq("page_id", pageId);
      const visits = (data ?? []).filter((e: any) => e.event_type === "visit").length;
      const clicks = (data ?? []).filter((e: any) => e.event_type === "click").length;
      return { visits, clicks };
    },
  });
  return (
    <div className="hidden gap-4 text-xs md:flex">
      <div className="text-right">
        <div className="font-display text-lg font-bold">{data?.visits ?? 0}</div>
        <div className="text-muted-foreground">visitas</div>
      </div>
      <div className="text-right">
        <div className="font-display text-lg font-bold">{data?.clicks ?? 0}</div>
        <div className="text-muted-foreground">clics</div>
      </div>
    </div>
  );
}

function PageStats({ pageId, title, onBack }: { pageId: string; title: string; onBack: () => void }) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["stats-detail", pageId],
    queryFn: async () => {
      const { data } = await supabase
        .from("page_events")
        .select("*")
        .eq("page_id", pageId)
        .order("created_at", { ascending: false })
        .limit(500);
      return data ?? [];
    },
  });

  const visits = events.filter((e: any) => e.event_type === "visit").length;
  const clicks = events.filter((e: any) => e.event_type === "click").length;

  const chartData = useMemo(() => {
    const days = 14;
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (days - 1 - i));
      return { date: d, label: `${d.getDate()}/${d.getMonth() + 1}`, visits: 0, clicks: 0 };
    });
    for (const ev of events as any[]) {
      const t = new Date(ev.created_at).getTime();
      for (const b of buckets) {
        const start = b.date.getTime();
        if (t >= start && t < start + 86400000) {
          if (ev.event_type === "visit") b.visits++;
          else if (ev.event_type === "click") b.clicks++;
          break;
        }
      }
    }
    return buckets;
  }, [events]);

  const clickBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const ev of events as any[]) {
      if (ev.event_type !== "click") continue;
      const k = ev.label || ev.href || "Botón";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [events]);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <header>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">Visitas y clics en botones de esta página.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard icon={<Eye className="h-4 w-4" />} label="Visitas" value={visits} />
        <StatCard icon={<MousePointerClick className="h-4 w-4" />} label="Clics en botones" value={clicks} />
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Conversión"
          value={visits > 0 ? `${Math.round((clicks / visits) * 100)}%` : "—"}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Actividad — últimos 14 días</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0B0F19", border: "1px solid #334155", borderRadius: 8 }} />
              <Line type="monotone" dataKey="visits" name="Visitas" stroke="#22D3EE" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="clicks" name="Clics" stroke="#A78BFA" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Clics por botón</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : clickBreakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay clics registrados en botones.</p>
        ) : (
          <ul className="divide-y divide-border">
            {clickBreakdown.map(([label, count]) => (
              <li key={label} className="flex items-center justify-between py-3">
                <span className="truncate pr-4 font-medium">{label}</span>
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {count} {count === 1 ? "clic" : "clics"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-2 inline-flex items-center gap-2 text-xs text-muted-foreground">{icon} {label}</div>
      <div className="font-display text-3xl font-bold">{value}</div>
    </div>
  );
}
