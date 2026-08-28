CREATE OR REPLACE FUNCTION public.redeem_activation_code(_code text)
RETURNS plan_tier
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  normalized_code text := upper(trim(_code));
  target_code public.activation_codes%ROWTYPE;
  current_user_id uuid := auth.uid();
  current_email text;
  current_name text;
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

  SELECT email, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1))
  INTO current_email, current_name
  FROM auth.users
  WHERE id = current_user_id;

  new_plan := CASE
    WHEN lower(COALESCE(current_email, '')) = 'gonzales1999.pan@gmail.com' THEN 'vip'::public.plan_tier
    ELSE target_code.plan
  END;

  UPDATE public.activation_codes
  SET used_by = current_user_id,
      used_at = COALESCE(used_at, now())
  WHERE id = target_code.id;

  INSERT INTO public.profiles (id, name, email, plan)
  VALUES (current_user_id, current_name, current_email, new_plan)
  ON CONFLICT (id) DO UPDATE SET
    plan = EXCLUDED.plan,
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    name = COALESCE(public.profiles.name, EXCLUDED.name);

  IF lower(COALESCE(current_email, '')) = 'gonzales1999.pan@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (current_user_id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN new_plan;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_activation_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_activation_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_activation_code(text) TO service_role;