import logo from "@/assets/skillora-logo.png";

const Footer = () => (
  <footer className="border-t border-border/50 py-10">
    <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
      <div className="flex items-center gap-2">
        <img src={logo} alt="Skillora AI logo" className="h-7 w-7 rounded-lg object-contain bg-white/95 p-0.5" />
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
