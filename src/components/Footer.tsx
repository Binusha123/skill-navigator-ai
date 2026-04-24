import { Brain } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border/50 py-10">
    <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg">
          <Brain className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm text-muted-foreground">© 2026 Skillora AI. Prove your skills. Plan your growth.</span>
      </div>
      <div className="flex gap-6 text-sm text-muted-foreground">
        <a href="#" className="hover:text-foreground">Privacy</a>
        <a href="#" className="hover:text-foreground">Terms</a>
        <a href="#" className="hover:text-foreground">Contact</a>
      </div>
    </div>
  </footer>
);

export default Footer;
