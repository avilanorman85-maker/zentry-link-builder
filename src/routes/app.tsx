import { createFileRoute, Outlet, useNavigate, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FilePlus2,
  FolderOpen,
  Palette,
  Smartphone,
  Share2,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  ShieldCheck,
  Crown,
  Menu,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { ZentryWordmark } from "@/components/ZentryLogo";
import { ZentryLogo } from "@/components/ZentryLogo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const NAV = [
  { to: "/app/dashboard", label: "Resumen", icon: LayoutDashboard },
  { to: "/app/pages", label: "Mis páginas", icon: FolderOpen },
  { to: "/app/builder/new", label: "Nueva página", icon: FilePlus2 },
  { to: "/app/builder", label: "Constructor visual", icon: Palette },
  { to: "/app/links", label: "Links públicos", icon: Share2 },
  { to: "/app/mobile", label: "Vista móvil", icon: Smartphone },
  { to: "/app/stats", label: "Estadísticas", icon: BarChart3 },
  { to: "/app/subscription", label: "Suscripción", icon: CreditCard },
  { to: "/app/settings", label: "Configuración", icon: Settings },
];

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, profile, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/", replace: true });
  }, [loading, user, navigate]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <ZentryLogo size={64} className="animate-pulse" />
      </div>
    );
  }

  const initial = (profile?.name ?? user.email ?? "?").charAt(0).toUpperCase();

  const NavContent = () => (
    <div className="flex h-full flex-col">
      <div className="mb-6 px-2">
        <ZentryWordmark size={32} />
      </div>

      <Link
        to="/app/settings"
        className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/50 transition"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-neon text-background font-bold">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{profile?.name ?? "Tu cuenta"}</div>
          <div className="truncate text-xs text-muted-foreground">Ver mi página</div>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active =
            location.pathname === n.to ||
            (n.to !== "/app/builder/new" && location.pathname.startsWith(n.to + "/")) ||
            (n.to === "/app/builder" && location.pathname.startsWith("/app/builder/") && !location.pathname.endsWith("/new"));
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-primary text-primary-foreground font-medium glow-violet"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            to="/app/admin"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
              location.pathname.startsWith("/app/admin")
                ? "bg-accent text-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Admin
          </Link>
        )}
      </nav>

      <div className="mt-auto pt-4 border-t border-border/50">
        <button
          onClick={() => signOut().then(() => navigate({ to: "/" }))}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent transition"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>

        {profile?.plan === "free" && (
          <Link
            to="/app/subscription"
            className="mt-3 block rounded-xl border border-primary/40 bg-gradient-to-br from-primary/20 to-accent/20 p-4 text-sm"
          >
            <div className="flex items-center gap-2 font-semibold">
              <Crown className="h-4 w-4 text-accent" /> Zentry Link Pro
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Desbloquea todo el potencial.</p>
            <div className="mt-3 inline-block rounded-md bg-gradient-neon px-3 py-1 text-xs font-semibold text-background">
              Ver planes →
            </div>
          </Link>
        )}
      </div>
    </div>
  );

  const isBuilder = location.pathname.startsWith("/app/builder/");

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar desktop fija al 100% de la ventana */}
      <aside className="hidden h-full w-64 shrink-0 border-r border-border bg-sidebar p-4 md:flex flex-col">
        <NavContent />
      </aside>

      <main className="flex-1 h-full min-w-0 overflow-hidden flex flex-col">
        {/* Top bar móvil */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-sidebar/95 px-4 py-3 backdrop-blur md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-r border-border bg-sidebar p-4">
              <div className="flex h-full flex-col">
                <NavContent />
              </div>
            </SheetContent>
          </Sheet>
          <ZentryWordmark size={26} />
          <Link to="/app/settings" className="grid h-9 w-9 place-items-center rounded-full bg-gradient-neon text-background text-sm font-bold">
            {initial}
          </Link>
        </div>

        {/* Contenedor del área de trabajo */}
        {isBuilder ? (
          <div className="flex-1 h-full w-full overflow-hidden">
            <Outlet />
          </div>
        ) : (
          <div className="flex-1 h-full overflow-y-auto px-4 py-6 md:px-6 md:py-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
