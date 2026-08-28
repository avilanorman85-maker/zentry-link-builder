import { useAuth } from "@/lib/hooks/use-auth";

export const PLAN_LIMITS = {
  free: { pages: 1, images: 1, customColors: false, customUrl: false, urlChanges: 0, externalTemplates: false, watermark: true },
  premium: { pages: 10, images: 4, customColors: true, customUrl: true, urlChanges: 2, externalTemplates: false, watermark: false },
  vip: { pages: Infinity, images: Infinity, customColors: true, customUrl: true, urlChanges: Infinity, externalTemplates: true, watermark: false },
} as const;

export function usePlan() {
  const { profile } = useAuth();
  const plan = profile?.plan ?? "free";
  return { plan, limits: PLAN_LIMITS[plan] };
}
