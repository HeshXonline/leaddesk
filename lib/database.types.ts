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
        }
        Insert: {
          business_name: string
          created_at?: string
          id?: string
          owner_email: string
        }
        Update: {
          business_name?: string
          created_at?: string
          id?: string
          owner_email?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]

export type Business = Tables<"businesses">
export type Inquiry = Tables<"inquiries">
export type Template = Tables<"quick_reply_templates">
export type InquiryChannel = Enums<"inquiry_channel">
export type InquiryStatus = Enums<"inquiry_status">
export type LostReason = Enums<"lost_reason">