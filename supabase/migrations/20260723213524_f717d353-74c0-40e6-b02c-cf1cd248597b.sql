GRANT SELECT ON public.pages TO anon, authenticated;
GRANT INSERT ON public.page_events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_events TO authenticated;
GRANT ALL ON public.pages TO service_role;
GRANT ALL ON public.page_events TO service_role;