import { supabase } from "./supabase";
import type {
  Inquiry,
  InquiryChannel,
  InquiryStatus,
  Template,
  Business,
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
