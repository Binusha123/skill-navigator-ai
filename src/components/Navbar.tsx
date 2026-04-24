import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { useEffect, useState } from "react";
import logo from "@/assets/skillora-logo.png";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(auth.current());

  useEffect(() => {
    setUser(auth.current());
  }, [location.pathname]);

  const handleLogout = () => {
    auth.logout();
    setUser(null);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Skillora AI logo" className="h-9 w-9 rounded-xl object-contain bg-white/95 p-1" />
          <span className="font-display text-xl font-bold">
            Skillora <span className="gradient-text">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="/#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
          <a href="/#how" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How it works</a>
          <a href="/#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button variant="glass" size="sm" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button variant="hero" size="sm" onClick={() => navigate("/signup")}>
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
