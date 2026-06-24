import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getSubscription,
  getInquiryUsage,
  getTeamMembers,
} from "../lib/api";
import type { Plan, Subscription, TeamMember } from "../lib/database.types";

type UsageInfo = {
  inquiryCount: number;
  teamCount: number;
  inquiryLimit: number | null;
  userLimit: number | null;
  canCreateInquiry: boolean;
  canInviteMember: boolean;
};

export function useSubscription() {
  const { businessId } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageInfo>({
    inquiryCount: 0,
    teamCount: 0,
    inquiryLimit: null,
    userLimit: null,
    canCreateInquiry: true,
    canInviteMember: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!businessId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get subscription with plan
      const sub = await getSubscription(businessId);
      if (sub) {
        setSubscription(sub);
        setPlan(sub.plan);

        const features = sub.plan.features as Record<string, unknown>;
        const inquiryLimit = features.max_inquiries_per_month as number | null;
        const userLimit = features.max_users as number | null;

        // Get current usage
        const inquiryCount = await getInquiryUsage(businessId);
        const teamMembers = await getTeamMembers(businessId);
        const teamCount = teamMembers.filter(
          (m: TeamMember) => m.invitation_status === "accepted"
        ).length;

        setUsage({
          inquiryCount,
          teamCount,
          inquiryLimit,
          userLimit,
          canCreateInquiry: inquiryLimit === null || inquiryCount < inquiryLimit,
          canInviteMember: userLimit === null || teamCount < userLimit,
        });
      } else {
        // No subscription found — treat as Free plan (but hasn't activated it yet)
        setPlan(null);
        setSubscription(null);

        const inquiryCount = await getInquiryUsage(businessId);

        setUsage({
          inquiryCount,
          teamCount: 0,
          inquiryLimit: 0,
          userLimit: 1,
          canCreateInquiry: false,
          canInviteMember: false,
        });
      }
    } catch (err) {
      console.error("Failed to load subscription data", err);
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    plan,
    subscription,
    usage,
    isLoading,
    refresh: fetchData,
  };
}
