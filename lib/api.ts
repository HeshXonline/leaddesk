import { supabase } from "./supabase";
import type {
  Inquiry,
  InquiryChannel,
  InquiryStatus,
  Template,
  Business,
  Plan,
  Subscription,
  TeamMember,
} from "./database.types";

// ─── Inquiries ────────────────────────────────────────────

export type InquiryFilters = {
  status?: InquiryStatus;
  channel?: InquiryChannel;
  search?: string;
};

export async function getInquiries(
  businessId: string,
  filters?: InquiryFilters
) {
  let query = supabase
    .from("inquiries")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.channel) {
    query = query.eq("channel", filters.channel);
  }
  if (filters?.search) {
    query = query.or(
      `customer_name.ilike.%${filters.search}%,message.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Inquiry[];
}

export async function createInquiry(
  data: Omit<Inquiry, "id" | "created_at" | "updated_at" | "status_changed_at">
) {
  const { data: result, error } = await supabase
    .from("inquiries")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result as Inquiry;
}

export async function updateInquiry(
  id: string,
  data: Partial<Inquiry>
) {
  const { data: result, error } = await supabase
    .from("inquiries")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return result as Inquiry;
}

export async function deleteInquiry(id: string) {
  const { error } = await supabase.from("inquiries").delete().eq("id", id);
  if (error) throw error;
}

// ─── Quick Reply Templates ─────────────────────────────────

export async function getTemplates(businessId: string) {
  const { data, error } = await supabase
    .from("quick_reply_templates")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Template[];
}

export async function createTemplate(
  data: Omit<Template, "id" | "created_at">
) {
  const { data: result, error } = await supabase
    .from("quick_reply_templates")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result as Template;
}

export async function updateTemplate(
  id: string,
  data: Partial<Template>
) {
  const { data: result, error } = await supabase
    .from("quick_reply_templates")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return result as Template;
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase
    .from("quick_reply_templates")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ─── Businesses ───────────────────────────────────────────

export async function updateBusiness(
  id: string,
  data: Partial<Business>
) {
  const { data: result, error } = await supabase
    .from("businesses")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return result as Business;
}

// ─── Plans ─────────────────────────────────────────────────

export async function getPlans() {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as Plan[];
}

// ─── Subscriptions ──────────────────────────────────────────

export async function getSubscription(businessId: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, plan:plan_id(*)")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  return data as (Subscription & { plan: Plan }) | null;
}

export async function createFreeSubscription(businessId: string) {
  // Get the Free plan
  const { data: freePlan } = await supabase
    .from("plans")
    .select("id")
    .eq("slug", "free")
    .single();
  if (!freePlan) throw new Error("Free plan not found");

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      business_id: businessId,
      plan_id: freePlan.id,
      status: "active",
      current_period_start: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as Subscription;
}

// ─── Team Members ───────────────────────────────────────────

export async function getTeamMembers(businessId: string) {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as TeamMember[];
}

// ─── Usage ──────────────────────────────────────────────────

export async function getInquiryUsage(businessId: string) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Try to get from usage log
  const { data: log } = await supabase
    .from("inquiry_usage_log")
    .select("count")
    .eq("business_id", businessId)
    .eq("month", month)
    .maybeSingle();

  if (log) return log.count;

  // Fallback: count actual inquiries this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count, error } = await supabase
    .from("inquiries")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("created_at", startOfMonth);
  if (error) throw error;
  return count ?? 0;
}

// ─── Edge Function Calls ────────────────────────────────────

export async function callEdgeFunction<T = unknown>(
  name: string,
  body: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message);
  return data as T;
}
