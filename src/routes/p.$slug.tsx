import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PublicPageView } from "@/components/PublicPageView";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const slug = params.slug;
    if (!slug) return { page: null };
    try {
      const { data } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return { page: data ?? null };
    } catch {
      return { page: null };
    }
  },
  component: PublicPage,
});

function PublicPage() {
  const { page } = Route.useLoaderData() as { page: any };
  if (!page) return <div className="grid min-h-screen place-items-center text-muted-foreground">Página no encontrada</div>;
  return <PublicPageView page={page} />;
}
