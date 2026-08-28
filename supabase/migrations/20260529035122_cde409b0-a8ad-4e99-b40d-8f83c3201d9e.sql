REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.activation_codes FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.pages FROM anon;

DROP POLICY IF EXISTS "users redeem code" ON public.activation_codes;
DROP POLICY IF EXISTS "users update code on redeem" ON public.activation_codes;

CREATE POLICY "signed users can read unused codes for redeem"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (used_by IS NULL OR used_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "signed users can claim unused own code"
ON public.activation_codes
FOR UPDATE
TO authenticated
USING (used_by IS NULL OR used_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (used_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));