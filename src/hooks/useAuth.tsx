import { useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      // Defer extra calls
      if (sess?.user) {
        setTimeout(checkAdmin, 0);
      } else {
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) setTimeout(checkAdmin, 0);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdmin = useCallback(async () => {
    // Check if user exists in admin_users table via is_admin RPC
    const { data, error } = await supabase.rpc("is_admin");
    if (error) {
      console.error("is_admin RPC error", error);
      setIsAdmin(false);
      return;
    }
    setIsAdmin(!!data);
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  return { session, user, loading, isAdmin, signOut };
}
