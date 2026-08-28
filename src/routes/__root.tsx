import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useNavigate,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { ZentryLogo } from "@/components/ZentryLogo";

function NotFoundComponent() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <ZentryLogo size={64} className="mx-auto mb-6" />
        <h1 className="text-7xl font-bold text-gradient-neon">404</h1>
        <p className="mt-4 text-muted-foreground">Esta ruta no existe.</p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="mt-6 rounded-lg bg-gradient-neon px-5 py-2.5 text-sm font-semibold text-background glow-violet"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={reset} className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Reintentar
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Zentry Link — Crea tu recetario digital" },
      { name: "description", content: "Zentry Link de Zentry Company: crea, publica y comparte tus recetas con un constructor visual en tiempo real." },
      { name: "theme-color", content: "#0B0F19" },
      { property: "og:title", content: "Zentry Link — Crea tu recetario digital" },
      { name: "twitter:title", content: "Zentry Link — Crea tu recetario digital" },
      { property: "og:description", content: "Zentry Link de Zentry Company: crea, publica y comparte tus recetas con un constructor visual en tiempo real." },
      { name: "twitter:description", content: "Zentry Link de Zentry Company: crea, publica y comparte tus recetas con un constructor visual en tiempo real." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/f60cc136-736b-4241-83cf-ffbd8de64910" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/f60cc136-736b-4241-83cf-ffbd8de64910" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster theme="dark" position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
