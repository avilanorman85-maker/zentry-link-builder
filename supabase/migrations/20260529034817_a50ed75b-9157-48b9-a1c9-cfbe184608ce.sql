GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT SELECT ON public.pages TO anon;
GRANT ALL ON public.pages TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activation_codes TO authenticated;
GRANT ALL ON public.activation_codes TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE WHEN lower(NEW.email) = 'gonzales1999.pan@gmail.com' THEN 'vip'::plan_tier ELSE 'free'::plan_tier END
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(public.profiles.name, EXCLUDED.name),
    email = EXCLUDED.email,
    plan = CASE WHEN lower(EXCLUDED.email) = 'gonzales1999.pan@gmail.com' THEN 'vip'::plan_tier ELSE public.profiles.plan END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN lower(NEW.email) = 'gonzales1999.pan@gmail.com' THEN 'admin'::app_role ELSE 'user'::app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END
$$;

INSERT INTO public.profiles (id, name, email, plan)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.email,
  'vip'::plan_tier
FROM auth.users u
WHERE lower(u.email) = 'gonzales1999.pan@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = COALESCE(public.profiles.name, EXCLUDED.name),
  plan = 'vip'::plan_tier;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE lower(u.email) = 'gonzales1999.pan@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.redeem_activation_code(_code text)
RETURNS public.plan_tier
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_code text := upper(trim(_code));
  target_code public.activation_codes%ROWTYPE;
  current_user_id uuid := auth.uid();
  current_email text;
  new_plan public.plan_tier;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para activar un código';
  END IF;

  SELECT * INTO target_code
  FROM public.activation_codes
  WHERE code = normalized_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Código no válido';
  END IF;

  IF target_code.used_by IS NOT NULL AND target_code.used_by <> current_user_id THEN
    RAISE EXCEPTION 'Código ya usado';
  END IF;

  new_plan := target_code.plan;

  UPDATE public.activation_codes
  SET used_by = current_user_id,
      used_at = COALESCE(used_at, now())
  WHERE id = target_code.id;

  SELECT email INTO current_email FROM auth.users WHERE id = current_user_id;

  INSERT INTO public.profiles (id, name, email, plan)
  VALUES (current_user_id, COALESCE(split_part(current_email, '@', 1), 'Usuario'), current_email, new_plan)
  ON CONFLICT (id) DO UPDATE SET
    plan = EXCLUDED.plan,
    email = COALESCE(public.profiles.email, EXCLUDED.email);

  RETURN new_plan;
END
$$;

GRANT EXECUTE ON FUNCTION public.redeem_activation_code(text) TO authenticated;