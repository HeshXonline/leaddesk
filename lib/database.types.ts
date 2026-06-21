// This file provides the type aliases used across the app.
// Full generated types are in database.generated.ts

import type { Database as GenDatabase } from "./database.generated";

export type Database = GenDatabase;

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

export type Business = Tables<"businesses">;
export type Inquiry = Tables<"inquiries">;
export type Template = Tables<"quick_reply_templates">;
export type Plan = Tables<"plans">;
export type Subscription = Tables<"subscriptions">;
export type TeamMember = Tables<"team_members">;
export type UsageLog = Tables<"inquiry_usage_log">;
export type InquiryChannel = Enums<"inquiry_channel">;
export type InquiryStatus = Enums<"inquiry_status">;
export type LostReason = Enums<"lost_reason">;