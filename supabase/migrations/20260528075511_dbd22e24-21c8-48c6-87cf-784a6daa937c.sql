
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    CASE WHEN NEW.email IN ('gonzales1999.pan@gmail.com','artesanalesj19@gmail.com')
      THEN 'vip'::plan_tier ELSE 'free'::plan_tier END
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN NEW.email IN ('gonzales1999.pan@gmail.com','artesanalesj19@gmail.com')
      THEN 'admin'::app_role ELSE 'user'::app_role END
  );
  RETURN NEW;
END $function$;

-- Backfill: si el usuario admin ya existe, asegurar plan VIP y rol admin.
UPDATE public.profiles SET plan='vip'::plan_tier
  WHERE email='gonzales1999.pan@gmail.com' AND plan<>'vip';

INSERT INTO public.user_roles (user_id, role)
  SELECT p.id, 'admin'::app_role FROM public.profiles p
  WHERE p.email='gonzales1999.pan@gmail.com'
ON CONFLICT DO NOTHING;
