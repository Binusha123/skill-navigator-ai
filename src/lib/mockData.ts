export interface AssessmentQuestion {
  id: string;
  skill: string;
  question: string;
}

export const mockQuestions: AssessmentQuestion[] = [
  { id: "q1", skill: "React", question: "Explain how React's virtual DOM improves performance and when it might not." },
  { id: "q2", skill: "JavaScript", question: "Describe closures in JavaScript with a practical example." },
  { id: "q3", skill: "TypeScript", question: "What problems does TypeScript solve compared to plain JavaScript?" },
  { id: "q4", skill: "System Design", question: "How would you design a URL shortener at scale?" },
  { id: "q5", skill: "SQL", question: "Difference between INNER JOIN and LEFT JOIN — when to use each?" },
  { id: "q6", skill: "REST APIs", question: "What status code would you return for a successful POST that creates a resource and why?" },
];

export interface SkillScore {
  skill: string;
  score: number; // 0-100
  required: number;
}

export const generateMockResults = (answers: Record<string, string>): SkillScore[] => {
  const base = [
    { skill: "React", required: 85 },
    { skill: "JavaScript", required: 90 },
    { skill: "TypeScript", required: 80 },
    { skill: "System Design", required: 70 },
    { skill: "SQL", required: 75 },
    { skill: "REST APIs", required: 80 },
  ];
  return base.map((b, i) => {
    const ans = answers[`q${i + 1}`] || "";
    // Pseudo score from answer length
    const score = Math.min(95, Math.max(25, Math.round((ans.trim().length / 200) * 100) + 20));
    return { ...b, score };
  });
};

export interface SkillConfidence {
  skill: string;
  confidence: number; // 0-100
}

// Mock "claimed" levels from resume — in real app would parse the resume
const claimedLevels: Record<string, number> = {
  React: 90,
  JavaScript: 90,
  TypeScript: 85,
  "System Design": 75,
  SQL: 80,
  "REST APIs": 85,
};

export const generateSkillConfidence = (results: SkillScore[]): SkillConfidence[] => {
  return results.map((r) => {
    const claimed = claimedLevels[r.skill] ?? 80;
    // Confidence = how well assessed score backs up the claim
    const confidence = Math.min(100, Math.max(10, Math.round((r.score / claimed) * 100)));
    return { skill: r.skill, confidence };
  });
};

export const calculateJobReadiness = (results: SkillScore[]): number => {
  if (!results.length) return 0;
  const avgRatio =
    results.reduce((sum, r) => sum + Math.min(1, r.score / r.required), 0) / results.length;
  const missingPenalty = results.filter((r) => r.score < 40).length * 5;
  const score = Math.round(avgRatio * 100 - missingPenalty);
  return Math.max(15, Math.min(98, score));
};

export interface LearningWeek {
  week: number;
  focus: string;
  tasks: string[];
  resources: { title: string; url: string }[];
  hours: number;
}

export const generateLearningPlan = (gaps: SkillScore[]): LearningWeek[] => {
  const weak = gaps.filter((g) => g.score < g.required);
  const top = weak.slice(0, 4);
  return top.map((s, i) => ({
    week: i + 1,
    focus: `Master ${s.skill}`,
    tasks: [
      `Complete fundamentals of ${s.skill}`,
      `Build 2 small projects using ${s.skill}`,
      `Solve 10 practical exercises`,
    ],
    resources: [
      { title: `${s.skill} – Official Docs`, url: "#" },
      { title: `${s.skill} Crash Course (YouTube)`, url: "#" },
      { title: `Frontend Masters: ${s.skill}`, url: "#" },
    ],
    hours: 8 + i,
  }));
};
