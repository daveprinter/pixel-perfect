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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ad_campaigns: {
        Row: {
          bookings: number
          budget: number
          clicks: number
          conversions: number
          created_at: string
          end_date: string | null
          id: string
          impressions: number
          is_sample: boolean
          leads: number
          name: string
          platform: string
          spend: number
          start_date: string | null
          target_location: string | null
        }
        Insert: {
          bookings?: number
          budget?: number
          clicks?: number
          conversions?: number
          created_at?: string
          end_date?: string | null
          id?: string
          impressions?: number
          is_sample?: boolean
          leads?: number
          name: string
          platform: string
          spend?: number
          start_date?: string | null
          target_location?: string | null
        }
        Update: {
          bookings?: number
          budget?: number
          clicks?: number
          conversions?: number
          created_at?: string
          end_date?: string | null
          id?: string
          impressions?: number
          is_sample?: boolean
          leads?: number
          name?: string
          platform?: string
          spend?: number
          start_date?: string | null
          target_location?: string | null
        }
        Relationships: []
      }
      admin_setup_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          label: string
          revoked: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          label: string
          revoked?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          label?: string
          revoked?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          assigned_team: string | null
          created_at: string
          deposit_required: number | null
          destination: string
          destination_detail: string | null
          floor_level: number
          id: string
          items: Json
          move_date: string | null
          move_time: string | null
          needs_manual_quote: boolean
          notes: string | null
          origin: string
          origin_detail: string | null
          phone: string
          quote_breakdown: Json
          quote_total: number | null
          reference: string
          special_handling: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_team?: string | null
          created_at?: string
          deposit_required?: number | null
          destination: string
          destination_detail?: string | null
          floor_level?: number
          id?: string
          items?: Json
          move_date?: string | null
          move_time?: string | null
          needs_manual_quote?: boolean
          notes?: string | null
          origin: string
          origin_detail?: string | null
          phone: string
          quote_breakdown?: Json
          quote_total?: number | null
          reference?: string
          special_handling?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_team?: string | null
          created_at?: string
          deposit_required?: number | null
          destination?: string
          destination_detail?: string | null
          floor_level?: number
          id?: string
          items?: Json
          move_date?: string | null
          move_time?: string | null
          needs_manual_quote?: boolean
          notes?: string | null
          origin?: string
          origin_detail?: string | null
          phone?: string
          quote_breakdown?: Json
          quote_total?: number | null
          reference?: string
          special_handling?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          booking_id: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          placement_id: string | null
          spent_on: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          placement_id?: string | null
          spent_on?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          placement_id?: string | null
          spent_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "placement_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_costs: {
        Row: {
          listing_id: string
          notes: string | null
          original_deposit: number
          other_costs: number
        }
        Insert: {
          listing_id: string
          notes?: string | null
          original_deposit?: number
          other_costs?: number
        }
        Update: {
          listing_id?: string
          notes?: string | null
          original_deposit?: number
          other_costs?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_costs_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          accommodation_type: string
          created_at: string
          customer_price: number
          description: string | null
          door_number: string | null
          furnishing: string
          household_items: string[]
          id: string
          is_sample: boolean
          landlord_deposit: number
          location: string
          name: string
          photos: string[]
          reservation_amount: number
          service_fee: number
          status: Database["public"]["Enums"]["listing_status"]
        }
        Insert: {
          accommodation_type: string
          created_at?: string
          customer_price: number
          description?: string | null
          door_number?: string | null
          furnishing?: string
          household_items?: string[]
          id?: string
          is_sample?: boolean
          landlord_deposit?: number
          location: string
          name: string
          photos?: string[]
          reservation_amount?: number
          service_fee?: number
          status?: Database["public"]["Enums"]["listing_status"]
        }
        Update: {
          accommodation_type?: string
          created_at?: string
          customer_price?: number
          description?: string | null
          door_number?: string | null
          furnishing?: string
          household_items?: string[]
          id?: string
          is_sample?: boolean
          landlord_deposit?: number
          location?: string
          name?: string
          photos?: string[]
          reservation_amount?: number
          service_fee?: number
          status?: Database["public"]["Enums"]["listing_status"]
        }
        Relationships: []
      }
      message_replies: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_admin: boolean
          message_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_admin?: boolean
          message_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_admin?: boolean
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_replies_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "support_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          id: string
          kind: string
          method: string
          placement_id: string | null
          provider_ref: string | null
          status: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          method?: string
          placement_id?: string | null
          provider_ref?: string | null
          status?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          method?: string
          placement_id?: string | null
          provider_ref?: string | null
          status?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "placement_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      place_options: {
        Row: {
          active: boolean
          id: string
          kind: string
          name: string
          sort: number
        }
        Insert: {
          active?: boolean
          id?: string
          kind: string
          name: string
          sort?: number
        }
        Update: {
          active?: boolean
          id?: string
          kind?: string
          name?: string
          sort?: number
        }
        Relationships: []
      }
      placement_requests: {
        Row: {
          agreed_price: number | null
          created_at: string
          id: string
          listing_id: string | null
          message: string | null
          phone: string | null
          status: string
          user_id: string
        }
        Insert: {
          agreed_price?: number | null
          created_at?: string
          id?: string
          listing_id?: string | null
          message?: string | null
          phone?: string | null
          status?: string
          user_id: string
        }
        Update: {
          agreed_price?: number | null
          created_at?: string
          id?: string
          listing_id?: string | null
          message?: string | null
          phone?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          referral_code: string
          referred_by: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          referral_code?: string
          referred_by?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string
          referred_by?: string | null
        }
        Relationships: []
      }
      referral_payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          reference: string | null
          referrer_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string
          reference?: string | null
          referrer_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          reference?: string | null
          referrer_id?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          id: string
          placement_id: string | null
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          id?: string
          placement_id?: string | null
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          placement_id?: string | null
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: true
            referencedRelation: "placement_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          assigned_to: string | null
          body: string
          created_at: string
          id: string
          status: string
          subject: string
          topic: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          body: string
          created_at?: string
          id?: string
          status?: string
          subject: string
          topic?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          body?: string
          created_at?: string
          id?: string
          status?: string
          subject?: string
          topic?: string
          user_id?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff" | "user"
      booking_status:
        | "draft"
        | "awaiting_quotation"
        | "awaiting_deposit"
        | "confirmed"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "refunded"
      listing_status: "available" | "reserved" | "occupied" | "unavailable"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "staff", "user"],
      booking_status: [
        "draft",
        "awaiting_quotation",
        "awaiting_deposit",
        "confirmed",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "refunded",
      ],
      listing_status: ["available", "reserved", "occupied", "unavailable"],
    },
  },
} as const
