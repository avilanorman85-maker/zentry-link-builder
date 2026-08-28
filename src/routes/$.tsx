import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { ZentryLogo } from "@/components/ZentryLogo";
import { supabase } from "@/integrations/supabase/client";
import { PublicPageView } from "@/components/PublicPageView";

// Rutas reservadas que NO deben tratarse como slug público.
const RESERVED = new Set(["app", "p", "auth", "login", "register", "api", "assets", "terms", "about"]);

export const Route = createFileRoute("/$")({
  loader: async ({ params }) => {
    const splat = ((params as any)?._splat ?? "").trim();
    const isSingleSegment = splat.length > 0 && !splat.includes("/");
    const slug = isSingleSegment && !RESERVED.has(splat.toLowerCase()) ? splat : null;
    if (!slug) return { page: null, slug: null };

    try {
      const { data } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return { page: data ?? null, slug };
    } catch {
      return { page: null, slug };
    }
  },
  component: CatchAll,
});

function CatchAll() {
  const loaderData = Route.useLoaderData() as { page: any; slug: string | null };
  const { _splat } = Route.useParams() as { _splat?: string };
  const splat = (_splat ?? "").trim();
  const isSingleSegment = splat.length > 0 && !splat.includes("/");
  const slug = isSingleSegment && !RESERVED.has(splat.toLowerCase()) ? splat : null;

  const [page, setPage] = useState<any>(loaderData?.page ?? null);
  const [checked, setChecked] = useState<boolean>(!!loaderData?.page);

  useEffect(() => {
    if (loaderData?.page) {
      setPage(loaderData.page);
      setChecked(true);
      return;
    }
    if (!slug) {
      setChecked(true);
      return;
    }

    supabase
      .from("pages")
      .select("*")
      .eq("slug", slug)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPage(data);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [slug, loaderData?.page]);

  if (page) {
    return <PublicPageView page={page} />;
  }

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ZentryLogo size={64} className="animate-pulse" />
      </div>
    );
  }

  return <Fallback />;
}

function Fallback() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    navigate({ to: user ? "/app/dashboard" : "/", replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <ZentryLogo size={64} className="animate-pulse" />
    </div>
  );
}
