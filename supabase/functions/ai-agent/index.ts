const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const MODEL = "google/gemini-2.5-flash";

type Step =
  | "parse_resume"
  | "analyze_jd"
  | "skill_mapping"
  | "generate_questions"
  | "evaluate_answers"
  | "gap_analysis"
  | "learning_plan"
  | "job_readiness"
  | "skill_confidence"
  | "validate_resume"
  | "enhance_resume";

interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

const tools: Record<Step, ToolSpec> = {
  parse_resume: {
    name: "return_resume",
    description: "Return structured resume data",
    parameters: {
      type: "object",
      properties: {
        skills: { type: "array", items: { type: "string" } },
        experience_level: { type: "string", description: "junior | mid | senior" },
        projects: { type: "array", items: { type: "string" } },
      },
      required: ["skills", "experience_level", "projects"],
      additionalProperties: false,
    },
  },
  analyze_jd: {
    name: "return_jd",
    description: "Return structured job description analysis",
    parameters: {
      type: "object",
      properties: {
        required_skills: { type: "array", items: { type: "string" } },
        optional_skills: { type: "array", items: { type: "string" } },
        role_level: { type: "string" },
      },
      required: ["required_skills", "optional_skills", "role_level"],
      additionalProperties: false,
    },
  },
  skill_mapping: {
    name: "return_mapping",
    description: "Return matched/missing/weak skills",
    parameters: {
      type: "object",
      properties: {
        matched_skills: { type: "array", items: { type: "string" } },
        missing_skills: { type: "array", items: { type: "string" } },
        weak_skills: { type: "array", items: { type: "string" } },
      },
      required: ["matched_skills", "missing_skills", "weak_skills"],
      additionalProperties: false,
    },
  },
  generate_questions: {
    name: "return_questions",
    description: "Return interview questions",
    parameters: {
      type: "object",
      properties: {
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              skill: { type: "string" },
              question: { type: "string" },
              qtype: { type: "string", description: "mcq | short | coding" },
              options: {
                type: "array",
                items: { type: "string" },
                description: "For MCQ: 4 answer choices. Empty for short/coding.",
              },
              correct_answer: {
                type: "string",
                description: "For MCQ: the exact correct option text. For short/coding: a model/ideal answer.",
              },
              source_url: {
                type: "string",
                description: "For coding DSA questions, a real LeetCode/HackerRank/Codeforces URL. Empty otherwise.",
              },
            },
            required: ["id", "skill", "question", "qtype", "options", "correct_answer", "source_url"],
            additionalProperties: false,
          },
        },
      },
      required: ["questions"],
      additionalProperties: false,
    },
  },
  evaluate_answers: {
    name: "return_evaluations",
    description: "Return per-skill evaluation scores",
    parameters: {
      type: "object",
      properties: {
        evaluations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              skill: { type: "string" },
              score: { type: "number" },
              required: { type: "number" },
              feedback: { type: "string" },
            },
            required: ["skill", "score", "required", "feedback"],
            additionalProperties: false,
          },
        },
      },
      required: ["evaluations"],
      additionalProperties: false,
    },
  },
  gap_analysis: {
    name: "return_gap",
    description: "Return strengths/weak/missing skills",
    parameters: {
      type: "object",
      properties: {
        strengths: { type: "array", items: { type: "string" } },
        weak_skills: { type: "array", items: { type: "string" } },
        missing_skills: { type: "array", items: { type: "string" } },
      },
      required: ["strengths", "weak_skills", "missing_skills"],
      additionalProperties: false,
    },
  },
  learning_plan: {
    name: "return_plan",
    description: "Return a 4-week learning plan",
    parameters: {
      type: "object",
      properties: {
        weeks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              week: { type: "number" },
              focus: { type: "string" },
              tasks: { type: "array", items: { type: "string" } },
              resources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    url: { type: "string" },
                  },
                  required: ["title", "url"],
                  additionalProperties: false,
                },
              },
              hours: { type: "number" },
            },
            required: ["week", "focus", "tasks", "resources", "hours"],
            additionalProperties: false,
          },
        },
      },
      required: ["weeks"],
      additionalProperties: false,
    },
  },
  job_readiness: {
    name: "return_readiness",
    description: "Return job readiness score and insight",
    parameters: {
      type: "object",
      properties: {
        job_readiness: { type: "number" },
        insight: { type: "string" },
      },
      required: ["job_readiness", "insight"],
      additionalProperties: false,
    },
  },
  skill_confidence: {
    name: "return_confidence",
    description: "Return per-skill confidence (claimed vs actual)",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              skill: { type: "string" },
              confidence: { type: "number" },
            },
            required: ["skill", "confidence"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
  },
  validate_resume: {
    name: "return_validation",
    description: "Determine if the input text is a real resume/CV",
    parameters: {
      type: "object",
      properties: {
        is_resume: { type: "boolean" },
        confidence: { type: "number", description: "0-100 confidence that input is a resume" },
        reason: { type: "string", description: "Short explanation of why or why not" },
        detected_sections: {
          type: "array",
          items: { type: "string" },
          description: "Resume sections found e.g. experience, education, skills, projects, contact",
        },
      },
      required: ["is_resume", "confidence", "reason", "detected_sections"],
      additionalProperties: false,
    },
  },
  enhance_resume: {
    name: "return_enhancement",
    description: "Analyze resume against job description and return concrete improvements",
    parameters: {
      type: "object",
      properties: {
        overall_summary: { type: "string", description: "2-3 sentence high-level assessment" },
        alignment_score: { type: "number", description: "0-100 how well resume aligns with JD" },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        missing_keywords: { type: "array", items: { type: "string" }, description: "ATS keywords from JD missing in resume" },
        suggested_changes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              section: { type: "string", description: "e.g. Summary, Experience, Skills, Projects, Education" },
              issue: { type: "string", description: "What's wrong or missing" },
              suggestion: { type: "string", description: "Concrete actionable rewrite or addition" },
              example: { type: "string", description: "Example sentence/bullet they can paste" },
            },
            required: ["section", "issue", "suggestion", "example"],
            additionalProperties: false,
          },
        },
        rewritten_summary: { type: "string", description: "A polished professional summary tailored to the JD" },
      },
      required: ["overall_summary", "alignment_score", "strengths", "weaknesses", "missing_keywords", "suggested_changes", "rewritten_summary"],
      additionalProperties: false,
    },
  },
};

