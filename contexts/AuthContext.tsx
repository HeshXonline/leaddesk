import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

type TeamMemberInfo = {
  id: string;
  email: string | null;
  role: string;
  invitation_status: string;
};

type AuthContextType = {
  user: User | null;
  businessId: string | null;
  businessName: string | null;
  loading: boolean;
  role: string | null;
  teamMembers: TeamMemberInfo[];
  isOwner: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    businessName: string
  ) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  refreshTeam: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setAuthInitialized] = useState(false);

  const fetchTeamInfo = useCallback(async (currentUser: User, bizId: string) => {
    // Fetch the user's team member record to get their role
    const { data: myMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("business_id", bizId)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (myMember) {
      setRole(myMember.role);
    }

    // Fetch all team members
    const { data: members } = await supabase
      .from("team_members")
      .select("id, invited_email, role, invitation_status")
      .eq("business_id", bizId);

    if (members) {
      setTeamMembers(
        members.map((m) => ({
          id: m.id,
          email: m.invited_email,
          role: m.role,
          invitation_status: m.invitation_status,
        }))
      );
    }
  }, []);


  // Extract business info from user metadata
  // Central handler for auth user data — stable reference, no deps
  const handleUserAuth = useCallback(async (currentUser: User) => {
    const meta = currentUser.user_metadata;
    if (meta?.business_id) {
      setBusinessId(meta.business_id);
      setBusinessName(meta.business_name ?? null);
      await fetchTeamInfo(currentUser, meta.business_id);
      return;
    }

    // Business_id not in metadata yet — look it up from team_members
    const { data: member } = await supabase
      .from("team_members")
      .select("business_id")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (member) {
      const { data: biz } = await supabase
      .from("businesses")
      .select("id, business_name")
      .eq("id", member.business_id)
      .single();

      if (biz) {
        setBusinessId(biz.id);
        setBusinessName(biz.business_name);
        await fetchTeamInfo(currentUser, biz.id);
        // Update user metadata so next time we don't need the lookup
        await supabase.auth.updateUser({
          data: {
            business_id: biz.id,
            business_name: biz.business_name,
          },
        });
      }
    }
  }, [fetchTeamInfo]);
  // Initialize on mount — run exactly once
  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          handleUserAuth(currentUser);
        }
        setLoading(false);
        setAuthInitialized(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
        setAuthInitialized(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        handleUserAuth(currentUser);
      } else {
        setBusinessId(null);
        setBusinessName(null);
        setRole(null);
        setTeamMembers([]);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };

    if (data.user) {
      await handleUserAuth(data.user);
    }

    return {};
  };

  const signUp = async (
    email: string,
    password: string,
    businessName: string
  ) => {
    // 1. Create the auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/pricing?new=true`,
      },
    });
    if (signUpError) return { error: signUpError.message };
    if (!authData.user) return { error: "Failed to create user" };

    // 2. Create the business record
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .insert({
        business_name: businessName,
        owner_email: email,
      })
      .select("id")
      .single();

    if (bizError) {
      return { error: bizError.message };
    }

    // 3. Create owner team_member record
    const { error: memberError } = await supabase.from("team_members").insert({
      business_id: business.id,
      user_id: authData.user.id,
      role: "owner",
      invitation_status: "accepted",
    });

    if (memberError) {
      await supabase.from("businesses").delete().eq("id", business.id);
      return { error: memberError.message };
    }

    // 4. If session exists, update user metadata immediately
    if (authData.session) {
      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          business_id: business.id,
          business_name: businessName,
        },
      });

      if (metaError) {
        await supabase.from("team_members").delete().eq("business_id", business.id);
        await supabase.from("businesses").delete().eq("id", business.id);
        return { error: metaError.message };
      }

      return {};
    }

    // 5. No session (email confirmation required)
    return { needsConfirmation: true };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setTeamMembers([]);
  };

  const refreshTeam = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser && businessId) {
      await fetchTeamInfo(currentUser, businessId);
    }
  }, [businessId, fetchTeamInfo]);

  return (
    <AuthContext.Provider
      value={{
        user,
        businessId,
        businessName,
        loading,
        role,
        teamMembers,
        isOwner: role === "owner",
        signIn,
        signUp,
        signOut,
        refreshTeam,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}