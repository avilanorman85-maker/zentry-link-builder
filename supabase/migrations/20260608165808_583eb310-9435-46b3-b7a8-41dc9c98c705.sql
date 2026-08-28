CREATE TABLE public.page_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('visit','click')),
  label text,
  href text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX page_events_page_id_idx ON public.page_events(page_id, created_at DESC);
GRANT INSERT ON public.page_events TO anon, authenticated;
GRANT SELECT, DELETE ON public.page_events TO authenticated;
GRANT ALL ON public.page_events TO service_role;
ALTER TABLE public.page_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can insert page events" ON public.page_events FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.pages p WHERE p.id = page_id AND p.status = 'active'));
CREATE POLICY "owners can read their page events" ON public.page_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pages p WHERE p.id = page_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "owners can delete their page events" ON public.page_events FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pages p WHERE p.id = page_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));