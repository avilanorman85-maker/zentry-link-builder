export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activation_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          plan: Database["public"]["Enums"]["plan_tier"]
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      page_events: {
        Row: {
          created_at: string
          event_type: string
          href: string | null
          id: string
          label: string | null
          page_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          href?: string | null
          id?: string
          label?: string | null
          page_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          href?: string | null
          id?: string
          label?: string | null
          page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_events_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_templates: {
        Row: {
          blocks: Json
          button_style: Json
          created_at: string
          id: string
          is_public: boolean
          name: string
          thumbnail: string | null
          user_id: string | null
        }
        Insert: {
          blocks?: Json
          button_style?: Json
          created_at?: string
          id?: string
          is_public?: boolean
          name: string
          thumbnail?: string | null
          user_id?: string | null
        }
        Update: {
          blocks?: Json
          button_style?: Json
          created_at?: string
          id?: string
          is_public?: boolean
          name?: string
          thumbnail?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          blocks: Json
          button_style: Json
          cover_image: string | null
          created_at: string
          description: string | null
          id: string
          pay_clicks: number
          saves: number
          slug: string
          social_clicks: number
          status: string
          title: string
          updated_at: string
          user_id: string
          visits: number
        }
        Insert: {
          blocks?: Json
          button_style?: Json
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          pay_clicks?: number
          saves?: number
          slug: string
          social_clicks?: number
          status?: string
          title?: string
          updated_at?: string
          user_id: string
          visits?: number
        }
        Update: {
          blocks?: Json
          button_style?: Json
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          pay_clicks?: number
          saves?: number
          slug?: string
          social_clicks?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          visits?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accepted_terms: boolean
          app_name: string | null
          bio: string | null
          created_at: string
          custom_domain: string | null
          email: string | null
          id: string
          name: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          public_url: string | null
          updated_at: string
          url_changes_used: number
        }
        Insert: {
          accepted_terms?: boolean
          app_name?: string | null
          bio?: string | null
          created_at?: string
          custom_domain?: string | null
          email?: string | null
          id: string
          name?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          public_url?: string | null
          updated_at?: string
          url_changes_used?: number
        }
        Update: {
          accepted_terms?: boolean
          app_name?: string | null
          bio?: string | null
          created_at?: string
          custom_domain?: string | null
          email?: string | null
          id?: string
          name?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          public_url?: string | null
          updated_at?: string
          url_changes_used?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      redeem_activation_code: {
        Args: { _code: string }
        Returns: Database["public"]["Enums"]["plan_tier"]
      }
      redeem_activation_code_for_user: {
        Args: { _code: string; _user_id: string }
        Returns: Database["public"]["Enums"]["plan_tier"]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      plan_tier: "free" | "premium" | "vip"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      plan_tier: ["free", "premium", "vip"],
    },
  },
} as const
