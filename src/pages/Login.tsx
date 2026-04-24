import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/auth";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill in all fields");
    auth.login(email, password);
    toast.success("Welcome back!");
    navigate("/dashboard");
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
        <h1 className="text-center font-display text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-center text-muted-foreground">Log in to continue your growth journey</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full">Log in</Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
