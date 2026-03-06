import type { Express } from "express";
import { requireSupabaseAuth } from "../../supabase";

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", requireSupabaseAuth, async (req: any, res) => {
    try {
      const user = req.supabaseUser;
      const fullName: string = user.user_metadata?.full_name || user.user_metadata?.name || "";
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0] || user.email?.split("@")[0] || "User";
      const lastName = parts.slice(1).join(" ");
      res.json({
        id: user.id,
        email: user.email || "",
        firstName,
        lastName,
        profileImageUrl: user.user_metadata?.avatar_url || null,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
