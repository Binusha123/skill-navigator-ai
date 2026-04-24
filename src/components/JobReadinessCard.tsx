import { Sparkles } from "lucide-react";

interface JobReadinessCardProps {
  score: number; // 0-100
  missingCount: number;
  weakCount: number;
}

const JobReadinessCard = ({ score, missingCount, weakCount }: JobReadinessCardProps) => {
  const v = Math.max(0, Math.min(100, Math.round(score)));
  const circumference = 2 * Math.PI * 46;
  const dash = (v / 100) * circumference;

  const insight =
    v >= 85
      ? "You're job-ready! Polish your portfolio and start applying."
      : v >= 65
      ? `You are close! Improve ${Math.max(1, weakCount)} key skill${weakCount === 1 ? "" : "s"} to become job-ready.`
      : v >= 45
      ? `Solid foundation. Focus on ${weakCount} weak and ${missingCount} missing skill${missingCount === 1 ? "" : "s"}.`
      : "Big gap to close — your learning plan below will guide you step by step.";

  const tone = v >= 75 ? "text-success" : v >= 50 ? "text-warning" : "text-destructive";

  return (
    <div className="card-glass rounded-2xl p-6 transition-all hover:shadow-glow">
      <div className="flex items-center gap-6">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="url(#grad)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--secondary))" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-display text-3xl font-bold ${tone}`}>{v}%</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Ready</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Job Readiness
          </div>
          <h2 className="font-display text-2xl font-bold">
            <span className="gradient-text">{v}%</span> ready for this role
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{insight}</p>
        </div>
      </div>
    </div>
  );
};

export default JobReadinessCard;
