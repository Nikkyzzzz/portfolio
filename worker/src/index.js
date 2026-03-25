export default {
  async fetch(request, env) {
    const requestOrigin = request.headers.get("Origin") || "";
    const configuredOrigin = normalizeOrigin(env.ALLOWED_ORIGIN || "");
    const allowedOrigin = resolveAllowedOrigin(requestOrigin, configuredOrigin);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(allowedOrigin)
      });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/api/chat") {
      return json({ error: "Not found" }, 404, allowedOrigin);
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, allowedOrigin);
    }

    if (!env.COHERE_API_KEY) {
      return json({ error: "Missing COHERE_API_KEY secret" }, 500, allowedOrigin);
    }

    try {
      const body = await request.json();
      const message = (body?.message || "").trim();
      const history = Array.isArray(body?.history) ? body.history : [];

      if (!message) {
        return json({ error: "Message is required" }, 400, allowedOrigin);
      }

      const cohereMessages = history
        .filter((item) => item && typeof item.content === "string" && item.content.trim())
        .map((item) => ({
          role: item.role === "assistant" ? "assistant" : "user",
          content: item.content
        }));

      const retrievedChunks = retrieveResumeChunks(message, 4);
      if (!retrievedChunks.length) {
        return json({ reply: "I could not find that in the resume." }, 200, allowedOrigin);
      }

      const resumeContext = formatResumeContext(retrievedChunks);

      const messages = [
        {
          role: "system",
          content:
            "You are a resume-grounded assistant. Use only the supplied Resume Context. If the answer is not explicitly present in Resume Context, respond exactly: 'I could not find that in the resume.' Do not guess, infer, or add outside facts. Keep answers concise.\n\nResume Context:\n" + resumeContext
        },
        ...cohereMessages.slice(-8),
        { role: "user", content: message }
      ];

      const model = env.COHERE_MODEL || "command-r-plus-08-2024";

      const cohereResponse = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.COHERE_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.4
        })
      });

      if (!cohereResponse.ok) {
        const errText = await cohereResponse.text();
        return json({ error: "Cohere API error", details: errText }, 502, allowedOrigin);
      }

      const data = await cohereResponse.json();
      const reply = data?.message?.content?.[0]?.text?.trim() || "I could not generate a response.";

      return json({ reply }, 200, allowedOrigin);
    } catch (error) {
      return json({ error: "Internal error", details: String(error) }, 500, allowedOrigin);
    }
  }
};

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

const RESUME_CHUNKS = [
  {
    id: "summary",
    text:
      "Nikita Patra is an AI/ML Engineer focused on LLM workflows, RAG pipelines, and automation systems."
  },
  {
    id: "experience_capitall",
    text:
      "Experience includes AI/ML Engineer Intern at Capitall where she built 25+ AI bots, processed 500K+ records, and reduced audit time by 60%."
  },
  {
    id: "experience_ltm",
    text:
      "Resume mentions experience with Capitall and LTM in AI-focused project execution and collaboration."
  },
  {
    id: "project_audit",
    text:
      "Project: Audit Automation Platform, an AI-powered audit system with anomaly detection and workflow automation."
  },
  {
    id: "project_pan",
    text:
      "Project: PAN Card Reader using OCR plus LLM-based extraction and validation of PAN details."
  },
  {
    id: "project_lung",
    text:
      "Project: Lung Cancer Detection using Vision Transformer and CCT model with around 94% accuracy."
  },
  {
    id: "skills_programming",
    text:
      "Programming skills include Python, SQL, and JavaScript."
  },
  {
    id: "skills_ai",
    text:
      "AI/ML skills include machine learning, deep learning, NLP, transformers, LLMs, and RAG."
  },
  {
    id: "skills_frameworks",
    text:
      "Frameworks include PyTorch, Scikit-learn, LangChain, and FastAPI."
  },
  {
    id: "skills_tools",
    text:
      "Tools include Docker, Git, and Streamlit."
  },
  {
    id: "certifications",
    text:
      "Certifications include IBM AI Fundamentals, Data Analytics, and Cisco Networking."
  },
  {
    id: "contact",
    text:
      "Contact email is patranikita@gmail.com. LinkedIn: linkedin.com/in/nikita-patra-13a67a220 and GitHub: github.com/Nikkyzzzz."
  }
];

function retrieveResumeChunks(query, limit) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];

  const scored = RESUME_CHUNKS.map((chunk) => {
    const chunkTokens = tokenize(chunk.text + " " + chunk.id);
    let score = 0;
    for (const token of queryTokens) {
      if (chunkTokens.has(token)) score += 1;
    }
    return { chunk, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.chunk);

  return scored;
}

function tokenize(text) {
  const tokens = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
  return new Set(tokens);
}

function formatResumeContext(chunks) {
  return chunks.map((chunk) => `- [${chunk.id}] ${chunk.text}`).join("\n");
}

function normalizeOrigin(value) {
  if (!value) return "";
  try {
    return new URL(value).origin;
  } catch (error) {
    return value;
  }
}

function resolveAllowedOrigin(requestOrigin, configuredOrigin) {
  if (configuredOrigin) {
    if (requestOrigin && requestOrigin === configuredOrigin) return requestOrigin;
    return configuredOrigin;
  }
  return requestOrigin || "*";
}

function json(payload, status, origin) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin)
    }
  });
}
