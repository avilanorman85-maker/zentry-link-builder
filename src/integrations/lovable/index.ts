import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple" | "microsoft" | "github", opts?: SignInOptions) => {
      const redirectUri = opts?.redirect_uri || (typeof window !== "undefined" ? window.location.origin : undefined);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider === "github" ? "github" : "google",
        options: {
          redirectTo: redirectUri,
          queryParams: opts?.extraParams,
        },
      });

      if (error) {
        return { error };
      }

      return { redirected: true, data };
    },
  },
};
