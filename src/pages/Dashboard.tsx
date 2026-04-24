import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, BrainCircuit, CheckCircle2, ChevronRight, Clock, FileText, Loader2, Sparkles, Target, TrendingUp, Upload, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/auth";
import JobReadinessCard from "@/components/JobReadinessCard";
import SkillConfidenceCard from "@/components/SkillConfidenceCard";
import { toast } from "sonner";
import {
  aiAgent,
  type AgentQuestion,
  type ConfidenceItem,
  type GapAnalysis,
  type JDData,
  type JobReadiness,
  type LearningWeek,
  type ResumeData,
  type SkillEvaluation,
  type SkillMapping,
} from "@/services/aiAgent";

type Step = "upload" | "assessment" | "results";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(auth.current());
  const [step, setStep] = useState<Step>("upload");

  // Inputs
  const [resumeName, setResumeName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");

  // Agent state
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [jdData, setJdData] = useState<JDData | null>(null);
  const [, setMapping] = useState<SkillMapping | null>(null);
  const [questions, setQuestions] = useState<AgentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<SkillEvaluation[]>([]);
  const [gap, setGap] = useState<GapAnalysis | null>(null);
  const [plan, setPlan] = useState<LearningWeek[]>([]);
  const [readiness, setReadiness] = useState<JobReadiness | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceItem[]>([]);

  // Loading
  const [stage, setStage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const handleFile = async (f: File) => {
    setResumeName(f.name);
    try {
      // Read as text — works for .txt and gives a best-effort for .pdf/.doc.
      const text = await f.text();
      setResumeText(text.slice(0, 12000));
    } catch {
      toast.error("Could not read file. Try pasting your resume content into the JD field below.");
    }
  };

  const runIntake = async () => {
    if (!resumeText && !resumeName) return toast.error("Please upload your resume");
    if (jd.trim().length < 30) return toast.error("Please paste a longer job description");

    setLoading(true);
    setError(null);
    try {
      setStage("Parsing resume…");
      const r = await aiAgent.parseResume(resumeText || resumeName);
      setResumeData(r);

      setStage("Analyzing job description…");
      const j = await aiAgent.analyzeJD(jd);
      setJdData(j);

      setStage("Mapping your skills to the role…");
      const m = await aiAgent.skillMapping(r, j);
      setMapping(m);

      setStage("Generating tailored interview questions…");
      const q = await aiAgent.generateQuestions(j, r);
      setQuestions(q.questions);
      setAnswers({});
      setStep("assessment");
      toast.success("Assessment ready — answer honestly!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setStage("");
    }
  };

  const runEvaluation = async () => {
    if (!resumeData || !jdData) return;
    const answered = Object.values(answers).filter((a) => a.trim().length > 10).length;
    if (answered < 3) return toast.error("Please answer at least 3 questions thoughtfully");

    setLoading(true);
    setError(null);
    try {
      setStage("Evaluating your answers…");
      const ev = await aiAgent.evaluateAnswers(questions, answers, jdData);
      setEvaluations(ev.evaluations);

      setStage("Running skill gap analysis…");
      const g = await aiAgent.gapAnalysis(ev.evaluations, jdData);
      setGap(g);

      setStage("Building your learning plan…");
      const lp = await aiAgent.learningPlan(g, resumeData);
      setPlan(lp.weeks);

      setStage("Calculating job readiness…");
      const jr = await aiAgent.jobReadiness(ev.evaluations, g);
      setReadiness(jr);

      setStage("Computing skill confidence…");
      const conf = await aiAgent.skillConfidence(resumeData, ev.evaluations);
      setConfidence(conf.items);

      setStep("results");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setStage("");
    }
  };

  const reset = () => {
    setStep("upload");
    setAnswers({});
    setEvaluations([]);
    setGap(null);
    setPlan([]);
    setReadiness(null);
    setConfidence([]);
  };

  const overall = evaluations.length ? Math.round(evaluations.reduce((s, r) => s + r.score, 0) / evaluations.length) : 0;
  const requiredAvg = evaluations.length ? Math.round(evaluations.reduce((s, r) => s + r.required, 0) / evaluations.length) : 0;
  const gapPct = Math.max(0, requiredAvg - overall);

  const missing = evaluations.filter((r) => r.score < 40);
  const weak = evaluations.filter((r) => r.score >= 40 && r.score < r.required);
  const strong = evaluations.filter((r) => r.score >= r.required);

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
          {step !== "upload" && !loading && (
            <Button variant="ghost" size="sm" onClick={reset}>
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

        {loading && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="font-medium">{stage || "Working…"}</span>
          </div>
        )}
        {error && !loading && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <div>
              <div className="font-semibold text-destructive">AI agent error</div>
              <div className="text-muted-foreground">{error}</div>
            </div>
            <Button size="sm" variant="outline" onClick={step === "assessment" ? runEvaluation : runIntake}>Retry</Button>
          </div>
        )}

        {step === "upload" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card-glass rounded-2xl p-6">
              <div className="mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-semibold">Upload Resume</h2>
              </div>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-12 text-center transition-colors hover:border-primary/50 hover:bg-muted/50">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
                <span className="font-medium">{resumeName || "Click to upload TXT, PDF, or DOC"}</span>
                <span className="mt-1 text-xs text-muted-foreground">Plain text works best</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </label>
              {resumeName && (
                <div className="mt-4 rounded-xl bg-primary/10 p-3 text-sm text-primary">
                  ✓ {resumeName} uploaded
                </div>
              )}
              <div className="mt-4">
                <Label htmlFor="resume-text" className="text-sm text-muted-foreground">
                  Or paste resume text
                </Label>
                <Textarea
                  id="resume-text"
                  rows={5}
                  placeholder="Paste your resume content for best AI accuracy…"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="mt-2 resize-none"
                />
              </div>
            </div>

            <div className="card-glass rounded-2xl p-6">
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-semibold">Job Description</h2>
              </div>
              <Label htmlFor="jd" className="text-sm text-muted-foreground">Paste the role you're targeting</Label>
              <Textarea
                id="jd"
                rows={14}
                placeholder="e.g. We are hiring a Frontend Engineer with 2+ years of React, TypeScript, REST APIs, and SQL experience…"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                className="mt-2 resize-none"
              />
            </div>

            <div className="lg:col-span-2">
              <Button variant="hero" size="xl" className="w-full" onClick={runIntake} disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                Generate My AI Assessment
              </Button>
            </div>
          </div>
        )}

        {step === "assessment" && (
          <div className="space-y-5">
            {resumeData && jdData && (
              <div className="card-glass rounded-2xl p-5">
                <div className="grid gap-4 md:grid-cols-2 text-sm">
                  <div>
                    <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Detected from your resume</div>
                    <div className="flex flex-wrap gap-2">
                      {resumeData.skills.slice(0, 12).map((s) => (
                        <span key={s} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Required by the role</div>
                    <div className="flex flex-wrap gap-2">
                      {jdData.required_skills.slice(0, 12).map((s) => (
                        <span key={s} className="rounded-full bg-secondary/15 px-2.5 py-1 text-xs text-secondary">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {questions.map((q, i) => (
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
            <Button variant="hero" size="xl" className="w-full" onClick={runEvaluation} disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5" />}
              Submit & Analyze
            </Button>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-6">
            {readiness && (
              <JobReadinessCard
                score={readiness.job_readiness}
                missingCount={missing.length}
                weakCount={weak.length}
              />
            )}
            {readiness?.insight && (
              <div className="card-glass rounded-2xl p-5 text-sm">
                <span className="font-semibold gradient-text">AI insight: </span>
                {readiness.insight}
              </div>
            )}

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
                <div className={`font-display text-5xl font-bold ${gapPct > 20 ? "text-warning" : "text-success"}`}>{gapPct}%</div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card-glass rounded-2xl p-6">
                <h2 className="mb-6 font-display text-xl font-semibold">Skill Breakdown</h2>
                <div className="space-y-5">
                  {evaluations.map((r) => (
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
                          style={{ width: `${Math.min(100, r.score)}%` }}
                        />
                        <div
                          className="absolute top-0 h-full w-0.5 bg-foreground/60"
                          style={{ left: `${Math.min(100, r.required)}%` }}
                        />
                      </div>
                      {r.feedback && (
                        <p className="mt-1.5 text-xs text-muted-foreground">{r.feedback}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <SkillConfidenceCard items={confidence} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <GapCard title="Strengths" icon={CheckCircle2} color="success" items={gap?.strengths ?? strong.map(s => s.skill)} empty="Keep building!" />
              <GapCard title="Weak Skills" icon={Clock} color="warning" items={gap?.weak_skills ?? weak.map(s => s.skill)} empty="None — well done!" />
              <GapCard title="Missing Skills" icon={XCircle} color="destructive" items={gap?.missing_skills ?? missing.map(s => s.skill)} empty="Nothing missing 🎉" />
            </div>

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
                              <a href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-secondary hover:underline">
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
