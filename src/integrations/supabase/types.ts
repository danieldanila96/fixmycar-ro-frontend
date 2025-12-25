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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          customer_id: string
          garage_id: string
          id: string
          job_id: string | null
          notes: string | null
          service_type: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          customer_id: string
          garage_id: string
          id?: string
          job_id?: string | null
          notes?: string | null
          service_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          customer_id?: string
          garage_id?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          service_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          id: string
          job_id: string
          payment_intent_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          quote_id: string
          scheduled_date: string
          scheduled_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          payment_intent_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          quote_id: string
          scheduled_date: string
          scheduled_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          payment_intent_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          quote_id?: string
          scheduled_date?: string
          scheduled_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          customer_id: string
          garage_id: string
          id: string
          job_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          garage_id: string
          id?: string
          job_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          garage_id?: string
          id?: string
          job_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          garage_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          garage_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          garage_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          car_make: string
          car_model: string
          car_year: number | null
          category: string
          city: string
          county: string
          created_at: string
          description: string
          fuel_type: string | null
          id: string
          images: string[] | null
          needed_by: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          urgency: string | null
          user_id: string
        }
        Insert: {
          car_make: string
          car_model: string
          car_year?: number | null
          category: string
          city: string
          county: string
          created_at?: string
          description: string
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          needed_by?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          urgency?: string | null
          user_id: string
        }
        Update: {
          car_make?: string
          car_model?: string
          car_year?: number | null
          category?: string
          city?: string
          county?: string
          created_at?: string
          description?: string
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          needed_by?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          urgency?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          business_address: string | null
          business_name: string | null
          city: string | null
          county: string | null
          created_at: string
          description: string | null
          full_name: string | null
          gallery_images: string[] | null
          id: string
          latitude: number | null
          longitude: number | null
          operating_hours: Json | null
          phone: string | null
          rar_authorization: string | null
          specialties: string[] | null
          total_reviews: number | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number | null
          business_address?: string | null
          business_name?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          full_name?: string | null
          gallery_images?: string[] | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          operating_hours?: Json | null
          phone?: string | null
          rar_authorization?: string | null
          specialties?: string[] | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number | null
          business_address?: string | null
          business_name?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          full_name?: string | null
          gallery_images?: string[] | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          operating_hours?: Json | null
          phone?: string | null
          rar_authorization?: string | null
          specialties?: string[] | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      quotes: {
        Row: {
          created_at: string
          estimated_days: number | null
          garage_id: string
          id: string
          job_id: string
          message: string | null
          price: number
          status: Database["public"]["Enums"]["quote_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_days?: number | null
          garage_id: string
          id?: string
          job_id: string
          message?: string | null
          price: number
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_days?: number | null
          garage_id?: string
          id?: string
          job_id?: string
          message?: string | null
          price?: number
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string
          garage_id: string
          id: string
          job_id: string
          rating: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          garage_id: string
          id?: string
          job_id: string
          rating: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          garage_id?: string
          id?: string
          job_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_safe: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          business_address: string | null
          business_name: string | null
          city: string | null
          county: string | null
          created_at: string | null
          description: string | null
          full_name: string | null
          gallery_images: string[] | null
          id: string | null
          latitude: number | null
          longitude: number | null
          operating_hours: Json | null
          phone: string | null
          rar_authorization: string | null
          specialties: string[] | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string | null
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number | null
          business_address?: string | null
          business_name?: string | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          description?: string | null
          full_name?: string | null
          gallery_images?: string[] | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          operating_hours?: Json | null
          phone?: never
          rar_authorization?: string | null
          specialties?: string[] | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number | null
          business_address?: string | null
          business_name?: string | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          description?: string | null
          full_name?: string | null
          gallery_images?: string[] | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          operating_hours?: Json | null
          phone?: never
          rar_authorization?: string | null
          specialties?: string[] | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
      reviews_public: {
        Row: {
          comment: string | null
          created_at: string | null
          garage_id: string | null
          id: string | null
          job_id: string | null
          rating: number | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          garage_id?: string | null
          id?: string | null
          job_id?: string | null
          rating?: number | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          garage_id?: string | null
          id?: string | null
          job_id?: string | null
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_type: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_type"]
      }
      has_active_customer_relationship: {
        Args: { _customer_id: string; _garage_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      job_status:
        | "open"
        | "quotes_provided"
        | "booked"
        | "completed"
        | "cancelled"
      payment_status: "pending" | "paid" | "refunded"
      quote_status: "sent" | "accepted" | "rejected"
      user_type: "customer" | "garage"
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
      app_role: ["admin", "moderator", "user"],
      job_status: [
        "open",
        "quotes_provided",
        "booked",
        "completed",
        "cancelled",
      ],
      payment_status: ["pending", "paid", "refunded"],
      quote_status: ["sent", "accepted", "rejected"],
      user_type: ["customer", "garage"],
    },
  },
} as const
