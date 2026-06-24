import { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import { updateBusiness } from "../lib/api";
import { callEdgeFunction } from "../lib/api";
import { supabase } from "../lib/supabase";
import type { Business, TeamMember } from "../lib/database.types";
import {
  Building2,
  Mail,
  Check,
  Loader2,
  X,
  Calendar,
  CreditCard,
  Users,
  UserPlus,
  Crown,
  Shield,
  User,
  ExternalLink,
  Hourglass,
  Ban,
  Sparkles,
  BarChart3,
  RefreshCw,
} from "lucide-react";

export default function Settings() {
  const { businessId, user, isOwner } = useAuth();
  const { plan, subscription, usage, isLoading: subLoading, refresh: refreshSub } = useSubscription();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Team state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Portal state
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }
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
        setLoading(false);
      });
  }, [businessId]);

  // Fetch team members
  const fetchTeam = async () => {
    if (!businessId) return;
    setTeamLoading(true);
    const { data } = await supabase
      .from("team_members")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true });
    if (data) setTeamMembers(data as TeamMember[]);
    setTeamLoading(false);
  };

  useEffect(() => {
    fetchTeam();
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

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const { url } = await callEdgeFunction<{ url: string }>(
        "stripe-create-portal",
        {}
      );
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (err) {
      setPortalError(
        err instanceof Error ? err.message : "Failed to open billing portal"
      );
    } finally {
      setPortalLoading(false);
    }
  };

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !isOwner) return;

    setInviting(true);
    setInviteError(null);
    setInviteSuccess(false);

    try {
      await callEdgeFunction("invite-team-member", {
        invited_email: inviteEmail.trim(),
      });
      setInviteSuccess(true);
      setInviteEmail("");
      await fetchTeam();
      await refreshSub();
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : "Failed to send invitation"
      );
    } finally {
      setInviting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            <Crown className="w-3 h-3" /> Owner
          </span>
        );
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
            <Shield className="w-3 h-3" /> Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary bg-muted px-2 py-0.5 rounded-full">
            <User className="w-3 h-3" /> Member
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
            <Check className="w-3 h-3" /> Active
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            <Hourglass className="w-3 h-3" /> Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
            <Ban className="w-3 h-3" /> {status}
          </span>
        );
    }
  };

  const planBadgeColors: Record<string, string> = {
    free: "bg-slate-100 text-slate-700",
    pro: "bg-accent/10 text-accent",
    enterprise: "bg-purple-100 text-purple-700",
  };

  if (loading || subLoading) {
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

  const usagePercent =
    usage.inquiryLimit && usage.inquiryLimit > 0
      ? Math.round((usage.inquiryCount / usage.inquiryLimit) * 100)
      : 0;

  const teamUsagePercent =
    usage.userLimit && usage.userLimit > 0
      ? Math.round((usage.teamCount / usage.userLimit) * 100)
      : 0;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-secondary mt-1 text-sm">
          Manage your account, subscription, and team
        </p>
      </div>

      {/* ── Business Profile ── */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-accent" />
            Business Profile
          </h2>
        </div>
        <div className="p-6 space-y-5">
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

      {/* ── Subscription ── */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent" />
            Subscription
          </h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Plan badge */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Current Plan
              </label>
              <div className="flex items-center gap-2">
                {plan ? (
                  <span
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ${
                      planBadgeColors[plan.slug] ?? "bg-muted text-foreground"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {plan.name}
                  </span>
                ) : (
                  <span className="text-sm text-secondary">
                    No active plan
                  </span>
                )}
                {subscription?.status === "canceled" && (
                  <span className="text-xs text-destructive bg-red-50 px-2 py-0.5 rounded-full">
                    Canceled
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleOpenPortal}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {portalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Manage Billing
            </button>
          </div>

          {portalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-destructive">
              {portalError}
            </div>
          )}

          <hr className="border-border" />

          {/* Usage meter — Inquiries */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-secondary" />
                Inquiry Usage
              </label>
              <span className="text-xs text-secondary">
                {usage.inquiryCount}
                {usage.inquiryLimit !== null ? ` / ${usage.inquiryLimit}` : ""}
                {" "}this month
              </span>
            </div>
            {usage.inquiryLimit !== null && (
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    usagePercent >= 90
                      ? "bg-destructive"
                      : usagePercent >= 70
                      ? "bg-amber-500"
                      : "bg-accent"
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
            )}
            {usage.inquiryLimit === null && (
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.min((usage.inquiryCount / 1000) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Usage meter — Team */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-secondary" />
                Team Seats
              </label>
              <span className="text-xs text-secondary">
                {usage.teamCount}
                {usage.userLimit !== null ? ` / ${usage.userLimit}` : ""}
                {" "}used
              </span>
            </div>
            {usage.userLimit !== null ? (
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    teamUsagePercent >= 90
                      ? "bg-destructive"
                      : teamUsagePercent >= 70
                      ? "bg-amber-500"
                      : "bg-accent"
                  }`}
                  style={{ width: `${Math.min(teamUsagePercent, 100)}%` }}
                />
              </div>
            ) : (
              <p className="text-xs text-secondary">Unlimited seats</p>
            )}
          </div>

          {/* Period info */}
          {subscription?.current_period_end && (
            <>
              <hr className="border-border" />
              <div className="flex items-center gap-2 text-sm text-secondary">
                <RefreshCw className="w-4 h-4" />
                Current period ends{" "}
                {formatDate(subscription.current_period_end)}
                {subscription.cancel_at_period_end && (
                  <span className="text-destructive">
                    (cancellation scheduled)
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Team Members ── */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            Team Members
          </h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Invite form — owner only */}
          {isOwner && (
            <>
              <form onSubmit={handleInvite} className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Invite Team Member
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"
                      disabled={inviting}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!inviteEmail.trim() || inviting || !usage.canInviteMember}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white font-medium rounded-lg hover:opacity-90 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                >
                  {inviting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Send Invite
                </button>
              </form>

              {inviteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-destructive">
                  {inviteError}
                </div>
              )}

              {inviteSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Invitation sent! They'll receive an email to join.
                </div>
              )}

              {!usage.canInviteMember && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  You've reached the team member limit for your plan.{" "}
                  <button
                    onClick={handleOpenPortal}
                    className="font-medium underline hover:no-underline cursor-pointer"
                  >
                    Upgrade to add more members.
                  </button>
                </div>
              )}

              <hr className="border-border" />
            </>
          )}

          {/* Team list */}
          {teamLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-secondary" />
            </div>
          ) : teamMembers.length === 0 ? (
            <p className="text-sm text-secondary py-2 text-center">
              No team members yet.
            </p>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-accent">
                        {(member.invited_email ?? "?")[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {member.invited_email || "Unknown"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {getRoleBadge(member.role)}
                        {getStatusBadge(member.invitation_status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Account ── */}
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
