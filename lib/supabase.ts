import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const SUPABASE_URL = "https://zttjmywgvuwsodkprrbe.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dGpteXdndnV3c29ka3BycmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMzk3MTYsImV4cCI6MjA5NzYxNTcxNn0.6kxCAmRIttG6lrq0GpQdI8VCsIv-4Nr8ofir-Esuhrc";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: "implicit",
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});
