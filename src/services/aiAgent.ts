import { supabase } from "@/integrations/supabase/client";

export interface ResumeData {
  skills: string[];
  experience_level: string;
  projects: string[];
}
export interface JDData {
  required_skills: string[];
  optional_skills: string[];
  role_level: string;
}
export interface SkillMapping {
  matched_skills: string[];
  missing_skills: string[];
  weak_skills: string[];
}
export interface AgentQuestion {
  id: string;
  skill: string;
  question: string;
}
export interface SkillEvaluation {
  skill: string;
  score: number;
  required: number;
  feedback: string;
}
export interface GapAnalysis {
  strengths: string[];
  weak_skills: string[];
  missing_skills: string[];
}
export interface LearningWeek {
  week: number;
  focus: string;
  tasks: string[];
  resources: { title: string; url: string }[];
  hours: number;
}
export interface JobReadiness {
  job_readiness: number;
  insight: string;
}
export interface ConfidenceItem {
  skill: string;
  confidence: number;
}
export interface ResumeValidation {
  is_resume: boolean;
  confidence: number;
  reason: string;
  detected_sections: string[];
}
export interface ResumeEnhancementChange {
  section: string;
  issue: string;
  suggestion: string;
  example: string;
}
export interface ResumeEnhancement {
  overall_summary: string;
  alignment_score: number;
  strengths: string[];
  weaknesses: string[];
  missing_keywords: string[];
  suggested_changes: ResumeEnhancementChange[];
  rewritten_summary: string;
}

async function callAgent<T>(step: string, payload: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke("ai-agent", {
    body: { step, payload },
  });
  if (error) {
    // Surface server-side error message
    const msg = (data as { error?: string } | null)?.error ?? error.message ?? "Agent request failed";
    throw new Error(msg);
  }
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return (data as { data: T }).data;
}

export const aiAgent = {
  parseResume: (resume_text: string) =>
    callAgent<ResumeData>("parse_resume", { resume_text }),
  analyzeJD: (jd_text: string) =>
    callAgent<JDData>("analyze_jd", { jd_text }),
  skillMapping: (resume: ResumeData, jd: JDData) =>
    callAgent<SkillMapping>("skill_mapping", { candidate_skills: resume.skills, required_skills: jd.required_skills }),
  generateQuestions: (jd: JDData, resume: ResumeData) =>
    callAgent<{ questions: AgentQuestion[] }>("generate_questions", {
      required_skills: jd.required_skills,
      experience_level: resume.experience_level,
    }),
  evaluateAnswers: (
    questions: AgentQuestion[],
    answers: Record<string, string>,
    jd: JDData,
  ) =>
    callAgent<{ evaluations: SkillEvaluation[] }>("evaluate_answers", {
      required_skills: jd.required_skills,
      qa: questions.map((q) => ({ skill: q.skill, question: q.question, answer: answers[q.id] || "" })),
    }),
  gapAnalysis: (evaluations: SkillEvaluation[], jd: JDData) =>
    callAgent<GapAnalysis>("gap_analysis", { evaluations, required_skills: jd.required_skills }),
  learningPlan: (gap: GapAnalysis, resume: ResumeData) =>
    callAgent<{ weeks: LearningWeek[] }>("learning_plan", {
      missing_skills: [...gap.missing_skills, ...gap.weak_skills],
      experience_level: resume.experience_level,
    }),
  jobReadiness: (evaluations: SkillEvaluation[], gap: GapAnalysis) =>
    callAgent<JobReadiness>("job_readiness", { evaluations, gap }),
  skillConfidence: (resume: ResumeData, evaluations: SkillEvaluation[]) =>
    callAgent<{ items: ConfidenceItem[] }>("skill_confidence", {
      claimed_skills: resume.skills,
      evaluations,
    }),
};
