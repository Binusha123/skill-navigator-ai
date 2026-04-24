const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const MODEL = "openai/gpt-5";

type Step =
  | "parse_resume"
  | "analyze_jd"
  | "skill_mapping"
  | "generate_questions"
  | "evaluate_answers"
  | "gap_analysis"
  | "learning_plan"
  | "job_readiness"
  | "skill_confidence";

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
    description: "Return 5 interview questions",
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
            },
            required: ["id", "skill", "question"],
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
};

const systemPrompts: Record<Step, string> = {
  parse_resume: "You are a resume parser. Extract structured data from the resume text. Infer skills even when implicit. experience_level must be one of: junior, mid, senior.",
  analyze_jd: "You are a job description analyst. Extract required and optional skills and the seniority level from the job description.",
  skill_mapping: "Compare candidate skills against required skills. matched = present and strong; weak = present but underdeveloped; missing = required but absent.",
  generate_questions: "You are a senior technical interviewer. Generate exactly 5 open-ended interview questions tailored to the required skills and the candidate's experience level. Use ids q1..q5. Cover the most important required skills.",
  evaluate_answers: "You are an expert evaluator. For each required skill, judge the candidate's answer (or absence thereof) and produce a score 0-100 reflecting demonstrated proficiency, plus the role's required threshold (0-100) and short feedback. If no answer was given for a skill, score it low (10-30).",
  gap_analysis: "Categorize skills based on their score vs required threshold. strengths: score >= required. weak_skills: 40 <= score < required. missing_skills: score < 40 OR required but not assessed.",
  learning_plan: "Build a focused 4-week plan to close the listed skill gaps. Each week targets ONE primary skill, has 3-5 actionable tasks, 3 high-quality resources (use real, well-known URLs like official docs, freeCodeCamp, MDN, frontendmasters.com, youtube.com), and an hours estimate (6-12).",
  job_readiness: "Compute an overall job readiness percentage (0-100) based on how well the candidate's scores meet the required thresholds, with penalties for missing skills. Return a one-sentence insight.",
  skill_confidence: "For each evaluated skill, compute a confidence score (0-100) measuring how well the assessed performance backs up what the resume claimed. Higher = candidate demonstrated what they claimed.",
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
