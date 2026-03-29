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
      
      // Always format context (retrieval now guarantees chunks)
      const resumeContext = formatResumeContext(retrievedChunks);

      const messages = [
        {
          role: "system",
          content: `You are Nikita Patra's AI assistant. Answer questions about Nikita using ONLY the Resume Context below. 

IMPORTANT: Use the Resume Context to answer. If the answer is clearly in the Resume Context, provide it with specific details like dates, company names, technologies, and achievements.

Resume Context:
${resumeContext}

Answer based on the Resume Context above. Be specific and cite the relevant information.`
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
      "Nikita Patra is an AI/ML Engineer specializing in machine learning, deep learning, and LLM-powered applications. Experienced in building Retrieval-Augmented Generation (RAG) systems, AI automation pipelines, and deploying AI applications using Python, LangChain, FastAPI, and modern AI platforms."
  },
  {
    id: "education",
    text:
      "Bachelor of Technology in Computer Science with AI & ML specialization. Studied at Dr. A.P.J. Abdul Kalam Technical University, Uttar Pradesh, India from Aug 2021 to Jul 2025. SGPA: 7.5"
  },
  {
    id: "work_experience",
    text:
      "AI/ML Engineer Intern at Capitall (Apr 2025 – Nov 2025). Built 25+ AI-powered audit automation bots for financial auditing and GRC workflows. Processed 500K+ financial records with 99.9% data integrity. Developed RAG pipelines using OpenAI and Cohere APIs with LangChain to automate financial audit report generation. Reduced manual audit processing time by 60%."
  },
  {
    id: "project_audit_automation",
    text:
      "Audit Automation Platform at Tata Communications: Developed a Streamlit-based audit automation platform using Python and Pandas to analyze Procure-to-Pay (P2P), Order-to-Cash (O2C), and Hire-to-Retire (H2R) workflows with rule-based anomaly detection for vendor KYC issues, PO–GRN–Invoice mismatches, split orders, and overdue deliveries, generating automated Excel audit reports."
  },
  {
    id: "project_pan_card_reader",
    text:
      "PAN Card Reader project for CIFL: Built an OCR-based document processing system using Tesseract and OpenAI APIs to extract structured PAN card information with a Streamlit interface for real-time document upload and automated verification."
  },
  {
    id: "project_lung_cancer",
    text:
      "Lung Cancer Detection: Developed Vision Transformer (ViT) and Compact Convolutional Transformer (CCT) models using PyTorch for lung cancer image classification, achieving 94% accuracy across three classes."
  },
  {
    id: "skills_programming",
    text:
      "Programming languages: Python, SQL, JavaScript. Data libraries: Pandas, NumPy, Polars, SciPy, Statsmodels."
  },
  {
    id: "skills_ai_ml",
    text:
      "AI/ML expertise: Machine Learning, Deep Learning, NLP, Transformers, LLMs, RAG (Retrieval-Augmented Generation), Prompt Engineering, Embeddings."
  },
  {
    id: "skills_frameworks",
    text:
      "Frameworks and libraries: PyTorch, Scikit-learn, LangChain, Flask, FastAPI, Streamlit, OpenAI GPT, Mistral, Cohere, Ollama, HuggingFace."
  },
  {
    id: "skills_deployment",
    text:
      "Deployment and tools: REST APIs, Docker, Uvicorn, Git, Jupyter Notebook, Google Colab, VS Code."
  },
  {
    id: "certifications",
    text:
      "Certifications: Cisco Networking Academy – Networking Basics, IBM SkillsBuild – AI Fundamentals, IBM SkillsBuild – Data Analytics Fundamentals, Python for Data Science and AI, Machine Learning Foundations."
  },
  {
    id: "contact",
    text:
      "Contact: Phone +91 7042445338, Email patranikita236@gmail.com, LinkedIn linkedin.com/in/nikita-patra-13a67a220, GitHub github.com/Nikkyzzzz"
  }
];

function retrieveResumeChunks(query, limit) {
  // Always return summary as base
  const chunks = [RESUME_CHUNKS.find(c => c.id === "summary")];
  
  // Add work experience for common questions
  chunks.push(RESUME_CHUNKS.find(c => c.id === "work_experience"));
  
  // Based on query intent, add more chunks
  if (/project|build|develop|audit|pan|cancer|lung/i.test(query)) {
    chunks.push(...RESUME_CHUNKS.filter(c => c.id.startsWith("project")));
  }
  
  if (/skill|language|framework|python|ai|ml|rag|tool|technology/i.test(query)) {
    chunks.push(...RESUME_CHUNKS.filter(c => c.id.startsWith("skill")));
  }
  
  if (/education|study|degree|university|bachelor|school|graduated/i.test(query)) {
    chunks.push(RESUME_CHUNKS.find(c => c.id === "education"));
  }
  
  if (/certificate|certif/i.test(query)) {
    chunks.push(RESUME_CHUNKS.find(c => c.id === "certifications"));
  }
  
  if (/contact|email|phone|linkedin|github/i.test(query)) {
    chunks.push(RESUME_CHUNKS.find(c => c.id === "contact"));
  }
  
  // Filter out undefined and duplicates
  const filtered = chunks.filter((c, i) => c && chunks.indexOf(c) === i);
  
  return filtered.length > 0 ? filtered : [RESUME_CHUNKS.find(c => c.id === "summary")];
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
