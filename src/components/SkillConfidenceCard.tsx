import { ShieldCheck } from "lucide-react";
import ProgressBar from "./ProgressBar";

export interface SkillConfidence {
  skill: string;
  confidence: number; // 0-100
}

interface SkillConfidenceCardProps {
  items: SkillConfidence[];
}

const toneFor = (v: number) =>
  v >= 75 ? "success" : v >= 50 ? "warning" : "destructive";

const labelFor = (v: number) =>
  v >= 75 ? "Confident" : v >= 50 ? "Moderate" : "Overstated";

const SkillConfidenceCard = ({ items }: SkillConfidenceCardProps) => {
  return (
    <div className="card-glass rounded-2xl p-6">
      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-secondary" />
        <h2 className="font-display text-xl font-semibold">Skill Confidence</h2>
        <span className="ml-auto text-xs text-muted-foreground">Claimed vs. Assessed</span>
      </div>
      <div className="space-y-5">
        {items.map((s) => {
          const tone = toneFor(s.confidence) as "success" | "warning" | "destructive";
          const toneClass =
            tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-destructive";
          return (
            <div key={s.skill}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">{s.skill}</span>
                <span className="flex items-center gap-2">
                  <span className={`text-xs ${toneClass}`}>{labelFor(s.confidence)}</span>
                  <span className={`font-semibold ${toneClass}`}>{s.confidence}%</span>
                </span>
              </div>
              <ProgressBar value={s.confidence} tone={tone} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillConfidenceCard;
