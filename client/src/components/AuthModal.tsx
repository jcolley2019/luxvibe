import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getSupabase } from "@/lib/supabase";
import { SiGoogle } from "react-icons/si";
import { Eye, EyeOff, Loader2 } from "lucide-react";

type Mode = "login" | "signup";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  function reset() {
    setEmail("");
    setPassword("");
    setFullName("");
    setError(null);
    setLoading(false);
    setGoogleLoading(false);
  }

  function handleClose() {
    reset();
    setMode("login");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = await getSupabase();

      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        toast({ title: "Welcome back!", description: "You've been signed in." });
        handleClose();
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (err) throw err;
        toast({
          title: "Account created!",
          description: "Check your email to confirm your account, then sign in.",
        });
        setMode("login");
        setPassword("");
        setFullName("");
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    try {
      const supabase = await getSupabase();
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (err) throw err;
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden" aria-describedby={undefined}>
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <span
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              className="text-3xl font-semibold tracking-[0.18em] text-foreground uppercase"
            >
              Luxvibe
            </span>
          </div>

          <div className="text-center mb-7">
            <h2 className="text-xl font-bold text-foreground mb-1">
              {mode === "login" ? "Sign in to your account" : "Create your account"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "Welcome back — your perfect stay awaits."
                : "Join Luxvibe and start exploring."}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 text-sm font-medium rounded-full mb-4 gap-2"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            data-testid="button-google-signin"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SiGoogle className="w-4 h-4" />
            )}
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={mode === "signup"}
                  className="h-11"
                  data-testid="input-fullname"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11"
                data-testid="input-email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="h-11 pr-10"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md" data-testid="text-auth-error">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold rounded-full"
              disabled={loading || googleLoading}
              data-testid="button-auth-submit"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "login" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
              data-testid="button-toggle-auth-mode"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>

          <p className="text-center text-xs text-muted-foreground mt-3 leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
