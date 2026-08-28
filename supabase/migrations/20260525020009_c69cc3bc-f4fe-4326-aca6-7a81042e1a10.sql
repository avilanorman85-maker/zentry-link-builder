
-- 1) Public storage bucket for cover & gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('page-assets', 'page-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "page-assets public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'page-assets');

CREATE POLICY "page-assets users upload own"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'page-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "page-assets users update own"
ON storage.objects FOR UPDATE
USING (bucket_id = 'page-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "page-assets users delete own"
ON storage.objects FOR DELETE
USING (bucket_id = 'page-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2) Page templates table (system + user custom templates)
CREATE TABLE public.page_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  thumbnail TEXT,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  button_style JSONB NOT NULL DEFAULT '{"color":"#A78BFA","animation":"pulse"}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.page_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads public templates"
ON public.page_templates FOR SELECT
USING (is_public = true OR auth.uid() = user_id OR has_role(auth.uid(),'admin'));

CREATE POLICY "users insert own templates"
ON public.page_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins manage all templates"
ON public.page_templates FOR ALL
USING (has_role(auth.uid(),'admin'));

CREATE POLICY "users update own templates"
ON public.page_templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "users delete own templates"
ON public.page_templates FOR DELETE
USING (auth.uid() = user_id);

-- 3) Add 'artesanalesj19@gmail.com' as second admin (now + on signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN NEW.email IN ('gonzales1999.pan@gmail.com','artesanalesj19@gmail.com')
      THEN 'admin'::app_role ELSE 'user'::app_role END
  );
  RETURN NEW;
END $function$;

-- backfill role for the new admin if they already exist
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE email = 'artesanalesj19@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 4) Seed a couple of public starter templates
INSERT INTO public.page_templates (name, is_public, thumbnail, blocks, button_style) VALUES
('Receta clásica', true, null,
 '[{"id":"t1","type":"title","data":{"text":"Bizcocho esponjoso"}},
   {"id":"t2","type":"text","data":{"text":"Una receta sencilla y deliciosa."}},
   {"id":"t3","type":"ingredients","data":{"items":["3 huevos","150 g de azúcar","200 g de harina"]}},
   {"id":"t4","type":"steps","data":{"items":["Bate los huevos con el azúcar.","Añade la harina tamizada.","Hornea 35 min a 180°C."]}},
   {"id":"t5","type":"button","data":{"label":"Comprar ingredientes","href":"https://","action":"pay"}}]'::jsonb,
 '{"color":"#A78BFA","animation":"pulse"}'::jsonb),
('Producto premium', true, null,
 '[{"id":"p1","type":"title","data":{"text":"Mi producto estrella"}},
   {"id":"p2","type":"text","data":{"text":"Descripción corta y atractiva."}},
   {"id":"p3","type":"gallery","data":{"urls":[]}},
   {"id":"p4","type":"button","data":{"label":"Comprar ahora","href":"https://","action":"pay"}}]'::jsonb,
 '{"color":"#22D3EE","animation":"shake"}'::jsonb);
