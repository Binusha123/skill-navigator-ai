import { Link } from "react-router-dom";
import { ArrowRight, Brain, Check, FileSearch, GraduationCap, Sparkles, Target, Upload, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImg from "@/assets/hero-ai.jpg";

const features = [
  {
    icon: Brain,
    title: "AI Skill Assessment",
    desc: "Conversational AI evaluates your real proficiency through adaptive, role-specific questions.",
  },
  {
    icon: Target,
    title: "Skill Gap Analysis",
    desc: "See exactly where you stand vs. job requirements with a precise gap percentage.",
  },
  {
    icon: GraduationCap,
    title: "Personalized Learning Plan",
    desc: "Get a weekly roadmap with curated resources and realistic timelines to close every gap.",
  },
];

const steps = [
  { icon: Upload, title: "Upload resume", desc: "Drop your CV and paste any job description." },
  { icon: Sparkles, title: "Take AI assessment", desc: "Answer dynamic questions tailored to the role." },
  { icon: FileSearch, title: "Review your gaps", desc: "Discover strengths, weaknesses, and missing skills." },
  { icon: Zap, title: "Follow your roadmap", desc: "Execute a weekly plan to become job-ready faster." },
];

const plans = [
  { name: "Free", price: "$0", desc: "Try the platform", features: ["1 assessment / month", "Basic gap report", "Sample roadmap"] },
  { name: "Pro", price: "$19", desc: "For active job seekers", features: ["Unlimited assessments", "Detailed gap analysis", "Weekly roadmaps", "Resource library"], highlight: true },
  { name: "Premium", price: "$49", desc: "Career acceleration", features: ["Everything in Pro", "1:1 mentor matching", "Mock interviews", "Priority support"] },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden hero-bg">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="container relative grid gap-12 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered skill intelligence
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] md:text-6xl lg:text-7xl">
              Stop guessing your skills.{" "}
              <span className="gradient-text">Measure them.</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
              Skillora AI evaluates your real proficiency through conversational AI, identifies gaps for any role, and builds a personalized roadmap to get you job-ready — fast.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/signup">
                <Button variant="hero" size="xl">
                  Start Free Assessment
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#how">
                <Button variant="glass" size="xl">How it works</Button>
              </a>
            </div>
            <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> No credit card</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Setup in 60s</div>
            </div>
          </div>

          <div className="relative animate-float">
            <div className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-3xl" />
            <img
              src={heroImg}
              alt="AI brain analyzing skills with holographic dashboards"
              width={1280}
              height={1280}
              className="rounded-3xl border border-border/50 shadow-elegant"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold md:text-5xl">Everything you need to <span className="gradient-text">level up</span></h2>
          <p className="mt-4 text-lg text-muted-foreground">Three tools. One outcome: a clear, confident path to your next role.</p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card-glass group rounded-2xl p-8 transition-all hover:border-primary/50 hover:shadow-glow">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl gradient-bg shadow-glow">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{f.title}</h3>
              <p className="text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border/50 bg-muted/20 py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold md:text-5xl">From resume to roadmap <span className="gradient-text">in minutes</span></h2>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="card-glass rounded-2xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span className="font-display text-3xl font-bold text-muted-foreground/30">0{i + 1}</span>
                  </div>
                  <h3 className="mb-1 text-lg font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold md:text-5xl">Simple, <span className="gradient-text">honest pricing</span></h2>
          <p className="mt-4 text-lg text-muted-foreground">Start free. Upgrade when you're ready to land the offer.</p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`card-glass relative rounded-2xl p-8 ${p.highlight ? "border-primary/60 shadow-glow" : ""}`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-bg px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}
              <h3 className="font-display text-2xl font-bold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold">{p.price}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button variant={p.highlight ? "hero" : "glass"} className="mt-8 w-full">
                  Choose {p.name}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20 md:pb-28">
        <div className="card-glass relative overflow-hidden rounded-3xl p-10 text-center md:p-16">
          <div className="absolute inset-0 -z-10 hero-bg" />
          <h2 className="font-display text-4xl font-bold md:text-5xl">Ready to <span className="gradient-text">prove your skills?</span></h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">Take your first AI assessment now — it's free, takes 5 minutes, and changes how you job hunt.</p>
          <Link to="/signup" className="mt-8 inline-block">
            <Button variant="hero" size="xl">
              Start Free Assessment <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