const systemPrompts: Record<Step, string> = {
  parse_resume: "You are a resume parser. Extract structured data from the resume text. Infer skills even when implicit. experience_level must be one of: junior, mid, senior.",
  analyze_jd: "You are a job description analyst. Extract required and optional skills and the seniority level from the job description.",
  skill_mapping: "Compare candidate skills against required skills. matched = present and strong; weak = present but underdeveloped; missing = required but absent.",
  generate_questions: "You are a senior technical interviewer. Generate the EXACT number of interview questions requested in the payload (count). Respect the requested question_type: 'mcq' (multiple-choice with EXACTLY 4 options and one correct_answer matching one option verbatim), 'short' (open-ended written answer with a model correct_answer in 2-4 sentences), 'coding' (algorithm/DSA problem with a brief problem statement, a high-level model solution in correct_answer, and a real source_url to a well-known LeetCode/HackerRank/Codeforces problem that matches). If the role mentions DSA, algorithms, problem solving, or competitive programming, you MUST include coding questions with valid source_url. Use ids q1, q2, q3… Cover the most important required skills. For non-applicable fields use empty array [] for options or empty string \"\" for source_url.",
  evaluate_answers: "You are an expert evaluator. For each required skill, judge the candidate's answer (or absence thereof) and produce a score 0-100 reflecting demonstrated proficiency, plus the role's required threshold (0-100) and short feedback. If no answer was given for a skill, score it low (10-30).",
  gap_analysis: "Categorize skills based on their score vs required threshold. strengths: score >= required. weak_skills: 40 <= score < required. missing_skills: score < 40 OR required but not assessed.",
  learning_plan: "Build a PERSONALIZED learning plan that adapts dynamically to the candidate's actual assessment performance. Use the payload's `evaluations` (per-skill score vs required), `job_readiness` (0-100 overall), `missing_skills`, `weak_skills`, `strengths`, and `experience_level` to decide: (1) PLAN LENGTH — 2 weeks if job_readiness >= 80, 4 weeks if 50-79, 6 weeks if 30-49, 8 weeks if < 30 or missing_skills.length >= 5. (2) WEEK ORDER — earliest weeks target the LOWEST scoring / most critical missing skills first; later weeks reinforce weak_skills; final week is mock interview + portfolio polish. Do NOT spend weeks on existing strengths. (3) HOURS PER WEEK — scale with the gap: 6h if score within 10 of required, 8-10h if moderate gap, 12-15h if large gap or missing. (4) TASK DIFFICULTY — match experience_level (junior=fundamentals + guided projects; mid=applied projects + system design basics; senior=architecture, scaling, leadership). (5) Each week: ONE primary skill in `focus`, 3-5 actionable tasks that explicitly reference the candidate's score (e.g. 'Raise React score from 45 to 75 by…'), and 3 real high-quality resources (official docs, MDN, freeCodeCamp, frontendmasters, youtube, leetcode). Never return a generic plan — every week must be justified by a specific score or gap from the payload.",
  job_readiness: "Compute an overall job readiness percentage (0-100) based on how well the candidate's scores meet the required thresholds, with penalties for missing skills. Return a one-sentence insight.",
  skill_confidence: "For each evaluated skill, compute a confidence score (0-100) measuring how well the assessed performance backs up what the resume claimed. Higher = candidate demonstrated what they claimed.",
  validate_resume: "You are a strict resume validator. Decide if the input text is a real resume/CV. A resume should contain: a name/contact info, work experience or projects, skills, and/or education. Reject random text, articles, code, lyrics, marketing copy, or job descriptions. Return is_resume=false with confidence and a clear reason if it is not a resume. List the resume sections you actually detected.",
  enhance_resume: "You are an expert technical recruiter and resume coach. Compare the candidate's resume to the target job description. Identify alignment gaps, missing ATS keywords, weak bullet points, and areas to strengthen. Provide 5-8 concrete, actionable suggested_changes — each tied to a specific resume section with a concrete example bullet/sentence the user can paste. Also produce a polished rewritten_summary tailored to the JD (2-4 sentences).",
};

async function runStep(step: Step, userPayload: unknown): Promise<unknown> {
  const tool = tools[step];
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompts[step] },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
      tools: [{ type: "function", function: tool }],
      tool_choice: { type: "function", function: { name: tool.name } },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    const err: { status: number; message: string } = {
      status: res.status,
      message:
        res.status === 429
          ? "Rate limit reached. Please try again in a moment."
          : res.status === 402
          ? "AI credits exhausted. Add credits in Settings → Workspace → Usage."
          : `AI gateway error: ${t}`,
    };
    throw err;
  }

  const data = await res.json();
  const call = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) throw { status: 500, message: "AI returned no structured output" };
  try {
    return JSON.parse(call.function.arguments);
  } catch {
    throw { status: 500, message: "AI returned malformed JSON" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw { status: 500, message: "LOVABLE_API_KEY not configured" };
    const { step, payload } = await req.json();
    if (!step || !(step in tools)) throw { status: 400, message: "Invalid step" };
    const result = await runStep(step as Step, payload);
    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const err = e as { status?: number; message?: string };
    const status = err.status ?? 500;
    const message = err.message ?? "Unknown error";
    console.error("ai-agent error:", status, message);
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
