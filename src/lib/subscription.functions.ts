import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const redeemActivationCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ code: z.string().trim().min(1).max(64) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: plan, error } = await supabaseAdmin.rpc(
      "redeem_activation_code_for_user" as any,
      { _code: data.code, _user_id: context.userId } as any,
    );

    if (error) throw new Error(error.message);
    return { plan };
  });