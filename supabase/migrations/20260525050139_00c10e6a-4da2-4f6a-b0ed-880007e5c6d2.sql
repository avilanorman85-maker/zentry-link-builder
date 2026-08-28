
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_domain text;

-- Backfill admin role for existing accounts matching the admin emails
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::app_role
FROM public.profiles p
WHERE lower(p.email) IN ('gonzales1999.pan@gmail.com','artesanalesj19@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Allow anyone to read an active page by slug (public viewing)
DROP POLICY IF EXISTS "public can view active pages" ON public.pages;
CREATE POLICY "public can view active pages"
ON public.pages
FOR SELECT
TO anon, authenticated
USING (status = 'active');
