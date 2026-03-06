import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { setCurrentAccessToken } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  loginModalOpen: false,
  openLoginModal: () => {},
  closeLoginModal: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    getSupabase().then((supabase) => {
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        setCurrentAccessToken(s?.access_token ?? null);
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        setCurrentAccessToken(s?.access_token ?? null);
        setLoading(false);

        if (event === "SIGNED_IN") {
          setLoginModalOpen(false);
          const redirect = sessionStorage.getItem("lv_post_login_redirect");
          if (redirect) {
            sessionStorage.removeItem("lv_post_login_redirect");
            setLocation(redirect);
          }
        }
        if (event === "SIGNED_OUT") {
          setCurrentAccessToken(null);
        }
      });

      return () => subscription.unsubscribe();
    });
  }, []);

  const signOut = useCallback(async () => {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
  }, []);

  const openLoginModal = useCallback(() => setLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setLoginModalOpen(false), []);

  return (
    <AuthContext.Provider value={{ user, session, loading, loginModalOpen, openLoginModal, closeLoginModal, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
