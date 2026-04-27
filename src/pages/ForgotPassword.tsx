import { useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Check your inbox for the reset link");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute inset-0 hero-bg" />
      <div className="absolute inset-0 grid-bg opacity-30" />

      <div className="card-glass relative w-full max-w-md rounded-3xl p-8 shadow-elegant">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold">Skillora <span className="gradient-text">AI</span></span>
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <MailCheck className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
              The link is valid for 60 minutes.
            </p>
            <Button asChild variant="hero" size="lg" className="mt-6 w-full">
              <Link to="/login">Back to login</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-center font-display text-3xl font-bold">Forgot password?</h1>
            <p className="mt-2 text-center text-muted-foreground">
              Enter your email and we'll send you a reset link
            </p>
            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Remembered it? <Link to="/login" className="text-primary hover:underline">Log in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
