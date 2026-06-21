import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { updateBusiness } from "../lib/api";
import { supabase } from "../lib/supabase";
import type { Business } from "../lib/database.types";
import {
  Building2, Mail, Check, Loader2, X, Save, Calendar,
} from "lucide-react";

export default function Settings() {
  const { businessId, user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setBusiness(data as Business);
          setNameInput((data as Business).business_name);
        }
      })
      .finally(() => setLoading(false));
  }, [businessId]);

  const handleSaveName = async () => {
    if (!business || !nameInput.trim()) return;
    setSaving(true);
    try {
      const updated = await updateBusiness(business.id, {
        business_name: nameInput.trim(),
      });
      setBusiness(updated);
      setEditingName(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      console.error("Failed to update business name");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setNameInput(business?.business_name ?? "");
    setEditingName(false);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-secondary mt-1 text-sm">
          Manage your account and business settings
        </p>
      </div>

      {/* Business section */}
      <div className="bg-white rounded-xl border border-border overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-accent" />
            Business Profile
          </h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Business name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Business Name
            </label>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={!nameInput.trim() || saving}
                  className="p-2.5 bg-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
                  aria-label="Save"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-2.5 border border-border rounded-lg text-foreground hover:bg-muted transition-all duration-150 cursor-pointer"
                  aria-label="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  {business?.business_name}
                </span>
                {saved && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                )}
                <button
                  onClick={() => setEditingName(true)}
                  className="text-sm text-accent hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          <hr className="border-border" />

          {/* Owner email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Owner Email
            </label>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Mail className="w-4 h-4 text-secondary" />
              {business?.owner_email}
            </div>
          </div>

          <hr className="border-border" />

          {/* Created */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Business Created
            </label>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Calendar className="w-4 h-4 text-secondary" />
              {business?.created_at ? formatDate(business.created_at) : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Account section */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-accent" />
            Account
          </h2>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Mail className="w-4 h-4 text-secondary" />
              {user?.email}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-secondary leading-relaxed">
            To change your password or delete your account, please use the
            Supabase Auth settings in your account dashboard.
          </div>
        </div>
      </div>
    </div>
  );
}
