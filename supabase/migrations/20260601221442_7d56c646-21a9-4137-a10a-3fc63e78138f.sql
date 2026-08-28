REVOKE EXECUTE ON FUNCTION public.redeem_activation_code(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_activation_code(text) TO service_role;