export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || "*";

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

      cohereMessages.push({ role: "user", content: message });

      const cohereResponse = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.COHERE_API_KEY}`
        },
        body: JSON.stringify({
          model: "command-r-plus",
          preamble:
            "You are an assistant for Nikita Patra portfolio website. Answer briefly and only about her skills, experience, projects, certifications, and contact details.",
          messages: cohereMessages,
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

function json(payload, status, origin) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin)
    }
  });
}
