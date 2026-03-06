import { createClient } from "@supabase/supabase-js";
import type { Request, Response, NextFunction } from "express";

export async function getSupabaseUser(token: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function requireSupabaseAuth(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const token = authHeader.slice(7);
  const user = await getSupabaseUser(token);
  if (!user) return res.status(401).json({ message: "Invalid or expired session" });
  req.supabaseUser = user;
  next();
}
