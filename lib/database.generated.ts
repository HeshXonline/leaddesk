export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          business_name: string
          created_at: string
          id: string
          owner_email: string
          stripe_customer_id: string | null
        }
        Insert: {
          business_name: string
          created_at?: string
          id?: string
          owner_email: string
          stripe_customer_id?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string
          id?: string
          owner_email?: string
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          business_id: string
          channel: Database["public"]["Enums"]["inquiry_channel"]
          created_at: string
          customer_name: string
          customer_phone: string | null
          estimated_value: number | null
          follow_up_date: string | null
          id: string
          lost_reason: string | null
          message: string
          notes: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          status_changed_at: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          channel: Database["public"]["Enums"]["inquiry_channel"]
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          estimated_value?: number | null
          follow_up_date?: string | null
          id?: string
          lost_reason?: string | null
          message?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          status_changed_at?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          channel?: Database["public"]["Enums"]["inquiry_channel"]
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          estimated_value?: number | null
          follow_up_date?: string | null
          id?: string
          lost_reason?: string | null
          message?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          status_changed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_usage_log: {
        Row: {
          business_id: string
          count: number
          id: string
          month: string
        }
        Insert: {
          business_id: string
          count?: number
          id?: string
          month: string
        }
        Update: {
          business_id?: string
          count?: number
          id?: string
          month?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_usage_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          name: string
          price_monthly_cents: number
          slug: string
          sort_order: number
          stripe_price_id_monthly: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price_monthly_cents: number
          slug: string
          sort_order?: number
          stripe_price_id_monthly?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_monthly_cents?: number
          slug?: string
          sort_order?: number
          stripe_price_id_monthly?: string | null
        }
        Relationships: []
      }
      quick_reply_templates: {
        Row: {
          business_id: string
          created_at: string
          id: string
          message_text: string
          title: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          message_text: string
          title: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          message_text?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_reply_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          business_id: string
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          invitation_status: string
          invited_email: string | null
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          invitation_status?: string
          invited_email?: string | null
          role: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          invitation_status?: string
          invited_email?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_team_role: {
        Args: { allowed_roles: string[]; business_id: string }
        Returns: boolean
      }
      is_team_member: { Args: { business_id: string }; Returns: boolean }
    }
    Enums: {
      inquiry_channel:
        | "WhatsApp"
        | "Instagram"
        | "Facebook"
        | "Phone Call"
        | "Walk-in"
        | "Other"
      inquiry_status: "New" | "Contacted" | "Quoted" | "Won" | "Lost"
      lost_reason:
        | "Price too high"
        | "No response"
        | "Chose a competitor"
        | "Not ready yet"
        | "Other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
