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

type AuthContextType = {
  user: User | null;
  businessId: string | null;
  businessName: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    businessName: string
  ) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Ensure user has business info in metadata (for users who signed up via email confirmation)
  const ensureBusinessMetadata = useCallback(async (currentUser: User) => {
    const meta = currentUser.user_metadata;
    if (meta?.business_id) {
      setBusinessId(meta.business_id);
      setBusinessName(meta.business_name ?? null);
      return;
    }

    // Business_id not in metadata yet — look it up from the database
    const { data: business } = await supabase
      .from("businesses")
      .select("id, business_name")
      .eq("owner_email", currentUser.email ?? "")
      .single();

    if (business) {
      setBusinessId(business.id);
      setBusinessName(business.business_name);
      // Also update the user metadata so RLS works
      await supabase.auth.updateUser({
        data: {
          business_id: business.id,
          business_name: business.business_name,
        },
      });
    }
  }, []);

  // Extract business info from user metadata
  const extractBusinessInfo = useCallback(
    (currentUser: User | null) => {
      if (!currentUser) {
        setBusinessId(null);
        setBusinessName(null);
        return;
      }
      const meta = currentUser.user_metadata;
      if (meta?.business_id) {
        setBusinessId(meta.business_id);
        setBusinessName(meta.business_name ?? null);
      } else {
        // Try to look up from DB
        ensureBusinessMetadata(currentUser);
      }
    },
    [ensureBusinessMetadata]
  );

  // Initialize on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      extractBusinessInfo(currentUser);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        extractBusinessInfo(currentUser);
      } else {
        setBusinessId(null);
        setBusinessName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [extractBusinessInfo]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };

    // Ensure business info is loaded (for users who signed up with email confirmation)
    if (data.user) {
      await extractBusinessInfo(data.user);
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
        emailRedirectTo: `${window.location.origin}/dashboard`,
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

    // 3. If session exists (email confirmation disabled), update user metadata immediately
    if (authData.session) {
      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          business_id: business.id,
          business_name: businessName,
        },
      });

      if (metaError) {
        // Try to clean up if metadata update fails
        await supabase.from("businesses").delete().eq("id", business.id);
        return { error: metaError.message };
      }

      return {};
    }

    // 4. No session (email confirmation required).
    //    Business record already created. When user confirms email and signs in,
    //    the signIn handler will look up their business_id
    return { needsConfirmation: true };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        businessId,
        businessName,
        loading,
        signIn,
        signUp,
        signOut,
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