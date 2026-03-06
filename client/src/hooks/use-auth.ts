import { useAuthContext } from "@/contexts/AuthContext";

export interface MappedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
}

function mapSupabaseUser(user: ReturnType<typeof useAuthContext>["user"]): MappedUser | null {
  if (!user) return null;
  const fullName: string = user.user_metadata?.full_name || user.user_metadata?.name || "";
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || user.email?.split("@")[0] || "User";
  const lastName = parts.slice(1).join(" ");
  return {
    id: user.id,
    email: user.email || "",
    firstName,
    lastName,
    profileImageUrl: user.user_metadata?.avatar_url || null,
  };
}

export function useAuth() {
  const { user, session, loading, openLoginModal, closeLoginModal, loginModalOpen, signOut } = useAuthContext();

  return {
    user: mapSupabaseUser(user),
    session,
    isLoading: loading,
    isAuthenticated: !!user,
    openLoginModal,
    closeLoginModal,
    loginModalOpen,
    logout: signOut,
    isLoggingOut: false,
  };
}
