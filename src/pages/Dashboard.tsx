import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, BrainCircuit, CheckCircle2, ChevronRight, Clock, FileText, Sparkles, Target, TrendingUp, Upload, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/auth";
import { mockQuestions, generateMockResults, generateLearningPlan, generateSkillConfidence, calculateJobReadiness, type SkillScore, type LearningWeek, type SkillConfidence } from "@/lib/mockData";
import JobReadinessCard from "@/components/JobReadinessCard";
import SkillConfidenceCard from "@/components/SkillConfidenceCard";
import { toast } from "sonner";

type Step = "upload" | "assessment" | "results";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(auth.current());
  const [step, setStep] = useState<Step>("upload");
  const [resumeName, setResumeName] = useState("");
  const [jd, setJd] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<SkillScore[]>([]);
  const [confidence, setConfidence] = useState<SkillConfidence[]>([]);
  const [plan, setPlan] = useState<LearningWeek[]>([]);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const startAssessment = () => {
    if (!resumeName) return toast.error("Please upload your resume");
    if (jd.trim().length < 30) return toast.error("Please paste a longer job description");
    setStep("assessment");
    toast.success("Assessment ready — answer honestly!");
  };

  const submitAssessment = () => {
    const answered = Object.values(answers).filter((a) => a.trim().length > 10).length;
    if (answered < 3) return toast.error("Please answer at least 3 questions thoughtfully");
    const r = generateMockResults(answers);
    setResults(r);
    setConfidence(generateSkillConfidence(r));
    setPlan(generateLearningPlan(r));
    setStep("results");
  };

  const overall = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
  const requiredAvg = results.length ? Math.round(results.reduce((s, r) => s + r.required, 0) / results.length) : 0;
  const gap = Math.max(0, requiredAvg - overall);

  const missing = results.filter((r) => r.score < 40);
  const weak = results.filter((r) => r.score >= 40 && r.score < r.required);
  const strong = results.filter((r) => r.score >= r.required);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              Hello, <span className="gradient-text">{user.name}</span> 👋
            </h1>
            <p className="mt-1 text-muted-foreground">
              {step === "upload" && "Let's start by analyzing your target role."}
              {step === "assessment" && "Answer the questions below — be detailed and honest."}
              {step === "results" && "Here's your full skill report and growth roadmap."}
            </p>
          </div>
          {step !== "upload" && (
            <Button variant="ghost" size="sm" onClick={() => { setStep("upload"); setAnswers({}); setResults([]); }}>
              New assessment
            </Button>
          )}
        </div>

        {/* Stepper */}
        <div className="mb-10 flex items-center gap-2 text-xs">
          {(["upload", "assessment", "results"] as Step[]).map((s, i) => {
            const active = step === s;
            const done = ["upload", "assessment", "results"].indexOf(step) > i;
            return (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold ${active ? "gradient-bg text-primary-foreground" : done ? "bg-success text-background" : "bg-muted text-muted-foreground"}`}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`hidden capitalize sm:inline ${active ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                {i < 2 && <div className={`mx-2 h-px flex-1 ${done ? "bg-success" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>

        {step === "upload" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card-glass rounded-2xl p-6">
              <div className="mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-semibold">Upload Resume</h2>
              </div>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-12 text-center transition-colors hover:border-primary/50 hover:bg-muted/50">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
                <span className="font-medium">{resumeName || "Click to upload PDF or DOC"}</span>
                <span className="mt-1 text-xs text-muted-foreground">Max 5MB</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setResumeName(f.name);
                  }}
                />
              </label>
              {resumeName && (
                <div className="mt-4 rounded-xl bg-primary/10 p-3 text-sm text-primary">
                  ✓ {resumeName} uploaded
                </div>
              )}
            </div>

            <div className="card-glass rounded-2xl p-6">
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-semibold">Job Description</h2>
              </div>
              <Label htmlFor="jd" className="text-sm text-muted-foreground">Paste the role you're targeting</Label>
              <Textarea
                id="jd"
                rows={10}
                placeholder="e.g. We are hiring a Frontend Engineer with 2+ years of React, TypeScript, REST APIs, and SQL experience…"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                className="mt-2 resize-none"
              />
            </div>

            <div className="lg:col-span-2">
              <Button variant="hero" size="xl" className="w-full" onClick={startAssessment}>
                <Sparkles className="h-5 w-5" /> Generate My AI Assessment
              </Button>
            </div>
          </div>
        )}

        {step === "assessment" && (
          <div className="space-y-5">
            {mockQuestions.map((q, i) => (
              <div key={q.id} className="card-glass rounded-2xl p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-xs font-semibold text-primary">
                      {i + 1}
                    </div>
                    <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-medium text-secondary">{q.skill}</span>
                  </div>
                </div>
                <p className="mb-3 text-base font-medium">{q.question}</p>
                <Textarea
                  rows={3}
                  placeholder="Type your answer here…"
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className="resize-none"
                />
              </div>
            ))}
            <Button variant="hero" size="xl" className="w-full" onClick={submitAssessment}>
              <BrainCircuit className="h-5 w-5" /> Submit & Analyze
            </Button>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-6">
            {/* Top: Job Readiness */}
            <JobReadinessCard
              score={calculateJobReadiness(results)}
              missingCount={missing.length}
              weakCount={weak.length}
            />

            {/* Overall scorecard */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="card-glass rounded-2xl p-6">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" /> Overall Score</div>
                <div className="font-display text-5xl font-bold gradient-text">{overall}<span className="text-2xl text-muted-foreground">/100</span></div>
              </div>
              <div className="card-glass rounded-2xl p-6">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><Target className="h-4 w-4" /> Role Required</div>
                <div className="font-display text-5xl font-bold">{requiredAvg}<span className="text-2xl text-muted-foreground">/100</span></div>
              </div>
              <div className="card-glass rounded-2xl p-6">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><BrainCircuit className="h-4 w-4" /> Skill Gap</div>
                <div className={`font-display text-5xl font-bold ${gap > 20 ? "text-warning" : "text-success"}`}>{gap}%</div>
              </div>
            </div>

            {/* Middle: Skill Breakdown + Confidence */}
            <div className="grid gap-6 lg:grid-cols-2">
            <div className="card-glass rounded-2xl p-6">
              <h2 className="mb-6 font-display text-xl font-semibold">Skill Breakdown</h2>
              <div className="space-y-5">
                {results.map((r) => (
                  <div key={r.skill}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium">{r.skill}</span>
                      <span className="text-muted-foreground">
                        <span className={r.score >= r.required ? "text-success" : "text-warning"}>{r.score}</span> / {r.required} required
                      </span>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="absolute top-0 left-0 h-full rounded-full gradient-bg transition-all"
                        style={{ width: `${r.score}%` }}
                      />
                      <div
                        className="absolute top-0 h-full w-0.5 bg-foreground/60"
                        style={{ left: `${r.required}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gap analysis */}
            <div className="grid gap-4 md:grid-cols-3">
              <GapCard title="Strengths" icon={CheckCircle2} color="success" items={strong.map(s => s.skill)} empty="Keep building!" />
              <GapCard title="Weak Skills" icon={Clock} color="warning" items={weak.map(s => s.skill)} empty="None — well done!" />
              <GapCard title="Missing Skills" icon={XCircle} color="destructive" items={missing.map(s => s.skill)} empty="Nothing missing 🎉" />
            </div>

            {/* Learning plan */}
            <div className="card-glass rounded-2xl p-6">
              <div className="mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-semibold">Your Personalized Learning Plan</h2>
              </div>
              {plan.length === 0 ? (
                <p className="text-muted-foreground">You're already meeting requirements. Keep refining! 🎯</p>
              ) : (
                <div className="space-y-4">
                  {plan.map((w) => (
                    <div key={w.week} className="rounded-2xl border border-border/60 bg-muted/20 p-5">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg font-display font-bold text-primary-foreground">
                            W{w.week}
                          </div>
                          <h3 className="font-display text-lg font-semibold">{w.focus}</h3>
                        </div>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" /> ~{w.hours}h
                        </span>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <ul className="space-y-1.5 text-sm">
                          {w.tasks.map((t) => (
                            <li key={t} className="flex items-start gap-2"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t}</li>
                          ))}
                        </ul>
                        <ul className="space-y-1.5 text-sm">
                          {w.resources.map((r) => (
                            <li key={r.title}>
                              <a href={r.url} className="flex items-center gap-2 text-secondary hover:underline">
                                <BookOpen className="h-4 w-4" /> {r.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const GapCard = ({
  title, icon: Icon, color, items, empty,
}: { title: string; icon: any; color: "success" | "warning" | "destructive"; items: string[]; empty: string }) => {
  const colorMap = {
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
  };
  return (
    <div className="card-glass rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((i) => (
            <span key={i} className={`rounded-full px-3 py-1 text-xs font-medium ${colorMap[color]}`}>{i}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
