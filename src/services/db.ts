// Typed data access layer for Skillora AI.
// Tables: profiles, assessments, assessment_questions, learning_plan_weeks.
// All queries rely on RLS — clients only see their own rows (admins see all).
import { supabase } from "@/integrations/supabase/client";
import type {
  AgentQuestion,
  ConfidenceItem,
  GapAnalysis,
  JDData,
  LearningWeek,
  ResumeData,
  SkillEvaluation,
  SkillMapping,
} from "@/services/aiAgent";

export interface Assessment {
  id: string;
  user_id: string;
  title: string;
  resume_text: string | null;
  jd_text: string | null;
  resume_file_path: string | null;
  status: string;
  job_readiness_score: number | null;
  insight: string | null;
  resume_data: ResumeData | null;
  jd_data: JDData | null;
  skill_mapping: SkillMapping | null;
  gap_analysis: GapAnalysis | null;
  skill_confidence: ConfidenceItem[] | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionRow {
  id: string;
  assessment_id: string;
  user_id: string;
  skill: string;
  question: string;
  answer: string | null;
  score: number | null;
  required_score: number | null;
  feedback: string | null;
  position: number;
}

export interface LearningWeekRow {
  id: string;
  assessment_id: string;
  user_id: string;
  week: number;
  focus: string;
  tasks: string[];
  resources: { title: string; url: string }[];
  hours: number;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const requireUserId = async (): Promise<string> => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
};

// ---------- Profiles ----------
export const profilesService = {
  async me(): Promise<Profile | null> {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  async update(patch: Partial<Pick<Profile, "display_name" | "avatar_url">>): Promise<Profile> {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ---------- Assessments ----------
export const assessmentsService = {
  async list(): Promise<Assessment[]> {
    const { data, error } = await supabase
      .from("assessments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Assessment[];
  },
  async listAllForAdmin(): Promise<(Assessment & { display_name: string | null })[]> {
    const { data, error } = await supabase
      .from("assessments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as unknown as Assessment[];
    if (rows.length === 0) return [];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);
    const map = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));
    return rows.map((r) => ({ ...r, display_name: map.get(r.user_id) ?? null }));
  },
  async getById(id: string): Promise<Assessment | null> {
    const { data, error } = await supabase
      .from("assessments")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as Assessment | null;
  },
  async create(input: Partial<Assessment> & { title: string }): Promise<Assessment> {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("assessments")
      .insert({ ...input, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Assessment;
  },
  async update(id: string, patch: Partial<Assessment>): Promise<Assessment> {
    const { data, error } = await supabase
      .from("assessments")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Assessment;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("assessments").delete().eq("id", id);
    if (error) throw error;
  },
};

// ---------- Questions ----------
export const questionsService = {
  async listForAssessment(assessmentId: string): Promise<QuestionRow[]> {
    const { data, error } = await supabase
      .from("assessment_questions")
      .select("*")
      .eq("assessment_id", assessmentId)
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []) as QuestionRow[];
  },
  async insertMany(
    assessmentId: string,
    questions: AgentQuestion[],
  ): Promise<QuestionRow[]> {
    const userId = await requireUserId();
    const rows = questions.map((q, i) => ({
      assessment_id: assessmentId,
      user_id: userId,
      skill: q.skill,
      question: q.question,
      position: i,
    }));
    const { data, error } = await supabase
      .from("assessment_questions")
      .insert(rows)
      .select();
    if (error) throw error;
    return (data ?? []) as QuestionRow[];
  },
  async saveEvaluations(
    rows: QuestionRow[],
    answers: Record<string, string>,
    evaluations: SkillEvaluation[],
  ): Promise<void> {
    // Map AgentQuestion ids -> DB rows by position; we have rows already
    const evalBySkill = new Map(evaluations.map((e) => [e.skill, e]));
    await Promise.all(
      rows.map((r) => {
        const ev = evalBySkill.get(r.skill);
        return supabase
          .from("assessment_questions")
          .update({
            answer: answers[r.id] ?? null,
            score: ev?.score ?? null,
            required_score: ev?.required ?? null,
            feedback: ev?.feedback ?? null,
          })
          .eq("id", r.id);
      }),
    );
  },
};

// ---------- Learning plan ----------
export const learningPlanService = {
  async listForAssessment(assessmentId: string): Promise<LearningWeekRow[]> {
    const { data, error } = await supabase
      .from("learning_plan_weeks")
      .select("*")
      .eq("assessment_id", assessmentId)
      .order("week", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as LearningWeekRow[];
  },
  async replace(assessmentId: string, weeks: LearningWeek[]): Promise<void> {
    const userId = await requireUserId();
    await supabase.from("learning_plan_weeks").delete().eq("assessment_id", assessmentId);
    if (weeks.length === 0) return;
    const rows = weeks.map((w) => ({
      assessment_id: assessmentId,
      user_id: userId,
      week: w.week,
      focus: w.focus,
      tasks: w.tasks,
      resources: w.resources,
      hours: w.hours,
    }));
    const { error } = await supabase.from("learning_plan_weeks").insert(rows);
    if (error) throw error;
  },
};

// ---------- Storage: resumes ----------
export const resumesStorage = {
  async upload(file: File): Promise<string> {
    const userId = await requireUserId();
    const ext = file.name.split(".").pop() || "bin";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("resumes").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw error;
    return path;
  },
  async signedUrl(path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  },
  async remove(path: string): Promise<void> {
    const { error } = await supabase.storage.from("resumes").remove([path]);
    if (error) throw error;
  },
};
