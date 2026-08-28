DROP POLICY IF EXISTS "users view own pages" ON public.pages;
DROP POLICY IF EXISTS "users insert own pages" ON public.pages;
DROP POLICY IF EXISTS "users update own pages" ON public.pages;
DROP POLICY IF EXISTS "users delete own pages" ON public.pages;

CREATE POLICY "users view own pages"
ON public.pages
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "users insert own pages"
ON public.pages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own pages"
ON public.pages
FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "users delete own pages"
ON public.pages
FOR DELETE
TO authenticated
USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role));